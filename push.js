'use strict'
/*
An adaptor to translate the current (V1) push API to the V2 API
I'd anticipate creating this for 2.0.0, and 2.1.0 would look to
refactor to remove the additional layer of abstraction
*/

const Push = require('./src/push')
const {timeDivisionButtonToCC, buttonToCC} = require('./src/buttonMap')
const zeroToSeven = [0, 1, 2, 3, 4, 5, 6, 7]
const oneToEight = [1, 2, 3, 4, 5, 6, 7, 8]

const listener = (elem, event) => listener => { elem.on(event, listener); return () => elem.removeListener(event, listener) }
const listenable = () => {
  let store = []
  return {
    dispatch: () => { store.forEach(listener => listener()) },
    listen: listener => {
      if (store.indexOf(listener) === -1) store.push(listener);
      return () => { store = store.filter(cb => cb !== listener) }
    }
  }
}
const touchable = () => {
  const pressed = listenable()
  const released = listenable()
  return { pressed, released, api: () => ({ onPressed: pressed.listen, onReleased: released.listen }) }
}

const touchableElem = elem => ({
  onPressed: listener(elem, 'pressed'),
  onReleased: listener(elem, 'released')
})
const aftertouchable = elem => ({ onAftertouch: listener(elem, 'aftertouch') })
const turnable = elem => ({ onTurned: listener(elem, 'turned') })
const pitchbendable = elem => ({ onPitchBend: listener(elem, 'pitchbend') })
const rgbButton = (sendOnMessage, index, sendRgbMessage) => () => ({
  ledOn: (value = 100) => sendOnMessage(value),
  ledOff: () => sendOnMessage(0),
  ledRGB: (r, g, b) => {
    const msb = [r, g, b].map(x => (x & 240) >> 4)
    const lsb = [r, g, b].map(x => x & 15)
    sendRgbMessage([4, 0, 8, index, 0, msb[0], lsb[0], msb[1], lsb[1], msb[2], lsb[2]])
  }
})
const dimmableLed = send => ({
  ledOn: () => send(4),
  ledDim: () => send(1),
  ledOff: () => send(0)
})
const dimColours = { orange: 7, red: 1, green: 19, yellow: 13 }
const dimColour = colour => dimColours[colour] || dimColours['orange']

const roygLed = send => () => ({
  ledOn: (colour = 'orange') => send(dimColour(colour) + 3),
  ledDim: (colour = 'orange') => send(dimColour(colour)),
  ledOff: () => send(0)
})

const compose = (elem, ...funcs) => Object.assign({}, ...funcs.map(func => func(elem)))
const combine = (...parts) => Object.assign({}, ...parts)

const lcdSegment = elem => ({
  clear: () => { elem.clear() },
  display: (text = '') => { elem.update(text) }
})

function webMidiIO () {
  if (navigator && navigator.requestMIDIAccess) {
    return navigator.requestMIDIAccess({ sysex: true }).then(midiAccess => {
      const userPort = ports => ports.filter(port => port.name === 'Ableton Push User Port')[0] || undefined
      const input = userPort(Array.from(midiAccess.inputs.values()))
      const output = userPort(Array.from(midiAccess.outputs.values()))

      return (input && output)
        ? Promise.resolve({ inputPort: input, outputPort: output })
        : Promise.reject('No default MIDI IO ports found with name "Ableton Push User Port"')
    })
  }
  return Promise.reject('Web MIDI API not supported by this browser!')
}

module.exports = {
  webMIDIio: webMidiIO,
  push: () => {
    let midiOutCallBacks = []
    const midiOut = bytes => { midiOutCallBacks.forEach(callback => callback(bytes)) }
    const sendCC = cc => value => { midiOut([176, cc, value]) }
    const sendMidiNote = note => value => { midiOut([144, note, value]) }
    const sendSysex = data => { midiOut([240, 71, 127, 21, ...data, 247]) }
    const push = new Push({ send: midiOut })

    const buttons = Object.keys(buttonToCC).map(name => combine({ id: buttonToCC[name], name}, touchable()))

    const dispatchers = buttons.reduce((acc, fullButton) => {
      acc[176][fullButton.id] = value => value > 0 ? fullButton.pressed.dispatch() : fullButton.released.dispatch()
      return acc
    }, {176: {}})

    const buttonMap = buttons.reduce((acc, button) => {
      acc[button.name] = combine(dimmableLed(sendCC(button.id)), button.api())
      return acc
    }, {})

    const pads = oneToEight.map(x => oneToEight.map(y => compose(push.grid.x[x].y[y], rgbButton(sendMidiNote(x - 1 + (8 * (y - 1)) + 36), x - 1 + (8 * (y - 1)), sendSysex), touchableElem, aftertouchable)))
    const lcdSegments = oneToEight.map(x => oneToEight.map(y => lcdSegment(push.lcd.x[x].y[y])))
    const gridSelectButtons = oneToEight.map(x => compose(push.grid.x[x].select, rgbButton(sendCC(102 + x - 1), 64 + x - 1, sendSysex), touchableElem))
    const timeDivisionButtons = Object.keys(timeDivisionButtonToCC).reduce((acc, name) => {
      acc[name] = compose(push.button[name], roygLed(sendCC(timeDivisionButtonToCC[name])), touchableElem)
      return acc
    }, {})
    const channelSelectButtons = oneToEight.map(x => compose(push.channel[x].select, roygLed(sendCC(20 + x - 1)), touchableElem))
    const channelKnobs = oneToEight.map(x => compose(push.channel[x].knob, touchableElem, turnable))
    const specialKnobs = ['master', 'swing', 'tempo'].map(name => compose(push.knob[name], touchableElem, turnable))
    const touchstrip = compose(push.touchstrip, touchableElem, pitchbendable)

    const dispatch = ([one, two, ...rest]) => {
      if (dispatchers[one] && dispatchers[one][two]) {
        dispatchers[one][two](rest)
        return true
      }
      return false
    }

    return {
      button: name => buttonMap[name],
      channelKnobs: () => channelKnobs.slice(),
      channelSelectButtons: () => channelSelectButtons.slice(),
      clearLCD: () => { push.lcd.clear() },
      gridRow: y => zeroToSeven.map(x => pads[x][y]),
      gridCol: x => zeroToSeven.map(y => pads[x][y]),
      gridSelectButtons: () => gridSelectButtons.slice(),
      lcdSegmentsCol: x => zeroToSeven.map(y => lcdSegments[x][y]),
      lcdSegmentsRow: y => zeroToSeven.map(x => lcdSegments[x][y]),
      midiFromHardware: bytes => dispatch(bytes) || push.receive_midi(bytes),
      onMidiToHardware: listener => { midiOutCallBacks.push(listener); return () => { midiOutCallBacks = midiOutCallBacks.filter(cb => cb !== listener) } },
      timeDivisionButtons: name => timeDivisionButtons[name],
      masterKnob: () => specialKnobs[0],
      swingKnob: () => specialKnobs[1],
      tempoKnob: () => specialKnobs[2],
      touchstrip: () => touchstrip
    }
  }
}

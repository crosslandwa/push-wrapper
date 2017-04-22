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
    dispatch: value => { store.forEach(listener => listener(value)) },
    listen: listener => {
      if (store.indexOf(listener) === -1) store.push(listener)
      return () => { store = store.filter(cb => cb !== listener) }
    }
  }
}
const aftertouchable = ({ aftertouch: { listen: onAftertouch } }) => ({ onAftertouch })
const pitchbendable = ({ bend: { listen: onPitchBend } }) => ({ onPitchBend })
const pressable = ({ press: { listen: onPressed } }) => ({ onPressed })
const releaseable = ({ release: { listen: onReleased } }) => ({ onReleased })
const turnable = ({ turn: { listen: onTurned } }) => ({ onTurned })
const touchableElem = elem => ({
  onPressed: listener(elem, 'pressed'),
  onReleased: listener(elem, 'released')
})

const rgbButton = (sendOnMessage, index, sendRgbMessage) => ({
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

const roygLed = send => ({
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

    const buttons = Object.keys(buttonToCC).map(name => ({ id: buttonToCC[name], name, press: listenable(), release: listenable() }))
    const channelSelectButtons = zeroToSeven.map(x => ({ id: 20 + x, press: listenable(), release: listenable() }))
    const gridSelectButtons = zeroToSeven.map(x => ({ id: 102 + x, press: listenable(), release: listenable() }))
    const timeDivisionButtons = Object.keys(timeDivisionButtonToCC).map(name => ({ id: timeDivisionButtonToCC[name], name, press: listenable(), release: listenable() }))

    const pads = zeroToSeven.map(x => zeroToSeven.map(y => ({ id: x + 8 * y + 36, press: listenable(), release: listenable(), aftertouch: listenable() })))

    const channelKnobs = zeroToSeven.map(x => ({ cc: 71 + x, note: x, press: listenable(), release: listenable(), turn: listenable() }))
    const specialKnobs = [
      { cc: 79, note: 8, press: listenable(), release: listenable(), turn: listenable() }, //master
      { cc: 15, note: 9, press: listenable(), release: listenable(), turn: listenable() }, //swing
      { cc: 14, note: 10, press: listenable(), release: listenable(), turn: listenable() } // tempo
    ]

    const touchstrip = { note: 12, press: listenable(), release: listenable(), bend: listenable() }

    const api = {
      buttons: buttons.reduce((acc, button) => {
        acc[button.name] = combine(dimmableLed(sendCC(button.id)), pressable(button), releaseable(button))
        return acc
      }, {}),
      channelKnobs: channelKnobs.map(knob => combine(pressable(knob), releaseable(knob), turnable(knob))),
      channelSelectButtons: channelSelectButtons.map(button => combine(roygLed(sendCC(button.id)), pressable(button), releaseable(button))),
      gridSelectButtons: gridSelectButtons.map(button => combine(rgbButton(sendCC(button.id), button.id - 38, sendSysex), pressable(button), releaseable(button))),
      pads: pads.map(col => col.map(pad => combine(rgbButton(sendMidiNote(pad.id), pad.id - 36, sendSysex), aftertouchable(pad), pressable(pad), releaseable(pad)))),
      specialKnobs: specialKnobs.map(knob => combine(pressable(knob), releaseable(knob), turnable(knob))),
      timeDivisionButtons: timeDivisionButtons.reduce((acc, button) => {
        acc[button.name] = combine(roygLed(sendCC(button.id)), pressable(button), releaseable(button))
        return acc
      }, {}),
      touchstrip: combine(pressable(touchstrip), releaseable(touchstrip), pitchbendable(touchstrip))
    }

    const dispatchers = {
      // MIDI NOTES
      144: combine(
        [].concat.apply([], pads).reduce((acc, pad) => {
          acc[pad.id] = velocity => velocity > 0 ? pad.press.dispatch(velocity) : pad.release.dispatch()
          return acc
        }, {}),
        [...specialKnobs, ...channelKnobs].reduce((acc, knob) => {
          acc[knob.note] = value => value > 0 ? knob.press.dispatch() : knob.release.dispatch()
          return acc
        }, {}),
        {[touchstrip.note]: value => {
          if (value > 0) {
            touchstrip.press.dispatch()
          } else {
            touchstrip.release.dispatch()
            touchstrip.bend.dispatch(8192)
          }
        }}
      ),
      // POLY PRESSURE
      160: [].concat.apply([], pads).reduce((acc, pad) => {
        acc[pad.id] = pad.aftertouch.dispatch
        return acc
      }, {}),
      // MIDI CC
      176: combine(
        [...buttons, ...channelSelectButtons, ...gridSelectButtons, ...timeDivisionButtons]
          .reduce((acc, button) => {
            acc[button.id] = value => value > 0 ? button.press.dispatch() : button.release.dispatch()
            return acc
          }, {}),
        [...specialKnobs, ...channelKnobs].reduce((acc, knob) => {
          acc[knob.cc] = value => knob.turn.dispatch(value < 64 ? value : value - 128)
          return acc
        }, {})
      )
    }

    const lcdSegments = oneToEight.map(x => oneToEight.map(y => lcdSegment(push.lcd.x[x].y[y])))

    const dispatch = ([one, two, ...rest]) => {
      if (one === 224) { // pitchbend
        const fourteenBitValue = (rest[0] << 7) + two
        if (fourteenBitValue !== 8192) touchstrip.bend.dispatch(fourteenBitValue)
        return true
      }
      if (dispatchers[one] && dispatchers[one][two]) {
        dispatchers[one][two](...rest)
        return true
      }
      return false
    }

    return {
      button: name => api.buttons[name],
      channelKnobs: () => api.channelKnobs.slice(),
      channelSelectButtons: () => api.channelSelectButtons.slice(),
      clearLCD: () => { push.lcd.clear() },
      gridRow: y => zeroToSeven.map(x => api.pads[x][y]),
      gridCol: x => api.pads[x].slice(),
      gridSelectButtons: () => api.gridSelectButtons.slice(),
      lcdSegmentsCol: x => zeroToSeven.map(y => lcdSegments[x][y]),
      lcdSegmentsRow: y => zeroToSeven.map(x => lcdSegments[x][y]),
      midiFromHardware: bytes => dispatch(bytes) || push.receive_midi(bytes),
      onMidiToHardware: listener => { midiOutCallBacks.push(listener); return () => { midiOutCallBacks = midiOutCallBacks.filter(cb => cb !== listener) } },
      timeDivisionButtons: name => api.timeDivisionButtons[name],
      masterKnob: () => api.specialKnobs[0],
      swingKnob: () => api.specialKnobs[1],
      tempoKnob: () => api.specialKnobs[2],
      touchstrip: () => api.touchstrip
    }
  }
}

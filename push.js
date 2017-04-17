'use strict'
/*
An adaptor to translate the current (V1) push API to the V2 API
I'd anticipate creating this for 2.0.0, and 2.1.0 would look to
refactor to remove the additional layer of abstraction
*/

const Push = require('./src/push.js')
const log = console.log
const zeroToSeven = [0, 1, 2, 3, 4, 5, 6, 7]
const oneToEight = [1, 2, 3, 4, 5, 6, 7, 8]

const listener = (elem, event) => listener => { elem.on(event, listener); return () => elem.removeListener(event, listener) }

const touchable = elem => ({
  onPressed: listener(elem, 'pressed'),
  onReleased: listener(elem, 'released')
})
const aftertouchable = elem => ({ onAftertouch: listener(elem, 'aftertouch')})
const turnable = elem => ({ onTurned: listener(elem, 'turned')})
const pitchbendable = elem => ({ onPitchBend: listener(elem, 'pitchbend')})
const rgbButton = elem => ({
  ledOn: elem.led_on.bind(elem),
  ledOff: elem.led_off.bind(elem),
  ledRGB: elem.led_rgb.bind(elem),
})
function roygButton (elem) {
  const colours = {'orange': 'orange', 'green': 'green', 'red': 'red', 'yellow': 'yellow'}
  const applyColour = (elem, col) => elem[colours[col] || 'orange']()
  return {
    ledOn: (colour = 'orange') => { applyColour(elem, colour); elem.led_on() },
    ledDim: (colour = 'orange') => { applyColour(elem, colour); elem.led_dim() },
    ledOff: elem.led_off.bind(elem)
  }
}
const compose = (elem, ...funcs) => Object.assign({}, ...funcs.map(func => func(elem)))

function createButtons (push) {
  const names = ['tap_tempo', 'metronome', 'master', 'stop', 'left', 'right', 'up', 'down',
    'select', 'shift', 'note', 'session', 'add_effect', 'add_track', 'octave_down', 'octave_up',
    'repeat', 'accent', 'scales', 'user', 'mute', 'solo', 'step_in', 'step_out', 'play', 'rec',
    'new', 'duplicate', 'automation', 'fixed_length', 'device', 'browse', 'track', 'clip',
    'volume', 'pan_&_send', 'quantize', 'double', 'delete', 'undo']
  const capitalize = name => name
    .replace(/_(\w|&)/g, (a, x) => a.replace(`_${x}`, x.toUpperCase()))
    .replace(/^(\w)/g, (a, x) => a.replace(x, x.toUpperCase()))
  return names.reduce((acc, name) => {
    acc[capitalize(name)] = compose(push.button[name], roygButton, touchable)
    return acc
  }, {})
}

function createTimeDivisionButtons (push) {
  const names = ['1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32', '1/32t']
  return names.reduce((acc, name) => {
    acc[name] = compose(push.button[name], roygButton, touchable)
    return acc
  }, {})
}

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

      return (input && output) ?
        Promise.resolve({ inputPort: input, outputPort: output })
        : Promise.reject('No default MIDI IO ports found with name "Ableton Push User Port"')
    })
  }
  return Promise.reject('Web MIDI API not supported by this browser!')
}

module.exports = {
  webMIDIio: webMidiIO,
  push: () => {
    let midiOutCallBacks = []
    const push = new Push({ send: bytes => { midiOutCallBacks.forEach(callback => callback(bytes)) }})
    const buttons = createButtons(push)
    const pads = oneToEight.map(x => oneToEight.map(y => compose(push.grid.x[x].y[y], rgbButton, touchable, aftertouchable)))
    const lcdSegments = oneToEight.map(x => oneToEight.map(y => lcdSegment(push.lcd.x[x].y[y])))
    const gridSelectButtons = oneToEight.map(x => compose(push.grid.x[x].select, rgbButton, touchable))
    const timeDivisionButtons = createTimeDivisionButtons(push)
    const channelSelectButtons = oneToEight.map(x => compose(push.channel[x].select, roygButton, touchable))
    const channelKnobs = oneToEight.map(x => compose(push.channel[x].knob, touchable, turnable))
    const specialKnobs = ['master', 'swing', 'tempo'].map(name => compose(push.knob[name], touchable, turnable))
    const touchstrip = compose(push.touchstrip, touchable, pitchbendable)

    return {
      button: name => buttons[name],
      channelKnobs: () => channelKnobs.slice(),
      channelSelectButtons: () => channelSelectButtons.slice(),
      clearLCD: () => { push.lcd.clear() },
      gridRow: y => zeroToSeven.map(x => pads[x][y]),
      gridCol: x => zeroToSeven.map(y => pads[x][y]),
      gridSelectButtons: () => gridSelectButtons.slice(),
      lcdSegmentsCol: x => zeroToSeven.map(y => lcdSegments[x][y]),
      lcdSegmentsRow: y => zeroToSeven.map(x => lcdSegments[x][y]),
      midiFromHardware: bytes => push.receive_midi(bytes),
      onMidiToHardware: listener => { midiOutCallBacks.push(listener); return () => { midiOutCallBacks = midiOutCallBacks.filter(cb => cb !== listener) } },
      timeDivisionButtons: name => timeDivisionButtons[name],
      masterKnob: () => specialKnobs[0],
      swingKnob: () => specialKnobs[1],
      tempoKnob: () => specialKnobs[2],
      touchstrip: () => touchstrip
    }
  }
}

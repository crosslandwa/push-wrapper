'use strict'

const { timeDivisionButtonToCC, buttonToCC } = require('./src/buttonMap')
const zeroToSeven = [0, 1, 2, 3, 4, 5, 6, 7]
const lcdOffsets = [0, 9, 17, 26, 34, 43, 51, 60]
const compose = (elem, ...parts) => Object.assign({}, ...parts.map(part => (typeof part === 'function') ? part(elem) : part))

const dispatchIncomingMidi = dispatchMap => ([one, two, ...rest]) => {
  let messageType = one & 0xf0
  switch (messageType) {
    case (128): // NOTE-OFF
      messageType = 144
      // fall through
    case (176): // CC
    case (144): // NOTE-ON
    case (160): // POLY PRESSURE (AFTERTOUCH)
      dispatchMap[messageType][two](...rest)
      break
    case (224): // PITCHBEND
      const fourteenBitValue = (rest[0] << 7) + two
      if (fourteenBitValue !== 8192) dispatchMap[messageType](fourteenBitValue)
      break
  }
}

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

const rgbButton = (sendOnOff, sendRgbSysex) => ({
  ledOn: (value = 100) => sendOnOff(value),
  ledOff: () => sendOnOff(0),
  ledRGB: (r = 0, g = 0, b = 0) => sendRgbSysex(r, g, b)
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

function eigthCharLcdData (input) {
  let chars = String(input).split('').slice(0, 8).map(x => x.charCodeAt(0))
  while (chars.length < 8) chars.push(32)
  return chars
}

const lcdSegment = (send, x, y) => ({
  clear: () => send(x, y, ''),
  display: (text = '') => send(x, y, text)
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
    const sendCC = ({cc}) => value => { midiOut([176, cc, value]) }
    const sendMidiNote = ({note}) => value => { midiOut([144, note, value]) }
    const sendSysex = data => { midiOut([240, 71, 127, 21, ...data, 247]) }
    const lcdSegmentSysex = (x, y, data) => sendSysex([27 - y, 0, 9, lcdOffsets[x], ...eigthCharLcdData(data)])
    const rgbSysex = index => (r, g, b) => {
      const msb = [r, g, b].map(x => (x & 240) >> 4)
      const lsb = [r, g, b].map(x => x & 15)
      sendSysex([4, 0, 8, index, 0, msb[0], lsb[0], msb[1], lsb[1], msb[2], lsb[2]])
    }

    const buttons = Object.keys(buttonToCC).map(name => ({ cc: buttonToCC[name], name, press: listenable(), release: listenable() }))
    const channelSelectButtons = zeroToSeven.map(x => ({ cc: 20 + x, press: listenable(), release: listenable() }))
    const gridSelectButtons = zeroToSeven.map(x => ({ cc: 102 + x, press: listenable(), release: listenable() }))
    const timeDivisionButtons = Object.keys(timeDivisionButtonToCC).map(name => ({ cc: timeDivisionButtonToCC[name], name, press: listenable(), release: listenable() }))
    const dimButtonApi = button => compose(button, dimmableLed(sendCC(button)), pressable, releaseable)
    const roygButtonApi = button => compose(button, roygLed(sendCC(button)), pressable, releaseable)
    const rgbButtonApi = button => compose(button, rgbButton(sendCC(button), rgbSysex(button.cc - 38)), pressable, releaseable)

    const pads = Array(64).fill(36).map((x, i) => x + i).map(note => ({ note, press: listenable(), release: listenable(), aftertouch: listenable() }))
    const padApi = pad => compose(pad, rgbButton(sendMidiNote(pad), rgbSysex(pad.note - 36)), aftertouchable, pressable, releaseable)

    const channelKnobs = zeroToSeven.map(x => ({ cc: 71 + x, note: x, press: listenable(), release: listenable(), turn: listenable() }))
    const masterKnob = { cc: 79, note: 8, press: listenable(), release: listenable(), turn: listenable() }
    const swingKnob = { cc: 15, note: 9, press: listenable(), release: listenable(), turn: listenable() }
    const tempoKnob = { cc: 14, note: 10, press: listenable(), release: listenable(), turn: listenable() }
    const knobApi = knob => compose(knob, pressable, releaseable, turnable)

    const touchstrip = { note: 12, press: listenable(), release: listenable(), bend: listenable() }

    const dispatchPressOrRelease = elem => value => value > 0 ? elem.press.dispatch(value) : elem.release.dispatch()

    const dispatchers = {
      // MIDI NOTES
      144: Object.assign({},
        [masterKnob, swingKnob, tempoKnob, ...channelKnobs, ...pads]
          .reduce((acc, elem) => { acc[elem.note] = dispatchPressOrRelease(elem); return acc }, {}),
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
      160: pads.reduce((acc, pad) => { acc[pad.note] = pad.aftertouch.dispatch; return acc }, {}),
      // MIDI CC
      176: Object.assign({},
        [...buttons, ...channelSelectButtons, ...gridSelectButtons, ...timeDivisionButtons]
          .reduce((acc, button) => { acc[button.cc] = dispatchPressOrRelease(button); return acc }, {}),
        [masterKnob, swingKnob, tempoKnob, ...channelKnobs].reduce((acc, knob) => {
          acc[knob.cc] = value => knob.turn.dispatch(value < 64 ? value : value - 128)
          return acc
        }, {})
      ),
      224: touchstrip.bend.dispatch // PITCHBEND
    }

    return {
      button: name => dimButtonApi(buttons.filter(button => button.name === name)[0]),
      channelKnobs: () => channelKnobs.map(knobApi),
      channelSelectButtons: () => channelSelectButtons.map(roygButtonApi),
      clearLCD: () => { [27, 26, 25, 24].forEach(row => { sendSysex([row, 0, 69, 0, ...new Array(68).fill(32)]) }) },
      gridRow: y => zeroToSeven.map(x => x + (y * 8)).map(index => pads[index]).map(padApi),
      gridCol: x => zeroToSeven.map(y => x + (y * 8)).map(index => pads[index]).map(padApi),
      gridSelectButtons: () => gridSelectButtons.map(rgbButtonApi),
      lcdSegmentsCol: x => zeroToSeven.map(y => lcdSegment(lcdSegmentSysex, x, y)),
      lcdSegmentsRow: y => zeroToSeven.map(x => lcdSegment(lcdSegmentSysex, x, y)),
      midiFromHardware: dispatchIncomingMidi(dispatchers),
      onMidiToHardware: listener => { midiOutCallBacks.push(listener); return () => { midiOutCallBacks = midiOutCallBacks.filter(cb => cb !== listener) } },
      timeDivisionButtons: name => roygButtonApi(timeDivisionButtons.filter(button => button.name === name)[0]),
      masterKnob: () => knobApi(masterKnob),
      swingKnob: () => knobApi(swingKnob),
      tempoKnob: () => knobApi(tempoKnob),
      touchstrip: () => compose(touchstrip, pressable, releaseable, pitchbendable)
    }
  }
}

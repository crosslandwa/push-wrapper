'use strict'
/*
An adaptor to translate the current (V1) push API to the V2 API
I'd anticipate creating this for 2.0.0, and 2.1.0 would look to
refactor to remove the additional layer of abstraction
*/

const Push = require('./push.js')
const log = console.log
const zeroToSeven = [0, 1, 2, 3, 4, 5, 6, 7]
const oneToEight = [1, 2, 3, 4, 5, 6, 7, 8]

const listener = (elem, event) => listener => { elem.on(event, listener); return () => elem.removeListener(event, listener) }

function createPads (push) {
  return oneToEight.map(x => oneToEight.map(y => {
    let pad = push.grid.x[x].y[y]
    return {
      ledOn: pad.led_on.bind(pad),
      ledOff: pad.led_off.bind(pad),
      ledRGB: pad.led_rgb.bind(pad),
      onAftertouch: listener(pad, 'aftertouch'),
      onPressed: listener(pad, 'pressed'),
      onReleased: listener(pad, 'released')
    }
  }))
}

function createGridSelectButtons (push) {
  return oneToEight.map(x => {
    let button = push.grid.x[x].select
    return {
      ledOn: button.led_on.bind(button),
      ledOff: button.led_off.bind(button),
      ledRGB: button.led_rgb.bind(button),
      onPressed: listener(button, 'pressed'),
      onReleased: listener(button, 'released')
    }
  })
}

// function baseButton

function createButtons (push) {
  const capitalize = name => name
    .replace(/_(\w|&)/g, (a, x) => a.replace(`_${x}`, x.toUpperCase()))
    .replace(/^(\w)/g, (a, x) => a.replace(x, x.toUpperCase()))
  const names = ['tap_tempo', 'metronome', 'master', 'stop', 'left', 'right', 'up', 'down',
    'select', 'shift', 'note', 'session', 'add_effect', 'add_track', 'octave_down', 'octave_up',
    'repeat', 'accent', 'scales', 'user', 'mute', 'solo', 'step_in', 'step_out', 'play', 'rec',
    'new', 'duplicate', 'automation', 'fixed_length', 'device', 'browse', 'track', 'clip',
    'volume', 'pan_&_send', 'quantize', 'double', 'delete', 'undo']
  return names.reduce((acc, it) => {
    let button = push.button[it]
    acc[capitalize(it)] = {
      ledOn: button.led_on.bind(button),
      ledDim: button.led_dim.bind(button),
      ledOff: button.led_off.bind(button),
      onPressed: listener(button, 'pressed'),
      onReleased: listener(button, 'released')
    }
    return acc
  }, {})
}

function createTimeDivisionButtons (push) {
  const names = ['1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32', '1/32t']
  return names.reduce((acc, it) => {
    let button = push.button[it]
    acc[it] = {
      ledOn: button.led_on.bind(button),
      ledDim: button.led_dim.bind(button),
      ledOff: button.led_off.bind(button),
      onPressed: listener(button, 'pressed'),
      onReleased: listener(button, 'released')
    }
    return acc
  }, {})
}

module.exports = (midiOutCallBacks = []) => {
  let push = new Push({ send: bytes => { midiOutCallBacks.forEach(callback => callback(bytes)) }})
  let buttons = createButtons(push)
  let pads = createPads(push)
  let gridSelectButtons = createGridSelectButtons(push)
  let timeDivisionButtons = createTimeDivisionButtons(push)

  return {
    button: name => buttons[name],
    gridRow: y => zeroToSeven.map(x => pads[x][y]),
    gridCol: x => zeroToSeven.map(y => pads[x][y]),
    gridSelectButtons: () => gridSelectButtons,
    midiIn: bytes => push.receive_midi(bytes),
    timeDivisionButtons: name => timeDivisionButtons[name]
  }
}

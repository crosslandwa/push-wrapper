'use strict'
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

module.exports = (midiOutCallBacks = []) => {
  let push = new Push({ send: bytes => { midiOutCallBacks.forEach(callback => callback(bytes)) }})
  let pads = createPads(push)

  return {
    gridRow: y => zeroToSeven.map(x => pads[x][y]),
    gridCol: x => zeroToSeven.map(y => pads[x][y]),
    midiIn: bytes => push.receive_midi(bytes)
  }
}

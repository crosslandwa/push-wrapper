'use strict'
const Push = require('./push.js')
const log = console.log
const zeroToSeven = [0, 1, 2, 3, 4, 5, 6, 7]
const oneToEight = [1, 2, 3, 4, 5, 6, 7, 8]

module.exports = (midiOutCallBacks = []) => {
  let push = new Push({ send: bytes => { midiOutCallBacks.forEach(callback => callback(bytes)) }})

  oneToEight.forEach(x => {
    oneToEight.forEach(y => {
      let pad = push.grid.x[x].y[y]
      pad.onPressed = callback => {
        pad.on('pressed', callback)
        return () => pad.removeListener('pressed', callback)
      }
    })
  })

  return {
    gridRow: y => zeroToSeven.map(x => push.grid.x[x + 1].y[y + 1]),
    gridCol: x => zeroToSeven.map(y => push.grid.x[x + 1].y[y + 1]),
    midiIn: bytes => push.receive_midi(bytes)
  }
}

'use strict'
const Push = require('./push.js')
const log = console.log

module.exports = (midiOutCallBacks = []) => {
  let push = new Push({ send: bytes => { midiOutCallBacks.forEach(callback => callback(bytes)) }})
  return {
    onPadPressed: (x, y, callback) => {
      push.grid.x[x + 1].y[y + 1].on('pressed', callback)
      return () => { push.grid.x[x + 1].y[y + 1].removeListener('pressed', callback) }
    },
    midiIn: bytes => push.receive_midi(bytes)
  }
}

const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach');

var ccToKnobMap = {
    14: 'tempo',
    15: 'swing',
    71: 'one',
    72: 'two',
    73: 'three',
    74: 'four',
    75: 'five',
    76: 'six',
    77: 'seven',
    78: 'eight',
    79: 'master'
}

function Knob() {
    EventEmitter.call(this);
}
util.inherits(Knob, EventEmitter);

function Knobs() {
    foreach(ccToKnobMap, (value, key) => this[value] = new Knob());
}

Knobs.prototype.receive_midi_cc = function(index, value) {
    if (ccToKnobMap.hasOwnProperty(index)) {
        var knob_name = ccToKnobMap[index];
        var delta = value < 64 ? value : value - 128;
        this[knob_name].emit('turned', delta);
    }
}

module.exports = Knobs;

const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach');

var knobMap = {
    'tempo': { 'cc': 14, 'note': 10 },
    'swing': { 'cc': 15, 'note': 9 },
    'one': { 'cc': 71, 'note': 0 },
    'two': { 'cc': 72, 'note': 1 },
    'three': { 'cc': 73, 'note': 2 },
    'four': { 'cc': 74, 'note': 3 },
    'five': { 'cc': 75, 'note': 4 },
    'six': { 'cc': 76, 'note': 5 },
    'seven': { 'cc': 77, 'note': 6 },
    'eight': { 'cc': 78, 'note': 7 },
    'master': { 'cc': 79, 'note': 8 },
}

var ccToKnobMap = {};
var noteToKnobMap = {};
foreach(knobMap, (value, key) => {
    ccToKnobMap[value.cc] = key;
    noteToKnobMap[value.note] = key;
})

function Knob() {
    EventEmitter.call(this);
}
util.inherits(Knob, EventEmitter);

function Knobs() {
    foreach(knobMap, (value, key) => this[key] = new Knob());
}

Knobs.prototype.receive_midi_cc = function(index, value) {
    if (ccToKnobMap.hasOwnProperty(index)) {
        var knob_name = ccToKnobMap[index];
        var delta = value < 64 ? value : value - 128;
        this[knob_name].emit('turned', delta);
    }
}

Knobs.prototype.receive_midi_note = function(note, velocity) {
    if (noteToKnobMap.hasOwnProperty(note)) { 
        var knob_name = noteToKnobMap[note];
        var event_name = velocity > 0 ? 'touched' : 'released';
        this[knob_name].emit(event_name);
    }
}

module.exports = Knobs;

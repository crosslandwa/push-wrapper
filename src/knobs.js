const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial');

var knobMap = {
    'tempo': { 'cc': 14, 'note': 10 },
    'swing': { 'cc': 15, 'note': 9 },
    1: { 'cc': 71, 'note': 0 },
    2: { 'cc': 72, 'note': 1 },
    3: { 'cc': 73, 'note': 2 },
    4: { 'cc': 74, 'note': 3 },
    5: { 'cc': 75, 'note': 4 },
    6: { 'cc': 76, 'note': 5 },
    7: { 'cc': 77, 'note': 6 },
    8: { 'cc': 78, 'note': 7 },
    'master': { 'cc': 79, 'note': 8 },
}

var ccToKnobMap = {};
var noteToKnobMap = {};
foreach(knobMap, (value, key) => {
    ccToKnobMap[value.cc] = key;
    noteToKnobMap[value.note] = key;
});
const handled_ccs = Object.keys(ccToKnobMap),
    handled_notes = Object.keys(noteToKnobMap);

function Knob() {
    EventEmitter.call(this);
}
util.inherits(Knob, EventEmitter);

function Knobs() {
    foreach(knobMap, (value, key) => this[key] = new Knob());
    this.handled_ccs = handled_ccs;
    this.receive_midi_cc = partial(receive_midi_cc, this);
    this.receive_midi_note = partial(receive_midi_note, this);
    this.handled_notes = handled_notes;
}

function receive_midi_cc(knobs, index, value) {
    var knob_name = ccToKnobMap[index];
    var delta = value < 64 ? value : value - 128;
    knobs[knob_name].emit('turned', delta);
}

function receive_midi_note(knobs, note, velocity) {
    var knob_name = noteToKnobMap[note];
    var event_name = velocity > 0 ? 'pressed' : 'released';
    knobs[knob_name].emit(event_name);
}

module.exports = Knobs;

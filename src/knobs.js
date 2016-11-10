const EventEmitter = require('events');
const util = require('util');

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

const ccToKnobMap = {};
const noteToKnobMap = {};
const knobNames = Object.keys(knobMap);
knobNames.forEach(name => {
    ccToKnobMap[knobMap[name].cc] = name;
    noteToKnobMap[knobMap[name].note] = name;
})
const handledCCs = Object.keys(ccToKnobMap);
const handledNotes = Object.keys(noteToKnobMap);

function Knob() {
    EventEmitter.call(this);
}
util.inherits(Knob, EventEmitter);

function Knobs() {
    knobNames.forEach(name => { this[name] = new Knob() });
    this.handled_ccs = handledCCs;
    this.receive_midi_cc = receive_midi_cc.bind(null, this);
    this.receive_midi_note = receive_midi_note.bind(null, this);
    this.handled_notes = handledNotes;
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

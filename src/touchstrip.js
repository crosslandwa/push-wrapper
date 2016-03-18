const EventEmitter = require('events'),
    util = require('util'),
    partial = require('lodash.partial'),
    handled_notes = [12];

function TouchStrip() {
    EventEmitter.call(this);
    this.receive_midi_pitch_bend = partial(receive_midi_pitch_bend, this);
    this.receive_midi_note = partial(receive_midi_note, this);
    this.handled_notes = handled_notes;
}
util.inherits(TouchStrip, EventEmitter);

function receive_midi_pitch_bend(touchstrip, fourteen_bit_value) {
    if (fourteen_bit_value == 8192) return;
    touchstrip.emit('pitchbend', fourteen_bit_value);
}

function receive_midi_note(touchstrip, note, velocity) {
    if (velocity > 0) {
        touchstrip.emit('pressed');
    } else {
        touchstrip.emit('released');
        touchstrip.emit('pitchbend', 8192);
    }
}

module.exports = TouchStrip;

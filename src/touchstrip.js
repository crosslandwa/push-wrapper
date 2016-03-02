const EventEmitter = require('events'),
    util = require('util');

function TouchStrip() {
    EventEmitter.call(this);
}
util.inherits(TouchStrip, EventEmitter);

TouchStrip.prototype.receive_midi_pitch_bend = function(fourteen_bit_value) {
    if (fourteen_bit_value == 8192) return;
    this.emit('pitchbend', fourteen_bit_value);
}

TouchStrip.prototype.receive_midi_note = function(note, velocity) {
    if (note != 12) { 
        console.log('Touchstrip only responds to MIDI note 12. Received: ' + note);
        return;
    }

    if (velocity > 0) {
        this.emit('touched');
    } else {
        this.emit('released');
        this.emit('pitchbend', 8192);
    }
}

module.exports = TouchStrip;

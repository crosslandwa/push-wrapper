const EventEmitter = require('events'),
    util = require('util');

function GridButton(send_note, send_sysex, note) {
    EventEmitter.call(this);
    this.note_out = function(velocity) { send_note(note, velocity) };
    this.sysex_out = function(data) { send_sysex(data) };
    this.note = note;
}
util.inherits(GridButton, EventEmitter);

GridButton.prototype.led_on = function(value) { this.note_out(value ? value : 100) }
GridButton.prototype.led_off = function() { this.note_out(0) }
GridButton.prototype.led_rgb = function(r, g, b) {
    var index = this.note - 36,
        msb = [r, g, b].map((x) => (x & 240) >> 4),
        lsb = [r, g, b].map((x) => x & 15);
    this.sysex_out([4, 0, 8, index, 0, msb[0], lsb[0], msb[1], lsb[1], msb[2], lsb[2]]);
}

function Grid(send_note, send_sysex) {
    this.x = {};
    this.y = {};
    for (var x = 1; x <= 8; x++) {
        this.x[x] = { y: {} }
        for (var y = 1; y <= 8; y++) {
            if (this.y[y] === undefined) this.y[y] = { x: {} };
            this.y[y].x[x] = this.x[x].y[y] = new GridButton(send_note, send_sysex, (x - 1) + ((y - 1) * 8) + 36);
        }
    }
}

Grid.prototype.receive_midi_note = function(note, velocity) {
    if ((note < 36) || (note > 99)) {
        console.log('No grid button known for MIDI note: ' + note);
        return;
    }
    var indexed_from_zero = note - 36,
        vel = parseInt(velocity),
        x = (indexed_from_zero % 8) + 1,
        y = parseInt(indexed_from_zero / 8) + 1,
        button = this.x[x].y[y];
    vel > 0 ? button.emit('pressed', vel) : button.emit('released');
} 

module.exports = Grid;

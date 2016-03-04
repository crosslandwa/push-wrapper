const EventEmitter = require('events'),
    util = require('util');

function GridButton(midi_out, note) {
    EventEmitter.call(this);
    this.midi_out = midi_out;
    this.note = note;
}
util.inherits(GridButton, EventEmitter);

GridButton.prototype.led_on = function(value) { this.midi_out.send([144, this.note, value ? value : 100]) }
GridButton.prototype.led_off = function() { this.midi_out.send([144, this.note, 0]) }
GridButton.prototype.led_rgb = function(r, g, b) {
    var index = this.note - 36,
        msb = [r, g, b].map((x) => (x & 240) >> 4),
        lsb = [r, g, b].map((x) => x & 15);
    this.midi_out.send([240, 71, 127, 21, 4, 0, 8, index, 0, msb[0], lsb[0], msb[1], lsb[1], msb[2], lsb[2], 247]);
}

function Grid(midi_out) {
    this.x = {};
    this.y = {};
    for (var x = 1; x <= 8; x++) {
        this.x[x] = { y: {} }
        for (var y = 1; y <= 8; y++) {
            this.x[x].y[y] = new GridButton(midi_out, (x - 1) + ((y - 1) * 8) + 36);
        }
    }
    // allow to reference grid locations by y.x (as well as x.y)
    for (var y = 1; y <= 8; y++) {
        this.y[y] = { x: {} }
        for (var x = 1; x <= 8; x++) {
            this.y[y].x[x] = this.x[x].y[y];
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

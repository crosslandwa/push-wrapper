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

function Grid(midi_out) {
    this.x = {};
    this.y = {};
    for (var x = 0; x < 8; x++) {
        this.x[x] = { y: {} }
        for (var y = 0; y < 8; y++) {
            this.x[x].y[y] = new GridButton(midi_out, x + (y * 8) + 36);
        }
    }
    // allow to reference grid locations by y.x (as well as x.y)
    for (var y = 0; y < 8; y++) {
        this.y[y] = { x: {} }
        for (var x = 0; x < 8; x++) {
            this.y[y].x[x] = this.x[x].y[y];
        }
    }
}

Grid.prototype.receive_midi_note = function(note, velocity) {
    if ((36 <= note) && (note <= 99)) {
        var indexed_from_zero = note - 36,
            vel = parseInt(velocity),
            button = this.x[indexed_from_zero % 8].y[parseInt(indexed_from_zero / 8)];
        vel > 0 ? button.emit('pressed', vel) : button.emit('released');
    } else {
        console.log('No grid button known for MIDI note: ' + note);
    }
} 

module.exports = Grid;

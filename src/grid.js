const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach');

const control_buttons = {
    102: 'select_one',
    103: 'select_two',
    104: 'select_three',
    105: 'select_four',
    106: 'select_five',
    107: 'select_six',
    108: 'select_seven',
    109: 'select_eight'
};

function GridButton(send_midi_message, send_sysex, note) {
    EventEmitter.call(this);
    this.note_out = function(velocity) { send_midi_message(note, velocity) };
    this.sysex_out = function(data) { send_sysex(data) };
    this.index = note < 102 ? note - 36 : note - 38;
}
util.inherits(GridButton, EventEmitter);

GridButton.prototype.led_on = function(value) { this.note_out(value ? value : 100) }
GridButton.prototype.led_off = function() { this.note_out(0) }
GridButton.prototype.led_rgb = function(r, g, b) {
    var msb = [r, g, b].map((x) => (x & 240) >> 4),
        lsb = [r, g, b].map((x) => x & 15);
    this.sysex_out([4, 0, 8, this.index, 0, msb[0], lsb[0], msb[1], lsb[1], msb[2], lsb[2]]);
}

function Grid(send_note, send_cc, send_sysex) {
    this.x = {};
    this.y = {};
    for (var x = 1; x <= 8; x++) {
        this.x[x] = { y: {} }
        for (var y = 1; y <= 8; y++) {
            if (this.y[y] === undefined) this.y[y] = { x: {} };
            this.y[y].x[x] = this.x[x].y[y] = new GridButton(send_note, send_sysex, (x - 1) + ((y - 1) * 8) + 36);
        }
    }

    foreach(control_buttons, (value, key) => this[value] = new GridButton(send_cc, send_sysex, parseInt(key)));
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

Grid.prototype.handled_ccs = function() {
    return Object.keys(control_buttons);
}

Grid.prototype.receive_midi_cc = function(index, value) {
    this[control_buttons[index]].emit(value > 0 ? 'pressed' : 'released');
}

module.exports = Grid;

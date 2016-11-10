const EventEmitter = require('events'),
    util = require('util'),
    partial = require('lodash.partial');

const controlButtons = {
    102: 1,
    103: 2,
    104: 3,
    105: 4,
    106: 5,
    107: 6,
    108: 7,
    109: 8
};
const handledCCs = Object.keys(controlButtons).map(Number);

var handledNotes = [];
for (var i = 36; i <= 99; i++) handledNotes.push(i);

function GridButton(send_midi_message, send_sysex, note) {
    EventEmitter.call(this);
    this.note_out = function(velocity) { send_midi_message(note, velocity) };
    this.sysex_out = function(data) { send_sysex(data) };
    this.index = note < 102 ? note - 36 : note - 38;

    return {
        led_on: partial(led_on, this),
        led_off: partial(led_off, this),
        led_rgb: partial(led_rgb, this),
        on: this.on,
        emit: this.emit,
    }
}
util.inherits(GridButton, EventEmitter);

function led_on(gridButton, value) { gridButton.note_out(value ? value : 100) }
function led_off(gridButton) { gridButton.note_out(0) }
function led_rgb(gridButton, r, g, b) {
    var msb = [r, g, b].map((x) => (x & 240) >> 4),
        lsb = [r, g, b].map((x) => x & 15);
    gridButton.sysex_out([4, 0, 8, gridButton.index, 0, msb[0], lsb[0], msb[1], lsb[1], msb[2], lsb[2]]);
}

function Grid(send_note, send_cc, send_sysex) {
    this.x = {};
    this.select = {};
    for (var x = 1; x <= 8; x++) {
        this.x[x] = { y: {} }
        for (var y = 1; y <= 8; y++) {
            this.x[x].y[y] = new GridButton(send_note, send_sysex, (x - 1) + ((y - 1) * 8) + 36);
        }
    }

    handledCCs.forEach(cc => { this.select[controlButtons[cc]] = new GridButton(send_cc, send_sysex, cc) });
    this.handled_ccs = handledCCs;
    this.handled_notes = handledNotes;
    this.receive_midi_note = partial(receive_midi_note, this);
    this.receive_midi_cc = partial(receive_midi_cc, this);
    this.receive_midi_poly_pressure = partial(receive_midi_poly_pressure, this);
}

function receive_midi_note(grid, note, velocity) {
    var button = button_from_note(grid, note),
        vel = parseInt(velocity);
    vel > 0 ? button.emit('pressed', vel) : button.emit('released');
}

function receive_midi_cc(grid, index, value) {
    grid.select[controlButtons[index]].emit(value > 0 ? 'pressed' : 'released');
}

function receive_midi_poly_pressure(grid, note, pressure) {
    button_from_note(grid, note).emit('aftertouch', parseInt(pressure));
}

function button_from_note(grid, note) {
    var indexed_from_zero = note - 36,
        x = (indexed_from_zero % 8) + 1,
        y = parseInt(indexed_from_zero / 8) + 1;
    return grid.x[x].y[y];
}

module.exports = Grid;

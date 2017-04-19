const EventEmitter = require('events');
const util = require('util');

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

    return {
        led_on: (value) => { send_midi_message(note, value ? value : 100) },
        led_off: () => { send_midi_message(note, 0) },
        on: this.on,
        emit: this.emit,
        removeListener: this.removeListener
    }
}
util.inherits(GridButton, EventEmitter);

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
    this.receive_midi_note = receive_midi_note.bind(null, this);
    this.receive_midi_cc = receive_midi_cc.bind(null, this);
    this.receive_midi_poly_pressure = receive_midi_poly_pressure.bind(null, this);
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

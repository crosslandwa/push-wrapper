const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach');

var ccToPadMap = {
    20: 1, // top row above grid
    21: 2,
    22: 3,
    23: 4,
    24: 5,
    25: 6,
    26: 7,
    27: 8,
    43: '1/32t',
    42: '1/32',
    41: '1/16t',
    40: '1/16',
    39: '1/8t',
    38: '1/8',
    37: '1/4t',
    36: '1/4',
}
const handled_ccs = Object.keys(ccToPadMap);

function Pad(send_cc, cc) {
    EventEmitter.call(this);
    this.output = function(value) { send_cc(cc, value) };
    var colours = [7, 10]; // dim, bright
    this.colours = [7, 10]; // dim, bright
    return {
        led_on: function() { send_cc(cc, colours[1]) },
        led_dim: function() { send_cc(cc, colours[0]) },
        led_off: function() { send_cc(cc, 0) },
        red: function() { colours = [1, 4] },
        orange: function() { colours = [7, 10] },
        yellow: function() { colours = [13, 16] },
        green: function() { colours = [19, 22] },
        on: this.on,
        emit: this.emit,
    }
}
util.inherits(Pad, EventEmitter);

function ControlButtons(send_cc) {
    const control_buttons = this;
    foreach(ccToPadMap, (value, key) => this[value] = new Pad(send_cc, parseInt(key)));
    this.handled_ccs = handled_ccs;
    this.receive_midi_cc = function(cc, value) {
        var pad_name = ccToPadMap[cc];
        control_buttons[pad_name].emit(value > 0 ? 'pressed' : 'released');
    }
}

module.exports = ControlButtons;

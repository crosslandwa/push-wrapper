const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial');

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
    this.colours = [7, 10]; // dim, bright
    this.led_on = partial(led_on, this);
    this.led_dim = partial(led_dim, this);
    this.led_off = partial(led_off, this);
    this.red = partial(red, this);
    this.orange = partial(orange, this);
    this.yellow = partial(yellow, this);
    this.green = partial(green, this);
}
util.inherits(Pad, EventEmitter);

function led_on(pad) { pad.output(pad.colours[1]) }
function led_dim(pad) { pad.output(pad.colours[0]) }
function led_off(pad) { pad.output(0) }
function red(pad) { pad.colours = [1, 4] }
function orange(pad) { pad.colours = [7, 10] }
function yellow(pad) { pad.colours = [13, 16] }
function green(pad) { pad.colours = [19, 22] }

function ControlButtons(send_cc) {
    foreach(ccToPadMap, (value, key) => this[value] = new Pad(send_cc, parseInt(key)));
    this.handled_ccs = handled_ccs;
    this.receive_midi_cc = partial(receive_midi_cc, this);
}

function receive_midi_cc(control_buttons, cc, value) {
    var pad_name = ccToPadMap[cc];
    control_buttons[pad_name].emit(value > 0 ? 'pressed' : 'released');
} 

module.exports = ControlButtons;

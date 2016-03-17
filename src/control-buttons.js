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
    this.colours = [7, 10]; // dim, bright
}
util.inherits(Pad, EventEmitter);

Pad.prototype.led_on = function() { this.output(this.colours[1]) }
Pad.prototype.led_dim = function() { this.output(this.colours[0]) }
Pad.prototype.led_off = function() { this.output(0) }
Pad.prototype.red = function() { this.colours = [1, 4] }
Pad.prototype.orange = function() { this.colours = [7, 10] }
Pad.prototype.yellow = function() { this.colours = [13, 16] }
Pad.prototype.green = function() { this.colours = [19, 22] }

function ControlButtons(send_cc) {
    foreach(ccToPadMap, (value, key) => this[value] = new Pad(send_cc, parseInt(key)));
    this.handled_ccs = function() { return handled_ccs };
}

ControlButtons.prototype.receive_midi_cc = function(cc, value) {
    var pad_name = ccToPadMap[cc];
    this[pad_name].emit(pressed_or_released(value));
} 

function pressed_or_released(velocity) {
    return parseInt(velocity) > 0 ? 'pressed' : 'released';
}

module.exports = ControlButtons;

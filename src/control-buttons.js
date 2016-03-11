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
    27: 8
}

function Pad(send_cc, cc) {
    EventEmitter.call(this);
    this.output = function(value) { send_cc(cc, value) };
}
util.inherits(Pad, EventEmitter);

Pad.prototype.led_on = function(value) { this.output(value ? value : 4) }
Pad.prototype.led_dim = function(value) { this.output(value ? value : 1) }
Pad.prototype.led_off = function() { this.output(0) }

function ControlButtons(send_cc) {
    this.selection = {};
    this.state = {};
    foreach(ccToPadMap, (value, key) => this[value] = new Pad(send_cc, parseInt(key)));
}

ControlButtons.prototype.handled_ccs = function() {
    return Object.keys(ccToPadMap);
}

ControlButtons.prototype.receive_midi_cc = function(cc, value) {
    var pad_name = ccToPadMap[cc];
    this[pad_name].emit(pressed_or_released(value));
} 

function pressed_or_released(velocity) {
    return parseInt(velocity) > 0 ? 'pressed' : 'released';
}

module.exports = ControlButtons;

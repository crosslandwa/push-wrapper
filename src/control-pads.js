const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach');

var ccToPadMap = {
    20: 'one', // top row ('selection')
    21: 'two',
    22: 'three',
    23: 'four',
    24: 'five',
    25: 'six',
    26: 'seven',
    27: 'eight'
}

function Pad(send_cc, cc) {
    EventEmitter.call(this);
    this.output = function(value) { send_cc(cc, value) };
}
util.inherits(Pad, EventEmitter);

Pad.prototype.led_on = function(value) { this.output(value ? value : 4) }
Pad.prototype.led_dim = function(value) { this.output(value ? value : 1) }
Pad.prototype.led_off = function() { this.output(0) }

function ControlPads(send_cc) {
    this.selection = {};
    this.state = {};
    foreach(ccToPadMap, (value, key) => this[row(key)][value] = new Pad(send_cc, parseInt(key)));
}

function row(cc) {
    return cc < 100 ? 'selection' : 'state';
}

ControlPads.prototype.handled_ccs = function() {
    return Object.keys(ccToPadMap);
}

ControlPads.prototype.receive_midi_cc = function(cc, value) {
    var pad_name = ccToPadMap[cc];
    this[row(cc)][pad_name].emit(pressed_or_released(value));
} 

function pressed_or_released(velocity) {
    return parseInt(velocity) > 0 ? 'pressed' : 'released';
}

module.exports = ControlPads;

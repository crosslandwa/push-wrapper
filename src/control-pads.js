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
    27: 'eight',
    102: 'one', // bottom row ('state')
    103: 'two',
    104: 'three',
    105: 'four',
    106: 'five',
    107: 'six',
    108: 'seven',
    109: 'eight'
}

function Pad(midi_out, cc) {
    EventEmitter.call(this);
    this.midi_out = midi_out;
    this.cc = cc;
}
util.inherits(Pad, EventEmitter);

Pad.prototype.led_on = function() { this.midi_out.send([176, this.cc, 127]) }
Pad.prototype.led_off = function() { this.midi_out.send([176, this.cc, 0]) }

function ControlPads(midi_out) {
    this.selection = {};
    this.state = {};
    foreach(ccToPadMap, (value, key) => this[row(key)][value] = new Pad(midi_out, parseInt(key)));
}

function row(cc) {
    return cc < 100 ? 'selection' : 'state';
}

ControlPads.prototype.handles_cc = function(index) {
    return ccToPadMap.hasOwnProperty(index);
}

ControlPads.prototype.receive_midi_cc = function(cc, value) {
    var pad_name = ccToPadMap[cc];
    this[row(cc)][pad_name].emit(pressed_or_released(value));
} 

function pressed_or_released(velocity) {
    return parseInt(velocity) > 0 ? 'pressed' : 'released';
}

module.exports = ControlPads;

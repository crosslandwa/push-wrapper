const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach');

var ccToButtonMap = {
    3: 'tap_tempo',
    9: 'metronome',
    119: 'undo',
    118: 'delete',
    117: 'double',
    116: 'quantize',
    90: 'fixed_length',
    89: 'automation',
    88: 'duplicate',
    87: 'new',
    86: 'rec',
    85: 'play',
    28: 'master',
    29: 'stop',
    43: '1/32t',
    42: '1/32',
    41: '1/16t',
    40: '1/16',
    39: '1/8t',
    38: '1/8',
    37: '1/4t',
    36: '1/4',
    44: 'left',
    45: 'right',
    46: 'up',
    47: 'down',
    114: 'volume',
    115: 'pan_&_send',
    112: 'track',
    113: 'clip',
    110: 'device',
    111: 'browse',
    62: 'step_in',
    63: 'step_out',
    60: 'mute',
    61: 'solo',
    58: 'scales',
    59: 'user',
    56: 'repeat',
    57: 'accent',
    54: 'octave_down',
    55: 'octave_up',
    52: 'add_effect',
    53: 'add_track',
    50: 'note',
    51: 'session',
    48: 'select',
    49: 'shift'
}

function Button(midi_out, cc) {
    EventEmitter.call(this);
    this.midi_out = midi_out;
    this.cc = cc;
}
util.inherits(Button, EventEmitter);

Button.prototype.led_on = function() { this.midi_out.send([176, this.cc, 127]) }
Button.prototype.led_off = function() { this.midi_out.send([176, this.cc, 0]) }

function Buttons(midi_out) {
    foreach(ccToButtonMap, (value, key) => this[value] = new Button(midi_out, parseInt(key)));
}

Buttons.prototype.receive_midi_cc = function(index, value) {
    this[ccToButtonMap[index]].emit(pressed_or_released(value));
}

Buttons.prototype.handles_cc = function(index) {
    return ccToButtonMap.hasOwnProperty(index);
}

function pressed_or_released(velocity) {
    return parseInt(velocity) > 0 ? 'pressed' : 'released';
}

module.exports = Buttons;

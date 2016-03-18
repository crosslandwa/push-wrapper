const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial');

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
const handled_ccs = Object.keys(ccToButtonMap);

function Button(send_cc, cc) {
    EventEmitter.call(this);
    this.output = function (value) { send_cc(cc, value) };
    this.led_on = partial(led_on, this);
    this.led_dim = partial(led_dim, this);
    this.led_off = partial(led_off, this);
}
util.inherits(Button, EventEmitter);

function led_on(button) { button.output(4) }
function led_dim(button) { button.output(1) }
function led_off(button) { button.output(0) }

function Buttons(send_cc) {
    foreach(ccToButtonMap, (value, key) => this[value] = new Button(send_cc, parseInt(key)));
    this.receive_midi_cc = partial(receive_midi_cc, this);
    this.handled_ccs = handled_ccs;
}

function receive_midi_cc (buttons, index, value) {
    buttons[ccToButtonMap[index]].emit(pressed_or_released(value));
}

function pressed_or_released(velocity) {
    return parseInt(velocity) > 0 ? 'pressed' : 'released';
}

module.exports = Buttons;

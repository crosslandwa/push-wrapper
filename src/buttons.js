const EventEmitter = require('events'),
    util = require('util');

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
    return {
        led_on: function() { send_cc(cc, 4) },
        led_dim: function() { send_cc(cc, 1) },
        led_off: function() { send_cc(cc, 0) },
        red: () => {},
        orange: () => {},
        yellow: () => {},
        green: () => {},
        on: this.on,
        emit: this.emit,
    }
}
util.inherits(Button, EventEmitter);

function Buttons(send_cc) {
    const buttons = this;
    Object.keys(ccToButtonMap).map(Number).forEach(cc => {
      this[ccToButtonMap[cc]] = new Button(send_cc, cc)
    });
    this.names = Object.keys(ccToButtonMap).map((key) => { return ccToButtonMap[key] });
    this.receive_midi_cc = function(index, value) {
        buttons[ccToButtonMap[index]].emit(pressed_or_released(value));
    };
    this.handled_ccs = handled_ccs;
}

function pressed_or_released(velocity) {
    return parseInt(velocity) > 0 ? 'pressed' : 'released';
}

module.exports = Buttons;

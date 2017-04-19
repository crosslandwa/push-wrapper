const EventEmitter = require('events'),
    util = require('util');

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
    return {
        led_on: function(value) { send_cc(cc, value) },
        led_dim: function(value) { send_cc(cc, value) },
        led_off: function() { send_cc(cc, 0) },
        on: this.on,
        emit: this.emit,
        removeListener: this.removeListener
    }
}
util.inherits(Pad, EventEmitter);

function ControlButtons(send_cc) {
    const control_buttons = this;
    Object.keys(ccToPadMap).map(Number).forEach(cc => {
      this[ccToPadMap[cc]] = new Pad(send_cc, cc)
    })
    this.handled_ccs = handled_ccs;
    this.receive_midi_cc = function(cc, value) {
        var pad_name = ccToPadMap[cc];
        control_buttons[pad_name].emit(value > 0 ? 'pressed' : 'released');
    }
}

module.exports = ControlButtons;

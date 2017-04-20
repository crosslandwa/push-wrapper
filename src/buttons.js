const EventEmitter = require('events'),
    util = require('util');

const {ccToButton: ccToButtonMap} = require('./buttonMap')
const handled_ccs = Object.keys(ccToButtonMap);

function Button() {
    EventEmitter.call(this);
    return {
        on: this.on,
        emit: this.emit,
        removeListener: this.removeListener
    }
}
util.inherits(Button, EventEmitter);

function Buttons() {
    const buttons = this;
    Object.keys(ccToButtonMap).map(Number).forEach(cc => {
      this[ccToButtonMap[cc]] = new Button()
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

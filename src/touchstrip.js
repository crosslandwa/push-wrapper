const EventEmitter = require('events'),
    util = require('util');

function TouchStrip(midi_out, cc) {
    EventEmitter.call(this);
    this.midi_out = midi_out;
    this.cc = cc;
}
util.inherits(TouchStrip, EventEmitter);

// TouchStrip.prototype.led_on = function() { this.midi_out.send([176, this.cc, 127]) }
// TouchStrip.prototype.led_off = function() { this.midi_out.send([176, this.cc, 0]) }

// Knobs.prototype.receive_midi_cc = function(index, value) {
//     if (ccToKnobMap.hasOwnProperty(index)) {
//         var knob_name = ccToKnobMap[index];
//         var delta = value < 64 ? value : value - 128;
//         this[knob_name].emit('turned', delta);
//     } else {
//         console.log('No knob known for CC: ' + index);
//     }
// }

TouchStrip.prototype.receive_midi_note = function(note, velocity) {
    if (note == 12) { 
        var event_name = velocity > 0 ? 'touched' : 'released';
        this.emit(event_name);
    } else {
        console.log('Touchstrip only responds to MIDI note 12. Received: ' + note);
    }
}

module.exports = TouchStrip;

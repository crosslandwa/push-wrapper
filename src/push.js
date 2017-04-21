// Public API/node-module for the Push

const EventEmitter = require('events'),
    util = require('util'),
    Knobs = require('./knobs'),
    Touchstrip = require('./touchstrip'),
    LCDs = require('./lcds'),
    oneToEight = [1, 2, 3, 4, 5, 6, 7, 8];

function Push(midi_out_port) {
    EventEmitter.call(this);

    var midi_out = {
        send_sysex: function(data) { midi_out_port.send([240, 71, 127, 21].concat(data).concat([247])) }
    }

    this.knobs = new Knobs();
    this.touchstrip = new Touchstrip();
    this.ccMap = [];
    this.noteMap = [];

    [this.knobs, this.touchstrip].forEach(
        (module) => module.handled_notes.forEach(note => this.noteMap[note] = module)
    );

    [this.knobs].forEach(
        (module) => module.handled_ccs.forEach(cc => this.ccMap[cc] = module)
    );

    // Defines public API returned
    const api = {
        knob: {
            tempo: this.knobs.tempo,
            swing: this.knobs.swing,
            master: this.knobs.master,
        },
        touchstrip: this.touchstrip,
        lcd: new LCDs(midi_out.send_sysex),
        channel: {},
        receive_midi: receive_midi.bind(null, this),
    }
    oneToEight.forEach(
        (number) => api.channel[number] = { knob: this.knobs[number] }
    );
    return api;
}
util.inherits(Push, EventEmitter);

function handle_midi_cc(push, index, value) {
    if (index in push.ccMap) {
        push.ccMap[index].receive_midi_cc(index, value);
    } else {
        console.log('No known mapping for CC: ' + index);
    }
}

function handle_midi_note(push, note, velocity) {
    if (note in push.noteMap) {
        push.noteMap[note].receive_midi_note(note, velocity);
    } else {
        console.log('No known mapping for note: ' + note);
    }
}

function handle_midi_pitch_bend(push, lsb_byte, msb_byte) {
    push.touchstrip.receive_midi_pitch_bend((msb_byte << 7) + lsb_byte);
}

var midi_messages = {
    'note-off': 128, // note number, velocity
    'note-on': 144, // note number, velocity
    'poly-pressure': 160, // note number, velocity
    'cc': 176, // cc number, value
    'program-change': 192, // pgm number
    'channel-pressure': 208, // velocity
    'pitch-bend': 224, // lsb (7-bits), msb (7-bits)
    'sysex': 240, // id [1 or 3 bytes], data [n bytes], 247
}

// Handles MIDI (CC) data from Push - causes events to be emitted
function receive_midi(push, bytes) {
    var message_type = bytes[0] & 0xf0;
    var midi_channel = bytes[0] & 0x0f;

    switch (message_type) {
        case (midi_messages['cc']):
            handle_midi_cc(push, bytes[1], bytes[2]);
            break;
        case (midi_messages['note-on']):
        case (midi_messages['note-off']):
            handle_midi_note(push, bytes[1], bytes[2]);
            break;
        case (midi_messages['pitch-bend']):
            handle_midi_pitch_bend(push, bytes[1], bytes[2]);
            break;
    }
}

// Adaptor function used to bind to web MIDI API
Push.create_bound_to_web_midi_api = function(midiAccess) {
    var inputs = midiAccess.inputs.values(),
        outputs = midiAccess.outputs.values(),
        push;

    for (var output = outputs.next(); output && !output.done; output = outputs.next()) {
        console.log('Found output: ' + output.value.name);
        if ('Ableton Push User Port' == output.value.name) {
            console.log('Binding MIDI output to ' + output.value.name);
            push = new Push(output.value);
            break;
        }
    }

    if (push === undefined) push = new Push({ send: (bytes) => { 'no implementation by default' } });

    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        console.log('Found input: ' + input.value.name);
        if ('Ableton Push User Port' == input.value.name) {
            console.log('Binding MIDI input to ' + input.value.name);
            input.value.onmidimessage = (event) => { push.receive_midi(event.data) };
            break;
        }
    }

    return push;
}

module.exports = Push;

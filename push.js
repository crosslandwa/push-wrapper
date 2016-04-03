// Public API/node-module for the Push

const EventEmitter = require('events'),
    util = require('util'),
    Buttons = require('./src/buttons.js'),
    Knobs = require('./src/knobs'),
    Grid = require('./src/grid.js'),
    Touchstrip = require('./src/touchstrip.js'),
    ControlButtons = require('./src/control-buttons.js'),
    LCDs = require('./src/lcds.js'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial');

function Push(midi_out_port) {
    EventEmitter.call(this);

    var midi_out = {
        send_cc: function(cc, value) { midi_out_port.send([176, cc, value]) },
        send_note: function(note, velocity) { midi_out_port.send([144, note, velocity]) },
        send_sysex: function(data) { midi_out_port.send([240, 71, 127, 21].concat(data).concat([247])) }
    }

    this.output_port = midi_out;
    this.buttons = new Buttons(midi_out.send_cc);
    this.knobs = new Knobs();
    this.grid = new Grid(midi_out.send_note, midi_out.send_cc, midi_out.send_sysex);
    this.touchstrip = new Touchstrip();
    this.control = new ControlButtons(midi_out.send_cc);
    this.lcd = new LCDs(midi_out.send_sysex);
    this.ccMap = [];
    this.noteMap = [];

    foreach(
        [this.knobs, this.touchstrip, this.grid],
        (module) => foreach(module.handled_notes, (value, key) => this.noteMap[value] = module)
    );

    foreach(
        [this.knobs, this.control, this.buttons, this.grid],
        (module) => foreach(module.handled_ccs, (value, key) => this.ccMap[value] = module)
    );

    this.receive_midi = partial(receive_midi, this);
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

function handle_midi_poly_pressure(push, note, pressure) {
    push.grid.receive_midi_poly_pressure(note, pressure);
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
        case(midi_messages['poly-pressure']):
            handle_midi_poly_pressure(push, bytes[1], bytes[2]);
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
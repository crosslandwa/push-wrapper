# node-push

## What?

A javascript wrapper for using the Ableton Push as a MIDI controller via a simple event-driven API, encapsulating the generation and parsing of MIDI messages sent to/from the Ableton Push hardware.

node-push can be compiled for use as a MIDI controller in a Web MIDI/Audio API enabled web browser.

## how to use

Add details for
- example app
- compiling
- running tests

## Why?

I posed myself a couple of front-end/musical-tool development questions and used this project to answer them.

### Can I write/test code in node and deploy for use in the browser?
- Node/npm provides a fast feedback environment for rapid test driven development
- Utilising [ports & adaptors](http://alistair.cockburn.us/Hexagonal+architecture) design pattern enables isolation of 'Push wrapper' code from the Web MIDI API used when deployed in the browser
  - presents simple MIDI IO interfaces that are easy to stub in tests
- [Browserify](http://browserify.org/) integrated into an npm workflow to bundle all the node application code into a single JS file for use in the web browser application

### Can I use the web browser as a *fast-booting* and *performant* environment (compared to e.g. MaxMSP, Ableton Live + Max4Live)?
- TBD

### Can i write a *reasonable looking* and *useful* app in a web browser (in a timeframe comparable to MaxMSP development)?
- TBD

# API documentation

The push wrapper presents each element of the Push hardware as a distinct object that emits **control events** (see [Event Emitter](https://nodejs.org/api/events.html)) in response to receiving MIDI messages from the Push hardware (via its `receive_midi` method). 

Similarly, **feedback commands** can be sent to elements of the hardware (e.g. turning on button LEDs) by calling the appropriate method on the object in the push wrapper (causing the wrapper to output the corresponding MIDI command)

## Instantiation and MIDI IO

### Create new Push wrapper

```
const Push = require('./push.js');
var midi_out = {
    send: function(midi_bytes) {
        // implementation expects midi_bytes to be an array
    }
}
var push = new Push(midi_out);

var midi_bytes = [144, 100, 127];
push.receive_midi(midi_bytes); // wrapper expects midi_bytes to be an array
```

### Web MIDI API integration
If you are using the Web MIDI API you can bind a MIDI input/output ports to the Push wrapper. It's no coincidence the interfaces expected by the wrapper closely match those exposed by the Web MIDI API:
```
navigator.requestMIDIAccess().then((midiAccess) => {
    var input = midiAccess.inputs.values()[0],
        output = midiAccess.outputs.values()[0];

    var push = new Push(output.value); // bind MIDI output
    input.value.onmidimessage = (event) => { push.receive_midi(event.data) }; // bind MIDI input
});
```

A static factory method is provided to encapsulate binding the Push wrapper to Web MIDI API input/output ports named "Ableton Push User Port"
```
const Push = require('./push.js');
navigator.requestMIDIAccess({ sysex: false })
    .then(Push.create_bound_to_web_midi_api)
    .then((push) => {
        // do stuff with the wrapper here    
    });
```

This convinience method works nicely on OS X, but on windows the Push likely reports itself as "USB Device 1" or similar (MIDI devices did last time I checked in) - you may have to roll your own binding if using this under windows...

## Control events and feedback commands

All interactions with the wrapper are documented in the [push_spec.js](spec/push_spec.js) test suite, but can be summarised as below.

```
//-----GRID-----

push.grid.x[X].y[Y].on('pressed', (velocity) => { // grid pressed actions. velocity = 1 -> 127 });
push.grid.x[X].y[Y].on('released', () => // grid released actions);

push.grid.x[X].y[Y].led_on(value); // value = 1 -> 127, giving various colours
push.grid.x[X].y[Y].led_on(); // turns on LED, defaulting to orange (value = 100)
push.grid.x[X].y[Y].led_off(); // turns LED off

// X, Y values: 1 -> 8, where x[1].y[1] is the bottom left grid pad, and x[8].y[8] is the top-right

// note can reference pads by x.y or y.x, i.e. these are equivalent
push.grid.x[1].y[7].led_on();
push.grid.y[7].x[1].led_on();

//-----BUTTONS-----

push.buttons.BUTTON_NAME.on('pressed', () => // button pressed actions);
push.buttons.BUTTON_NAME.on('released', () => // button released actions);

push.buttons.BUTTON_NAME.led_on()
push.buttons.BUTTON_NAME.led_off()

// BUTTON_NAME values: tap_tempo, metronome, master, stop, 1/4, 1/4t, 1/8, 1/8t, 1/16, 1/16t, 1/32, 1/32t, left, right, up, down, select, shift, note, session, add_effect, add_track, octave_down, octave_up, repeat, accent, scales, user, mute, solo, step_in, step_out, play, rec, new, duplicate, automation, fixed_length, device, browse, track, clip, volume, pan_&_send, quantize, double, delete, undo

//-----KNOBS-----

push.knobs.KNOB_NAME.on('touched', () => // knob touching start actions);
push.knobs.KNOB_NAME.on('released', () => // knob touching stop actions);
push.knobs.KNOB_NAME.on('turned', (delta) => { // delta = number of clicks. positive = clockwise, negative = anti-clockwise });

// KNOB_NAME values: tempo, swing, one, two, three, four, five, six, seven, eight, master

//-----TOUCHSTRIP-----

push.touchstrip.on('touched', () => // touchstrip pushed actions);
push.touchstrip.on('released', () => // touchstrip released actions);
push.touchstrip.on('pitchbend', (amount) => // amount = 14bit value (0 -> 16383));
```

# app example credits/enhancement

Initial version of the app based off blog post here: http://www.keithmcmillen.com/blog/making-music-in-the-browser-web-midi-api/

I intend to create my own example app to include with the wrapper to demonstrate its use...

# Disclaimer

The code is written using javascript [ES2015/ES6](http://es6-features.org/) so expects native Promises and other language features to be available. It is only **known** to work in Google Chrome/OS X...
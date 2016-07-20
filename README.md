# push-wrapper

## What?

A javascript wrapper primarily enabling the use of the Ableton Push hardware as a MIDI controller in a Web MIDI/Audio API enabled web browser - I created a simple [example application](https://github.com/crosslandwa/push-wrapper-example-site) to demonstrate this.

The wrapper presents a simple event-driven [API](#control-events-and-feedback-commands), encapsulating the generation and parsing of MIDI messages sent to/from the hardware.

push-wrapper is written as a [requirejs](http://requirejs.org/) compatible module, and is distributed via [npm](https://www.npmjs.com/package/push-wrapper). The code is written using javascript [ES2015/ES6](http://es6-features.org/) so expects native Promises and other newer language features to be available.

###Modification & Running tests

If you want to modify the wrapper, install its dependencies and run its test suite by:
 
    npm install
    npm test

# API

push-wrapper presents each element of the Push hardware as a distinct object that emits **control events** (see [Event Emitter](https://nodejs.org/api/events.html)) in response to receiving MIDI messages from the Push hardware.

Similarly, **feedback commands** can be sent to elements of the hardware (e.g. turning on button LEDs) by calling the appropriate methods on each element (causing the wrapper to output a corresponding MIDI command).

## Instantiation and MIDI IO

### Create new Push wrapper

```javascript
const Push = require('push-wrapper');
var midi_out = {
    send: function(midi_bytes) {
        // implementation of sending MIDI messages to Push hardware
        // expects midi_bytes to be an array
    }
}
var push = new Push(midi_out); // MIDI messages sent to midi_out in response to issuing feedback commands to push

push.receive_midi([144, 100, 127]); // push emits events in response to receiving MIDI bytes from hardware
```

### Web MIDI API integration
If you are using the Web MIDI API you can bind a MIDI input/output ports to the Push wrapper. It's no coincidence the interfaces expected by the wrapper closely match those exposed by the Web MIDI API:

```javascript
navigator.requestMIDIAccess({ sysex: true }).then((midiAccess) => {
    var input = midiAccess.inputs.values()[0],
        output = midiAccess.outputs.values()[0];

    var push = new Push(output.value); // bind MIDI output
    input.value.onmidimessage = (event) => { push.receive_midi(event.data) }; // bind MIDI input
});
```

A static factory method is provided to encapsulate binding the Push wrapper to Web MIDI API input/output ports named "Ableton Push User Port"

```javascript
const Push = require('push-wrapper');
navigator.requestMIDIAccess({ sysex: true })
    .then(Push.create_bound_to_web_midi_api)
    .then((push) => {
        // do stuff with the wrapper here    
    });
```

*This convenience method works nicely on OS X, but on Windows the Push likely reports itself as "USB AudioDevice 1" or similar (MIDI devices did last time I checked in) - you may have to roll your own binding if using this under Windows...*

## Control events and feedback commands

All interactions with the wrapper are documented in the [push_spec.js](spec/push_spec.js) test suite, but are summarised below.

```javascript
//-----GRID-----

push.grid.x[X].y[Y].on('pressed', (velocity) => { /* pad pressed actions. velocity = 1 -> 127 */});
push.grid.x[X].y[Y].on('released', () => /* pad released actions */);
push.grid.x[X].y[Y].on('aftertouch', (pressure) => /* pad aftertouch actions. pressure = 0 -> 127 */);
push.grid.x[X].select.on('pressed', () => /* grid column select button pressed actions */);
push.grid.x[X].select.on('released', () => /* grid column select button released actions */);

push.grid.x[X].y[Y].led_on(value); /* value = 1 -> 127, giving various colours */
push.grid.x[X].y[Y].led_on(); /* turns on LED, defaulting to orange (value = 100) */
push.grid.x[X].y[Y].led_off(); /* turns LED off */
push.grid.x[X].y[Y].led_rgb(r, g, b); /* specify LED by RGB values (0-255) */
push.grid.x[X].select.led_on(value); /* grid column select button LED, value = 1 -> 127, giving various colours */
push.grid.x[X].select.led_on(); /* turns on grid column select button LED, defaulting to orange (value = 100) */
push.grid.x[X].select.led_off(); /* turns grid column select button LED off */
push.grid.x[X].select.led_rgb(r, g, b); /* specify grid column select button LED by RGB values (0-255) */

// X, Y values: 1 -> 8
// where x[1].y[1] is the bottom left pad, and x[8].y[8] is the top-right
// select elements represent the row of buttons immediately above the grid pads

//-----BUTTONS-----

push.button[BUTTON_NAME].on('pressed', () => /* button pressed actions */);
push.button[BUTTON_NAME].on('released', () => /* button released actions */);

push.button[BUTTON_NAME].led_on(); /* colour fixed per button */
push.button[BUTTON_NAME].led_dim(); /* colour fixed per button */
push.button[BUTTON_NAME].led_off();

// Note the time division buttons allow LED colour changes, honoured on the next led_on or led_dim call
// Default colour is orange
push.button[BUTTON_NAME].red();
push.button[BUTTON_NAME].orange();
push.button[BUTTON_NAME].yellow();
push.button[BUTTON_NAME].green();

// BUTTON_NAME values:
// tap_tempo, metronome, master, stop, 
// left, right, up, down, select, shift, note, session, add_effect, add_track,
// octave_down, octave_up, repeat, accent, scales, user, mute, solo, step_in, step_out,
// play, rec, new, duplicate, automation, fixed_length, device, browse, track, clip,
// volume, pan_&_send, quantize, double, delete, undo
// 1/4, 1/4t, 1/8, 1/8t, 1/16, 1/16t, 1/32, 1/32t (time division control buttons)

//-----CHANNEL-----
// Use the knob above and select button below the LCD for each of the eight channels

push.channel[X].knob.on('pressed', () => /* knob touching start actions */);
push.channel[X].knob.on('released', () => /* knob touching stop actions */);
push.channel[X].knob.on('turned', (delta) => { /* delta = number of clicks. positive = clockwise, negative = anti-clockwise */});

push.channel[X].select.on('pressed', () => /* select button pressed actions */);
push.channel[X].select.on('released', () => /* select button released actions */);

push.channel[X].select.led_on(); /* colour defaults to orange */
push.channel[X].select.led_dim(); /* colour defaults to orange */
push.channel[X].select.led_off();

// LED colour changes, honoured on the next led_on or led_dim call
push.channel[X].select.red();
push.channel[X].select.orange();
push.channel[X].select.yellow();
push.channel[X].select.green();

// X values: 1 -> 8

//-----KNOBS-----
// Use the remaining (non channel-specific) knobs

push.knob[KNOB_NAME].on('pressed', () => /* knob touching start actions */);
push.knob[KNOB_NAME].on('released', () => /* knob touching stop actions */);
push.knob[KNOB_NAME].on('turned', (delta) => { /* delta = number of clicks. positive = clockwise, negative = anti-clockwise */});

// KNOB_NAME values: tempo, swing, master

//-----TOUCHSTRIP-----

push.touchstrip.on('pressed', () => /* touchstrip pushed actions */);
push.touchstrip.on('released', () => /* touchstrip released actions */);
push.touchstrip.on('pitchbend', (amount) => { /* amount = 14bit value (0 -> 16383) */});

//-----LCDS-----

push.lcd.clear(); /* clears all LCD text */
push.lcd.x[X].y[Y].update(text); /* text is a 1-8 character string */
push.lcd.x[X].y[Y].clear(); /* clears specific 8 character segment */

// X values: 1 -> 8, Y values: 1 -> 4
// where x[1].y[1] is the bottom left 8 character segment of the LCD, and x[8].y[4] is the top-right
```

## Why?

I posed myself a couple of front-end/musical-tool development questions and used this project to answer them.

### Can I write/test code in node and deploy for use in the browser?
- Node/npm provides a fast feedback environment for rapid test driven development
- Utilising [ports & adaptors](http://alistair.cockburn.us/Hexagonal+architecture) design pattern enables testing of Push wrapper code in isolation from the Web MIDI API used when deployed in the browser
- npm modules can be used to *require* the push-wrapper code into an arbitrary JS/node application
- [Browserify](http://browserify.org/) integrates into an npm workflow to bundle application code into a single JS file for use in a HTML page

### Can I use the web browser as a *fast-booting* and *performant* environment (compared to e.g. MaxMSP, Ableton Live + Max4Live)?
- Fast booting? Yeah! 
- Performant? I've not built anything complex enough yet to indicate this could be an issue

### Can i write a *reasonable looking* and *useful* app in a web browser (in a timeframe comparable to MaxMSP development)?
- Yes and no
- The push-wrapper code makes hooking up the controller to application code trivial
- Writing audio applications *from scratch* using the Web Audio API proved to be slower than anticipated
  - The Web Audio API offers a fairly low level building blocks
  - Suggest I look at libraries such as [Tonejs](https://github.com/Tonejs/Tone.js) that provide higher level functionality in the future

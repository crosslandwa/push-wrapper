# node-push

## What?

A javascript wrapper for using the Ableton Push as a MIDI controller via a simple event-driven API, encapsulating the generation and parsing of MIDI messages sent to/from the Ableton Push hardware.

node-push can be used as a MIDI controller in a Web MIDI/Audio API enabled web browser - this repo includes an [example application](example-site/) to demonstrate this.

node-push is written as a (node) npm module, and can be used in your application via a require statement (see API documentation below). It is assumed you have node/npm installed on your system.

**Modification & Running tests**

If you want to modify the wrapper, install its dependencies via:
 
    npm install

To run the node-push test suite:

    npm test

### Disclaimer

The code is written using javascript [ES2015/ES6](http://es6-features.org/) so expects native Promises and other language features to be available. It is only **known** to work in Google Chrome/OS X...

# API documentation

The push wrapper presents each element of the Push hardware as a distinct object that emits **control events** (see [Event Emitter](https://nodejs.org/api/events.html)) in response to receiving MIDI messages from the Push hardware (via its `receive_midi` method). 

Similarly, **feedback commands** can be sent to elements of the hardware (e.g. turning on button LEDs) by calling the appropriate method on the object in the push wrapper (causing the wrapper to output the corresponding MIDI command)

## Instantiation and MIDI IO

### Create new Push wrapper

```javascript
const Push = require('./push.js');
var midi_out = {
    send: function(midi_bytes) {
        // implementation of sending MIDI messages to Push hardware
        // expects midi_bytes to be an array
    }
}
var push = new Push(midi_out);

var midi_bytes = [144, 100, 127];
push.receive_midi(midi_bytes); // wrapper expects midi_bytes to be an array
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
const Push = require('./push.js');
navigator.requestMIDIAccess({ sysex: true })
    .then(Push.create_bound_to_web_midi_api)
    .then((push) => {
        // do stuff with the wrapper here    
    });
```

This convenience method works nicely on OS X, but on Windows the Push likely reports itself as "USB AudioDevice 1" or similar (MIDI devices did last time I checked in) - you may have to roll your own binding if using this under Windows...

## Control events and feedback commands

All interactions with the wrapper are documented in the [push_spec.js](spec/push_spec.js) test suite, but can be summarised as below.

```javascript
//-----GRID-----

push.grid.x[X].y[Y].on('pressed', (velocity) => { /* pad pressed actions. velocity = 1 -> 127 */});
push.grid.x[X].y[Y].on('released', () => /* pad released actions */);
push.grid.SELECT.on('pressed', () => /* channel select button pressed actions */);
push.grid.SELECT.on('released', () => /* channel select button released actions */);

push.grid.x[X].y[Y].led_on(value); // value = 1 -> 127, giving various colours
push.grid.x[X].y[Y].led_on(); // turns on LED, defaulting to orange (value = 100)
push.grid.x[X].y[Y].led_off(); // turns LED off
push.grid.x[X].y[Y].led_rgb(r, g, b); // specify LED by RGB values (0-255)
push.grid.SELECT.led_on(value); // value = 1 -> 127, giving various colours
push.grid.SELECT.led_on(); // turns on LED, defaulting to orange (value = 100)
push.grid.SELECT.led_off(); // turns LED off
push.grid.SELECT.led_rgb(r, g, b); // specify LED by RGB values (0-255)

// X, Y values: 1 -> 8
// where x[1].y[1] is the bottom left pad, and x[8].y[8] is the top-right

// SELECT values:
// select_one, select_two, select_three, select_four, select_five, select_six, select_seven, select_eight

// note can reference pads by x.y or y.x, i.e. these are equivalent
push.grid.x[1].y[7].led_on();
push.grid.y[7].x[1].led_on();

//-----BUTTONS-----

push.buttons.BUTTON_NAME.on('pressed', () => /* button pressed actions */);
push.buttons.BUTTON_NAME.on('released', () => /* button released actions */);

push.buttons.BUTTON_NAME.led_on();
push.buttons.BUTTON_NAME.led_dim();
push.buttons.BUTTON_NAME.led_off();

// BUTTON_NAME values:
// tap_tempo, metronome, master, stop, 1/4, 1/4t, 1/8, 1/8t, 1/16, 1/16t, 1/32, 1/32t,
// left, right, up, down, select, shift, note, session, add_effect, add_track,
// octave_down, octave_up, repeat, accent, scales, user, mute, solo, step_in, step_out,
// play, rec, new, duplicate, automation, fixed_length, device, browse, track, clip,
// volume, pan_&_send, quantize, double, delete, undo

//-----KNOBS-----

push.knobs.KNOB_NAME.on('pressed', () => /* knob touching start actions */);
push.knobs.KNOB_NAME.on('released', () => /* knob touching stop actions */);
push.knobs.KNOB_NAME.on('turned', (delta) => { /* delta = number of clicks. positive = clockwise, negative = anti-clockwise */});

// KNOB_NAME values:
// tempo, swing, one, two, three, four, five, six, seven, eight, master

//-----TOUCHSTRIP-----

push.touchstrip.on('pressed', () => /* touchstrip pushed actions */);
push.touchstrip.on('released', () => /* touchstrip released actions */);
push.touchstrip.on('pitchbend', (amount) => { /* amount = 14bit value (0 -> 16383) */});

//-----LCDS-----
push.lcd.clear() /* clears all LCD text */
push.lcd.x[X].y[Y].update(text); /* text is a 1-8 character string */

// X values: 1 -> 8, Y values: 1 -> 4
// where x[1].y[1] is the bottom left 8 character segment of the LCD, and x[8].y[4] is the top-right

// note can reference LCD segments by x.y or y.x, i.e. these are equivalent
push.lcd.x[1].y[4].update('bananas');
push.lcd.y[4].x[1].update('bananas');
```

## Why?

I posed myself a couple of front-end/musical-tool development questions and used this project to answer them.

### Can I write/test code in node and deploy for use in the browser?
- Node/npm provides a fast feedback environment for rapid test driven development
- Utilising [ports & adaptors](http://alistair.cockburn.us/Hexagonal+architecture) design pattern enables testing of Push wrapper code in isolation from the Web MIDI API used when deployed in the browser
- [Browserify](http://browserify.org/) integrated into an npm workflow to bundle all the node application code into a single JS file for use in the web browser application

### Can I use the web browser as a *fast-booting* and *performant* environment (compared to e.g. MaxMSP, Ableton Live + Max4Live)?
- Fast booting? Yeah! 
- Performant? TBD

### Can i write a *reasonable looking* and *useful* app in a web browser (in a timeframe comparable to MaxMSP development)?
- TBD

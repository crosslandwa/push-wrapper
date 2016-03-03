# node-push
A wrapper for using the Ableton Push as a MIDI controller in a web browser.

The code is written using javascript ES2015/ES6 (so expects native Promises and other language features to be available) and is only **known** to work in Google Chrome...

## what

node-push can be compiled into javascript (via 'browserify') to use in a Web MIDI API / Web Audio API enabled web browser to use the Ableton Push as a MIDI controller for any (Web Audio API) code running in that browser.

The node-push wrapper encapsulates the MIDI messaging sent to/from the Ableton Push and presents a clean event driven API for hooking Push control/feedback into your application

## how to use

## why

I wanted to pose myself a couple of challenges/questions and used this project to drive out some solutions/answers. These cover both front-end development issues and musical tool development

### Can I write/test code in node (fast feedback) and deploy for use in the browser?
- Yes.
- Node/npm provides the environment for rapid test driven development
- Utilising ports/adaptors design pattern enables me to isolate the 'Push wrapper' from the Web MIDI API used when deployed in the browser
  - The API presented relies on two simple methods for MIDI input/output that can be mocked/stubbed in tests and integrate seemlessly with the Web MIDI API when running in the browser
- 'Browserify' (http://browserify.org/) utilised as a tool (and integrated into an npm workflow) to bundle all the node application code into a single JS file that can be deployed/run in the context of a JS app running in the web browser

### Can I use the web browser as a 'fast-booting' environment for my musical tools, compared to my current tools of choice (MaxMSP, Ableton Live + Max4Live)?
- TBD

### Can i write a 'reasonable looking' and 'useful' app in a web browser in a timeframe comparable to MaxMSP development?
- TBD

# API documentation

## Construction and MIDI IO

### Create new Push wrapper

The Push wrapper must be instantiated with a `midi_out` object as a dependency (see below)

```
const Push = require('./push.js');
var midi_out; 
var push = new Push(midi_out);
```

### MIDI output

The Push wrapper is dependent on a `midi_out` object that satisfies the following interface:

```
var midi_out = {
    send: function(midi_bytes) {
        // implementation expects midi_bytes to be an array
    }
}
```

When any **feedback commands** are issued to the Push wrapper, it will call `midi_out.send` to send the appropriate MIDI commands to the Push hardware

### MIDI input

The Push wrapper exposes a single method for receiving and parsing MIDI commands from the Push hardware
```
var midi_bytes = [144, 100, 127];
push.receive_midi(midi_bytes); // midi_bytes expected to be an array
```

Typically MIDI received from the Push hardware will cause the wrapper to emit **control events**. If you are using the Web MIDI API you can bind a MIDI input to the Push wrapper:
```
input.value.onmidimessage = function(event) { push.receive_midi(event.data) };
```

### Convenient creation in the browser

The main use case for the Push wrapper is within a web browser, interacting with the Web MIDI API. To that end a static factory method is provided that will bind the Push wrapper to MIDI input and output ports with the name "Ableton Push User Port"
```
const Push = require('./push.js');

window.addEventListener('load', function() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({ sysex: false })
            .then(Push.create_bound_to_web_midi_api)
            .then(off_we_go)
            .catch(console.error);
    } else {
        alert('No MIDI support in your browser');
    }
});

function off_we_go(bound_push) {
    const push = bound_push;
    
    // do stuff with the wrapper here
}
```
## Control events

## Feedback commands

# app example credits/enhancement

Initial version of the app based off blog post here: http://www.keithmcmillen.com/blog/making-music-in-the-browser-web-midi-api/

I intend to create my own example app to include with the wrapper to demonstrate its use...
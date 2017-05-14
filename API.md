# Push Wrapper API

## Setup and IO

### Instantiation
```javascript
const pushWrapper = require('push-wrapper')
const push = pushWrapper.push() // create a new push instance
```

### Receiving MIDI from hardware
```javascript
let bytes = [144, 44, 127] // MIDI note on
push.midiFromHardware(bytes)
```

### Listening to MIDI messages sent by wrapper
```javascript
const sendMidiToHardware = bytes => { /* bytes is an array of integers */ }
push.onMidiToHardware(sendMidiToHardware) // add listener
push.onMidiToHardware(console.log) // add multiple listeners (e.g. for logging sent MIDI)
```

### Web MIDI API integration
If you are using the Web MIDI API you can bind a MIDI input/output ports to the Push wrapper. It's no coincidence the interfaces expected by the wrapper closely match those exposed by the Web MIDI API:

```javascript
navigator.requestMIDIAccess({ sysex: true }).then((midiAccess) => {
  const input = midiAccess.inputs.values()[0].value
  const output = midiAccess.outputs.values()[0].value
  const push = pushWrapper.push()
  push.onMidiToHardware(output.send.bind(output))
  input.onmidimessage = event => push.midiFromHardware(event.data)
})
```

For convenience the wrapper provides a Promise function that resolves to give Web MIDI input/output ports named "Ableton Push User Port"
```javascript
pushWrapper.webMIDIio() // a Promise that rejects if the browser does not support the Web MIDI API, or input/output ports named "Ableton Push User Port" can not be found
  .then(({inputPort, outputPort}) => {
    const push = pushWrapper.push()
    inputPort.onmidimessage = event => push.midiFromHardware(event.data)
    push.onMidiToHardware(outputPort.send.bind(outputPort))
    return push
  }).then(push => /* do stuff with push */)
```
*This convenience method works nicely on OS X, but on Windows the Push likely reports itself as "USB AudioDevice 1" or similar (MIDI devices did last time I checked in) - you may have to roll your own binding if using this under Windows...*

## Hardware interactions
```javascript
//-----GRID PADS-----
push.gridRow(Y) // returns array (row) of pads
push.gridCol(X) // returns array (column) of pads

let pad = push.gridCol(X)[Y] || push.gridRow(Y)[X]
pad.ledOn(value = 100) // turn on LED, value = 1 -> 127, giving various colours, defaults to 100 (orange)
pad.ledOff() // turn off LED
pad.ledRGB(r, g, b) // turn on LED specifying RGB values (0-255)
pad.onPressed(velocity => { /* pressed actions. velocity = 1 -> 127 */})
pad.onReleased(() => { /* released actions */ })
pad.onAftertouch(pressure => { /* aftertouch actions. pressure = 0 -> 127 */ })


//-----ROW OF BUTTONS ABOVE GRID-----
push.gridSelectButtons() // returns array (row) of buttons

let gridSelectButton = push.gridSelectButtons()[X]
gridSelectButton.ledOn(value = 100) // turn on LED, value = 1 -> 127, giving various colours, defaults to 100 (orange)
gridSelectButton.ledOff() // turn off LED
gridSelectButton.ledRGB(r, g, b) // turn on LED specifying RGB values (0-255)
gridSelectButton.onPressed(() => { /* pressed actions */ })
gridSelectButton.onReleased(() => { /* released actions */ })


//-----BUTTONS-----
let button = push.button(NAME)
button.onPressed(() => { /* pressed actions */ })
button.onReleased(() => { /* released actions */ })
button.ledOn() // turn on LED (full brightness)
button.ledDim() // turn on LED dim
button.ledOff() // turn off LED

// NAME values:
// TapTempo, Metronome, Master, Stop, Left, Right, Up, Down, Select, Shift, Note,
// Session, AddEffect, AddTrack, OctaveDown, OctaveUp, Repeat, Accent, Scales,
// User, Mute, Solo, StepIn, StepOut, Play, Rec, New, Duplicate, Automation, FixedLength,
// Device, Browse, Track, Clip, Volume, Pan&Send, Quantize, Double, Delete, Undo


//-----TIME DIVISION ("SCENE") BUTTONS-----
let timeDivisionButton = push.button(NAME)

// As BUTTONS but with additional parameter to ledOn() and ledDim() to specify colour
timeDivisionButton.ledOn(colour = 'orange') // colour = 'orange', 'red', 'green', 'yellow'
timeDivisionButton.ledDim(colour = 'orange') // colour = 'orange', 'red', 'green', 'yellow'

// NAME values:
// 1/4, 1/4t, 1/8, 1/8t, 1/16, 1/16t, 1/32, 1/32t


//-----ROW OF BUTTONS BELOW THE LCD-----
push.channelSelectButtons() // returns array (row) of buttons
let channelSelectButton = push.channelSelectButtons()[X]

// As BUTTONS but with additional parameter to ledOn() and ledDim() to specify colour
channelSelectButton.ledOn(colour = 'orange') // colour = 'orange', 'red', 'green', 'yellow'
channelSelectButton.ledDim(colour = 'orange') // colour = 'orange', 'red', 'green', 'yellow'


//-----KNOBS-----
let knob = push.channelKnobs()[X] || push.tempoKnob() || push.swingKnob() || push.masterKnob()

knob.onPressed(() => { /* knob touching start actions */ })
knob.onReleased(() => { /* knob touching end actions */ })
knob.onTurned(delta => { /* delta = number of clicks. positive = clockwise, negative = anti-clockwise */})


//-----TOUCHSTRIP-----
let touchstrip = push.touchstrip()
touchstrip.onPressed(() => { /* touchstrip pushed actions */ })
touchstrip.onReleased(() => { /* touchstrip released actions */ })
touchstrip.onPitchBend(amount => { /* amount = 14bit value (0 -> 16383) */ })


//-----LCDs-----
push.lcdSegmentsRow(Y) // returns array (row) of LCD segments
push.lcdSegmentsCol(X) // returns array (column) of LCD segments

let lcdSegment = push.lcdSegmentsCol(X)[Y] || push.lcdSegmentsRow(Y)[X]

lcdSegment.display(text) // display text in LCD segment (automatically truncates/pads to 8 chars)
lcdSegment.clear() // clear text in LCD segment

push.clearLCD() // clear all LCD text
```

### X & Y
``` javascript
// uses zero indexing, with 0,0 at the bottom left
push.gridCol(0)[0] // the bottom left grid pad
push.gridCol(7)[0] // the bottom right grid pad
push.gridRow(0)[7] // also the bottom right grid pad!
push.gridCol(7)[7] // the top right grid pad
push.gridRow(7)[7] // also the top right grid pad!

push.gridSelectButtons()[0] // the leftmost button above the grid
push.channelKnobs()[0] // the leftmost channel knob
push.channelSelectButtons()[7] // the right most channel select button

lcd.lcdSegmentsRow(0)[0].display('muzaaaak') // the bottom left LCD segment
lcd.lcdSegmentsRow(3).map(seg => {segment.clear()}) // clear top row of LCD segments
```

## Listeners
```javascript
const unsubscribe = element.onX(() => { /* listener code */ }) // returns a function...
unsubscribe() // ...that will unsubscribe the passed listener

// addition and removal of listeners works consistently for all the 'onX' methods
```

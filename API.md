# Push Wrapper API

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


//-----ROW OF SELECT BUTTONS ABOVE GRID-----
push.gridSelectButton() // returns array (row) of buttons

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


//-----TIME DIVISION & CHANNEL SELECT BUTTONS-----
let timeDivisionButton = push.button(NAME)

// As BUTTONS but with additional parameter to ledOn() and ledDim() to specify colour
timeDivisionButton.ledOn(colour = 'orange') // colour = 'orange', 'red', 'green', 'yellow'
timeDivisionButton.ledDim(colour = 'orange') // colour = 'orange', 'red', 'green', 'yellow'

// NAME values:
// 1/4, 1/4t, 1/8, 1/8t, 1/16, 1/16t, 1/32, 1/32t


//-----CHANNEL SELECT BUTTONS-----
// The row of buttons immediately below the LCD.
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


//-----LCDS-----
let lcd = push.lcd()
lcd.clear() // clear all LCD text
lcd.updateRow(Y, [text1, text2], offset = 0) // display text in row of subsequent segments starting from offset
lcd.updateCol(X, [text1, text2], offset = 0) // display text in col of subsequent segments starting from offset
lcd.updateSegment(X, Y, text = '') // display text (1-8 character string) in specific segment
lcd.clearRow(Y)
lcd.clearCol(X)
lcd.clearSegment(X, Y)


//-----X & Y-----
// uses zero indexing, with 0,0 at the bottom left
push.gridCol(0)[0] // the bottom left grid pad
push.gridCol(7)[0] // the bottom right grid pad
push.gridRow(0)[7] // also the bottom right grid pad!
push.gridCol(7)[7] // the top right grid pad
push.gridRow(7)[7] // also the top right grid pad!

push.gridSelectButtons()[0] // the leftmost button above the grid
push.channelKnobs()[0] // the leftmost channel knob
push.channelSelectButtons()[7] // the right most channel select button

lcd.updateSegment(0, 0, 'muzaaaak') // the bottom left LCD segment
lcd.clearRow(3) // clear top row of LCD segments


//-----LISTENERS-----
const unsubscribe = element.onX(() => { /* listener code */ }) // returns a function...
unsubscribe() // ...that will unsubscribe the passed listener

// addition and removal of listeners works consistently for all the 'onX' methods
```

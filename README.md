# push-wrapper

## What?

A javascript wrapper enabling use of the [Ableton Push](https://www.ableton.com/en/push/) (mk1) hardware as a MIDI controller in a Web MIDI/Audio API enabled web browser - I created a simple [example application](https://chippanfire.com/push-wrapper.html) ([source code](https://github.com/crosslandwa/push-wrapper-example-site)) to demonstrate this.

The wrapper presents a simple [API](./API.md) that abstracts the generation and parsing of MIDI messages sent to/from the hardware.

push-wrapper is written as a [requirejs](http://requirejs.org/) compatible module, and is distributed via [npm](https://www.npmjs.com/package/push-wrapper). The code is written using javascript [ES2015/ES6](http://es6-features.org/) so expects native Promises and other newer language features to be available.

###Modification & Running tests

If you want to modify the wrapper, install its dependencies and run its test suite by:

    npm install
    npm test

# API

push-wrapper presents each element of the Push hardware such that a you can:
- subscribe listeners that are called in response to user interaction with the hardware e.g. `push.swingKnob().onTurned(myCallback)`
- provide feedback on the hardware by controlling button/pad LEDs and the LCD screen e.g. `push.button('TapTempo').ledOn()`

[Read the full API here](https://github.com/crosslandwa/push-wrapper/blob/master/API.md)

## Quick Start
Can't wait to get going? The following snippet will instantiate a push instance bound to web MIDI inputs/outputs if:
- your browser supports the Web MIDI API
- your browser can find MIDI IO ports called *"Ableton Push User Port"*

```javascript
const pushWrapper = require('push-wrapper')
pushWrapper.webMIDIio()
  .catch(err => { console.error(err); return { inputPort: {}, outputPort: { send: () => {} } } })
  .then(({inputPort, outputPort}) => {
    const push = pushWrapper.push()
    inputPort.onmidimessage = event => push.midiFromHardware(event.data)
    push.onMidiToHardware(outputPort.send.bind(outputPort))
    return push
  })
  .then(push => { /* do stuff with push */ })
```

## V1 -> V2

I made some breaking API changes. Sorry, but I felt I made some improvements...

### Purer Functions

```javascript
/* In V1, state meant functions behaved inconsistently over time */
push.grid.x[1].y[1].led_on() // makes LED orange
push.grid.x[1].y[1].red()
push.grid.x[1].y[1].led_on() // makes LED red

/* In V2, pure functions are favoured, i.e. calling them ALWAYS produces the same results */
push.gridRow(0)[0].ledOn() // makes LED orange
push.gridRow(0)[0].ledOn('red') // makes LED red
push.gridRow(0)[0].ledOn() // makes LED orange
```

### Zero-indexing
```javascript
/*
  In V1, the grid was accessed using one-indexing, in line with thinking about
  a mixing console, where you'd have an instrument presented on channel 1 (rather than channel 0)
*/
push.grid.x[1].y[1].on('pressed', doSomething)

/*
  Not surprisingly, one-indexing adds mental overhead if you want to do anything with loops...
*/
[1, 2, 3].forEach((channel, index) => push.grid.x[channel].y[1].led_on()) // why aren't channel and index the same?

/* In V2, everything is zero-indexed */
push.gridRow(0)[0].ledOn() // turn on bottom left pad LED
```

### No nested accessors
```javascript
/* In V1 a tree of elements were presented */
push.grid.x[8].y[8] // top right pad
push.grid.x[2].select // button above the grid, second from left

/* In V2 a flat API is preferred */
push.gridRow(7)[7] // the top right pad
push.gridSelectButtons()[1]  // button above the grid, second from left
```

### Consistent array access
```javascript
/* In V1 elements were presented in an 'array like' manner, but these where really just maps with numeric keys... */
push.grid.x.forEach(columnOfPads => { /* do something */}) // TypeError: push.grid.x.forEach is not a function

/* In V2 arrays of elements are consistently presented, allowing javascript's native array APIs to be leveraged */
push.gridRow(0).forEach(pad => pad.ledOn()) // turn on all pads in bottom row of grid
```

### No magic strings for events
```javascript
/* In V1, callbacks were registered via magic strings for event names */
push.grid.x[1].y[1].on('pushed', nothingsHappening) // what was that event called again?

/* In V2, listeners can be subscribed for specific actions only */
push.gridRow(1)[0].onPushed(pleaseDoSomething) // TypeError: gridRow(...)[0].onPushed is not a function
push.gridRow(1)[0].onPressed(youCanDoIt) // You Can Do It!
```

### Camel casing
```javascript
/* At the time of writing V1 I was working_on_a_project_that_had_all_its_things_named_in_snake_case */
push.grid.x[1].y[1].led_on()

/* In V2 everythingIsCamelCase */
push.gridRow(0)[0].ledOn()
```

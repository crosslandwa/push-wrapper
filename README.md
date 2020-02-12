# push-wrapper

## What?

A javascript wrapper enabling use of the [Ableton Push](https://www.ableton.com/en/push/) (mk1) hardware as a MIDI controller in a Web MIDI/Audio API enabled environment

The wrapper presents a simple API that abstracts the generation and parsing of MIDI messages sent to/from the hardware.
- [Read the full API here](https://github.com/crosslandwa/push-wrapper/blob/master/API.md)

## How to use it

`push-wrapper` is distributed via [npm](https://www.npmjs.com/package/push-wrapper) as both:
- a **UMD** module
- an **ESM** module

The code is written using javascript [ES2015/ES6](http://es6-features.org/) so expects native Promises and other newer language features to be available.

### In browser

Add `push-wrapper` to your (npm) project
```
npm install push-wrapper
```

**With support for ESM modules**

Assuming your application lives in a file `public/index.html`, copy the distributed `push-wrapper` ESM module into place:
```
cp -r node_modules/push-wrapper/dist/esm public/esm
```

Then use it in your app:
```
<script type="module">
  import pushWrapper from './esm/push-wrapper.js'

  const push = pushWrapper.push()
  push.onMidiToHardware(console.log)
  push.button('TapTempo').ledOn() // prints [176, 3, 4] to console
</script>
```

**Without support for ESM modules**

Assuming your application lives in a file `public/index.html`, copy the distributed `push-wrapper` UMD module into place:
```
cp -r node_modules/push-wrapper/dist/umd public/umd
```

Then use it in your app:
```
<script src="umd/push-wrapper.js"></script>
<script>
  const push = pushWrapper.push()
  push.onMidiToHardware(console.log)
  push.button('TapTempo').ledOn() // prints [176, 3, 4] to console
</script>
```

_Note that `push-wrapper` can also be used in the browser as an ASM module via libraries such as [requirejs](https://requirejs.org/)_

### In browser via a bundler

If you are writing your application and bundling it for the browser (e.g. using [Rollup](https://rollupjs.org/)) then add `push-wrapper` to your (npm) project
```
npm install push-wrapper
```

Then use it in your application's source code (before bundling/transpilation) as an ESM module
```
import pushWrapper from 'push-wrapper'

const push = pushWrapper.push()
push.onMidiToHardware(console.log)
push.button('TapTempo').ledOn() // prints [176, 3, 4] to console
```

Then let your bundler transpile those `import` statements into an inline version of the code

_Note that the UMD distribution of `push-wrapper` can be used in your project (before bundling/transpilation) as a commonjs module via `require` statements if you prefer_

### In node

Add `push-wrapper` to your (npm) project
```
npm install push-wrapper
```

Then use it via
```
const pushWrapper = require('push-wrapper')

const push = pushWrapper.push()
push.onMidiToHardware(console.log)
push.button('TapTempo').ledOn() // prints [176, 3, 4] to stdout
```

## Modification & Running tests

If you want to modify the wrapper, install its dependencies and run its test suite by:

    npm install
    npm test
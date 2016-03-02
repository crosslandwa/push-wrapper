# node-push
A wrapper for using the Ableton Push as a MIDI controller in a web browser

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

# app example credits/enhancement

Initial version of the app based off blog post here: http://www.keithmcmillen.com/blog/making-music-in-the-browser-web-midi-api/

I intend to create my own example app to include with the wrapper to demonstrate its use...
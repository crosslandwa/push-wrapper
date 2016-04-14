# Demo app

A relatively simple web application that uses the Ableton Push hardare as a MIDI controller for a sampler, via the node-push wrapper. 

## Running locally

**Installation**

    cd node-push
    sudo npm install -g browserify
    npm install # installs dependencies
    npm run build # bundles example-site/app.js and all its dependencies into single file example-site/bundle.js

**Start web server**

The Push hardware uses MIDI SYSEX messages for some of it communication. MIDI SYSEX is only supported in the browser if the page is served securely (i.e. over HTTPS).

Under OS X, Python can be used to create a simple HTTPS server - this repo includes a script to start that server, and also prompts you to create a *self-signed certificate* for that HTTPS server to use. Generation of this certificate is only required the first time you start the server - the generated cert is stored at `example-site/server.pem`

    cd example-site
    python simple-http-server.py # Fill in details for certificate when prompted

**Load app in browser**

- Navigate to `https://localhost:4443` in Chrome
- Chrome will consider the *self-signed certificated* used by the server as invalid. Read the code, and if you are happy accept the invalid cert in the warning page Chrome displays
- Allow browser use of MIDI devices via the dialogue box that pops up

## Functionality

TBD

## Credits

Initial version of the app based off blog post here: http://www.keithmcmillen.com/blog/making-music-in-the-browser-web-midi-api/

Timing for repeated notes inspired by this: https://github.com/cwilso/metronome

## TODO

- should this be ready compiled
- should it have its own package.json for the browserify build command?
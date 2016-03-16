const Push = require('../push.js'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial');

window.addEventListener('load', () => {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({ sysex: true })
            .then(Push.create_bound_to_web_midi_api)
            .then(off_we_go)
            .catch(function(error) { console.log(error.message) });
    } else {
        alert('No MIDI support in your browser');
    }
});



function off_we_go(bound_push) {
    console.log('hi');
    var players = [],
        btn = document.getElementsByClassName('button');

    for (var i = 0; i < btn.length; i++) {
        players[i] = new Player(i);
        players[i].on_playing(partial(buttonClicked, btn[i]));
        players[i].on_done(partial(buttonReleased, btn[i]));
        btn[i].addEventListener('mousedown', players[i].play);
    }
}

function buttonClicked(ui_btn, index) {
    ui_btn.classList.add('active');
    console.log('playing ' + index);
}

function buttonReleased(ui_btn, index) {
    ui_btn.classList.remove('active');
    console.log('done ' + index);
}

// TODO make this an event emitter, rather than manually handling callbacks
// TODO use audio node from web audio api and invoke the callbacks on play start/stop
function Player(index) {
    var on_done_callback = function() {},
        play_start_callback = function() {};

    return {
        play: function() {
            play_start_callback(index);
            setTimeout(() => on_done_callback(index), 3000);
        },
        on_playing: function(f) {
            play_start_callback = f;
        },
        on_done: function(f) {
            on_done_callback = f;
        }
    }
}
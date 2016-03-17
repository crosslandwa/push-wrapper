const Push = require('../push.js'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial'),
    Player = require('./player.js');

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
    var players = [],
        btn = document.getElementsByClassName('button');

    for (var i = 0; i < btn.length; i++) {
        players[i] = new Player();
        players[i].on('started', partial(buttonClicked, btn[i]));
        players[i].on('stopped', partial(buttonReleased, btn[i]));
        btn[i].addEventListener('mousedown', players[i].play);
    }
}

function buttonClicked(ui_btn) {
    ui_btn.classList.add('active');
}

function buttonReleased(ui_btn) {
    ui_btn.classList.remove('active');
}

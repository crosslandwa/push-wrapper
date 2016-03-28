const Push = require('../push.js'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial'),
    Player = require('./player.js'),
    context = new AudioContext(),
    samples = [
        'samples/Bonus_Kick27.mp3',
        'samples/snare_ac2_r1.mp3',
        'samples/HandClap.mp3',
        'samples/Beat07_Hat.mp3',
        'samples/HH_KIT09_100_TMB.mp3',
        'samples/clingfilm.mp3',
        'samples/tang-1.mp3',
        'samples/Cassette808_Tom01.mp3'
    ];

var rate = [1, 1.5, 2, 0.5, 0.25];

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
    const buttons = document.getElementsByClassName('button'),
        players = create_players(),
        push = bound_push;

    foreach(players, (player, i) => {
        turn_off_column(push, i + 1);
        var full_path_sample_name = samples[i].split('.')[0];
        var sample_name = full_path_sample_name.split('/').pop();
        push.lcd.x[i + 1].y[2].update(sample_name.length > 8 ? sample_name.substr(sample_name.length - 8) : sample_name);
        player.on('started', partial(buttonClicked, buttons[i]));
        player.on('stopped', partial(buttonReleased, buttons[i]));
        player.on('started', partial(turn_on_column, push, i + 1));
        player.on('stopped', partial(turn_off_column, push, i + 1));
        buttons[i].addEventListener('mousedown', partial(player.play, 110));
        bind_column_to_player(push, player, i + 1);
    });

    bind_pitchbend(push, players);
}

function create_players() {
    var players = [];
    for (var  i = 0; i < samples.length; i++) {
        players[i] = new Player(samples[i], context);
    }
    return players;
}

function bind_column_to_player(push, player, x) {
    foreach([1, 2, 3, 4, 5, 6, 7, 8], (y) => {
        var grid_button = push.grid.y[y].x[x];
        grid_button.on('pressed', player.play);
    });
}

function turn_on_column(push, x, velocity) {
    foreach([1, 2, 3, 4, 5, 6, 7, 8], (y) => {
        if (((velocity + 15) / 16) >= y) {
            push.grid.x[x].y[y].led_on(velocity);
        } else {
            push.grid.x[x].y[y].led_off();
        }
    });
}

function turn_off_column(push, x) {
    foreach([2, 3, 4, 5, 6, 7, 8], (y) => {
        push.grid.y[y].x[x].led_off();
    });
    push.grid.y[1].x[x].led_on();
}

function bind_pitchbend(push, players) {
    push.touchstrip.on('pitchbend', (pb) => {
        var rate = pb > 8192 ? pb / 4096 : pb / 8192;
        foreach(players, (player) => player.update_playback_rate(rate));
    });
}

function buttonClicked(ui_btn) {
    ui_btn.classList.add('active');
}

function buttonReleased(ui_btn) {
    ui_btn.classList.remove('active');
}

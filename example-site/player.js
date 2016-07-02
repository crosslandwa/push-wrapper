const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach');

function Player(asset_url, audio_context) {
    EventEmitter.call(this);
    let player = this;

    this.play = function(velocity, cutoff_frequency) {
        play(player, audio_context, velocity, cutoff_frequency);
    }

    this.update_playback_rate = function(rate) {
        update_playback_rate(player, audio_context, rate);
    }

    this._loaded = false;
    this._voices = [];
    this._playback_rate = 1;
    loadSample(asset_url, audio_context, (buffer) => {
        this._buffer = buffer;
        this._loaded = true;
    });
}
util.inherits(Player, EventEmitter);

function loadSample(asset_url, audio_context, done) {
    var request = new XMLHttpRequest();
    request.open('GET', asset_url, true);
    request.responseType = 'arraybuffer';
    request.onload = function () {
        audio_context.decodeAudioData(request.response, done);
    }
    request.send();
}

function play(player, audio_context, velocity, cutoff_frequency) {
    if (!player._loaded) return;

    var now = time_now(audio_context);

    if (is_playing(player)) {
        foreach(player._voices, (voice) => {
            voice.gain.cancelScheduledValues(now);
            anchor(voice.gain, now);
            voice.gain.linearRampToValueAtTime(0, now + 0.01);
        });
        player.emit('stopped');
    }

    var gain_node = audio_context.createGain();
    var filter_node = audio_context.createBiquadFilter();       
    filter_node.frequency.value = cutoff_frequency > 30 ? cutoff_frequency : 30;
    var source = audio_context.createBufferSource();
    
    source.connect(filter_node);
    filter_node.connect(gain_node);

    gain_node.connect(audio_context.destination);

    gain_node.gain.setValueAtTime(0, now);
    gain_node.gain.linearRampToValueAtTime(velocity / 127, now + 0.01);

    source.playbackRate.setValueAtTime(player._playback_rate, now);
    source.buffer = player._buffer;

    source.addEventListener('ended', () => {
        player._voices.shift();
        if (!is_playing(player)) player.emit('stopped');
    });

    player._voices.push({source: source, gain: gain_node.gain});
    source.start();
    player.emit('started', velocity);
}

function anchor(audio_param, now) {
    audio_param.setValueAtTime(audio_param.value, now);
}

function is_playing(player) {
    return player._voices.length > 0;
}

function update_playback_rate(player, audio_context, rate) {
    player._playback_rate = rate;
    var now = time_now(audio_context);
    foreach(player._voices, (voice) => {
        voice.source.playbackRate.setValueAtTime(player._playback_rate, now);
    });
}

function time_now(audio_context) {
    return audio_context.currentTime;
}

module.exports = Player;
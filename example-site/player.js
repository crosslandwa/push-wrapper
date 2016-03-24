const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial');

function Player(asset_url, audio_context) {
    EventEmitter.call(this);
    this.play = partial(play, this, audio_context);
    this._loaded = false;
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

/*
Cannot use a value of 0 for a gain node that you want to apply exponential ramp too!

Works
gain.setValueAtTime(0.001, now);
gain.exponentialRampToValueAtTime(1, now + 0.1);

Not Works!
gain.setValueAtTime(0, now);
gain.exponentialRampToValueAtTime(1, now + 0.1);
*/

function play(player, audio_context) {
    if (!player._loaded) return;

    var gain = audio_context.createGain();
    
    var source = audio_context.createBufferSource();
    source.connect(gain);

    gain.connect(audio_context.destination);

    var now = audio_context.currentTime;

    gain.gain.setValueAtTime(1, now);
    gain.gain.linearRampToValueAtTime(1, now + 0.01);
    gain.gain.linearRampToValueAtTime(0, now + 0.7);

    source.playbackRate.setValueAtTime(0.5, now);
    source.buffer = player._buffer;
    source.addEventListener('ended', () => player.emit('stopped'));
    source.start();
    player.emit('started');
}

module.exports = Player;
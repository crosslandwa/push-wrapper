const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial');

function Player(asset_url, audio_context) {
    EventEmitter.call(this);
    this.play = partial(play, this, audio_context);
    this._loaded = false;
    this._voices = [];
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

Also that cancelling a ramp, then ramping to zero clicked unless 'anchoring' ramp before scheduling change

Clicks:
gain.cancelScheduledValues(now);
gain.linearRampToValueAtTime(0, now + 0.5);

Not clicks:
gain.cancelScheduledValues(now);
gain.setValueAtTime(voice.gain.gain.value, now);
gain.linearRampToValueAtTime(0, now + 0.01);            
*/

function play(player, audio_context) {
    if (!player._loaded) return;

    var now = audio_context.currentTime;

    if (is_playing(player)) {
        foreach(player._voices, (voice) => {
            voice.gain.gain.cancelScheduledValues(now);
            voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
            voice.gain.gain.linearRampToValueAtTime(0, now + 0.01);
        });
        player._voices = [];
        player.emit('stopped');
    }

    var gain = audio_context.createGain();
    
    var source = audio_context.createBufferSource();
    source.connect(gain);

    gain.connect(audio_context.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + 0.01);

    source.playbackRate.setValueAtTime(0.5, now);
    source.buffer = player._buffer;
    source.addEventListener('ended', () => {
        if (is_playing(player)) player._voices.shift();
        if (!is_playing(player)) player.emit('stopped');
    });

    player._voices.push({source: source, gain: gain});
    source.start();
    player.emit('started');
}

function is_playing(player) {
    return player._voices.length > 0;
}

module.exports = Player;
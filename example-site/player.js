const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial');

function Player(asset_url, audio_context) {
    EventEmitter.call(this);
    this.play = partial(play, this, audio_context);
    this._loaded = false;
    this._is_playing = false;
    this._voice;
    this._stop = partial(end_playback, this);
    loadSample(this, asset_url, audio_context);
}
util.inherits(Player, EventEmitter);

function loadSample(player, asset_url, audio_context) {
    var request = new XMLHttpRequest();
    request.open('GET', asset_url, true);
    request.responseType = 'arraybuffer';
    request.onload = function () {
        audio_context.decodeAudioData(request.response, (buffer) => {
            player.buffer = buffer;
            player._loaded = true;
        });
    }
    request.send();
}

function play(player, audio_context) {
    if (!player._loaded) return;
    if (player._is_playing) end_playback(player);
    start_playback(player, audio_context); 
}

function start_playback(player, audio_context) {
    player._is_playing = true;
    player._voice = audio_context.createBufferSource();
    player._voice.playbackRate.value = 0.7;
    player._voice.buffer = player.buffer;
    player._voice.addEventListener('ended', player._stop);
    player._voice.connect(audio_context.destination);
    player._voice.start();
    player.emit('started');
}

function end_playback(player) {
    player._voice.removeEventListener('ended', player._stop);
    player._voice.stop();
    delete player._voice;
    player._is_playing = false;
    player.emit('stopped');
}

module.exports = Player;
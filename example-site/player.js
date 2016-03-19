const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial');

function Player(asset_url, audio_context) {
    EventEmitter.call(this);
    this.play = partial(play, this, audio_context);
    this.loaded = false;
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
            player.loaded = true;
        });
    }
    request.send();
}

function play(player, audio_context) {
    if (!player.loaded) return;
    player.emit('started');
    var source = audio_context.createBufferSource();
    source.playbackRate.value = 0.2;
    source.buffer = player.buffer;
    source.addEventListener('ended', () => player.emit('stopped'));
    source.connect(audio_context.destination);
    source.start();
}


module.exports = Player;
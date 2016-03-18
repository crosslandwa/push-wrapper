const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial');

function Player(asset_url, context) {
    EventEmitter.call(this);
    this.play = partial(play, this, context);
    this.loaded = false;
    loadSample(this, asset_url, context);
}
util.inherits(Player, EventEmitter);

function loadSample(player, asset_url, context) {
    var request = new XMLHttpRequest();
    request.open('GET', asset_url, true);
    request.responseType = 'arraybuffer';
    request.onload = function () {
        context.decodeAudioData(request.response, (buffer) => {
            player.buffer = buffer;
            player.loaded = true;
        });
    }
    request.send();
}

function play(player, context) {
    if (!player.loaded) return;
    player.emit('started');
    var s = context.createBufferSource();
    s.playbackRate.value = 0.2;
    s.buffer = player.buffer;
    s.addEventListener('ended', () => player.emit('stopped'));
    s.start();
    s.connect(context.destination);
}


module.exports = Player;
const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach'),
    partial = require('lodash.partial');

// TODO use audio node from web audio api and invoke the callbacks on play start/stop
function Player() {
    EventEmitter.call(this);
    this.play = partial(play, this);
}
util.inherits(Player, EventEmitter);

function play(player) {
    player.emit('started');
    setTimeout(() => player.emit('stopped'), 3000);
}


module.exports = Player;
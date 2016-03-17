const EventEmitter = require('events'),
    util = require('util'),
    foreach = require('lodash.foreach');
// TODO make this an event emitter, rather than manually handling callbacks
// TODO use audio node from web audio api and invoke the callbacks on play start/stop
function Player() {
    EventEmitter.call(this);
}
util.inherits(Player, EventEmitter);


Player.prototype.play = function() {
    console.log(this);
    this.emit('started');
    setTimeout(() => this.emit('stopped'), 3000);
}

module.exports = Player;
const EventEmitter = require('events'),
    util = require('util'),
    partial = require('lodash.partial');

// todo static factory to create Repetae with web audio based callback, rather than (stub) setTimeout
function Repetae(scheduled_execution) {
    EventEmitter.call(this);
    this._active = false;
    this._time_changed = false;
    this._being_pressed = false;
    this._interval = 500; // ms

    this.press = function() {
        this._being_pressed = true;
    }

    this.release = function() {
        var started_active = this._active,
            time_changed = this._time_changed;

        this._active = !this._active;
        this._time_changed = false;
        this._being_pressed = false;
        this._is_scheduling = false;

        switch (true) {
            case (!started_active):
                this.emit('on');
                break;
            case (started_active && !time_changed):
                this.emit('off');
                break;
        }
    }

    this.interval = function(amount_ms)  {
        if (this._being_pressed) this._time_changed = true;
        this._interval = amount_ms > 20 ? amount_ms : 20; // 20ms min interval
    }

    this.start = function(callback) {
        if (!this._active || this._is_scheduling) return;
        this._is_scheduling = true;
        call_and_reschedule(this, scheduled_execution, callback);
    }    

    this.stop = function() {
        this._is_scheduling = false;
    }
}
util.inherits(Repetae, EventEmitter);

function call_and_reschedule(repetae, scheduled_execution, callback) {
    if (repetae._is_scheduling) {
        callback();
        scheduled_execution(partial(call_and_reschedule, repetae, scheduled_execution, callback), repetae._interval);
    };
}

// Adaptor function used to bind to web Audio API and utilise its audio-rate scheduling
Repetae.create_scheduled_by_audio_context = function(context) {
    return new Repetae((callback, interval_ms) => {
        var source = context.createBufferSource(),
            now = context.currentTime,
            buffer = context.createBuffer(1, 1, context.sampleRate),
            scheduled_at = now + (interval_ms / 1000);

        source.addEventListener('ended', callback);
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(scheduled_at);
    });
}

module.exports = Repetae;
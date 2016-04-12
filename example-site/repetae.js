const EventEmitter = require('events'),
    util = require('util');

function Repetae(scheduled_execution, initial_interval) {
    EventEmitter.call(this);
    var repetae = this;
    this._active = false;
    this._time_changed = false;
    this._being_pressed = false;
    this._interval = initial_interval > 20 ? initial_interval : 500; // ms

    this.press = function() {
        repetae._being_pressed = true;
    }

    this.release = function() {
        var started_active = repetae._active,
            time_changed = repetae._time_changed;

        repetae._time_changed = false;
        repetae._being_pressed = false;

        switch (true) {
            case (!started_active):
                repetae._active = true;
                repetae.emit('on');
                break;
            case (started_active && !time_changed):
                repetae._active = false;
                repetae._is_scheduling = false;
                repetae.emit('off');
                break;
        }
    }

    this.interval = function (amount_ms) {
        if (repetae._being_pressed) {
            repetae._time_changed = true;
            repetae._interval = amount_ms > 20 ? amount_ms : 20; // 20ms min interval
            repetae.report_interval();
        }
    }

    this.start = function(callback) {
        if (!repetae._active) {
            callback();
            return;
        }

        if (repetae._is_scheduling) return;
        repetae._is_scheduling = true;
        repetae._call_and_reschedule(callback);
    }

    this._call_and_reschedule = function(callback) {
        if (repetae._is_scheduling) {
            callback();
            scheduled_execution(() => repetae._call_and_reschedule(callback), repetae._interval);
        };
    }
    
    this.stop = function() {
        repetae._is_scheduling = false;
    }

    this.report_interval = function() {
        repetae.emit('interval', repetae._interval);
    }
}
util.inherits(Repetae, EventEmitter);

// Adaptor function used to bind to web Audio API and utilise its audio-rate scheduling
Repetae.create_scheduled_by_audio_context = function(context, initial_interval) {
    return new Repetae((callback, interval_ms) => {
        var source = context.createBufferSource(),
            now = context.currentTime,
            buffer = context.createBuffer(1, 1, context.sampleRate),
            scheduled_at = now + (interval_ms / 1000);

        source.addEventListener('ended', callback);
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(scheduled_at);
    }, initial_interval);
}

module.exports = Repetae;
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

    this.press = partial(press, this);
    this.release = partial(release, this);
    this.interval = partial(interval, this);
    this.start = partial(start, this, scheduled_execution);
    this.stop = partial(stop, this);
    this.report_interval = partial(report_interval, this);
}
util.inherits(Repetae, EventEmitter);

function press(repetae) {
    repetae._being_pressed = true;
}

function release(repetae) {
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

function interval(repetae, amount_ms) {
    if (repetae._being_pressed) {
        repetae._time_changed = true;
        repetae._interval = amount_ms > 20 ? amount_ms : 20; // 20ms min interval
        repetae.report_interval();
    }
}

function start(repetae, scheduled_execution, callback) {
    if (!repetae._active) {
        callback();
        return;
    }

    if (repetae._is_scheduling) return;
    repetae._is_scheduling = true;
    call_and_reschedule(repetae, scheduled_execution, callback);
}

function call_and_reschedule(repetae, scheduled_execution, callback) {
    if (repetae._is_scheduling) {
        callback();
        scheduled_execution(partial(call_and_reschedule, repetae, scheduled_execution, callback), repetae._interval);
    };
}

function stop(repetae) {
    repetae._is_scheduling = false;
}

function report_interval(repetae) {
    repetae.emit('interval', repetae._interval);
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
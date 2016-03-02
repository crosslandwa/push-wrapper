var Push = require('../push.js');

describe('Ableton Push wrapper', function() {
    var push, sent_bytes = [];

    beforeEach(function() {
        push = new Push({ send: function(bytes) { sent_bytes = bytes } });
    })

    it('can be instantiated multiple times and act independently', function() {
        var push_1_called = false,
            push_2_called = false,
            push2 = new Push();

        push.buttons.add_track.on('pressed', function() { push_1_called = true });
        push2.buttons.add_track.on('pressed', function() { push_2_called = true });

        push.receive_midi([176, 53, 120]);

        expect(push_1_called).toEqual(true);
        expect(push_2_called).toEqual(false);
    });

    describe('grid', function() {
        it('emits pressed events with velocity in response to button MIDI note messages', function(done) {
            push.grid.x[0].y[1].on('pressed', function(velocity) {
                expect(velocity).toEqual(123);
                done();
            })
            push.receive_midi([144, 44, 123]);
        });

        it('emits released events in response to button MIDI note-off messages', function(done) {
            push.grid.y[0].x[1].on('released', done); // note can refer to grid locations x.y and y.x
            push.receive_midi([144, 37, 0]);
        });

        it('buttons can have LED turned on', function() {
            push.grid.x[7].y[7].led_on(101);
            expect(sent_bytes).toEqual([144, 99, 101]);

            push.grid.x[7].y[6].led_on();
            expect(sent_bytes).toEqual([144, 91, 100]); // default colour of 100 if 'velocity' not provided
        })

        it('buttons can have LED turned off', function() {
            push.grid.x[6].y[7].led_off();
            expect(sent_bytes).toEqual([144, 98, 0]);
        })
    });

    describe('buttons', function() {
        it('emit pressed events in response to button MIDI CC messages', function() {
            var called = false;
            push.buttons.add_track.on('pressed', function() { called = true });
            push.receive_midi([176, 53, 120]);
            expect(called).toEqual(true);
            // this works as events emitted synchronously (could call done() in event handler)
        });

        it('emit released events in response to button MIDI CC messages with velocity zero', function() {
            var called = false;
            push.buttons.add_effect.on('released', function() { called = true });
            push.receive_midi([176, 52, 0]);
            expect(called).toEqual(true);
        });

        it('can have their LED turned on', function() {
            push.buttons.add_effect.led_on();
            expect(sent_bytes).toEqual([176, 52, 127]);
        })

        it('can have their LED turned off', function() {
            push.buttons.add_effect.led_off();
            expect(sent_bytes).toEqual([176, 52, 0]);
        })
    })

    describe('knobs', function() {
        it('emit turned events with a positive delta in response to clockwise turns of the master knob', function(done) {
            push.knobs.master.on('turned', function(delta) {
                expect(delta).toEqual(1);
                done();
            });
            push.receive_midi([176, 79, 1]);
        });

        it('emit turned events with a positive delta in response to clockwise turns of the tempo knob', function(done) {
            push.knobs.tempo.on('turned', function(delta) {
                expect(delta).toEqual(2);
                done();
            });
            push.receive_midi([176, 14, 2]);
        });

        it('emit turned events with a negative delta in response to clockwise turns of the 1st knob', function(done) {
            push.knobs.one.on('turned', function(delta) {
                expect(delta).toEqual(-1);
                done();
            });
            push.receive_midi([176, 71, 127]);
        });

        it('emit turned events with a negative delta in response to clockwise turns of the swing knob', function(done) {
            push.knobs.swing.on('turned', function(delta) {
                expect(delta).toEqual(-2);
                done();
            });
            push.receive_midi([176, 15, 126]);
        });
    });
});
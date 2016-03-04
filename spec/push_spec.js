var Push = require('../push.js');

describe('Ableton Push wrapper', () => {
    var push, sent_bytes = [];

    beforeEach(() => {
        push = new Push({ send: (bytes) => { sent_bytes = bytes } });
    })

    it('can be instantiated multiple times and act independently', () => {
        var push_1_called = false,
            push_2_called = false,
            push2 = new Push();

        push.buttons.add_track.on('pressed', () => { push_1_called = true });
        push2.buttons.add_track.on('pressed', () => { push_2_called = true });

        push.receive_midi([176, 53, 120]);

        expect(push_1_called).toEqual(true);
        expect(push_2_called).toEqual(false);
    });

    describe('grid', () => {
        it('emits pressed events with velocity in response to grid MIDI note messages', (done) => {
            push.grid.x[1].y[2].on('pressed', (velocity) => {
                expect(velocity).toEqual(123);
                done();
            })
            push.receive_midi([144, 44, 123]);
        });

        it('emits released events in response to grid MIDI note-off messages', (done) => {
            push.grid.y[1].x[2].on('released', done); // note can refer to grid locations x.y and y.x
            push.receive_midi([144, 37, 0]);
        });

        it('buttons can have LED turned on', () => {
            push.grid.x[8].y[8].led_on(101);
            expect(sent_bytes).toEqual([144, 99, 101]);

            push.grid.x[8].y[7].led_on();
            expect(sent_bytes).toEqual([144, 91, 100]); // default colour of 100 if 'velocity' not provided
        })

        it('buttons can have LED turned off', () => {
            push.grid.x[7].y[8].led_off();
            expect(sent_bytes).toEqual([144, 98, 0]);
        })
    });

    describe('buttons', () => {
        it('emit pressed events in response to button MIDI CC messages', () => {
            var called = false;
            push.buttons.add_track.on('pressed', () => { called = true });
            push.receive_midi([176, 53, 120]);
            expect(called).toEqual(true);
            // this works as events emitted synchronously (could call done() in event handler)
        });

        it('emit released events in response to button MIDI CC messages with velocity zero', () => {
            var called = false;
            push.buttons.add_effect.on('released', () => { called = true });
            push.receive_midi([176, 52, 0]);
            expect(called).toEqual(true);
        });

        it('can have their LED turned on', () => {
            push.buttons.add_effect.led_on();
            expect(sent_bytes).toEqual([176, 52, 127]);
        })

        it('can have their LED turned off', () => {
            push.buttons.add_effect.led_off();
            expect(sent_bytes).toEqual([176, 52, 0]);
        })
    })

    describe('knobs', () => {
        it('emit turned events with a positive delta in response to clockwise turns of the master knob', (done) => {
            push.knobs.master.on('turned', (delta) => {
                expect(delta).toEqual(1);
                done();
            });
            push.receive_midi([176, 79, 1]);
        });

        it('emit turned events with a positive delta in response to clockwise turns of the tempo knob', (done) => {
            push.knobs.tempo.on('turned', (delta) => {
                expect(delta).toEqual(2);
                done();
            });
            push.receive_midi([176, 14, 2]);
        });

        it('emit turned events with a negative delta in response to clockwise turns of the 1st knob', (done) => {
            push.knobs.one.on('turned', (delta) => {
                expect(delta).toEqual(-1);
                done();
            });
            push.receive_midi([176, 71, 127]);
        });

        it('emit turned events with a negative delta in response to clockwise turns of the swing knob', (done) => {
            push.knobs.swing.on('turned', (delta) => {
                expect(delta).toEqual(-2);
                done();
            });
            push.receive_midi([176, 15, 126]);
        });

        it('emit touched events when touched (receives knob MIDI note on)', (done) => {
            push.knobs.one.on('touched', done);
            push.receive_midi([144, 0, 126]);
        });

        it('emit released events when touching stops (receives knob MIDI note off)', (done) => {
            push.knobs.swing.on('released', done);
            push.receive_midi([144, 9, 0]);
        });
    });

    describe('touchstrip', () => {
        it('emits touched events when touched (receives touchstrip MIDI note on)', (done) => {
            push.touchstrip.on('touched', done);
            push.receive_midi([144, 12, 126]);
        });

        it('emits released events when touching stops (receives touchstrip MIDI note off)', (done) => {
            push.touchstrip.on('released', done);
            push.receive_midi([144, 12, 0]);
        });

        it('emits pitchbend events when the hardware is rubbed', (done) => {
            push.touchstrip.on('pitchbend', bend_amount => {
                expect(bend_amount).toEqual(385);
                done();
            });
            push.receive_midi([224, 1, 3]); // equivalent to 0b 0000011 0000001
        });

        it('emits a default pitchbend event after being released', () => {
            var emittedEvents = [];
            push.touchstrip.on('touched', () => emittedEvents.push({ 'event': 'touched' }));
            push.touchstrip.on('released', () => emittedEvents.push({ 'event': 'released' }));
            push.touchstrip.on('pitchbend', (value) => emittedEvents.push({ 'event': 'pitchbend', 'value': value }));

            push.receive_midi([144, 12, 126]); // touched
            push.receive_midi([224, 1, 3]);
            push.receive_midi([224, 2, 3]);
            push.receive_midi([224, 0, 64]); // hardware sends PB 64 (8192) before sending released event
            push.receive_midi([144, 12, 0]); // released
            
            expect(emittedEvents.length).toEqual(5);
            expect(emittedEvents[0].event).toEqual('touched');

            expect(emittedEvents[1].event).toEqual('pitchbend');
            expect(emittedEvents[1].value).toEqual(385);

            expect(emittedEvents[2].event).toEqual('pitchbend');
            expect(emittedEvents[2].value).toEqual(386);

            expect(emittedEvents[3].event).toEqual('released');

            expect(emittedEvents[4].event).toEqual('pitchbend');
            expect(emittedEvents[4].value).toEqual(8192);
        })
    });
});
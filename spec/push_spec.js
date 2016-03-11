var Push = require('../push.js');

describe('Ableton Push wrapper', () => {
    var push, sent_bytes = [];

    beforeEach(() => {
        push = new Push({ send: (bytes) => { sent_bytes = bytes } });
    })

    describe('grid', () => {
        it('emits pressed events with velocity in response to pad MIDI note messages', (done) => {
            push.grid.x[1].y[2].on('pressed', (velocity) => {
                expect(velocity).toEqual(123);
                done();
            })
            push.receive_midi([144, 44, 123]);
        });

        it('emits released events in response to pad MIDI note-off messages', (done) => {
            push.grid.y[1].x[2].on('released', done); // note can refer to grid locations x.y and y.x
            push.receive_midi([144, 37, 0]);
        });

        it('emits pressed events in response to button row above grid pad MIDI note messages', (done) => {
            push.grid.select[1].on('pressed', done)
            push.receive_midi([176, 102, 127]);
        });

        it('emits released events in response to button row above grid pad MIDI note messages', (done) => {
            push.grid.select[1].on('released', done)
            push.receive_midi([176, 102, 0]);
        });

        it('pads can have LED turned on', () => {
            push.grid.x[8].y[8].led_on(101);
            expect(sent_bytes).toEqual([144, 99, 101]);

            push.grid.x[8].y[7].led_on();
            expect(sent_bytes).toEqual([144, 91, 100]); // default colour of 100 if 'velocity' not provided
        })

        it('pads can have LED turned off', () => {
            push.grid.x[7].y[8].led_off();
            expect(sent_bytes).toEqual([144, 98, 0]);
        })

        it('pad LEDs can be controlled by RGB values', () => {
            push.grid.x[7].y[1].led_rgb(216, 80, 255);
            expect(sent_bytes).toEqual([240, 71, 127, 21, 4, 0, 8, 6, 0, 13, 8, 5, 0, 15, 15, 247]);
        });

        it('pads can have LED turned on', () => {
            push.grid.select[2].led_on(101);
            expect(sent_bytes).toEqual([176, 103, 101]);

            push.grid.select[2].led_on();
            expect(sent_bytes).toEqual([176, 103, 100]); // default colour of 100 if 'velocity' not provided
        })

        it('button row above pads can have LED turned off', () => {
            push.grid.select[2].led_off();
            expect(sent_bytes).toEqual([176, 103, 0]);
        })

        it('button row above pads can have LEDs controlled by RGB values', () => {
            push.grid.select[2].led_rgb(216, 80, 255);
            expect(sent_bytes).toEqual([240, 71, 127, 21, 4, 0, 8, 65, 0, 13, 8, 5, 0, 15, 15, 247]);
        });
    });

    describe('control buttons', () => {
        it('emit pressed events in response receiving top row pad MIDI CC messages', (done) => {
            var selection_control_button_pressed = false;
            push.control[5].on('pressed', done);
            push.receive_midi([176, 24, 127]);
        });

        it('emit released events in response receiving top row pad MIDI CC messages', (done) => {
            var selection_control_button_released = false;
            push.control[5].on('released', done);
            push.receive_midi([176, 24, 0]);
        });

        it('top row of pads above grid can have LED turned on', () => {
            push.control[1].led_on();
            expect(sent_bytes).toEqual([176, 20, 4]);
        })

        it('top row of pads above grid can have LED turned on dimly', () => {
            push.control[1].led_dim();
            expect(sent_bytes).toEqual([176, 20, 1]);
        })

        it('top row of pads above grid can have LED turned off', () => {
            push.control[1].led_off();
            expect(sent_bytes).toEqual([176, 20, 0]);
        })

        // TODO test and document control of LEDs!
    });

    describe('lcd strips', () => {
        it('can be updated with 8 chars of text across four rows per channel', () => {
            push.lcd.clear();

            push.lcd.x[1].y[1].update('more-than-8');
            expect(sent_bytes).toEqual([240, 71, 127, 21, 27, 0, 69, 0,
                109, 111, 114, 101, 45, 116, 104, 97, // char codes for "m o r e - t h a"
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                247]
            );

            push.lcd.x[4].y[1].update('yes');
            expect(sent_bytes).toEqual([240, 71, 127, 21, 27, 0, 69, 0,
                109, 111, 114, 101, 45, 116, 104, 97, // char codes for "m o r e - t h a"
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32,
                121, 101, 115, 32, 32, 32, 32, 32, // char codes for "y e s" padded
                32, 32, 32, 32, 32, 32, 32, 32,
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                247]
            );

            push.lcd.y[4].x[1].update('more-than-8');
            expect(sent_bytes).toEqual([240, 71, 127, 21, 24, 0, 69, 0,
                109, 111, 114, 101, 45, 116, 104, 97, // char codes for "m o r e - t h a"
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                247]
            );
        });

        it('can be initialised so all LCDs are blank', () => {
            var sent_bytes = [];
            push = new Push({ send: (bytes) => { sent_bytes = sent_bytes.concat(bytes) } });

            // on load Push initialises LCD with 'powered by node-push' text, so clear before test
            sent_bytes = [];
            push.lcd.clear();

            var blank_line = [32, 32, 32, 32, 32, 32, 32, 32,
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32, 32, 32, 32, 32, 32, 32, 32,
                32,
                32, 32, 32, 32, 32, 32, 32, 32
            ];

            expect(sent_bytes).toEqual(
                [240, 71, 127, 21, 27, 0, 69, 0].concat(blank_line).concat([247])
                .concat([240, 71, 127, 21, 26, 0, 69, 0].concat(blank_line).concat([247]))
                .concat([240, 71, 127, 21, 25, 0, 69, 0].concat(blank_line).concat([247]))
                .concat([240, 71, 127, 21, 24, 0, 69, 0].concat(blank_line).concat([247]))
            );
        });
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
            expect(sent_bytes).toEqual([176, 52, 4]);
        })

        it('can have their LED turned off', () => {
            push.buttons.add_effect.led_off();
            expect(sent_bytes).toEqual([176, 52, 0]);
        })

        it('can have their LED turned on dimly', () => {
            push.buttons.play.led_dim();
            expect(sent_bytes).toEqual([176, 85, 1]);
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

        it('emit pressed events when pressed (receives knob MIDI note on)', (done) => {
            push.knobs.one.on('pressed', done);
            push.receive_midi([144, 0, 126]);
        });

        it('emit released events when touching stops (receives knob MIDI note off)', (done) => {
            push.knobs.swing.on('released', done);
            push.receive_midi([144, 9, 0]);
        });
    });

    describe('touchstrip', () => {
        it('emits pressed events when pressed (receives touchstrip MIDI note on)', (done) => {
            push.touchstrip.on('pressed', done);
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
            push.touchstrip.on('pressed', () => emittedEvents.push({ 'event': 'pressed' }));
            push.touchstrip.on('released', () => emittedEvents.push({ 'event': 'released' }));
            push.touchstrip.on('pitchbend', (value) => emittedEvents.push({ 'event': 'pitchbend', 'value': value }));

            push.receive_midi([144, 12, 126]); // pressed
            push.receive_midi([224, 1, 3]);
            push.receive_midi([224, 2, 3]);
            push.receive_midi([224, 0, 64]); // hardware sends PB 64 (8192) before sending released event
            push.receive_midi([144, 12, 0]); // released
            
            expect(emittedEvents.length).toEqual(5);
            expect(emittedEvents[0].event).toEqual('pressed');

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
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
            push.grid.x[2].y[1].on('released', done); // note can refer to grid locations x.y and y.x
            push.receive_midi([144, 37, 0]);
        });

        it('emits pressed events in response to button row above grid pad MIDI note messages', (done) => {
            push.grid.x[1].select.on('pressed', done)
            push.receive_midi([176, 102, 127]);
        });

        it('emits released events in response to button row above grid pad MIDI note messages', (done) => {
            push.grid.x[1].select.on('released', done)
            push.receive_midi([176, 102, 0]);
        });

        it('emits aftertouch events in response to grid pad poly key-pressure MIDI messages', (done) => {
            push.grid.x[2].y[1].on('aftertouch', (pressure) => {
                expect(pressure).toEqual(100);
                done();
            });
            push.receive_midi([160, 37, 100]);
        })

        it('can have event listeners removed', () => {
            var pressure = 0;
            var listener = (p) => { pressure = p }
            push.grid.x[2].y[1].on('aftertouch', listener);
            push.receive_midi([160, 37, 100]);
            push.grid.x[2].y[1].removeListener('aftertouch', listener);
            push.receive_midi([160, 37, 101]);
            expect(pressure).toEqual(100);
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
            push.grid.x[2].select.led_on(101);
            expect(sent_bytes).toEqual([176, 103, 101]);

            push.grid.x[2].select.led_on();
            expect(sent_bytes).toEqual([176, 103, 100]); // default colour of 100 if 'velocity' not provided
        })

        it('button row above pads can have LED turned off', () => {
            push.grid.x[2].select.led_off();
            expect(sent_bytes).toEqual([176, 103, 0]);
        })

        it('button row above pads can have LEDs controlled by RGB values', () => {
            push.grid.x[2].select.led_rgb(216, 80, 255);
            expect(sent_bytes).toEqual([240, 71, 127, 21, 4, 0, 8, 65, 0, 13, 8, 5, 0, 15, 15, 247]);
        });
    });

    describe('top row of buttons above grid', () => {
        it('emit pressed events in response receiving top row pad MIDI CC messages', (done) => {
            push.channel[5].select.on('pressed', done);
            push.receive_midi([176, 24, 127]);
        });

        it('emit released events in response receiving top row pad MIDI CC messages', (done) => {
            push.channel[5].select.on('released', done);
            push.receive_midi([176, 24, 0]);
        });

        it('can have event listeners removed', () => {
            var called = 0;
            var listener = () => { called++ }
            push.channel[5].select.on('pressed', listener);
            push.receive_midi([176, 24, 127]);
            push.channel[5].select.removeListener('pressed', listener);
            push.receive_midi([176, 24, 127]);
            expect(called).toEqual(1);
        });

        it('can have LED turned on', () => {
            push.channel[1].select.led_on();
            expect(sent_bytes).toEqual([176, 20, 10]);
        })

        it('can have LED turned on dimly', () => {
            push.channel[1].select.led_dim();
            expect(sent_bytes).toEqual([176, 20, 7]);
        })

        it('can have LED turned off', () => {
            push.channel[1].select.led_off();
            expect(sent_bytes).toEqual([176, 20, 0]);
        })

        it('can have LEDs colour changed', () => {
            push.channel[1].select.red();
            push.channel[1].select.led_on();
            expect(sent_bytes).toEqual([176, 20, 4]);
            push.channel[1].select.led_dim();
            expect(sent_bytes).toEqual([176, 20, 1]);

            push.channel[1].select.orange();
            push.channel[1].select.led_on();
            expect(sent_bytes).toEqual([176, 20, 10]);
            push.channel[1].select.led_dim();
            expect(sent_bytes).toEqual([176, 20, 7]);

            push.channel[1].select.yellow();
            push.channel[1].select.led_on();
            expect(sent_bytes).toEqual([176, 20, 16]);
            push.channel[1].select.led_dim();
            expect(sent_bytes).toEqual([176, 20, 13]);

            push.channel[1].select.green();
            push.channel[1].select.led_on();
            expect(sent_bytes).toEqual([176, 20, 22]);
            push.channel[1].select.led_dim();
            expect(sent_bytes).toEqual([176, 20, 19]);
        })
    });

    describe('time division control buttons', () => {
        it('emit pressed events in response receiving top row pad MIDI CC messages', (done) => {
            push.button['1/32t'].on('pressed', done);
            push.receive_midi([176, 43, 127]);
        });

        it('emit released events in response receiving top row pad MIDI CC messages', (done) => {
            push.button['1/32t'].on('released', done);
            push.receive_midi([176, 43, 0]);
        });

        it('can have LED turned on', () => {
            push.button['1/4'].led_on();
            expect(sent_bytes).toEqual([176, 36, 10]);
        })

        it('can have LED turned on dimly', () => {
            push.button['1/4'].led_dim();
            expect(sent_bytes).toEqual([176, 36, 7]);
        })

        it('can have LED turned off', () => {
            push.button['1/4'].led_off();
            expect(sent_bytes).toEqual([176, 36, 0]);
        })

        it('can have LEDs colour changed', () => {
            push.button['1/16'].red();
            push.button['1/16'].led_on();
            expect(sent_bytes).toEqual([176, 40, 4]);
            push.button['1/16'].led_dim();
            expect(sent_bytes).toEqual([176, 40, 1]);

            push.button['1/16'].orange();
            push.button['1/16'].led_on();
            expect(sent_bytes).toEqual([176, 40, 10]);
            push.button['1/16'].led_dim();
            expect(sent_bytes).toEqual([176, 40, 7]);

            push.button['1/16'].yellow();
            push.button['1/16'].led_on();
            expect(sent_bytes).toEqual([176, 40, 16]);
            push.button['1/16'].led_dim();
            expect(sent_bytes).toEqual([176, 40, 13]);

            push.button['1/16'].green();
            push.button['1/16'].led_on();
            expect(sent_bytes).toEqual([176, 40, 22]);
            push.button['1/16'].led_dim();
            expect(sent_bytes).toEqual([176, 40, 19]);
        })
    });

    describe('lcd strips', () => {
        var blank_segment = [32, 32, 32, 32, 32, 32, 32, 32],
            blank_line = blank_segment.concat([32]).concat(blank_segment)
                .concat(blank_segment).concat([32]).concat(blank_segment)
                .concat(blank_segment).concat([32]).concat(blank_segment)
                .concat(blank_segment).concat([32]).concat(blank_segment);

        it('displays 8 chars of text on four rows per channel', () => {
            push.lcd.x[1].y[1].update('more-than-8');
            var text_bytes = 'more-tha'.split('').map((letter) => letter.charCodeAt(0)),
                length = 9,
                offset = 0;
            expect(sent_bytes).toEqual([240, 71, 127, 21, 27, 0, length, offset].concat(text_bytes).concat([247]));

            push.lcd.x[4].y[1].update(123);
            var text_bytes = '123     '.split('').map((letter) => letter.charCodeAt(0)),
                length = 9,
                offset = 26;
            expect(sent_bytes).toEqual([240, 71, 127, 21, 27, 0, length, offset].concat(text_bytes).concat([247]));

            push.lcd.x[1].y[4].update('more-than-8');
            var text_bytes = 'more-tha'.split('').map((letter) => letter.charCodeAt(0)),
                length = 9,
                offset = 0;
            expect(sent_bytes).toEqual([240, 71, 127, 21, 24, 0, length, offset].concat(text_bytes).concat([247]));
        });

        it('can be cleared so all LCDs are blank', () => {
            var sent_bytes = [];
            push = new Push({ send: (bytes) => { sent_bytes = sent_bytes.concat(bytes) } });

            // on load Push initialises LCD with 'powered by push-wrapper' text, so clear before test
            sent_bytes = [];

            push.lcd.clear();

            expect(sent_bytes).toEqual(
                [240, 71, 127, 21, 27, 0, 69, 0].concat(blank_line).concat([247])
                .concat([240, 71, 127, 21, 26, 0, 69, 0].concat(blank_line).concat([247]))
                .concat([240, 71, 127, 21, 25, 0, 69, 0].concat(blank_line).concat([247]))
                .concat([240, 71, 127, 21, 24, 0, 69, 0].concat(blank_line).concat([247]))
            );
        });

        it('can have individual elements cleared', () => {
            push.lcd.x[8].y[4].clear();
            var text_bytes = '        '.split('').map((letter) => letter.charCodeAt(0)),
                length = 9,
                offset = 60;
            expect(sent_bytes).toEqual([240, 71, 127, 21, 24, 0, length, offset].concat(text_bytes).concat([247]));
        });
    });

    describe('buttons', () => {
        it('emit pressed events in response to button MIDI CC messages', (done) => {
            push.button['add_track'].on('pressed', done);
            push.receive_midi([176, 53, 120]);
        });

        it('emit released events in response to button MIDI CC messages with velocity zero', () => {
            var called = false;
            push.button['add_effect'].on('released', () => { called = true });
            push.receive_midi([176, 52, 0]);
            expect(called).toEqual(true);
        });

        it('can have event listeners removed', () => {
            var called = false;
            var listener = () => { called = true }
            push.button['add_effect'].on('released', listener);
            push.button['add_effect'].removeListener('released', listener);
            push.receive_midi([176, 52, 0]);
            expect(called).toEqual(false);
        });

        it('can have their LED turned on', () => {
            push.button['add_effect'].led_on();
            expect(sent_bytes).toEqual([176, 52, 4]);
        })

        it('can have their LED turned off', () => {
            push.button['add_effect'].led_off();
            expect(sent_bytes).toEqual([176, 52, 0]);
        })

        it('can have their LED turned on dimly', () => {
            push.button['play'].led_dim();
            expect(sent_bytes).toEqual([176, 85, 1]);
        })
    })

    describe('knobs', () => {
        it('emit turned events with a positive delta in response to clockwise turns of the master knob', (done) => {
            push.knob['master'].on('turned', (delta) => {
                expect(delta).toEqual(1);
                done();
            });
            push.receive_midi([176, 79, 1]);
        });

        it('emit turned events with a positive delta in response to clockwise turns of the tempo knob', (done) => {
            push.knob['tempo'].on('turned', (delta) => {
                expect(delta).toEqual(2);
                done();
            });
            push.receive_midi([176, 14, 2]);
        });

        it('emit turned events with a negative delta in response to clockwise turns of the 1st knob', (done) => {
            push.channel[1].knob.on('turned', (delta) => {
                expect(delta).toEqual(-1);
                done();
            });
            push.receive_midi([176, 71, 127]);
        });

        it('emit turned events with a negative delta in response to clockwise turns of the swing knob', (done) => {
            push.knob['swing'].on('turned', (delta) => {
                expect(delta).toEqual(-2);
                done();
            });
            push.receive_midi([176, 15, 126]);
        });

        it('emit pressed events when pressed (receives knob MIDI note on)', (done) => {
            push.channel[1].knob.on('pressed', done);
            push.receive_midi([144, 0, 126]);
        });

        it('emit released events when touching stops (receives knob MIDI note off)', (done) => {
            push.knob['swing'].on('released', done);
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

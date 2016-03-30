const Repetae = require('../example-site/repetae.js');

describe('Example app repetae', () => {
    var repetae, emitted_events;

    beforeEach(() => {
        repetae = new Repetae(setTimeout); // use the inbuilt setTimeout function for tests
        emitted_events = [];
        repetae.on('on', (amount) => emitted_events.push('on'));
        repetae.on('off', () => emitted_events.push('off'))
    })

    it('can be turned on', () => {
        repetae.press();
        expect(emitted_events).toEqual([]);
        repetae.release();
        expect(emitted_events).toEqual(['on']);
    });

    it('can be turned on and have interval changed', () => {
        repetae.press();
        expect(emitted_events).toEqual([]);

        repetae.interval();
        expect(emitted_events).toEqual([]);

        repetae.release();
        expect(emitted_events).toEqual(['on']);
    });

    it('can be turned off', () => {
        repetae.press();
        repetae.release();
        expect(emitted_events).toEqual(['on']);

        repetae.press();
        repetae.release();
        expect(emitted_events).toEqual(['on', 'off']);
    });

    it('remains on while interval is changed', () => {
        repetae.press();
        repetae.release();
        expect(emitted_events).toEqual(['on']);

        repetae.press();
        repetae.interval();
        repetae.release();
        expect(emitted_events).toEqual(['on']);
    });

    it('cannot have interval changed while not being pressed', () => {
        repetae.press();
        repetae.release();
        expect(emitted_events).toEqual(['on']);

        repetae.interval();

        repetae.press();
        repetae.release();
        expect(emitted_events).toEqual(['on', 'off']);
    });

    it('calls the passed function at the specified interval whilst on', (done) => {
        repetae.press();
        repetae.interval(450); // expect to be called at 0, 450, 900, 1350 & 1600ms (i.e. 4 times in 1.4s)
        repetae.release();
        expect(emitted_events).toEqual(['on']);

        var called_count = 0;

        repetae.start(() => {
            called_count++;
        });

        setTimeout(() => {
            repetae.stop(); // but we stop after 1.2s, so total invocation count should be 3
        }, 1300);

        setTimeout(function () {
            expect(called_count).toEqual(3);
            done();
        }, 1400);
    });

    // TODO: probably want to call callback once if not active
    it('does not call the passed function whilst off', () => {
        var called_count = 0;

        repetae.start(() => {
            called_count++;
        });

        repetae.stop();

        expect(called_count).toEqual(0);
    });
});
const Repetae = require('../example-site/repetae.js');

describe('Example app repetae', () => {
    var repetae, emitted_events;

    beforeEach(() => {
        repetae = new Repetae(setTimeout); // use the inbuilt setTimeout function for tests
        emitted_events = [];
        repetae.on('on', (amount) => emitted_events.push('on'));
        repetae.on('off', () => emitted_events.push('off'));
        repetae.on('interval', (amount_ms) => emitted_events.push('interval-' + amount_ms));
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

        repetae.interval(300);
        expect(emitted_events).toEqual(['interval-300']);

        repetae.release();
        expect(emitted_events).toEqual(['interval-300', 'on']);
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
        repetae.interval(100);
        repetae.release();
        expect(emitted_events).toEqual(['on', 'interval-100']);
    });

    it('cannot have interval changed while not being pressed', () => {
        repetae.press();
        repetae.release();
        expect(emitted_events).toEqual(['on']);

        repetae.interval(200);

        repetae.press();
        repetae.release();
        expect(emitted_events).toEqual(['on', 'off']);
    });

    it('calls the passed function at the specified interval whilst on', (done) => {
        repetae.press();
        repetae.interval(450); // expect to be called at 0, 450, 900, 1350 & 1700ms (i.e. 4 times in 1.4s)
        repetae.release();
        expect(emitted_events).toEqual(['interval-450', 'on']);

        var called_count = 0;

        repetae.start(() => called_count++ );

        // but we stop after 1.2s, so total invocation count should be 3
        setTimeout(repetae.stop , 1200);

        setTimeout(function () {
            expect(called_count).toEqual(3);
            done();
        }, 1400);
    });

    it('continues calling the passed function at an interval that can be changed', (done) => {
        repetae.press();
        repetae.interval(450); // expect to be called at 0, 450, 900, 1350 & 1700ms (i.e. 5 times in 2s)
        repetae.release();

        var called_count = 0;

        repetae.start(() => called_count++);

        // but we update interval after 1s, so expect invocations at 1350, 1450, 1550, ..., 1950
        setTimeout(() => {
            repetae.press();
            repetae.interval(100);
            repetae.release();
        }, 1000);

        setTimeout(function () {
            repetae.stop();
            expect(called_count).toEqual(10);
            done();
        }, 2000);
    });

    it('calls the passed function only once whilst off', (done) => {
        var called_count = 0;

        repetae.start(() => {
            called_count++;
        });

        setTimeout(() => {
            repetae.stop();
        }, 1300);

        setTimeout(function () {
            expect(called_count).toEqual(1);
            done();
        }, 1400);
    });

    it('reports current interval on request', () => {
        repetae.report_interval();
        expect(emitted_events).toEqual(['interval-500']);
    })
});
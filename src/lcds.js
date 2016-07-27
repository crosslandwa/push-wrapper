const foreach = require('lodash.foreach'),
    range = require('lodash.range'),
    one_to_eight = [1, 2, 3, 4, 5, 6, 7, 8],
    one_to_four = [1, 2, 3, 4],
    zero_to_seven = [0, 1, 2, 3, 4, 5, 6, 7],
    blank = 32,
    blank_line = range(blank, 100, 0), // 68 character array filled with 'blank character'
    offsets = [0, 9, 17, 26, 34, 43, 51, 60];

function LCDSegment(update) {
    this.update = function(text) {
        update(lcd_data(text));
    };

    this.clear = function() {
        update(lcd_data(''));
    };
}

function lcd_data(text) {
    const text_string = String(text);
    return zero_to_seven.map((index) => {
        return text_string.length > index ? text_string.charCodeAt(index) : blank;
    });
}

function LCDs(send_sysex) {
    const lcds = this;

    this.clear = function() {
        foreach(
            one_to_eight,
            (x) => {
                lcds.x[x] = { y: {} };
                foreach(
                    one_to_four,
                    (y) => {
                        lcds.x[x].y[y] = new LCDSegment((display_data) => {
                            send_sysex([28 - y].concat([0, 9, offsets[x - 1]]).concat(display_data));
                        })
                    }
                )
            }
        );

        foreach(one_to_four, (row) => send_sysex([28 - row].concat([0, 69, 0]).concat(blank_line)));
    };

    this.x = {};

    this.clear();

    this.x[8].y[4].update(' powered');
    this.x[8].y[3].update('      by');
    this.x[8].y[2].update('   push-');
    this.x[8].y[1].update(' wrapper');
}

module.exports = LCDs;

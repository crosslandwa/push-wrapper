const foreach = require('lodash.foreach'),
    one_to_eight = [1, 2, 3, 4, 5, 6, 7, 8],
    one_to_four = [1, 2, 3, 4],
    zero_to_seven = [0, 1, 2, 3, 4, 5, 6, 7],
    blank = 32,
    offsets = [0, 9, 17, 26, 34, 43, 51, 60];

function LCDSegment(offset, update) {
    var lcd_segment = this;
    this.lcd_data = [blank, blank, blank, blank, blank, blank, blank, blank];

    this.update = function(text) {
        lcd_segment.lcd_data = lcd_data(String(text));
        update(offset, lcd_segment.lcd_data);
    };

    this.clear = function() {
        lcd_segment.lcd_data = lcd_data(String(''));
        update(offset, lcd_segment.lcd_data);
    };
}

function lcd_data(text) {
    return zero_to_seven.map((index) => {
        return text.length > index ? text.charCodeAt(index) : blank;
    });
}

function LCDs(send_sysex) {
    const lcds = this;
    const update_row = function (row_number) {
        var display_data = [];
        foreach(one_to_eight, (channel) => {
            display_data = display_data.concat(lcds.x[channel].y[row_number].lcd_data);
            if ((channel % 2) == 1) display_data.push(blank);
        });
        send_sysex(
            [28 - row_number]
            .concat([0, 69, 0])
            .concat(display_data)
        );
    }
    const update_segment = function (row_number, offset, display_data) {
        send_sysex(
            [28 - row_number]
            .concat([0, 9, offset])
            .concat(display_data)
        );
    }

    this.clear = function() {
        foreach(
            one_to_eight,
            (x) => {
                lcds.x[x] = { y: {} };
                foreach(
                    one_to_four,
                    (y) => { lcds.x[x].y[y] = new LCDSegment(offsets[x - 1], (offset, display_data) => update_segment(y, offset, display_data)) }
                )
            }
        );

        foreach(one_to_four, update_row);
    };

    this.x = {};

    this.clear();

    this.x[8].y[4].update(' powered');
    this.x[8].y[3].update('      by');
    this.x[8].y[2].update('   push-');
    this.x[8].y[1].update(' wrapper');
}

module.exports = LCDs;

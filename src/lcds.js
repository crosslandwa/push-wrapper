const foreach = require('lodash.foreach'),
    one_to_eight = [1, 2, 3, 4, 5, 6, 7, 8],
    one_to_four = [1, 2, 3, 4]
    zero_to_seven = [0, 1, 2, 3, 4, 5, 6, 7],
    blank = 32;

function LCDSegment(lcds, update_row) {
    var lcd_segment = this;
    this.lcd_data = [blank, blank, blank, blank, blank, blank, blank, blank];

    this.update = function(text) {
        lcd_segment.lcd_data = lcd_data(String(text));
        update_row();
    };

    this.clear = function() {
        lcd_segment.lcd_data = lcd_data(String(''));
        update_row();
    };
}

function lcd_data(text) {
    return zero_to_seven.map((index) => {
        return text.length > index ? text.charCodeAt(index) : blank;
    });
}

function LCDs(send_sysex) {
    var lcds = this;

    this.clear = function() {
        foreach(
            one_to_eight,
            (x) => {
                lcds.x[x] = { y: {} };
                foreach(
                    one_to_four,
                    (y) => { lcds.x[x].y[y] = new LCDSegment(lcds, () => lcds.update_row(y)) }
                )
            }
        );

        foreach(one_to_four, row => lcds.update_row(row));
    };

    this.update_row = function (row_number) {
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

    this.x = {};

    this.clear();

    this.x[8].y[4].update(' powered');
    this.x[8].y[3].update('      by');
    this.x[8].y[2].update('   push-');
    this.x[8].y[1].update(' wrapper');

    foreach(one_to_four, row => this.update_row(row));
}

module.exports = LCDs;

const foreach = require('lodash.foreach'),
    partial = require('lodash.partial'),
    one_to_eight = [1, 2, 3, 4, 5, 6, 7, 8],
    one_to_four = [1, 2, 3, 4]
    zero_to_seven = [0, 1, 2, 3, 4, 5, 6, 7],
    blank = 32;

function LCDSegment(lcds, row) {
    this.lcds = lcds
    this.row = row;
    this.lcd_data = [blank, blank, blank, blank, blank, blank, blank, blank];
    this.update = partial(update, this);
    this.clear = partial(update, this, '');
}

function update(lcd_segment, text) {
    lcd_segment.lcd_data = lcd_data(String(text));
    lcd_segment.lcds.update_row(lcd_segment.row);
}

function LCDs(send_sysex) {
    this.clear = partial(clear, this);
    this.update_row = partial(update_row, this);

    this.send_sysex = send_sysex;
    this.x = {};
    this.y = {};

    this.clear();

    this.x[8].y[4].update(' powered');
    this.x[8].y[3].update('      by');
    this.x[8].y[2].update('   push-');
    this.x[8].y[1].update(' wrapper');

    foreach(one_to_four, row => this.update_row(row));
}

function clear(lcds) {
    foreach(one_to_eight, (x) => {
        lcds.x[x] = { y: {} };
        foreach(one_to_four, (y) => {
            if (lcds.y[y] === undefined) lcds.y[y] = { x: {} };
            lcds.y[y].x[x] = lcds.x[x].y[y] = new LCDSegment(lcds, y)
        })
    });

    foreach(one_to_four, row => lcds.update_row(row));
}

function update_row(lcds, row_number) {
    var display_data = [];
    foreach(one_to_eight, (channel) => {
        display_data = display_data.concat(lcds.x[channel].y[row_number].lcd_data);
        if ((channel % 2) == 1) display_data.push(blank);
    });
    lcds.send_sysex(
        [28 - row_number]
        .concat([0, 69, 0])
        .concat(display_data)
    );
}

function lcd_data(text) {
    return zero_to_seven.map((index) => {
        return text.length > index ? text.charCodeAt(index) : 32;
    });
}
module.exports = LCDs;

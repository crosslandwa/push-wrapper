const oneToEight = [1, 2, 3, 4, 5, 6, 7, 8],
    oneToFour = [1, 2, 3, 4],
    zeroToSeven = [0, 1, 2, 3, 4, 5, 6, 7],
    blank = 32,
    blank_line = new Array(68).fill(blank),
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
    return zeroToSeven.map((index) => {
        return text_string.length > index ? text_string.charCodeAt(index) : blank;
    });
}

function LCDs(send_sysex) {
    const lcds = this;

    this.clear = function() {
        oneToEight.forEach(x => {
            lcds.x[x] = { y: {} };
            oneToFour.forEach(y => {
                lcds.x[x].y[y] = new LCDSegment(display_data => {
                    send_sysex([28 - y, 0, 9, offsets[x - 1], ...display_data]);
                })
            })
        });
        oneToFour.forEach(row => { send_sysex([28 - row, 0, 69, 0, ...blank_line]) });
    };

    this.x = {};

    this.clear();

    this.x[8].y[4].update(' powered');
    this.x[8].y[3].update('      by');
    this.x[8].y[2].update('   push-');
    this.x[8].y[1].update(' wrapper');
}

module.exports = LCDs;

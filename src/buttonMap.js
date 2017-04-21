'use strict'

const ccToButtonMap = {
    3: 'TapTempo',
    9: 'Metronome',
    119: 'Undo',
    118: 'Delete',
    117: 'Double',
    116: 'Quantize',
    90: 'FixedLength',
    89: 'Automation',
    88: 'Duplicate',
    87: 'New',
    86: 'Rec',
    85: 'Play',
    28: 'Master',
    29: 'Stop',
    44: 'Left',
    45: 'Right',
    46: 'Up',
    47: 'Down',
    114: 'Volume',
    115: 'Pan&Send',
    112: 'Track',
    113: 'Clip',
    110: 'Device',
    111: 'Browse',
    62: 'StepIn',
    63: 'StepOut',
    60: 'Mute',
    61: 'Solo',
    58: 'Scales',
    59: 'User',
    56: 'Repeat',
    57: 'Accent',
    54: 'OctaveDown',
    55: 'OctaveUp',
    52: 'AddEffect',
    53: 'AddTrack',
    50: 'Note',
    51: 'Session',
    48: 'Select',
    49: 'Shift'
}

const timeDivisionButtonToCC = {
  '1/4': 36,
  '1/4t': 37,
  '1/8': 38,
  '1/8t': 39,
  '1/16': 40,
  '1/16t': 42,
  '1/32': 43,
  '1/32t': 44
}

module.exports = {
  ccToButton: ccToButtonMap,
  buttonToCC: Object.keys(ccToButtonMap).map(Number)
    .reduce((acc, cc) => { acc[ccToButtonMap[cc]] = cc; return acc }, {}),
  timeDivisionButtonToCC
}

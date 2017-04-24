'use strict'

const buttonToCC = {
  'TapTempo': 3,
  'Metronome': 9,
  'Undo': 119,
  'Delete': 118,
  'Double': 117,
  'Quantize': 116,
  'FixedLength': 90,
  'Automation': 89,
  'Duplicate': 88,
  'New': 87,
  'Rec': 86,
  'Play': 85,
  'Master': 28,
  'Stop': 29,
  'Left': 44,
  'Right': 45,
  'Up': 46,
  'Down': 47,
  'Volume': 114,
  'Pan&Send': 115,
  'Track': 112,
  'Clip': 113,
  'Device': 110,
  'Browse': 111,
  'StepIn': 62,
  'StepOut': 63,
  'Mute': 60,
  'Solo': 61,
  'Scales': 58,
  'User': 59,
  'Repeat': 56,
  'Accent': 57,
  'OctaveDown': 54,
  'OctaveUp': 55,
  'AddEffect': 52,
  'AddTrack': 53,
  'Note': 50,
  'Session': 51,
  'Select': 48,
  'Shift': 49
}

const timeDivisionButtonToCC = {
  '1/4': 36,
  '1/4t': 37,
  '1/8': 38,
  '1/8t': 39,
  '1/16': 40,
  '1/16t': 41,
  '1/32': 42,
  '1/32t': 43
}

module.exports = {buttonToCC, timeDivisionButtonToCC}

fdescribe('Ableton Push wrapper', () => {
  let sentBytes = []
  let button, gridRow, gridCol, gridSelectButtons, midiFromHardware

  function testLedOn(element, expectedMIDI) {
    element.ledOn()
    expect(sentBytes).toEqual(expectedMIDI)
  }

  function testLedOnWithValue(element, velocity, expectedMIDI) {
    element.ledOn(velocity)
    expect(sentBytes).toEqual(expectedMIDI)
  }

  function testLedDim(element, expectedMIDI) {
    element.ledDim()
    expect(sentBytes).toEqual(expectedMIDI)
  }

  function testLedOff(element, expectedMIDI) {
    element.ledOff()
    expect(sentBytes).toEqual(expectedMIDI)
  }

  function testLedRGB(element, rgb, expectedMIDI) {
    element.ledRGB(...rgb)
    expect(sentBytes).toEqual(expectedMIDI)
  }

  beforeEach(() => {
    ({
      button,
      gridRow,
      gridCol,
      gridSelectButtons,
      midiIn: midiFromHardware
    } = require('../pushV2.js')([bytes => { sentBytes = bytes }]))
    sentBytes = []
  })

  describe('grid pads', () => {
    it('can have listeners subscribed that are passed velocity when the pad is pressed', done => {
      gridRow(1)[0].onPressed(velocity => {
        expect(velocity).toEqual(123)
        done()
      })
      midiFromHardware([144, 44, 123]) // MIDI note on
    })

    it('can have listeners subscribed and unsubscibed (for presses)', () => {
      let captured = 0

      let unsubscribe = gridCol(0)[1].onPressed(velocity => { captured = velocity })
      midiFromHardware([144, 44, 124])

      unsubscribe()
      midiFromHardware([144, 44, 101])

      expect(captured).toEqual(124)
    })

    it('can have listeners subscribed that are invoked when the pad is released', done => {
      gridCol(1)[0].onReleased(done)
      midiFromHardware([144, 37, 0]) // MIDI note off (well, a note on with velocity 0)
    })

    it('can have listeners subscribed that are passed pressure for pad aftertouch', (done) => {
      gridCol(1)[0].onAftertouch(pressure => {
        expect(pressure).toEqual(100)
        done()
      })
      midiFromHardware([160, 37, 100]); // MIDI poly key-pressure
    })

    it('can have LED turned on', () => {
      testLedOn(gridCol(7)[7], [144, 99, 100]) // default colour of 100 if 'velocity' not provided
      testLedOnWithValue(gridCol(7)[6], 101, [144, 91, 101])
    })

    it('can have LED turned off', () => {
      testLedOff(gridRow(7)[6], [144, 98, 0])
    })

    it('can have LED turned on with RGB values', () => {
      testLedRGB(gridRow(0)[6], [216, 80, 255], [240, 71, 127, 21, 4, 0, 8, 6, 0, 13, 8, 5, 0, 15, 15, 247])
    })
  })

  describe('grid select buttons', () => {
    it('can have listeners subscribed that are invoked when the button is pressed', done => {
      gridSelectButtons()[0].onPressed(done)
      midiFromHardware([176, 102, 127]) // MIDI cc
    })

    it('can have listeners subscribed that are invoked when the button is released', done => {
      gridSelectButtons()[2].onReleased(done)
      midiFromHardware([176, 104, 0])
    })

    it('can have LED turned on', () => {
      testLedOn(gridSelectButtons()[1], [176, 103, 100]) // default colour of 100 if 'velocity' not provided
      testLedOnWithValue(gridSelectButtons()[1], 101, [176, 103, 101])
    })

    it('can have LED turned off', () => {
      testLedOff(gridSelectButtons()[1], [176, 103, 0])
    })

    it('can have LED turned on with RGB values', () => {
      testLedRGB(gridSelectButtons()[1], [216, 80, 255], [240, 71, 127, 21, 4, 0, 8, 65, 0, 13, 8, 5, 0, 15, 15, 247])
    })
  })

  describe('buttons', () => {
    it('can have listeners subscribed that are invoked when the button is pressed', done => {
      button('AddTrack').onPressed(done)
      midiFromHardware([176, 53, 120]) // MIDI cc
    })

    it('can have listeners subscribed that are invoked when the button is released', done => {
      button('AddEffect').onReleased(done)
      midiFromHardware([176, 52, 0]) // MIDI cc
    })

    it('can have LED turned on', () => {
      testLedOn(button('AddEffect'), [176, 52, 4])
    })

    it('can have LED turned on dimly', () => {
      testLedDim(button('Play'), [176, 85, 1])
    })

    it('can have LED turned off', () => {
      testLedOff(button('AddEffect'), [176, 52, 0])
    })
  })
})

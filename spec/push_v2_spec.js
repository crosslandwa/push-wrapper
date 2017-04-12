fdescribe('Ableton Push wrapper', () => {
  let sentBytes = []
  let gridRow, gridCol, gridSelectButtons, midiFromHardware

  beforeEach(() => {
    ({
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
        gridCol(7)[7].ledOn()
        expect(sentBytes).toEqual([144, 99, 100]) // default colour of 100 if 'velocity' not provided

        gridCol(7)[6].ledOn(101)
        expect(sentBytes).toEqual([144, 91, 101])
    })

    it('can have LED turned off', () => {
        gridRow(7)[6].ledOff()
        expect(sentBytes).toEqual([144, 98, 0])
    })

    it('can have LED turned on with RGB values', () => {
        gridRow(0)[6].ledRGB(216, 80, 255)
        expect(sentBytes).toEqual([240, 71, 127, 21, 4, 0, 8, 6, 0, 13, 8, 5, 0, 15, 15, 247])
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
  })
})

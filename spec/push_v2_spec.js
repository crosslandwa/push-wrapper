fdescribe('Ableton Push wrapper', () => {
  let sentBytes = []
  let button, gridRow, gridCol, gridSelectButtons, midiFromHardware

  const midiCC = (cc, value) => [176, cc, value]
  const midiNote = (note, velocity) => [144, note, velocity]

  const testSendsMidi = ({ call: c, expect: e }) => () => { c(); expect(sentBytes).toEqual(e) }
  const testOnPressed = (elem, midi) => done => { elem().onPressed(done); midiFromHardware(midi) }
  const testOnReleased = (elem, midi) => done => { elem().onReleased(done); midiFromHardware(midi) }

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
    it('pass velocity to subscribed listeners when pressed', done => {
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

    it('invoke subscribed listeners when released', testOnReleased(() => gridCol(1)[0], [144, 37, 0])) // MIDI note off (well, a note on with velocity 0)

    it('can have listeners subscribed that are passed pressure for pad aftertouch', (done) => {
      gridCol(1)[0].onAftertouch(pressure => {
        expect(pressure).toEqual(100)
        done()
      })
      midiFromHardware([160, 37, 100]); // MIDI poly key-pressure
    })

    it('can have LED turned on', testSendsMidi({ call: () => gridCol(7)[7].ledOn(), expect: midiNote(99, 100) }))
    it('can have LED turned on specifying velocity', testSendsMidi({ call: () => gridCol(7)[6].ledOn(101), expect: midiNote(91, 101) }))
    it('can have LED turned off', testSendsMidi({ call: () => gridRow(7)[6].ledOff(), expect: midiNote(98, 0) }))
    it('can have LED turned on with RGB values', testSendsMidi(
      { call: () => gridRow(0)[6].ledRGB(216, 80, 255), expect: [240, 71, 127, 21, 4, 0, 8, 6, 0, 13, 8, 5, 0, 15, 15, 247] }
    ))
  })

  describe('grid select buttons', () => {
    it('invoke subscribed listeners when pressed', testOnPressed(() => gridSelectButtons()[0], midiCC(102, 127)))
    it('invoke subscribed listeners when released', testOnReleased(() => gridSelectButtons()[2], midiCC(104, 0)))

    it('can have LED turned on', testSendsMidi({ call: () => gridSelectButtons()[1].ledOn(), expect: midiCC(103, 100) }))
    it('can have LED turned on specifying velocity', testSendsMidi({ call: () => gridSelectButtons()[1].ledOn(101), expect: midiCC(103, 101) }))
    it('can have LED turned off', testSendsMidi({ call: () => gridSelectButtons()[1].ledOff(), expect: midiCC(103, 0) }))
    it('can have LED turned on with RGB values', testSendsMidi(
      { call: () => gridSelectButtons()[1].ledRGB(216, 80, 255), expect: [240, 71, 127, 21, 4, 0, 8, 65, 0, 13, 8, 5, 0, 15, 15, 247] }
    ))
  })

  describe('buttons', () => {
    it('invoked subscribed listeners when pressed', testOnPressed(() => button('AddTrack'), midiCC(53, 120)))
    it('invoked subscribed listeners when released', testOnReleased(() => button('AddEffect'), midiCC(52, 0)))

    it('can have LED turned on', testSendsMidi({ call: () => button('AddEffect').ledOn(), expect: midiCC(52, 4) }))
    it('can have LED turned on dimly', testSendsMidi({ call: () => button('Play').ledDim(), expect: midiCC(85, 1) }))
    it('can have LED turned off', testSendsMidi({ call: () => button('AddEffect').ledOff(), expect: midiCC(52, 0) }))
  })
})

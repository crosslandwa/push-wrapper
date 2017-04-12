

fdescribe('Ableton Push wrapper', () => {
  let sentBytes = []
  let gridRow, gridCol, midiIn

  beforeEach(() => {
    ({gridRow, gridCol, midiIn} = require('../pushV2.js')([bytes => { sentBytes = bytes }]))
    sentBytes = []
  })

  describe('grid', () => {
    it('emits pressed events with velocity in response to pad MIDI note messages', (done) => {
      gridRow(1)[0].onPressed(velocity => {
        expect(velocity).toEqual(123)
        done()
      })
      midiIn([144, 44, 123])
    })

    it('can have callbacks registered and removed for pad presses', () => {
      let captured = 0

      let unsubscribe = gridCol(0)[1].onPressed(velocity => { captured = velocity })
      midiIn([144, 44, 124])

      unsubscribe()
      midiIn([144, 44, 101])

      expect(captured).toEqual(124)
    })
  })
})

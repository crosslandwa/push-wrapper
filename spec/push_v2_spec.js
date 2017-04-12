

fdescribe('Ableton Push wrapper', () => {
  let sentBytes = []
  const { onPadPressed, midiIn } = require('../pushV2.js')([bytes => { sentBytes = bytes }])

  beforeEach(() => {
    sentBytes = []
  })

  describe('grid', () => {
    it('emits pressed events with velocity in response to pad MIDI note messages', (done) => {
      const unsubscribe = onPadPressed(0, 1, velocity => {
        unsubscribe()
        expect(velocity).toEqual(123)
        done()
      })
      midiIn([144, 44, 123])
    })

    it('can have callbacks registered and removed for pad presses', () => {
      let captured = 0
      let callback = velocity => { captured = velocity }

      let unsubscribe = onPadPressed(0, 1, callback)
      midiIn([144, 44, 124])

      unsubscribe()
      midiIn([144, 44, 101])

      expect(captured).toEqual(124)
    })
  })
})

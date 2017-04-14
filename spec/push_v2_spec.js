describe('Ableton Push wrapper', () => {
  let sentBytes = []
  let button, channelSelectButtons, gridRow, gridCol, gridSelectButtons, midiFromHardware, timeDivisionButtons

  const midiCC = (cc, value) => [176, cc, value]
  const midiNote = (note, velocity) => [144, note, velocity]

  const testSendsMidi = ({ call: c, expect: e }) => () => { c(); expect(sentBytes).toEqual(e) }
  const testListenerInvoked = ({ receive: r, invoke: i }) => done => { i(done); midiFromHardware(r) }

  beforeEach(() => {
    ({
      button,
      channelSelectButtons,
      gridRow,
      gridCol,
      gridSelectButtons,
      midiIn: midiFromHardware,
      timeDivisionButtons
    } = require('../pushV2.js')([bytes => { sentBytes = bytes }]))
    sentBytes = []
  })

  describe('grid pads', () => {
    it('pass velocity to subscribed listeners when pressed', done => {
      gridRow(1)[0].onPressed(velocity => {
        expect(velocity).toEqual(123)
        done()
      })
      midiFromHardware(midiNote(44, 123))
    })

    it('can have listeners subscribed and unsubscribed (for presses)', () => {
      let captured = 0

      let unsubscribe = gridCol(0)[1].onPressed(velocity => { captured = velocity })
      midiFromHardware(midiNote(44, 124))

      unsubscribe()
      midiFromHardware(midiNote(44, 101))

      expect(captured).toEqual(124)
    })

    it('invoke subscribed listeners when released', testListenerInvoked({
      receive: midiNote(37, 0),
      invoke: done => gridCol(1)[0].onReleased(done)
    }))

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
    it('can have LED turned on with RGB values', testSendsMidi({
      call: () => gridRow(0)[6].ledRGB(216, 80, 255),
      expect: [240, 71, 127, 21, 4, 0, 8, 6, 0, 13, 8, 5, 0, 15, 15, 247]
    }))
  })

  describe('grid select buttons', () => {
    it('invoke subscribed listeners when pressed', testListenerInvoked({
      receive: midiCC(102, 127),
      invoke: done => gridSelectButtons()[0].onPressed(done)
    }))
    it('invoke subscribed listeners when released', testListenerInvoked({
      receive: midiCC(104, 0),
      invoke: done => gridSelectButtons()[2].onReleased(done)
    }))

    it('can have LED turned on', testSendsMidi({ call: () => gridSelectButtons()[1].ledOn(), expect: midiCC(103, 100) }))
    it('can have LED turned on specifying velocity', testSendsMidi({ call: () => gridSelectButtons()[1].ledOn(101), expect: midiCC(103, 101) }))
    it('can have LED turned off', testSendsMidi({ call: () => gridSelectButtons()[1].ledOff(), expect: midiCC(103, 0) }))
    it('can have LED turned on with RGB values', testSendsMidi({
      call: () => gridSelectButtons()[1].ledRGB(216, 80, 255),
      expect: [240, 71, 127, 21, 4, 0, 8, 65, 0, 13, 8, 5, 0, 15, 15, 247]
    }))
  })

  describe('buttons', () => {
    it('invoke subscribed listeners when released', testListenerInvoked({
      receive: midiCC(53, 120),
      invoke: done => button('AddTrack').onPressed(done)
    }))
    it('invoke subscribed listeners when released', testListenerInvoked({
      receive: midiCC(52, 0),
      invoke: done => button('AddEffect').onReleased(done)
    }))

    it('can have LED turned on', testSendsMidi({ call: () => button('AddEffect').ledOn(), expect: midiCC(52, 4) }))
    it('can have LED turned on dimly', testSendsMidi({ call: () => button('Play').ledDim(), expect: midiCC(85, 1) }))
    it('can have LED turned off', testSendsMidi({ call: () => button('AddEffect').ledOff(), expect: midiCC(52, 0) }))
  })

  describe('time division buttons', () => {
    it('invoke subscribed listeners when released', testListenerInvoked({
      receive: midiCC(43, 127),
      invoke: done => timeDivisionButtons('1/32t').onPressed(done)
    }))
    it('invoke subscribed listeners when released', testListenerInvoked({
      receive: midiCC(43, 0),
      invoke: done => timeDivisionButtons('1/32t').onReleased(done)
    }))

    it('can have LED turned on (defaults to orange)', testSendsMidi({ call: () => timeDivisionButtons('1/4').ledOn(), expect: midiCC(36, 10) }))
    it('can have LED turned on red', testSendsMidi({ call: () => timeDivisionButtons('1/16').ledOn('red'), expect: midiCC(40, 4) }))
    it('can have LED turned on orange', testSendsMidi({ call: () => timeDivisionButtons('1/16').ledOn('orange'), expect: midiCC(40, 10) }))
    it('can have LED turned on yellow', testSendsMidi({ call: () => timeDivisionButtons('1/16').ledOn('yellow'), expect: midiCC(40, 16) }))
    it('can have LED turned on green', testSendsMidi({ call: () => timeDivisionButtons('1/16').ledOn('green'), expect: midiCC(40, 22) }))
    it('can have LED turned on dimly (defaults to orange)', testSendsMidi({ call: () => timeDivisionButtons('1/16').ledDim(), expect: midiCC(40, 7) }))
    it('can have LED turned on dimly red', testSendsMidi({ call: () => timeDivisionButtons('1/16').ledDim('red'), expect: midiCC(40, 1) }))
    it('can have LED turned on dimly orange', testSendsMidi({ call: () => timeDivisionButtons('1/16').ledDim('orange'), expect: midiCC(40, 7) }))
    it('can have LED turned on dimly yellow', testSendsMidi({ call: () => timeDivisionButtons('1/16').ledDim('yellow'), expect: midiCC(40, 13) }))
    it('can have LED turned on dimly green', testSendsMidi({ call: () => timeDivisionButtons('1/16').ledDim('green'), expect: midiCC(40, 19) }))
    it('can have LED turned off', testSendsMidi({ call: () => timeDivisionButtons('1/4').ledOff(), expect: midiCC(36, 0) }))
  })

  describe('channel select buttons', () => {
    it('invoke subscribed listeners when released', testListenerInvoked({
      receive: midiCC(24, 127),
      invoke: done => channelSelectButtons()[4].onPressed(done)
    }))
    it('invoke subscribed listeners when released', testListenerInvoked({
      receive: midiCC(24, 0),
      invoke: done => channelSelectButtons()[4].onReleased(done)
    }))

    it('can have LED turned on (defaults to orange)', testSendsMidi({ call: () => channelSelectButtons()[0].ledOn(), expect: midiCC(20, 10) }))
    it('can have LED turned on red', testSendsMidi({ call: () => channelSelectButtons()[0].ledOn('red'), expect: midiCC(20, 4) }))
    it('can have LED turned on orange', testSendsMidi({ call: () => channelSelectButtons()[0].ledOn('orange'), expect: midiCC(20, 10) }))
    it('can have LED turned on yellow', testSendsMidi({ call: () => channelSelectButtons()[0].ledOn('yellow'), expect: midiCC(20, 16) }))
    it('can have LED turned on green', testSendsMidi({ call: () => channelSelectButtons()[0].ledOn('green'), expect: midiCC(20, 22) }))
    it('can have LED turned on dimly (defaults to orange)', testSendsMidi({ call: () => channelSelectButtons()[0].ledDim(), expect: midiCC(20, 7) }))
    it('can have LED turned on dimly red', testSendsMidi({ call: () => channelSelectButtons()[0].ledDim('red'), expect: midiCC(20, 1) }))
    it('can have LED turned on dimly orange', testSendsMidi({ call: () => channelSelectButtons()[0].ledDim('orange'), expect: midiCC(20, 7) }))
    it('can have LED turned on dimly yellow', testSendsMidi({ call: () => channelSelectButtons()[0].ledDim('yellow'), expect: midiCC(20, 13) }))
    it('can have LED turned on dimly green', testSendsMidi({ call: () => channelSelectButtons()[0].ledDim('green'), expect: midiCC(20, 19) }))
    it('can have LED turned off', testSendsMidi({ call: () => channelSelectButtons()[0].ledOff(), expect: midiCC(20, 0) }))
  })
})

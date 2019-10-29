/******************************************************************************
* (c) 2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
const expect = require('chai').expect
const rti = require(path.join(__dirname, '/../../rticonnextdds-connector'))
const sinon = require('sinon')
const events = require('events')

// We have to do this due to the expect() syntax of chai and the fact
// that we install mocha globally
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

// We provide a timeout of 10s to operations that we expect to succeed. This
// is so that if they fail, we know for sure something went wrong
const testExpectSuccessTimeout = 10000

describe('Connector EventEmitter tests', function () {
  this.timeout(testExpectSuccessTimeout)
  let connector = null
  let input = null
  let output = null

  beforeEach(async () => {
    // Create the connector object
    const xmlPath = path.join(__dirname, '/../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::DataAccessTest'
    connector = new rti.Connector(profile, xmlPath)
    expect(connector).to.exist.and.be.an.instanceof(rti.Connector)
    input = connector.getInput('TestSubscriber::TestReader')
    expect(input).to.exist
    output = connector.getOutput('TestPublisher::TestWriter')
    expect(output).to.exist

    // Wait for the entities to match
    try {
      const newMatches = await input.waitForPublications(testExpectSuccessTimeout)
      expect(newMatches).to.be.at.least(1)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw err
    }
  })

  afterEach(async () => {
    await connector.close()
  })

  /*
   * Writing these tests is a bit awkward. We cannot do what we do in the other
   * tests and use async/await syntax. Instead we have to define the test functions
   * to accept the variable (it is actually a callback) done. Once we have finished
   * testing we have to call done() so that the test suite knows it can now run afterEach
   * and the next test.
   * If you don't do this, when you call await <something> the test will immediately
   * return a Promise and connector.close() is called. BUT since the .on() runs
   * asynchronously the waitset is still busy and a segfault will occur.
   */

  it('Callback should be called when event is emitted', (done) => {
    var spy = sinon.spy()
    connector.on('on_data_available', spy)
    connector.emit('on_data_available')
    expect(spy.calledOnce).to.be.true
    connector.removeListener('on_data_available', spy)
    done()
  })

  it('Event should be emitted when data is available on an input', (done) => {
    var spy = sinon.spy()
    connector.on('on_data_available', spy)
    output.write()
    events.once(connector, 'on_data_available')
      .then(() => {
        expect(spy.calledOnce).to.be.true
        // test is complete BUT internally, removeListener handler might not have run
        done()
      })
  })

  it('Connector.once() should automatically unregister the callback after data is received', (done) => {
    var spy = sinon.spy()
    connector.once('on_data_available', spy)
    output.write()
    events.once(connector, 'on_data_available')
      .then(() => {
        expect(spy.calledOnce).to.be.true
        expect(connector.listenerCount('on_data_available')).to.deep.equals(0)
        // Writing again
        output.write()
        return events.once(connector, 'on_data_available')
      })
      .then(() => {
        // Should still only have a single call
        expect(spy.calledOnce).to.be.true
        done()
      })
  })

  it('When no data is written, no event should be emitted', (done) => {
    var spy = sinon.spy()
    connector.on('on_data_available', spy)
    setTimeout(() => {
      expect(spy.notCalled).to.be.true
      done()
    }, 250)
  })

  it('Should be possible to add multiple callbacks for the same event', (done) => {
    var spy1 = sinon.spy()
    var spy2 = sinon.spy()
    connector.on('on_data_available', spy1)
    connector.on('on_data_available', spy2)
    expect(connector.listenerCount('on_data_available')).to.deep.equals(2)
    output.write()
    events.once(connector, 'on_data_available')
      .then(() => {
        expect(spy1.calledOnce).to.be.true
        expect(spy2.calledOnce).to.be.true
        done()
      })
  })

  it('Possible to uninstall the eventListener with .off()', (done) => {
    var spy = sinon.spy()
    connector.on('on_data_available', spy)
    output.write()
    events.once(connector, 'on_data_available')
      .then(() => {
        expect(spy.calledOnce).to.be.true
        connector.off('on_data_available', spy)
        expect(connector.listenerCount('on_data_available')).to.deep.equals(0)
        // Writing again
        output.write()
        setTimeout(() => {
          // We should still only have a single call to the spy callback
          expect(spy.calledOnce).to.be.true
          done()
        }, 250)
      })
  })

  it('Using .off() should only unregister the supplied callback, if multiple are registered', (done) => {
    var spy1 = sinon.spy()
    var spy2 = sinon.spy()
    connector.on('on_data_available', spy1)
    connector.on('on_data_available', spy2)
    expect(connector.listenerCount('on_data_available')).to.deep.equals(2)
    output.write()
    events.once(connector, 'on_data_available')
      .then(() => {
        expect(spy1.calledOnce).to.be.true
        expect(spy2.calledOnce).to.be.true
        connector.off('on_data_available', spy1)
        expect(connector.listenerCount('on_data_available')).to.deep.equals(1)
        output.write()
        return events.once(connector, 'on_data_available')
      })
      .then(() => {
        expect(spy1.calledOnce).to.be.true
        expect(spy2.calledTwice).to.be.true
        done()
      })
  })

  it('Using .removeAllListeners() should remove all eventListeners', () => {
    var spy1 = sinon.spy()
    var spy2 = sinon.spy()
    connector.on('on_data_available', spy1)
    connector.on('on_data_available', spy2)
    expect(connector.listenerCount('on_data_available')).to.deep.equals(2)
    connector.removeAllListeners('on_data_available')
    expect(connector.listenerCount('on_data_available')).to.deep.equals(0)
  })

  it('It should not be possible to register the event listener and have a Promise waiting for data simultaneously', (done) => {
    var spy = sinon.spy()
    connector.on('on_data_available', spy)
    // Internally, the connector's waitset is now busy
    connector.waitForData(500)
      .then(() => {
        // This should not have been possible
        console.log('Error occurred. Expected waitForData to fail due to waitSetBusy')
        expect(true).to.deep.equals(false)
      })
      .catch((err) => {
        expect(err.message).to.deep.equals('Can not concurrently wait on the same Connector object')
        done()
      })
  })
})

describe('Input EventEmitter tests', function () {
  this.timeout(testExpectSuccessTimeout)
  let connector = null
  let input = null
  let output = null

  before(async () => {
    // Create the connector object
    const xmlPath = path.join(__dirname, '/../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::DataAccessTest'
    connector = new rti.Connector(profile, xmlPath)
    expect(connector).to.exist.and.be.an.instanceof(rti.Connector)
    input = connector.getInput('TestSubscriber::TestReader')
    expect(input).to.exist
    output = connector.getOutput('TestPublisher::TestWriter')
    expect(output).to.exist

    // Wait for the entities to match
    try {
      const newMatches = await input.waitForPublications(testExpectSuccessTimeout)
      expect(newMatches).to.be.at.least(1)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw err
    }
  })

  afterEach(async () => {
    // Clean up the state of the Input
    input.take()
    await input.waitForInternalResources()
  })

  after(() => {
    connector.close()
  })

  it('Callback should be called when event is emitted', () => {
    var spy = sinon.spy()
    input.on('on_data_available', spy)
    expect(input.listenerCount('on_data_available')).to.deep.equals(1)
    input.emit('on_data_available')
    input.off('on_data_available', spy)
    expect(spy.calledOnce).to.be.true
    expect(input.listenerCount('on_data_available')).to.deep.equals(0)
  })

  it('Event should be emitted when data is received', (done) => {
    var spy = sinon.spy()
    input.on('on_data_available', spy)
    output.write()
    events.once(input, 'on_data_available')
      .then(() => {
        expect(spy.calledOnce).to.be.true
        done()
      })
  })

  it('.once() should automatically unregister event', (done) => {
    var spy = sinon.spy()
    input.once('on_data_available', spy)
    expect(input.listenerCount('on_data_available')).to.deep.equals(1)
    output.write()
    events.once(input, 'on_data_available')
      .then(() => {
        expect(spy.calledOnce).to.be.true
        expect(input.listenerCount('on_data_available')).to.deep.equals(0)
        done()
      })
  })

  it('If no data is received, the event should not be emitted', (done) => {
    var spy = sinon.spy()
    input.on('on_data_available', spy)
    setTimeout(() => {
      expect(spy.notCalled).to.be.true
      done()
    }, 250)
  })

  it('The event should not be emitted when data is received on another input', (done) => {
    const otherInput = connector.getInput('TestSubscriber::TestReader2')
    const otherOutput = connector.getOutput('TestPublisher::TestWriter2')
    var spy = sinon.spy()
    var otherSpy = sinon.spy()

    // Wait for the new input / output to match
    otherInput.waitForPublications(testExpectSuccessTimeout)
      .then((res) => {
        expect(res).to.deep.equals(1)
        return otherOutput.waitForSubscriptions(testExpectSuccessTimeout)
      })
      .then((res) => {
        expect(res).to.deep.equals(1)
        expect(otherInput.matchedPublications.length).to.deep.equals(1)
        expect(otherOutput.matchedSubscriptions.length).to.deep.equals(1)
        // Add the listeners to each input
        input.on('on_data_available', spy)
        otherInput.on('on_data_available', otherSpy)
        // The on_data_available callback is only cleared once data is read (or taken)
        // Since we are explicitly checking the number of times the callback occurs,
        // we have to make sure that we clear the status. Do this by adding another
        // listener which will just take any data.
        input.on('on_data_available', () => { input.take() })
        otherInput.on('on_data_available', () => { otherInput.take() })
        // Writing data on output should only trigger one of these callbacks
        output.write()
        return events.once(input, 'on_data_available')
      })
      .then(() => {
        expect(spy.calledOnce).to.be.true
        expect(otherSpy.notCalled).to.be.true
        // Test the opposite
        otherOutput.write()
        return events.once(otherInput, 'on_data_available')
      })
      .then(() => {
        expect(spy.calledOnce).to.be.true
        expect(otherSpy.calledOnce).to.be.true
        otherInput.removeAllListeners('on_data_available')
        done()
      })
  })

  it('It should not be possible to register the event listener and have a Promise waiting for data simultaneously', (done) => {
    var spy = sinon.spy()
    input.on('on_data_available', spy)
    input.wait(500)
      .then(() => {
        console.log('Error occurred. Expected input.wait() to fail due to waitSetBusy')
        expect(true).to.deep.equals(false)
      })
      .catch((err) => {
        expect(err.message).to.deep.equals('Can not concurrently wait on the same Input')
        done()
      })
  })

  it('Register multiple callbacks for the same event', (done) => {
    var spy1 = sinon.spy()
    var spy2 = sinon.spy()
    input.on('on_data_available', spy1)
    input.on('on_data_available', spy2)
    expect(input.listenerCount('on_data_available')).to.deep.equals(2)
    output.write()
    events.once(input, 'on_data_available')
      .then(() => {
        expect(spy1.calledOnce).to.be.true
        expect(spy2.calledOnce).to.be.true
        done()
      })
  })

  it('Uninstall a callback using .off()', () => {
    var spy = sinon.spy()
    input.on('on_data_available', spy)
    expect(input.listenerCount('on_data_available')).to.deep.equals(1)
    input.off('on_data_available', spy)
    expect(input.listenerCount('on_data_available')).to.deep.equals(0)
  })

  it('Uninstall all callbacks using .removeAllListeners()', () => {
    var spy = sinon.spy()
    input.on('on_data_available', spy)
    expect(input.listenerCount('on_data_available')).to.deep.equals(1)
    input.removeAllListeners('on_data_available')
    expect(input.listenerCount('on_data_available')).to.deep.equals(0)
  })
})

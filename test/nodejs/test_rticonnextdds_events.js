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

  it('Callback should be called when event is emitted', (done) => {
    const spy = sinon.spy()
    connector.on('on_data_available', spy)
    connector.emit('on_data_available')
    expect(spy.calledOnce).to.be.true
    connector.removeListener('on_data_available', spy)
    done()
  })

  it('When no data is written, no event should be emitted', (done) => {
    const spy = sinon.spy()
    connector.on('on_data_available', spy)
    setTimeout(() => {
      expect(spy.notCalled).to.be.true
      done()
    }, 250)
  })

  it('It should not be possible to register the event listener and have a Promise waiting for data simultaneously', (done) => {
    const spy = sinon.spy()
    connector.on('on_data_available', spy)
    // Internally, the connector's waitset is now busy
    connector.wait(500)
      .then(() => {
        // This should not have been possible
        console.log('Error occurred. Expected wait to fail due to waitSetBusy')
        throw (err)
      })
      .catch((err) => {
        expect(err.message).to.deep.equals('Can not concurrently wait on the same Connector object')
        done()
      })
  })

  it('Using .removeAllListeners() should remove all eventListeners', () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    connector.on('on_data_available', spy1)
    connector.on('on_data_available', spy2)
    expect(connector.listenerCount('on_data_available')).to.deep.equals(2)
    connector.removeAllListeners('on_data_available')
    expect(connector.listenerCount('on_data_available')).to.deep.equals(0)
  })

  it('Should be possible to re-use a Connector after calling waitForCallbackFinalization', (done) => {
    const spy = sinon.spy()
    connector.on('on_data_available', spy)
    expect(connector.listenerCount('on_data_available')).to.deep.equals(1)
    connector.emit('on_data_available')
    expect(spy.calledOnce).to.be.true
    connector.removeListener('on_data_available', spy)
    expect(connector.listenerCount('on_data_available')).to.deep.equals(0)
    connector.waitForCallbackFinalization()
      .then(() => {
        connector.on('on_data_available', spy)
        expect(connector.listenerCount('on_data_available')).to.deep.equals(1)
        connector.emit('on_data_available')
        expect(spy.calledTwice).to.be.true
        done()
      })
  })

  // We use the events.once() API to detect when an event has occured. It is not
  // available in all versions of node (added in v11.12), so run these next
  // test conditionally
  if (typeof events.once === 'function') {
    it('Event should be emitted when data is available on an input', (done) => {
      const spy = sinon.spy()
      connector.on('on_data_available', spy)
      output.write()
      events.once(connector, 'on_data_available')
        .then(() => {
          expect(spy.calledOnce).to.be.true
          done()
        })
    })

    it('Connector.once() should automatically unregister the callback after data is received', (done) => {
      const spy = sinon.spy()
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

    it('Should be possible to add multiple callbacks for the same event', (done) => {
      const spy1 = sinon.spy()
      const spy2 = sinon.spy()
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
      const spy = sinon.spy()
      connector.on('on_data_available', spy)
      output.write()
      events.once(connector, 'on_data_available')
        .then(() => {
          expect(spy.calledOnce).to.be.true
          connector.removeListener('on_data_available', spy)
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
      const spy1 = sinon.spy()
      const spy2 = sinon.spy()
      connector.on('on_data_available', spy1)
      connector.on('on_data_available', spy2)
      expect(connector.listenerCount('on_data_available')).to.deep.equals(2)
      output.write()
      events.once(connector, 'on_data_available')
        .then(() => {
          expect(spy1.calledOnce).to.be.true
          expect(spy2.calledOnce).to.be.true
          connector.removeListener('on_data_available', spy1)
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
  }
})

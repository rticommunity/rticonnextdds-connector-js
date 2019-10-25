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

// We have to do this due to the expect() syntax of chai and the fact
// that we install mocha globally
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

// We provide a timeout of 10s to operations that we expect to succeed. This
// is so that if they fail, we know for sure something went wrong
const testExpectSuccessTimeout = 10000

// describe('Connector EventEmitter tests', function () {
//   this.timeout('10s')
//   let connector = null
//   let input = null
//   let output = null

//   before(async () => {
//     // Create the connector object
//     const xmlPath = path.join(__dirname, '/../xml/TestConnector.xml')
//     const profile = 'MyParticipantLibrary::DataAccessTest'
//     connector = new rti.Connector(profile, xmlPath)
//     expect(connector).to.exist.and.be.an.instanceof(rti.Connector)
//     input = connector.getInput('TestSubscriber::TestReader')
//     expect(input).to.exist
//     output = connector.getOutput('TestPublisher::TestWriter')
//     expect(output).to.exist

//     // Wait for the entities to match
//     try {
//       const newMatches = await input.waitForPublications(testExpectSuccessTimeout)
//       expect(newMatches).to.be.at.least(1)
//     } catch (err) {
//       console.log('Caught err: ' + err)
//       // Fail the test
//       expect(true).to.be.false
//     }
//   })

//   afterEach(() => {
//     /*
//     **TODO** https://github.com/node-ffi/node-ffi/issues/413
//     It is not possible to cancel an FFI library call
//     In this case, we are calling connector.on() which repeatedly (every 1s) calls waitfordata
//     If connector.close() is called it can be the case that the waitset is busy etc. causing issues
//     To get around this I modified connector.close() to:
//         close () {
//           // The Call to RTI_Connector_wait_for_data via ffi is asynchronous and can not
//           // be cancelled. This means that when we come to close the connector it may still
//           // be in use. Ensure that it is cleaned up correctly.
//           if (this.waitSetBusy) {
//             setTimeout(() => {
//               this.close()
//             }, 100)
//           } else {
//             connectorBinding.api.RTI_Connector_delete(this.native)
//             this.native = null
//           }
//         }
//     But this has other issues because now when you call connector.close() you don't know when
//     it is actually closed (setTimeout runs in a different thread)
//     How should we handle this?
//     I spoke to Israel and he doesn't see another solution other than spwaning another process
//     and killing it from a parent process... too risky to do at this point?
//     */
    // /*
    // Separate issue seems to be that we cannot actually waitOnConnector at same time as waitOnReader:
    // Wait no, it can't be that since I do that fairly often in these tests...
    // sam@rti-10678:~/working/trees/connector/rticonnextdds-connector-js$ mocha test/nodejs/test_rticonnextdds_events.js


    //   Input EventEmitter tests
    //     ✓ The event should not be emitted when data is received on another input


    //   1 passing (536ms)

    // REDAWorker_enterExclusiveArea:!precondition: "exclusiveArea == ((void *)0)"
    //   Backtrace:
    //   #1	?? ??:0 [0x3A83254]
    //   #2	?? ??:0 [0x35F464B]
    //   #3	?? ??:0 [0x30518F1]
    //   #4	?? ??:0 [0x305199D]
    //   #5	?? ??:0 [0x3B3B3BA]
    //   #6	?? ??:0 [0x3B3E388]
    //   #7	?? ??:0 [0x3B32E22]
    //   #8	?? ??:0 [0x18D99ED0]
    //   #9	?? ??:0 [0x18D98CFC]
    //   #10	worker /home/iojs/build/ws/out/../deps/uv/src/threadpool.c:124 [0xAAA0AE]
    //   #11	?? ??:0 [0x1BD7D6BA]
    //   #12	?? ??:0 [0x1BAB341D]
    // PRESStatusCondition_set_enabled_statuses:!take semaphore
    // RTIDDSConnectorCommon_waitForStatusOnEntity:Failed to set enabled status on statusCondition
    // RTIDDSConnectorReaders_waitForData:Failed to wait for DDS_DATA_AVAILABLE_STATUS:  1
    // Caught error: DDSError: DDS error
    // (node:15858) UnhandledPromiseRejectionWarning: DDSError: DDS error
    //     at connectorBinding.api.RTI_Connector_wait_for_data_on_reader.async (/home/sam/working/trees/connector/rticonnextdds-connector-js/rticonnextdds-connector.js:1076:29)
    //     at /home/sam/working/trees/connector/rticonnextdds-connector-js/node_modules/ffi/lib/_foreign_function.js:115:9
    // (node:15858) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 1)
    // (node:15858) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
    // sam@rti-10678:~/working/trees/connector/rticonnextdds-connector-js$ 
    // */
//     connector.removeAllListeners('on_data_available')
//   })

//   after(() => {
//     connector.close()
//   })

//   /*
//    * Writing these tests is a bit awkward. We cannot do what we do in the other
//    * tests and use async/await syntax. Instead we have to define the test functions
//    * to accept the variable (it is actually a callback) done. Once we have finished
//    * testing we have to call done() so that the test suite knows it can now run afterEach
//    * and the next test.
//    * If you don't do this, when you call await <something> the test will immediately
//    * return a Promise and connector.close() is called. BUT since the .on() runs
//    * asynchronously the waitset is still busy and a segfault will occur.
//    */

  // it('Callback should be called when event is emitted', () => {
  //   var spy = sinon.spy()
  //   connector.on('on_data_available', spy)
  //   connector.emit('on_data_available')
  //   expect(spy.calledOnce).to.be.true
  // })

  // it('Event should be emitted when data is available on an input', (done) => {
  //   var spy = sinon.spy()
  //   connector.on('on_data_available', spy)
  //   output.write()
  //   input.wait(testExpectSuccessTimeout)
  //     .then(() => {
  //       expect(spy.calledOnce).to.be.true
  //       done()
  //     })
  //     .catch((err) => {
  //       console.log('Caught err: ' + err)
  //       console.log('Spy callCount: ' + spy.callCount)
  //       expect(false).to.deep.equals(true)
  //     })
  // })

  // it('Connector.once() should automatically unregister the callback after data is received', (done) => {
  //   var spy = sinon.spy()
  //   connector.once('on_data_available', spy)
  //   output.write()
  //   input.wait(testExpectSuccessTimeout)
  //     .then(() => {
  //       expect(spy.calledOnce).to.be.true
  //       expect(connector.listenerCount('on_data_available')).to.deep.equals(0)
  //       // Writing again
  //       output.write()
  //       return input.wait(testExpectSuccessTimeout)
  //     })
  //     .then(() => {
  //       // Should still only have a single call
  //       expect(spy.calledOnce).to.be.true
  //       done()
  //     })
  //     .catch((err) => {
  //       console.log('Caught err: ' + err)
  //       expect(false).to.deep.equals(true)
  //     })
  // })

  // it('When no data is written, no event should be emitted', (done) => {
  //   var spy = sinon.spy()
  //   connector.on('on_data_available', spy)
  //   setTimeout(() => {
  //     expect(spy.notCalled).to.be.true
  //     done()
  //   }, 500)
  // })

  // it('Should be possible to add multiple callbacks for the same event', (done) => {
  //   var spy1 = sinon.spy()
  //   var spy2 = sinon.spy()
  //   connector.on('on_data_available', spy1)
  //   connector.on('on_data_available', spy2)
  //   output.write()
  //   input.wait(testExpectSuccessTimeout)
  //     .then(() => {
  //       expect(spy1.calledOnce).to.be.true
  //       expect(spy2.calledOnce).to.be.true
  //       done()
  //     })
  //     .catch((err) => {
  //       console.log('Caught err: ' + err)
  //       expect(false).to.deep.equals(true)
  //     })
  // })

  // it('Possible to uninstall the eventListener with .off()', (done) => {
  //   var spy = sinon.spy()
  //   connector.on('on_data_available', spy)
  //   output.write()
  //   input.wait(testExpectSuccessTimeout)
  //     .then(() => {
  //       expect(spy.calledOnce).to.be.true
  //       connector.off('on_data_available', spy)
  //       expect(connector.listenerCount('on_data_available')).to.deep.equals(0)
  //       // Writing again
  //       output.write()
  //       return input.wait()
  //     })
  //     .then(() => {
  //       // Should still only have a single call
  //       expect(spy.calledOnce).to.be.true
  //       done()
  //     })
  //     .catch((err) => {
  //       console.log('Caught err: ' + err)
  //       expect(false).to.deep.equals(true)
  //     })
  // })

  // it('Using .off() should only unregister the supplied callback, if multiple are registered', (done) => {
  //   var spy1 = sinon.spy()
  //   var spy2 = sinon.spy()
  //   connector.on('on_data_available', spy1)
  //   connector.on('on_data_available', spy2)
  //   expect(connector.listenerCount('on_data_available')).to.deep.equals(2)
  //   output.write()
  //   input.wait(testExpectSuccessTimeout)
  //     .then(() => {
  //       expect(spy1.calledOnce).to.be.true
  //       expect(spy2.calledOnce).to.be.true
  //       connector.off('on_data_available', spy1)
  //       expect(connector.listenerCount('on_data_available')).to.deep.equals(1)
  //       // Writing again
  //       output.write()
  //       return input.wait()
  //     })
  //     .then(() => {
  //       expect(spy1.calledOnce).to.be.true
  //       expect(spy2.calledTwice).to.be.true
  //       done()
  //     })
  //     .catch((err) => {
  //       console.log('Caught err: ' + err)
  //       expect(false).to.deep.equals(true)
  //     })
  // })

//   it('Using .removeAllListeners() should remove all eventListeners', () => {
//     var spy1 = sinon.spy()
//     var spy2 = sinon.spy()
//     connector.on('on_data_available', spy1)
//     connector.on('on_data_available', spy2)
//     expect(connector.listenerCount('on_data_available')).to.deep.equals(2)
//     connector.removeAllListeners('on_data_available')
//     expect(connector.listenerCount('on_data_available')).to.deep.equals(0)
//   })

//   it('It should not be possible to register the event listener and have a Promise waiting for data simultaneously', (done) => {
//     var spy = sinon.spy()
//     connector.on('on_data_available', spy)
//     // Internally, the connector's waitset is now busy
//     connector.waitForData(500)
//       .then(() => {
//         // This should not have been possible
//         console.log('Error occurred. Expected waitForData to fail due to waitsetbusy')
//         expect(true).to.deep.equals(false)
//       })
//       .catch((err) => {
//         expect(err.message).to.deep.equals('Can not concurrently wait on the same Connector object')
//         done()
//       })
//   })
// })

describe('Input EventEmitter tests', function () {
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
      // Fail the test
      expect(true).to.be.false
    }
  })

  afterEach(() => {
    // Clean up the state of the Input
    input.removeAllListeners('on_data_available')
    input.take()
  })

  after(() => {
    connector.close()
  })

  // it('Callback should be called when event is emitted', () => {
  //   var spy = sinon.spy()
  //   input.on('on_data_available', spy)
  //   expect(input.listenerCount('on_data_available')).to.deep.equals(1)
  //   input.emit('on_data_available')
  //   input.off('on_data_available', spy)
  //   expect(spy.calledOnce).to.be.true
  //   expect(input.listenerCount('on_data_available')).to.deep.equals(0)
  // })

  // it('Event should be emitted when data is received', (done) => {
  //   var spy = sinon.spy()
  //   input.on('on_data_available', spy)
  //   output.write()
  //   // Have to use connector.waitForData instead of the per-input option due
  //   // to the fact that we cannot concurrently wait on the same input
  //   connector.waitForData(testExpectSuccessTimeout)
  //     .then(() => {
  //       expect(spy.calledOnce).to.be.true
  //       done()
  //     })
  //     .catch((err) => {
  //       console.log('Caught err: ' + err)
  //       console.log('spy callCount: ' + spy.callCount)
  //       expect(true).to.deep.equals(false)
  //     })
  // })

  // it('.once() should automatically unregister event', (done) => {
  //   var spy = sinon.spy()
  //   input.once('on_data_available', spy)
  //   expect(input.listenerCount('on_data_available')).to.deep.equals(1)
  //   output.write()
  //   connector.waitForData(testExpectSuccessTimeout)
  //     .then(() => {
  //       expect(spy.calledOnce).to.be.true
  //       expect(input.listenerCount('on_data_available')).to.deep.equals(0)
  //       done()
  //     })
  //     .catch((err) => {
  //       console.log('Caught err: ' + err)
  //       console.log('Spy callCount: ' + spy.callCount)
  //       expect(true).to.deep.equals(false)
  //     })
  // })

  // it('If no data is received, the event should not be emitted', (done) => {
  //   var spy = sinon.spy()
  //   input.on('on_data_available', spy)
  //   setTimeout(() => {
  //     expect(spy.notCalled).to.be.true
  //     done()
  //   }, 500)
  // })

  // it('The event should not be emitted when data is received on another input', (done) => {
  //   const otherInput = connector.getInput('TestSubscriber::TestReader2')
  //   const otherOutput = connector.getOutput('TestPublisher::TestWriter2')
  //   var spy = sinon.spy()
  //   var otherSpy = sinon.spy()

  //   // Wait for the new input / output to match
  //   otherInput.waitForPublications(testExpectSuccessTimeout)
  //     .then((res) => {
  //       expect(res).to.deep.equals(1)
  //       return otherOutput.waitForSubscriptions(testExpectSuccessTimeout)
  //     })
  //     .then((res) => {
  //       expect(res).to.deep.equals(1)
  //       expect(otherInput.matchedPublications.length).to.deep.equals(1)
  //       expect(otherOutput.matchedSubscriptions.length).to.deep.equals(1)
  //       // Add the listeners to each input
  //       input.on('on_data_available', spy)
  //       otherInput.on('on_data_available', otherSpy)
  //       // Writing data on output should only trigger one of these callbacks
  //       output.write()
  //       return connector.waitForData(testExpectSuccessTimeout)
  //     })
  //     .then(() => {
  //       expect(spy.calledOnce).to.be.true
  //       expect(otherSpy.notCalled).to.be.true
  //       input.take()
  //       // Test the opposite
  //       otherOutput.write()
  //       return connector.waitForData(testExpectSuccessTimeout)
  //     })
  //     .then(() => {
  //       otherInput.take()
  //       expect(otherSpy.calledOnce).to.be.true
  //       expect(spy.calledOnce).to.be.true
  //       otherInput.removeAllListeners('on_data_available')
  //       done()
  //     })
  //     .catch((err) => {
  //       console.log('Caught err: ' + err)
  //       console.log('spy.callCount: ' + spy.callCount)
  //       console.log('otherSpy.callCount: ' + otherSpy.callCount)
  //       expect(false).to.deep.equals(true)
  //     })
  // })

//   it('It should not be possible to register the event listener and have a Promise waiting for data simultaneously', (done) => {

//   })

  it('Register multiple callbacks for the same event', (done) => {
    var spy1 = sinon.spy()
    var spy2 = sinon.spy()
    input.on('on_data_available', spy1)
    input.on('on_data_available', spy2)
    expect(input.listenerCount('on_data_available')).to.deep.equals(2)
    output.write()
    input.wait(testExpectSuccessTimeout)
      .then(() => {
        expect(spy1.calledOnce).to.be.true
        expect(spy2.calledOnce).to.be.true
        done()
      })
      .catch((err) => {
        console.log('Caught err: ' + err)
        expect(false).to.deep.equals(true)
      })
  })

  // it('Uninstall a callback using .off()', () => {
  //   var spy = sinon.spy()
  //   input.on('on_data_available', spy)
  //   expect(input.listenerCount('on_data_available')).to.deep.equals(1)
  //   input.off('on_data_available', spy)
  //   expect(input.listenerCount('on_data_available')).to.deep.equals(0)
  // })

  // it('Uninstall all callbacks using .removeAllListeners()', () => {
  //   var spy = sinon.spy()
  //   input.on('on_data_available', spy)
  //   expect(input.listenerCount('on_data_available')).to.deep.equals(1)
  //   input.removeAllListeners('on_data_available')
  //   expect(input.listenerCount('on_data_available')).to.deep.equals(0)
  // })
})

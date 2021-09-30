/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
const os = require('os')
const ffi = require('ffi-napi')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.config.includeStack = true
chai.use(chaiAsPromised)
const rti = require(path.join(__dirname, '/../../rticonnextdds-connector'))

// We have to do this due to the expect() syntax of chai and the fact
// that we install mocha globally
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

// We provide a timeout of 10s to operations that we expect to succeed. This
// is so that if they fail, we know for sure something went wrong
const testExpectSuccessTimeout = 10000
// We provide a much shorter timeout to operations that we expect to timeout.
// This is to prevent us from hanging the tests for 10s
const testExpectFailureTimeout = 500

describe('Input Tests', function () {
  let connector = null
  // Initialization before all tests are executed
  before(function () {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
  })

  // cleanup after all tests have executed
  after(async function () {
    this.timeout(0)
    await connector.close()
  })

  it('Input object should not get instantiated for invalid DataReader', function () {
    const invalidDR = 'invalidDR'
    expect(function () {
      connector.getInput(invalidDR)
    }).to.throw(Error)
  })

  it('Input object should get instantiated for valid ' +
      'Subscription::DataReader name', function () {
    const validDR = 'MySubscriber::MySquareReader'
    const input = connector.getInput(validDR)
    expect(input).to.exist
    expect(input.name).to.equal(validDR)
    expect(input.connector).to.equal(connector)
  })
})

describe('Subscriber not automatically enabled tests', () => {
  let connector = null

  before(() => {
    const participantProfile = 'MyParticipantLibrary::TestNoAutoenableSubscriber'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
    expect(connector).to.exist.and.to.be.instanceOf(rti.Connector)
  })

  after(async () => {
    await connector.close()
  })

  it('Entities should not auto-discover each other if QoS is set appropriately', async () => {
    const output = connector.getOutput('TestPublisher::TestWriter')
    expect(output).to.exist
    // The input is not automatically enabled in this QoS profile, meaning the
    // output should not match with it
    try {
      await output.waitForSubscriptions(testExpectFailureTimeout)
      console.log('Expected output.waitForSubscriptions to timeout but it did not')
      expect(true).to.deep.equal(false)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }
  })

  it('Calling getInput should enable the input', async () => {
    const output = connector.getOutput('TestPublisher::TestWriter')
    expect(output).to.exist
    connector.getInput('TestSubscriber::TestReader')
    try {
      const newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
  })
})

describe('Native call on a DataReader', () => {
  // We do not run these tests on Windows since the symbols are not exported in the DLL
  if (os.platform() !== 'win32') {
    it('Should be possible to call an API in the Connector library which is not in the binding ', async () => {
      const participantProfile = 'MyParticipantLibrary::Zero'
      const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
      const connector = new rti.Connector(participantProfile, xmlProfile)
      const input = connector.getInput('MySubscriber::MySquareReader')
      const additionalApi = ffi.Library(rti.connectorBinding.library, {
        DDS_DataReader_get_topicdescription: ['pointer', ['pointer']],
        DDS_TopicDescription_get_name: ['string', ['pointer']]
      })
      try {
        const topic = additionalApi.DDS_DataReader_get_topicdescription(input.native)
        expect(topic).not.to.be.null
        const topicName = additionalApi.DDS_TopicDescription_get_name(topic)
        expect(topicName).to.equal('Square')
      } catch (err) {
        console.log('Caught err: ' + err)
        throw (err)
      } finally {
        await connector.close()
      }
    })
  }
})

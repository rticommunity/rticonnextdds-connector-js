/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

var path = require('path')
var os = require('os')
var ffi = require('ffi')
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var expect = chai.expect
chai.config.includeStack = true
chai.use(chaiAsPromised)
var rti = require(path.join(__dirname, '/../../rticonnextdds-connector'))

// We have to do this due to the expect() syntax of chai and the fact
// that we install mocha globally
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

describe('Input Tests', function () {
  let connector = null
  // Initialization before all tests are executed
  before(function () {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
  })

  // cleanup after all tests have executed
  after(function () {
    this.timeout(0)
    connector.delete()
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

  after(() => {
    connector.close()
  })

  it('Entities should not auto-discover each other if QoS is set appropriately', () => {
    const output = connector.getOutput('TestPublisher::TestWriter')
    expect(output).to.exist
    // The input is not automatically enabled in this QoS profile, meaning the
    // output should not match with it
    return expect(output.waitForSubscriptions(200)).to.be.rejectedWith(rti.TimeoutError)
  })

  it('Calling getInput should enable the input', (done) => {
    const output = connector.getOutput('TestPublisher::TestWriter')
    expect(output).to.exist
    connector.getInput('TestSubscriber::TestReader')

    expect(output.waitForSubscriptions(2000)).to.eventually.become(1).notify(done)
  })
})

describe('Native call on a DataReader', () => {
  // We do not run these tests on Windows since the symbols are not exported in the DLL
  if (os.platform() !== 'win32') {
    it('Should be possible to call an API in the Connector library which is not in the binding ', () => {
      const participantProfile = 'MyParticipantLibrary::Zero'
      const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
      const connector = new rti.Connector(participantProfile, xmlProfile)
      const input = connector.getInput('MySubscriber::MySquareReader')
      const additionalApi = ffi.Library(rti.connectorBinding.library, {
        DDS_DataReader_get_topicdescription: ['pointer', ['pointer']],
        DDS_TopicDescription_get_name: ['string', ['pointer']]
      })
      const topic = additionalApi.DDS_DataReader_get_topicdescription(input.native)
      expect(topic).not.to.be.null
      const topicName = additionalApi.DDS_TopicDescription_get_name(topic)
      expect(topicName).to.equal('Square')
    })
  }
})

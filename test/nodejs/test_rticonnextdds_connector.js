/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
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

describe('Connector Tests', function () {
  it('Connector should throw an error for invalid xml path', function () {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const invalidXmlPath = 'invalid/path/to/xml'
    expect(function () {
      new rti.Connector(participantProfile, invalidXmlPath) // eslint-disable-line no-new
    }).to.throw(Error)
  })

  it('Connector should throw an error for invalid participant profile', function () {
    const invalidParticipantProfile = 'InvalidParticipantProfile'
    const xmlPath = path.join(__dirname, '/../xml/TestConnector.xml')
    expect(function () {
      new rti.Connector(invalidParticipantProfile, xmlPath) // eslint-disable-line no-new
    }).to.throw(Error)
  })

  it('Connector should throw an error for invalid xml profile', function () {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const invalidXml = path.join(__dirname, '/../xml/InvalidXml.xml')
    expect(function () {
      new rti.Connector(participantProfile, invalidXml) // eslint-disable-line no-new
    }).to.throw(Error)
  })

  it('Connector should get instantiated for valid' +
         'xml and participant profile', async function () {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    const connector = new rti.Connector(participantProfile, xmlProfile)
    expect(connector).to.exist
    expect(connector).to.be.instanceOf(rti.Connector)
    await connector.close()
  })

  it('Multiple Connector objects can be instantiated', async () => {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    const connectors = []
    for (let i = 0; i < 3; i++) {
      connectors.push(new rti.Connector(participantProfile, xmlProfile))
    }

    connectors.forEach(async (connector) => {
      expect(connector).to.exist
      expect(connector).to.be.instanceOf(rti.Connector)
      await connector.close()
    })
  })

  // Test for CON-163
  it('Multiple Connector obejcts can be instantiated without participant QoS', async () => {
    const participantProfile = 'MyParticipantLibrary::MyParticipant'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector3.xml')
    const connectors = []
    for (let i = 0; i < 2; i++) {
      connectors.push(new rti.Connector(participantProfile, xmlProfile))
    }
    connectors.forEach(async (connector) => {
      expect(connector).to.exist
      expect(connector).to.be.instanceOf(rti.Connector)
      await connector.close()
    })
  })

  it('Load two XML files using the url group syntax', async function () {
    const xmlProfile1 = path.join(__dirname, '/../xml/TestConnector.xml')
    const xmlProfile2 = path.join(__dirname, '/../xml/TestConnector2.xml')
    const fullXmlPath = xmlProfile1 + ';' + xmlProfile2
    const connector = new rti.Connector('MyParticipantLibrary2::MyParticipant2', fullXmlPath)
    expect(connector).to.exist
    expect(connector).to.be.instanceOf(rti.Connector)
    const output = connector.getOutput('MyPublisher2::MySquareWriter2')
    expect(output).to.exist
    await connector.close()
  })

  it('Should be possible to create a Connector with participant qos', async function () {
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    const connector = new rti.Connector(
      'MyParticipantLibrary::ConnectorWithParticipantQos',
      xmlProfile)
    expect(connector).to.exist
    expect(connector).to.be.instanceOf(rti.Connector)
    await connector.close()
  })

  it('is possible to obtain the current version of Connector', function () {
    const version = rti.Connector.getVersion()
    expect(version).to.be.a.string

    // The returned version string should contain four pieces of information:
    // - the API version of Connector
    // - the build ID of core.1.0
    // - the build ID of dds_c.1.0
    // - the build ID of lua_binding.1.0
    // Each build ID has either 3 or 4 version digits.
    // Expect "RTI Connector for JavaScript, version X.X.X"
    let regex = /RTI Connector for JavaScript, version ([0-9][.]){2}[0-9]/
    expect(regex.test(version)).deep.equals(true)
    // Expect "NDDSCORE_BUILD_<VERSION>_<DATE>T<TIMESTAMP>Z"
    regex = /.*NDDSCORE_BUILD_([0-9][.]){2,3}[0-9]_[0-9]{8}T[0-9]{6}Z/
    expect(regex.test(version)).deep.equals(true)
    // Expect "NDDSC_BUILD_<VERSION>_<DATE>T<TIMESTAMP>Z"
    regex = /.*NDDSC_BUILD_([0-9][.]){2,3}[0-9]_[0-9]{8}T[0-9]{6}Z/
    expect(regex.test(version)).deep.equals(true)
    // Expect "RTICONNECTOR_BUILD_<VERSION>_<DATE>T<TIMESTAMP>Z"
    regex = /.*RTICONNECTOR_BUILD_([0-9][.]){2,3}[0-9]_[0-9]{8}T[0-9]{6}Z/
    expect(regex.test(version)).deep.equals(true)
  })

  // Test for CON-200
  it('Connector should not segfault if deleted twice', async function () {
    const xmlProfile1 = path.join(__dirname, '/../xml/TestConnector.xml')
    const xmlProfile2 = path.join(__dirname, '/../xml/TestConnector2.xml')
    const fullXmlPath = xmlProfile1 + ';' + xmlProfile2
    const connector = new rti.Connector('MyParticipantLibrary2::MyParticipant2', fullXmlPath)
    expect(connector).to.exist
    expect(connector).to.be.instanceOf(rti.Connector)
    await connector.close()
  })

  describe('Connector callback test', function () {
    let connector

    // Initialization before all tests are executed
    before(() => {
      const participantProfile = 'MyParticipantLibrary::Zero'
      const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
      connector = new rti.Connector(participantProfile, xmlProfile)
    })

    // Cleanup after all tests have executed
    after(async () => {
      await connector.delete()
    })

    it('on_data_available callback gets called when data is available', function (done) {
    // spies are used for testing callbacks
      const spy = sinon.spy()
      setTimeout(() => {
        expect(spy.calledOnce).to.be.true
        done() // Pattern for async testing: next test won't execute until done gets called.
      }, 1000) // Expectation Test will execute after 1000 milisec
      connector.once('on_data_available', spy)
      output = connector.getOutput('MyPublisher::MySquareWriter')
      testMsg = '{"x":1,"y":1,"z":true,"color":"BLUE","shapesize":5}'
      output.instance.setFromJson(JSON.parse(testMsg))
      output.write()
    })

    it('on_data_available emits the error event on error', function (done) {
      const errorSpy = sinon.spy()
      // We expect the "error" event to be emitted within the next second
      setTimeout(() => {
        expect(errorSpy.calledOnce).to.be.true
        connector.removeAllListeners('on_data_available')
        done()
      }, 1000)
      connector.once('error', errorSpy)
      // Need to cause the onDataAvailable callback to throw an error, we do
      // this by concurrently waiting on the same connector object
      connector.wait(500)
      connector.once('on_data_available', () => {})
    })

    it('internal waitset is waited on repeatedly within on_data_available', function (done) {
      const spy = sinon.spy()
      // We expect the data to be received within the next second
      setTimeout(() => {
        expect(spy.calledOnce).to.be.true
        done()
      }, 1500)
      // Set the listener
      connector.once('on_data_available', spy)
      // Internally, on_data_available calls connector.wait every 500ms.
      // Test that if no data is received within the first 500ms, we call wait
      // multiple times
      output = connector.getOutput('MyPublisher::MySquareWriter')
      testMsg = '{"x":1,"y":1,"z":true,"color":"BLUE","shapesize":5}'
      output.instance.setFromJson(JSON.parse(testMsg))
      // In 500ms, write the data
      setTimeout(() => {
        output.write()
      }, 1000)
    })
  })
})

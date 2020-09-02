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
         'xml and participant profile', function () {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    const connector = new rti.Connector(participantProfile, xmlProfile)
    expect(connector).to.exist
    expect(connector).to.be.instanceOf(rti.Connector)
    connector.close()
  })

  it('Multiple Connector objects can be instantiated', () => {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    const connectors = []
    for (var i = 0; i < 3; i++) {
      connectors.push(new rti.Connector(participantProfile, xmlProfile))
    }
    connectors.forEach((connector) => {
      expect(connector).to.exist
      expect(connector).to.be.instanceOf(rti.Connector)
      connector.close()
    })
  })

  // Test for CON-163
  it('Multiple Connector obejcts can be instantiated without participant QoS', () => {
    const participantProfile = 'MyParticipantLibrary::MyParticipant'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector3.xml')
    const connectors = []
    for (var i = 0; i < 2; i++) {
        connectors.push(new rti.Connector(participantProfile, xmlProfile))
    }
    connectors.forEach((connector)  => {
      expect(connector).to.exist
      expect(connector).to.be.instanceOf(rti.Connector)
      connector.close()
    })
  })

  it('Load two XML files using the url group syntax', function () {
      const xmlProfile1 = path.join(__dirname, '/../xml/TestConnector.xml')
      const xmlProfile2 = path.join(__dirname, '/../xml/TestConnector2.xml')
      const fullXmlPath = xmlProfile1 + ';' + xmlProfile2
      const connector = new rti.Connector('MyParticipantLibrary2::MyParticipant2', fullXmlPath)
      expect(connector).to.exist
      expect(connector).to.be.instanceOf(rti.Connector)
      const output = connector.getOutput('MyPublisher2::MySquareWriter2')
      expect(output).to.exist
      connector.close()
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
  })
})

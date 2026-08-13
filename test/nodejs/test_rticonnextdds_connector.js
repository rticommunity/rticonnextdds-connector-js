/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
const assert = require('node:assert/strict')
const { setTimeout: sleep } = require('node:timers/promises')
const { describe, it, before, after, mock } = require('node:test')
const rti = require('../../rticonnextdds-connector')

describe('Connector Tests', () => {
  it('Connector should throw an error for invalid xml path', () => {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const invalidXmlPath = 'invalid/path/to/xml'
    assert.throws(() => {
      new rti.Connector(participantProfile, invalidXmlPath) // eslint-disable-line no-new
    }, Error)
  })

  it('Connector should throw an error for invalid participant profile', () => {
    const invalidParticipantProfile = 'InvalidParticipantProfile'
    const xmlPath = path.resolve(__dirname, '../xml/TestConnector.xml')
    assert.throws(() => {
      new rti.Connector(invalidParticipantProfile, xmlPath) // eslint-disable-line no-new
    }, Error)
  })

  it('Connector should throw an error for invalid xml profile', () => {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const invalidXml = path.resolve(__dirname, '../xml/InvalidXml.xml')
    assert.throws(() => {
      new rti.Connector(participantProfile, invalidXml) // eslint-disable-line no-new
    }, Error)
  })

  it('Connector should get instantiated for valid xml and participant profile', async () => {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.resolve(__dirname, '../xml/TestConnector.xml')
    const connector = new rti.Connector(participantProfile, xmlProfile)
    assert.ok(connector instanceof rti.Connector)
    await connector.close()
  })

  it('Multiple Connector objects can be instantiated', async () => {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.resolve(__dirname, '../xml/TestConnector.xml')
    const connectors = []
    for (let i = 0; i < 3; i++) {
      connectors.push(new rti.Connector(participantProfile, xmlProfile))
    }

    for (const connector of connectors) {
      assert.ok(connector instanceof rti.Connector)
      await connector.close()
    }
  })

  // Test for CON-163
  it('Multiple Connector obejcts can be instantiated without participant QoS', async () => {
    const participantProfile = 'MyParticipantLibrary::MyParticipant'
    const xmlProfile = path.resolve(__dirname, '../xml/TestConnector3.xml')
    const connectors = []
    for (let i = 0; i < 2; i++) {
      connectors.push(new rti.Connector(participantProfile, xmlProfile))
    }
    for (const connector of connectors) {
      assert.ok(connector instanceof rti.Connector)
      await connector.close()
    }
  })

  it('Load two XML files using the url group syntax', async () => {
    const xmlProfile1 = path.resolve(__dirname, '../xml/TestConnector.xml')
    const xmlProfile2 = path.resolve(__dirname, '../xml/TestConnector2.xml')
    const fullXmlPath = xmlProfile1 + ';' + xmlProfile2
    const connector = new rti.Connector('MyParticipantLibrary2::MyParticipant2', fullXmlPath)
    assert.ok(connector instanceof rti.Connector)
    const output = connector.getOutput('MyPublisher2::MySquareWriter2')
    assert.ok(output)
    await connector.close()
  })

  it('Should be possible to create a Connector with participant qos', async () => {
    const xmlProfile = path.resolve(__dirname, '../xml/TestConnector.xml')
    const connector = new rti.Connector(
      'MyParticipantLibrary::ConnectorWithParticipantQos',
      xmlProfile)
    assert.ok(connector instanceof rti.Connector)
    await connector.close()
  })

  it('is possible to obtain the current version of Connector', () => {
    const version = rti.Connector.getVersion()
    assert.strictEqual(typeof version, 'string')

    // The returned version string should contain four pieces of information:
    // - the API version of Connector
    // - the build ID of core.1.0
    // - the build ID of dds_c.1.0
    // - the build ID of lua_binding.1.0
    // Each build ID has either 3 or 4 version digits.
    // Expect "RTI Connector for JavaScript, version X.X.X"
    let regex = /RTI Connector for JavaScript, version ([0-9][.]){2}[0-9]/
    assert.ok(regex.test(version))
    // Expect "NDDSCORE_BUILD_<VERSION>_<DATE>T<TIMESTAMP>Z"
    regex = /.*NDDSCORE_BUILD_([0-9][.]){2,3}[0-9]_[0-9]{8}T[0-9]{6}Z/
    assert.ok(regex.test(version))
    // Expect "NDDSC_BUILD_<VERSION>_<DATE>T<TIMESTAMP>Z"
    regex = /.*NDDSC_BUILD_([0-9][.]){2,3}[0-9]_[0-9]{8}T[0-9]{6}Z/
    assert.ok(regex.test(version))
    // Expect "RTICONNECTOR_BUILD_<VERSION>_<DATE>T<TIMESTAMP>Z"
    regex = /.*RTICONNECTOR_BUILD_([0-9][.]){2,3}[0-9]_[0-9]{8}T[0-9]{6}Z/
    assert.ok(regex.test(version))
  })

  // Test for CON-200
  it('Connector should not segfault if deleted twice', async () => {
    const xmlProfile1 = path.resolve(__dirname, '../xml/TestConnector.xml')
    const xmlProfile2 = path.resolve(__dirname, '../xml/TestConnector2.xml')
    const fullXmlPath = xmlProfile1 + ';' + xmlProfile2
    const connector = new rti.Connector('MyParticipantLibrary2::MyParticipant2', fullXmlPath)
    assert.ok(connector instanceof rti.Connector)
    await connector.close()
  })

  describe('Connector callback test', () => {
    /** @type {rti.Connector} */
    let connector

    // Initialization before all tests are executed
    before(() => {
      const participantProfile = 'MyParticipantLibrary::Zero'
      const xmlProfile = path.resolve(__dirname, '../xml/TestConnector.xml')
      connector = new rti.Connector(participantProfile, xmlProfile)
    })

    // Cleanup after all tests have executed
    after(async () => {
      await connector.delete()
    })

    it('on_data_available callback gets called when data is available', async () => {
      // spies are used for testing callbacks
      const spy = mock.fn()
      connector.once('on_data_available', spy)
      const output = connector.getOutput('MyPublisher::MySquareWriter')
      const testMsg = '{"x":1,"y":1,"z":true,"color":"BLUE","shapesize":5}'
      output.instance.setFromJson(JSON.parse(testMsg))
      output.write()
      await sleep(1000)
      assert.strictEqual(spy.mock.callCount(), 1)
    })

    it('on_data_available emits the error event on error', async () => {
      const errorSpy = mock.fn()
      // We expect the "error" event to be emitted within the next second
      connector.once('error', errorSpy)
      // Need to cause the onDataAvailable callback to throw an error, we do
      // this by concurrently waiting on the same connector object
      connector.wait(500)
      connector.once('on_data_available', () => { })
      // We expect the "error" event to be emitted within the next second
      await sleep(1000)
      assert.strictEqual(errorSpy.mock.callCount(), 1)
      connector.removeAllListeners('on_data_available')
    })

    it('internal waitset is waited on repeatedly within on_data_available', async () => {
      // We expect the data to be received within the next second
      const spy = mock.fn()
      // Set the listener
      connector.once('on_data_available', spy)
      // Internally, on_data_available calls connector.wait every 500ms.
      // Test that if no data is received within the first 500ms, we call wait
      // multiple times
      const output = connector.getOutput('MyPublisher::MySquareWriter')
      const testMsg = '{"x":1,"y":1,"z":true,"color":"BLUE","shapesize":5}'
      output.instance.setFromJson(JSON.parse(testMsg))
      // Write the data after 1000ms, then expect it received within 1500ms total
      sleep(1000).then(() => output.write())
      await sleep(1500)
      assert.strictEqual(spy.mock.callCount(), 1)
    })
  })
})

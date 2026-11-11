/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
const os = require('os')
const assert = require('node:assert/strict')
const { describe, it, before, after } = require('node:test')
const rti = require('../../rticonnextdds-connector')

// We provide a timeout of 10s to operations that we expect to succeed. This
// is so that if they fail, we know for sure something went wrong
const testExpectSuccessTimeout = 10000
// We provide a much shorter timeout to operations that we expect to timeout.
// This is to prevent us from hanging the tests for 10s
const testExpectFailureTimeout = 500

describe('Input Tests', () => {
  /** @type {rti.Connector} */
  let connector
  // Initialization before all tests are executed
  before(() => {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.resolve(__dirname, '../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
  })

  // cleanup after all tests have executed
  after(async () => {
    await connector.close()
  })

  it('Input object should not get instantiated for invalid DataReader', () => {
    const invalidDR = 'invalidDR'
    assert.throws(() => {
      connector.getInput(invalidDR)
    }, Error)
  })

  it('Input object should get instantiated for valid ' +
      'Subscription::DataReader name', () => {
    const validDR = 'MySubscriber::MySquareReader'
    const input = connector.getInput(validDR)
    assert.ok(input)
    assert.strictEqual(input.name, validDR)
    assert.strictEqual(input.connector, connector)
  })
})

describe('Subscriber not automatically enabled tests', () => {
  /** @type {rti.Connector} */
  let connector

  before(() => {
    const participantProfile = 'MyParticipantLibrary::TestNoAutoenableSubscriber'
    const xmlProfile = path.resolve(__dirname, '../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
    assert.ok(connector instanceof rti.Connector)
  })

  after(async () => {
    await connector.close()
  })

  it('Entities should not auto-discover each other if QoS is set appropriately', async () => {
    const output = connector.getOutput('TestPublisher::TestWriter')
    assert.ok(output)
    await assert.rejects(
      output.waitForSubscriptions(testExpectFailureTimeout),
      rti.TimeoutError
    )
  })

  it('Calling getInput should enable the input', async () => {
    const output = connector.getOutput('TestPublisher::TestWriter')
    assert.ok(output)
    connector.getInput('TestSubscriber::TestReader')
    const newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
    assert.strictEqual(newMatches, 1)
  })
})

describe('Native call on a DataReader', () => {
  // We do not run these tests on Windows since the symbols are not exported in the DLL
  if (os.platform() !== 'win32') {
    it('Should be possible to call an API in the Connector library which is not in the binding ', async () => {
      const participantProfile = 'MyParticipantLibrary::Zero'
      const xmlProfile = path.resolve(__dirname, '../xml/TestConnector.xml')
      const connector = new rti.Connector(participantProfile, xmlProfile)
      const input = connector.getInput('MySubscriber::MySquareReader')
      const DDS_DataReader_get_topicdescription = rti.connectorBinding.api.func('DDS_DataReader_get_topicdescription', 'RTI_HANDLE', ['RTI_HANDLE'])
      const DDS_TopicDescription_get_name = rti.connectorBinding.api.func('DDS_TopicDescription_get_name', 'string', ['RTI_HANDLE'])
      try {
        const topic = DDS_DataReader_get_topicdescription(input.native)
        assert.notStrictEqual(topic, null)
        const topicName = DDS_TopicDescription_get_name(topic)
        assert.strictEqual(topicName, 'Square')
      } finally {
        await connector.close()
      }
    })
  }
})

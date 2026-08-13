/******************************************************************************
* (c) 2019 Copyright, Real-Time Innovations.  All rights reserved.            *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
const assert = require('node:assert/strict')
const { describe, it, afterEach } = require('node:test')
const rti = require('../../rticonnextdds-connector')

// Create the connector at this level so it can be automatically closed after
// each test
/** @type {rti.Connector} */
let discoveryConnector
/** @type {rti.Connector} */
let discoveryConnectorNoEntityNames
/** @type {rti.Connector} */
let readerOnlyConnector
/** @type {rti.Connector} */
let writerOnlyConnector
// We provide a timeout of 10s to operations that we expect to succeed. This
// is so that if they fail, we know for sure something went wrong
const testExpectSuccessTimeout = 10000
// We provide a much shorter timeout to operations that we expect to timeout.
// This is to prevent us from hanging the tests for 10s
const testExpectFailureTimeout = 500

const getDiscoveryConnector = () => {
  if (!discoveryConnector) {
    const xmlPath = path.resolve(__dirname, '../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::DiscoveryTest'
    discoveryConnector = new rti.Connector(profile, xmlPath)
  }
  assert.ok(discoveryConnector instanceof rti.Connector)
  return discoveryConnector
}

const getDiscoveryConnectorNoEntityNames = () => {
  if (!discoveryConnectorNoEntityNames) {
    const xmlPath = path.resolve(__dirname, '../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::DiscoveryTestNoEntityName'
    discoveryConnectorNoEntityNames = new rti.Connector(profile, xmlPath)
  }
  assert.ok(discoveryConnectorNoEntityNames instanceof rti.Connector)
  return discoveryConnectorNoEntityNames
}
const getReaderOnlyConnector = () => {
  if (!readerOnlyConnector) {
    const xmlPath = path.resolve(__dirname, '../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::DiscoveryTestReaderOnly'
    readerOnlyConnector = new rti.Connector(profile, xmlPath)
  }
  assert.ok(readerOnlyConnector instanceof rti.Connector)
  return readerOnlyConnector
}

const getWriterOnlyConnector = () => {
  if (!writerOnlyConnector) {
    const xmlPath = path.resolve(__dirname, '../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::DiscoveryTestWriterOnly'
    writerOnlyConnector = new rti.Connector(profile, xmlPath)
  }
  assert.ok(writerOnlyConnector instanceof rti.Connector)
  return writerOnlyConnector
}

const getDiscoveryReaderOnlyInput = () => {
  const connector = getReaderOnlyConnector()
  const input = connector.getInput('TestSubscriber::TestReader')
  assert.ok(input)
  return input
}

const getDiscoveryWriterOnlyOutput = () => {
  const connector = getWriterOnlyConnector()
  const output = connector.getOutput('TestPublisher::TestWriter')
  assert.ok(output)
  return output
}

const cleanupConnectors = async () => {
  if (discoveryConnector) {
    await discoveryConnector.close()
    discoveryConnector = null
  }
  if (discoveryConnectorNoEntityNames) {
    await discoveryConnectorNoEntityNames.close()
    discoveryConnectorNoEntityNames = null
  }
  if (readerOnlyConnector) {
    await readerOnlyConnector.close()
    readerOnlyConnector = null
  }
  if (writerOnlyConnector) {
    await writerOnlyConnector.close()
    writerOnlyConnector = null
  }
}

describe('Discovery tests', () => {

  afterEach(() => {
    cleanupConnectors()
  })

  it('Create a Connector object with an input and no output', async () => {
    const input = getDiscoveryReaderOnlyInput()
    const matches = input.matchedPublications
    assert.strictEqual(matches.length, 0)
    await assert.rejects(
      input.waitForPublications(testExpectFailureTimeout),
      rti.TimeoutError
    )
  })

  it('Create a Connector object with an output and no input', async () => {
    const output = getDiscoveryWriterOnlyOutput()
    const matches = output.matchedSubscriptions
    assert.strictEqual(matches.length, 0)
    await assert.rejects(
      output.waitForSubscriptions(testExpectFailureTimeout),
      rti.TimeoutError
    )
  })

  it('Check matching between a single input and output', async () => {
    const connector = getDiscoveryConnector()
    const input = connector.getInput('MySubscriber::MyReader')
    const output = connector.getOutput('MyPublisher::MyWriter')

    let changesInMatches = await input.waitForPublications(testExpectSuccessTimeout)
    assert.strictEqual(changesInMatches, 1)
    changesInMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
    assert.strictEqual(changesInMatches, 1)

    let matches = input.matchedPublications
    assert.strictEqual(matches.length, 1)
    assert.deepStrictEqual(matches[0], { name: 'MyWriter' })
    matches = output.matchedSubscriptions
    assert.strictEqual(matches.length, 1)
    assert.deepStrictEqual(matches[0], { name: 'MyReader' })
  })

  it('Check matching with multiple inputs', async () => {
    const connector = getDiscoveryConnector()
    const output = connector.getOutput('MyPublisher::MyWriter')
    getDiscoveryReaderOnlyInput()
    connector.getInput('MySubscriber::MyReader')

    let totalMatches = 0
    while (totalMatches < 2) {
      totalMatches += await output.waitForSubscriptions(testExpectSuccessTimeout)
    }
    assert.ok(totalMatches >= 2)

    await assert.rejects(
      output.waitForSubscriptions(testExpectFailureTimeout),
      rti.TimeoutError
    )

    const matches = output.matchedSubscriptions
    assert.ok(matches.some(m => m.name === 'MyReader'))
    assert.ok(matches.some(m => m.name === 'TestReader'))
  })

  it('Check matching with multiple outputs', async () => {
    const connector = getDiscoveryConnector()
    const input = connector.getInput('MySubscriber::MyReader')
    connector.getOutput('MyPublisher::MyWriter')
    getDiscoveryWriterOnlyOutput()

    let totalMatches = 0
    while (totalMatches < 2) {
      totalMatches += await input.waitForPublications(testExpectSuccessTimeout)
    }
    assert.ok(totalMatches >= 2)

    await assert.rejects(
      input.waitForPublications(testExpectFailureTimeout),
      rti.TimeoutError
    )

    const matches = input.matchedPublications
    assert.ok(matches.some(m => m.name === 'MyWriter'))
    assert.ok(matches.some(m => m.name === 'TestWriter'))
  })

  it('Checking unmatching from an input', async () => {
    const output = getDiscoveryWriterOnlyOutput()
    await assert.rejects(
      output.waitForSubscriptions(testExpectFailureTimeout),
      rti.TimeoutError
    )
    assert.strictEqual(output.matchedSubscriptions.length, 0)

    const input = getDiscoveryReaderOnlyInput()

    let changesInMatches = 0
    let matches = []
    changesInMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
    assert.strictEqual(changesInMatches, 1)
    matches = output.matchedSubscriptions
    assert.strictEqual(matches.length, 1)
    assert.deepStrictEqual(matches[0], { name: 'TestReader' })
    changesInMatches = await input.waitForPublications(testExpectSuccessTimeout)
    assert.strictEqual(changesInMatches, 1)
    matches = input.matchedPublications
    assert.strictEqual(matches.length, 1)
    assert.deepStrictEqual(matches[0], { name: 'TestWriter' })

    await readerOnlyConnector.close()
    readerOnlyConnector = null

    changesInMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
    assert.strictEqual(changesInMatches, -1)
    assert.strictEqual(output.matchedSubscriptions.length, 0)
  })

  it('Checking unmatching from an output', async () => {
    const input = getDiscoveryReaderOnlyInput()
    await assert.rejects(
      input.waitForPublications(testExpectFailureTimeout),
      rti.TimeoutError
    )
    assert.strictEqual(input.matchedPublications.length, 0)

    const output = getDiscoveryWriterOnlyOutput()

    let changesInMatches = 0
    let matches = []
    changesInMatches = await input.waitForPublications(testExpectSuccessTimeout)
    assert.strictEqual(changesInMatches, 1)
    matches = input.matchedPublications
    assert.strictEqual(matches.length, 1)
    assert.deepStrictEqual(matches[0], { name: 'TestWriter' })
    changesInMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
    assert.strictEqual(changesInMatches, 1)
    matches = output.matchedSubscriptions
    assert.strictEqual(matches.length, 1)
    assert.deepStrictEqual(matches[0], { name: 'TestReader' })

    await writerOnlyConnector.close()
    writerOnlyConnector = null

    changesInMatches = await input.waitForPublications(testExpectSuccessTimeout)
    assert.strictEqual(changesInMatches, -1)
    assert.strictEqual(input.matchedPublications.length, 0)
  })

  it('Matching entities with empty entity names', async () => {
    const connector = getDiscoveryConnectorNoEntityNames()
    const output = connector.getOutput('MyPublisher::MyWriter')

    const newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
    assert.strictEqual(newMatches, 1)

    const matches = output.matchedSubscriptions
    assert.strictEqual(matches.length, 1)
    assert.deepStrictEqual(matches[0], { name: '' })
  })

  it('Matching entities with no entity names', async () => {
    const output = getDiscoveryWriterOnlyOutput()
    const retcode = rti.connectorBinding.RTI_Connector_create_test_scenario(
      output.connector.native,
      0, // RTI_Connector_testScenario_createReader
      output.native)
    assert.strictEqual(retcode, 0)

    const newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
    assert.strictEqual(newMatches, 1)
    const matches = output.matchedSubscriptions
    assert.strictEqual(matches.length, 1)
    assert.deepStrictEqual(matches[0], { name: null })
  })

  it('waitForPublications timeout defaults to infinity', async () => {
    const input = getDiscoveryReaderOnlyInput()
    setTimeout(() => {
      getDiscoveryWriterOnlyOutput()
    }, 600)
    await input.waitForPublications()
  })

  it('waitForSubscriptions timeout defaults to infinity', async () => {
    const output = getDiscoveryWriterOnlyOutput()
    setTimeout(() => {
      getDiscoveryReaderOnlyInput()
    }, 600)
    await output.waitForSubscriptions()
  })

  it('waitForPublications timeout must be a valid number', async () => {
    const input = getDiscoveryReaderOnlyInput()
    await assert.rejects(input.waitForPublications('NAN'), TypeError)
  })

  it('waitForSubscriptions timeout must be a valid number', async () => {
    const output = getDiscoveryWriterOnlyOutput()
    await assert.rejects(output.waitForSubscriptions('NAN'), TypeError)
  })
})

/******************************************************************************
* (c) 2019 Copyright, Real-Time Innovations.  All rights reserved.            *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
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

// Create the connector at this level so it can be automatically closed after
// each test
let discoveryConnector = null
let discoveryConnectorNoEntityNames = null
let readerOnlyConnector = null
let writerOnlyConnector = null
// We provide a timeout of 10s to operations that we expect to succeed. This
// is so that if they fail, we know for sure something went wrong
const testExpectSuccessTimeout = 10000
// We provide a much shorter timeout to operations that we expect to timeout.
// This is to prevent us from hanging the tests for 10s
const testExpectFailureTimeout = 500

const getDiscoveryConnector = () => {
  if (discoveryConnector === null) {
    const xmlPath = path.join(__dirname, '/../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::DiscoveryTest'
    discoveryConnector = new rti.Connector(profile, xmlPath)
  }
  expect(discoveryConnector).to.exist.and.be.and.instanceOf(rti.Connector)
  return discoveryConnector
}

const getDiscoveryConnectorNoEntityNames = () => {
  if (discoveryConnectorNoEntityNames === null) {
    const xmlPath = path.join(__dirname, '/../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::DiscoveryTestNoEntityName'
    discoveryConnectorNoEntityNames = new rti.Connector(profile, xmlPath)
  }
  expect(discoveryConnectorNoEntityNames).to.exist.and.be.and.instanceOf(rti.Connector)
  return discoveryConnectorNoEntityNames
}
const getReaderOnlyConnector = () => {
  if (readerOnlyConnector === null) {
    const xmlPath = path.join(__dirname, '/../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::DiscoveryTestReaderOnly'
    readerOnlyConnector = new rti.Connector(profile, xmlPath)
  }
  expect(readerOnlyConnector).to.exist.and.be.and.instanceOf(rti.Connector)
  return readerOnlyConnector
}

const getWriterOnlyConnector = () => {
  if (writerOnlyConnector === null) {
    const xmlPath = path.join(__dirname, '/../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::DiscoveryTestWriterOnly'
    writerOnlyConnector = new rti.Connector(profile, xmlPath)
  }
  expect(writerOnlyConnector).to.exist.and.be.and.instanceOf(rti.Connector)
  return writerOnlyConnector
}

const getDiscoveryReaderOnlyInput = () => {
  const connector = getReaderOnlyConnector()
  const input = connector.getInput('TestSubscriber::TestReader')
  expect(input).to.exist
  return input
}

const getDiscoveryWriterOnlyOutput = () => {
  const connector = getWriterOnlyConnector()
  const output = connector.getOutput('TestPublisher::TestWriter')
  expect(output).to.exist
  return output
}

const cleanupConnectors = async () => {
  if (discoveryConnector !== null) {
    await discoveryConnector.close()
    discoveryConnector = null
  }
  if (discoveryConnectorNoEntityNames !== null) {
    await discoveryConnectorNoEntityNames.close()
    discoveryConnectorNoEntityNames = null
  }
  if (readerOnlyConnector !== null) {
    await readerOnlyConnector.close()
    readerOnlyConnector = null
  }
  if (writerOnlyConnector !== null) {
    await writerOnlyConnector.close()
    writerOnlyConnector = null
  }
}

describe('Discovery tests', function () {
  // By default, mocha will kill all tests if they take longer than 2s. Some of
  // the tests in this block can take up to 1.5s so to be safe we increase this
  // timeout. Note, this means we cannot use fat arrow functions here (since 'this'
  // is not binded in fat arrows).
  this.timeout('30s')

  afterEach(() => {
    cleanupConnectors()
  })

  it('Create a Connector object with an input and no output', async function () {
    const input = getDiscoveryReaderOnlyInput()
    // At this point we should not have matched anything
    const matches = input.matchedPublications
    expect(matches.length).to.deep.equals(0)
    // We should timeout if we attempt to wait for a match
    try {
      const newMatches = await input.waitForPublications(testExpectFailureTimeout)
      console.log('Expected waitForPublications to timeout, but we matched ' + newMatches + ' publications')
      // Should not get here - fail the test
      expect(false).to.deep.equals(true)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }
  })

  it('Create a Connector object with an output and no input', async function () {
    const output = getDiscoveryWriterOnlyOutput()
    // At this point we should not have matched anything
    const matches = output.matchedSubscriptions
    expect(matches.length).to.deep.equals(0)
    // We should timeout if we attempt to wait for a match
    try {
      const newMatches = await output.waitForSubscriptions(testExpectFailureTimeout)
      console.log('Expected waitForSubscriptions to timeout, but we matched ' + newMatches + ' subscriptions')
      // Should not get here - fail the test
      expect(false).to.deep.equals(true)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }
  })

  it('Check matching between a single input and output', async function () {
    const connector = getDiscoveryConnector()
    const input = connector.getInput('MySubscriber::MyReader')
    const output = connector.getOutput('MyPublisher::MyWriter')

    // Both the input and output should match each other and nothing else
    try {
      let changesInMatches = await input.waitForPublications(testExpectSuccessTimeout)
      expect(changesInMatches).to.deep.equals(1)
      changesInMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      expect(changesInMatches).to.deep.equals(1)
    } catch (err) {
      console.log('Caught error: ' + err)
      // Fail the test
      expect(false).to.deep.equals(true)
    }

    let matches = input.matchedPublications
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: 'MyWriter' }])
    matches = output.matchedSubscriptions
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: 'MyReader' }])
  })

  it('Check matching with multiple inputs', async () => {
    const connector = getDiscoveryConnector()
    const output = connector.getOutput('MyPublisher::MyWriter')
    // Create / enable two inputs
    getDiscoveryReaderOnlyInput()
    connector.getInput('MySubscriber::MyReader')

    let totalMatches = 0
    // The output should match 2 inputs in total (but this may not happen
    // straight away
    while (totalMatches < 2) {
      try {
        totalMatches += await output.waitForSubscriptions(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Caught error: ' + err)
        // Fail the test
        throw (err)
      }
    }
    expect(totalMatches).to.be.at.least(2)

    // Another call to waitForSubscriptions should timeout
    try {
      const newMatches = await output.waitForSubscriptions(testExpectFailureTimeout)
      console.log('Expected waitForSubscriptions to timeout, but we matched ' + newMatches + ' subscriptions')
      // Should not get here - fail the test
      expect(false).to.deep.equals(true)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }

    const matches = output.matchedSubscriptions
    expect(matches).to.deep.include.members([{ name: 'MyReader' }, { name: 'TestReader' }])
  })

  it('Check matching with multiple outputs', async () => {
    const connector = getDiscoveryConnector()
    const input = connector.getInput('MySubscriber::MyReader')
    // Create / enable two outputs
    connector.getOutput('MyPublisher::MyWriter')
    getDiscoveryWriterOnlyOutput()

    let totalMatches = 0
    // The input should match 2 outputs in total (but this may not happen
    // straight away
    while (totalMatches < 2) {
      try {
        totalMatches += await input.waitForPublications(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Caught error: ' + err)
        // Fail the test
        throw (err)
      }
    }
    expect(totalMatches).to.be.at.least(2)

    // Another call to waitForPublications should timeout
    try {
      const newMatches = await input.waitForPublications(testExpectFailureTimeout)
      console.log('Expected waitForPublications to timeout, but we matched ' + newMatches + ' publications')
      // Should not get here - fail the test
      expect(false).to.deep.equals(true)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }

    const matches = input.matchedPublications
    expect(matches).to.deep.include.members([{ name: 'MyWriter' }, { name: 'TestWriter' }])
  })

  it('Checking unmatching from an input', async function () {
    const output = getDiscoveryWriterOnlyOutput()
    // To begin with there is no matching
    try {
      const newMatches = await output.waitForSubscriptions(testExpectFailureTimeout)
      console.log('Expected waitForSubscriptions to timeout, but we matched ' + newMatches + ' subscriptions')
      // Should not get here - fail the test
      expect(false).to.deep.equals(true)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }
    expect(output.matchedSubscriptions.length).to.deep.equals(0)

    // Create the matching input
    const input = getDiscoveryReaderOnlyInput()

    // Check that both the input and output match each other
    let changesInMatches = 0
    let matches = []
    try {
      changesInMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught error: ' + err)
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    expect(changesInMatches).to.deep.equals(1)
    matches = output.matchedSubscriptions
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: 'TestReader' }])
    try {
      changesInMatches = await input.waitForPublications(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught error: ' + err)
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    expect(changesInMatches).to.deep.equals(1)
    matches = input.matchedPublications
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: 'TestWriter' }])

    // Delete the Connector object that the input is within
    await readerOnlyConnector.close()
    readerOnlyConnector = null

    // The output should unmatch from the input
    try {
      changesInMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught error: ' + err)
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    expect(changesInMatches).to.deep.equals(-1)
    expect(output.matchedSubscriptions.length).to.deep.equals(0)
  })

  it('Checking unmatching from an output', async function () {
    const input = getDiscoveryReaderOnlyInput()
    // To begin with there is no matching
    try {
      const newMatches = await input.waitForPublications(testExpectFailureTimeout)
      console.log('Expected waitForPublications to timeout, but we matched ' + newMatches + ' publications')
      // Should not get here - fail the test
      expect(false).to.deep.equals(true)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }
    expect(input.matchedPublications.length).to.deep.equals(0)

    // Create the matching output
    const output = getDiscoveryWriterOnlyOutput()

    // Check that both the input and output match each other
    let changesInMatches = 0
    let matches = []
    try {
      changesInMatches = await input.waitForPublications(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught error: ' + err)
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    expect(changesInMatches).to.deep.equals(1)
    matches = input.matchedPublications
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: 'TestWriter' }])
    try {
      changesInMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught error: ' + err)
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    expect(changesInMatches).to.deep.equals(1)
    matches = output.matchedSubscriptions
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: 'TestReader' }])

    // Delete the Connector object that the output is within
    await writerOnlyConnector.close()
    writerOnlyConnector = null

    // The input should unmatch from the output
    try {
      changesInMatches = await input.waitForPublications(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught error: ' + err)
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    expect(changesInMatches).to.deep.equals(-1)
    expect(input.matchedPublications.length).to.deep.equals(0)
  })

  it('Matching entities with empty entity names', async function () {
    const connector = getDiscoveryConnectorNoEntityNames()
    const output = connector.getOutput('MyPublisher::MyWriter')

    // Ensure that the entities match
    try {
      const newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      console.log('Caught error: ' + err)
      // Fail the test
      throw (err)
    }

    // Get the entity names of the matched subs
    const matches = output.matchedSubscriptions
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: '' }])
  })

  it('Matching entities with no entity names', async function () {
    const output = getDiscoveryWriterOnlyOutput()
    // Create a matching remote reader which has no entity name (this isn't possible
    // with XML application creation)
    const retcode = rti.connectorBinding.api.RTI_Connector_create_test_scenario(
      output.connector.native,
      0, // RTI_Connector_testScenario_createReader
      output.native)
    expect(retcode).to.deep.equals(0)

    // Wait to match with the new reader
    try {
      const newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      console.log('Caught error: ' + err)
      // Fail the test
      throw (err)
    }
    const matches = output.matchedSubscriptions
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: null }])

    //  It is not necessary to delete the entities created by the call to createTestScenario
    //  since they were all created from the same DomainParticipant as output,
    //  which will have delete_contained_entities called on it.
  })

  it('waitForPublications timeout defaults to infinity', async function () {
    const input = getDiscoveryReaderOnlyInput()
    // Create the writer in 600ms
    setTimeout(() => {
      getDiscoveryWriterOnlyOutput()
    }, 600)
    await input.waitForPublications()
  })

  it('waitForSubscriptions timeout defaults to infinity', async function () {
    const output = getDiscoveryWriterOnlyOutput()
    // Create the reader in 600ms
    setTimeout(() => {
      getDiscoveryReaderOnlyInput()
    }, 600)
    await output.waitForSubscriptions()
  })

  it('waitForPublications timeout must be a valid number', function () {
    const input = getDiscoveryReaderOnlyInput()
    return expect(input.waitForPublications('NAN')).to.be.rejectedWith(TypeError)
  })

  it('waitForSubscriptions timeout must be a valid number', function () {
    const output = getDiscoveryWriterOnlyOutput()
    return expect(output.waitForSubscriptions('NAN')).to.be.rejectedWith(TypeError)
  })
})

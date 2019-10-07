/******************************************************************************
* (c) 2019 Copyright, Real-Time Innovations.  All rights reserved.            *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

var path = require('path')
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

// Create the connector at this level so it can be automatically closed after
// each test
var discoveryConnector = null
var discoveryConnectorNoEntityNames = null
var readerOnlyConnector = null
var writerOnlyConnector = null

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

const cleanupConnectors = () => {
  if (discoveryConnector !== null) {
    discoveryConnector.close()
    discoveryConnector = null
  }
  if (discoveryConnectorNoEntityNames !== null) {
    discoveryConnectorNoEntityNames.close()
    discoveryConnectorNoEntityNames = null
  }
  if (readerOnlyConnector !== null) {
    readerOnlyConnector.close()
    readerOnlyConnector = null
  }
  if (writerOnlyConnector !== null) {
    writerOnlyConnector.close()
    writerOnlyConnector = null
  }
}

describe('Discovery tests', () => {
  afterEach(() => {
    cleanupConnectors()
  })

  it('Create a Connector object with an input and no ouput', async () => {
    const input = getDiscoveryReaderOnlyInput()
    // At this point we should not have matched anything
    const matches = input.matchedPublications
    expect(matches.length).to.deep.equals(0)
    // We should timeout if we attempt to wait for a match
    try {
      await input.waitForPublications(500)
      // Should not get here - fail the test
      expect(false).to.deep.equals(true)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }
  })

  it('Create a Connector object with an output and no input', async () => {
    const output = getDiscoveryWriterOnlyOutput()
    // At this point we should not have matched anything
    const matches = output.matchedSubscriptions
    expect(matches.length).to.deep.equals(0)
    // We should timeout if we attempt to wait for a match
    try {
      await output.waitForSubscriptions(500)
      // Should not get here - fail the test
      expect(false).to.deep.equals(true)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }
  })

  it('Check matching between a single input and output', async () => {
    const connector = getDiscoveryConnector()
    const input = connector.getInput('MySubscriber::MyReader')
    const output = connector.getOutput('MyPublisher::MyWriter')

    // Both the input and output should match each other and nothing else
    try {
      let changesInMatches = await input.waitForPublications(2000)
      expect(changesInMatches).to.deep.equals(1)
      changesInMatches = await output.waitForSubscriptions(2000)
      expect(changesInMatches).to.deep.equals(1)
    } catch (err) {
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
        totalMatches += await output.waitForSubscriptions(2000)
      } catch (err) {
        // Fail the test
        expect(true).to.deep.equals(false)
      }
    }
    expect(totalMatches).to.be.at.least(2)
  
    // Another call to waitForSubscriptions should timeout
    try {
      await output.waitForSubscriptions(300)
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
        totalMatches += await input.waitForPublications(2000)
      } catch (err) {
        // Fail the test
        expect(true).to.deep.equals(false)
      }
    }
    expect(totalMatches).to.be.at.least(2)

    // Another call to waitForPublications should timeout
    try {
      await input.waitForPublications(300)
      // Should not get here - fail the test
      expect(false).to.deep.equals(true)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }

    const matches = input.matchedPublications
    expect(matches).to.deep.include.members([{ name: 'MyWriter' }, { name: 'TestWriter' }])
  })

  it('Checking unmatching from an input', async () => {
    const output = getDiscoveryWriterOnlyOutput()
    // To begin with there is no matching
    try {
      await output.waitForSubscriptions(300)
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
      changesInMatches = await output.waitForSubscriptions(1000)
    } catch (err) {
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    expect(changesInMatches).to.deep.equals(1)
    matches = output.matchedSubscriptions
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: 'TestReader' }])
    try {
      changesInMatches = await input.waitForPublications(1000)
    } catch (err) {
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    expect(changesInMatches).to.deep.equals(1)
    matches = input.matchedPublications
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: 'TestWriter' }])

    // Delete the Connector object that the input is within
    readerOnlyConnector.close()
    readerOnlyConnector = null

    // The output should unmatch from the input
    try {
      changesInMatches = await output.waitForSubscriptions(1000)
    } catch (err) {
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    expect(changesInMatches).to.deep.equals(-1)
    expect(output.matchedSubscriptions.length).to.deep.equals(0)
  })

  it('Checking unmatching from an output', async () => {
    const input = getDiscoveryReaderOnlyInput()
    // To begin with there is no matching
    try {
      await input.waitForPublications(300)
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
      changesInMatches = await input.waitForPublications(1000)
    } catch (err) {
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    expect(changesInMatches).to.deep.equals(1)
    matches = input.matchedPublications
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: 'TestWriter' }])
    try {
      changesInMatches = await output.waitForSubscriptions(1000)
    } catch (err) {
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    expect(changesInMatches).to.deep.equals(1)
    matches = output.matchedSubscriptions
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: 'TestReader' }])

    // Delete the Connector object that the output is within
    writerOnlyConnector.close()
    writerOnlyConnector = null

    // The input should unmatch from the output
    try {
      changesInMatches = await input.waitForPublications(1000)
    } catch (err) {
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    expect(changesInMatches).to.deep.equals(-1)
    expect(input.matchedPublications.length).to.deep.equals(0)
  })

  it('Matching entities with empty entity names', async () => {
    const connector = getDiscoveryConnectorNoEntityNames()
    const output = connector.getOutput('MyPublisher::MyWriter')

    // Ensure that the entities match
    try {
      const newMatches = await output.waitForSubscriptions(2000)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      // Fail the test
      expect(true).to.deep.equals(false)
    }

    // Get the entity names of the matched subs
    const matches = output.matchedSubscriptions
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: '' }])
  })

  it('Matching entities with no entity names', async () => {
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
      const newMatches = await output.waitForSubscriptions(2000)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      // Fail the test
      expect(true).to.deep.equals(false)
    }
    const matches = output.matchedSubscriptions
    expect(matches.length).to.deep.equals(1)
    expect(matches).to.deep.include.members([{ name: null }])

    //  It is not necessary to delete the entities created by the call to createTestScenario
    //  since they were all created from the same DomainParticipant as output,
    //  which will have delete_contained_entities called on it.
  })
})

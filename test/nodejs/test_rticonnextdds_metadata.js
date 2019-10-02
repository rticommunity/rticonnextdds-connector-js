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

describe('Tests with a testOutput and testInput', () => {
  let connector = null
  let testOutput = null
  let testInput = null

  before(() => {
    const participantProfile = 'MyParticipantLibrary::DataAccessTest'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
    expect(connector).to.exist.and.be.an.instanceof(rti.Connector)
    testInput = connector.getInput('TestSubscriber::TestReader2')
    expect(testInput).to.exist
    testOutput = connector.getOutput('TestPublisher::TestWriter2')
    expect(testOutput).to.exist

    // Wait for the input and output to dicovery each other
    expect(testOutput.waitForSubscriptions(2000)).to.eventually.become(1)
  })

  afterEach(() => {
    // Take all samples here to ensure that next test case has a clean input
    testInput.take()
    connector.close()
  })

  it('test write with params metadata', async () => {
    const actionStr = 'write'
    const sourceTimestamp = 0
    const identWriterGuid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    const identSeqNumber = 1
    const rIdentWriterGuid = [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]
    const rIdentSeqNumber = 2
    
    testOutput.write(
      {
        action: actionStr,
        source_timestamp: sourceTimestamp,
        identity: {
          writer_guid: identWriterGuid,
          sequence_number: identSeqNumber
        },
        related_sample_identity:
        {
          writer_guid: rIdentWriterGuid,
          sequence_number: rIdentSeqNumber
        }
      })
    try {
      await testInput.wait(2000)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const sample = testInput.samples.get(0)

    expect(sample.info.getValue('source_timestamp')).to.deep.equals(sourceTimestamp)
    expect(sample.info.getValue('identity').writer_guid).to.deep.equals(identWriterGuid)
    expect(sample.info.getValue('identity').sequence_number).to.deep.equals(identSeqNumber)
    expect(sample.info.getValue('related_sample_identity').writer_guid).to.deep.equals(rIdentWriterGuid)
    expect(sample.info.getValue('related_sample_identity').sequence_number).to.deep.equals(rIdentSeqNumber)
  })
})

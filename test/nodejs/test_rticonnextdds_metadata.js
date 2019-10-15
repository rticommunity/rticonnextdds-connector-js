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

// We provide a timeout of 10s to operations that we expect to succeed. This
// is so that if they fail, we know for sure something went wrong
const testExpectSuccessTimeout = 10000

describe('Test operations involving meta data', () => {
  let connector = null
  let testOutput = null
  let testInput = null
  const testJsonObject = { my_string: 'hello_world' }

  beforeEach(async () => {
    const participantProfile = 'MyParticipantLibrary::DataAccessTest'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
    expect(connector).to.exist.and.be.an.instanceof(rti.Connector)
    testInput = connector.getInput('TestSubscriber::TestReader2')
    expect(testInput).to.exist
    testOutput = connector.getOutput('TestPublisher::TestWriter2')
    expect(testOutput).to.exist

    // Wait for the input and output to dicovery each other
    try {
      const newMatches = await testOutput.waitForSubscriptions(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      console.log('Caught err: ' + err)
      expect(true).to.deep.equals(false)
    }
  })

  afterEach(() => {
    // Take all samples here to ensure that next test case has a clean input
    testInput.take()
    connector.close()
  })

  it('test write with source_timestamp', async () => {
    testOutput.instance.setFromJson(testJsonObject)
    const sourceTimestamp = 0

    testOutput.write({ source_timestamp: sourceTimestamp })
    try {
      await testInput.wait(2000)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()

    for (const sample of testInput.samples.dataIterator) {
      expect(sample.info.get('source_timestamp')).to.deep.equals(sourceTimestamp)
      expect(sample.get('my_string')).to.deep.equals(testJsonObject.my_string)
    }
  })

  it('test write with identity', async () => {
    testOutput.instance.setFromJson(testJsonObject)
    const identWriterGuid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    const identSeqNumber = 1

    testOutput.write(
      {
        identity: {
          writer_guid: identWriterGuid,
          sequence_number: identSeqNumber
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

    for (const sample of testInput.samples.dataIterator) {
      expect(sample.info.get('identity').writer_guid).to.deep.equals(identWriterGuid)
      expect(sample.info.get('identity').sequence_number).to.deep.equals(identSeqNumber)
      expect(sample.get('my_string')).to.deep.equals(testJsonObject.my_string)
    }
  })

  it('test write with related_sample_identity', async () => {
    testOutput.instance.setFromJson(testJsonObject)
    const rIdentWriterGuid = [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]
    const rIdentSeqNumber = 2

    testOutput.write(
      {
        related_sample_identity: {
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

    for (const sample of testInput.samples.validDataIter) {
      expect(sample.info.get('related_sample_identity').writer_guid).to.deep.equals(rIdentWriterGuid)
      expect(sample.info.get('related_sample_identity').sequence_number).to.deep.equals(rIdentSeqNumber)
      expect(sample.get('my_string')).to.deep.equals(testJsonObject.my_string)
    }
  })

  it('test write with unsupported params', async () => {
    testOutput.instance.setFromJson(testJsonObject)

    expect(() => {
      testOutput.write({ unsupported_param: 5 })
    }).to.throw(rti.DDSError)
  })

  it('test write with invalid action', async () => {
    testOutput.instance.setFromJson(testJsonObject)

    expect(() => {
      testOutput.write({ action: 'this_should_be_write_unregister_dispose' })
    }).to.throw(rti.DDSError)
  })

  it('test write with invalid source_timestamp', async () => {
    testOutput.instance.setFromJson(testJsonObject)

    expect(() => {
      testOutput.write({ source_timestamp: 'this_should_be_positive_integer' })
    }).to.throw(rti.DDSError)
  })

  it('test write with invalid guid', async () => {
    testOutput.instance.setFromJson(testJsonObject)
    const identSeqNumber = 1

    expect(() => {
      testOutput.write(
        {
          identity: {
            writer_guid: 'this_should_be_an_array_of_integers',
            sequence_number: identSeqNumber
          }
        })
    }).to.throw(rti.DDSError)
  })

  it('test write with invalid sequence_number', async () => {
    testOutput.instance.setFromJson(testJsonObject)
    const identWriterGuid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

    expect(() => {
      testOutput.write(
        {
          identity: {
            writer_guid: identWriterGuid,
            sequence_number: 'this_should_be_an_integer'
          }
        })
    }).to.throw(rti.DDSError)
  })

  it('test metadata from write without params', async () => {
    testOutput.instance.setFromJson(testJsonObject)

    testOutput.write()
    try {
      await testInput.wait(2000)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()

    for (const sample of testInput.samples.validDataIter) {
      expect(sample.info.get('source_timestamp')).is.a('number')
      expect(sample.info.get('identity').writer_guid).is.an('array')
      expect(sample.info.get('identity').sequence_number).is.a('number')
      expect(sample.info.get('related_sample_identity').writer_guid).is.an('array')
      expect(sample.info.get('related_sample_identity').sequence_number).is.a('number')
      expect(sample.get('my_string')).to.deep.equals(testJsonObject.my_string)
    }
  })
})
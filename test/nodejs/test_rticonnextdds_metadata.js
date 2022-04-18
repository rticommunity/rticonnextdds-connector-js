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
      throw (err)
    }
  })

  afterEach(async () => {
    // Take all samples here to ensure that next test case has a clean input
    testInput.take()
    await connector.close()
  })

  it('test write with source_timestamp', async () => {
    testOutput.instance.setFromJson(testJsonObject)
    const sourceTimestamp = 0

    testOutput.write({ source_timestamp: sourceTimestamp })
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()

    for (const sample of testInput.samples) {
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
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()

    for (const sample of testInput.samples) {
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
      await testInput.wait(testExpectSuccessTimeout)
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
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()

    for (const sample of testInput.samples.validDataIter) {
      // Source timestamp will either be returned as a string or as a number,
      // depending on whether or not it is larger than 2^53.
      expect(sample.info.get('source_timestamp')).satisfies((val) => {
        return (typeof val === 'string' || typeof val === 'number')
      })
      expect(sample.info.get('identity').writer_guid).is.an('array')
      expect(sample.info.get('identity').sequence_number).is.a('number')
      expect(sample.info.get('related_sample_identity').writer_guid).is.an('array')
      expect(sample.info.get('related_sample_identity').sequence_number).is.a('number')
      expect(sample.get('my_string')).to.deep.equals(testJsonObject.my_string)
    }
  })

  it('test getting sample_state', async () => {
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }

    // Since this is the first time that we are accessing the sample, it should
    // have a sample state of NOT_READ
    testInput.read()
    expect(testInput.samples.get(0).info.get('sample_state')).to.deep.equals('NOT_READ')
    // Now that we have already accessed the sample once time, accessing it
    // again should result in a sample state of READ
    testInput.read()
    expect(testInput.samples.get(0).info.get('sample_state')).to.deep.equals('READ')
    // Taking after a read should also have a sample state of READ
    testInput.take()
    expect(testInput.samples.get(0).info.get('sample_state')).to.deep.equals('READ')
  })

  it('test getting instance state', async () => {
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    // Instance is currently alive
    expect(testInput.samples.get(0).info.get('instance_state')).to.deep.equals('ALIVE')
    // Disposing the sample should update the instance state
    testOutput.write({ action: 'dispose' })
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    expect(testInput.samples.get(0).info.get('instance_state')).to.deep.equals('NOT_ALIVE_DISPOSED')
    // Writing the sample again should transition it back to alive
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    // Instance is currently alive
    expect(testInput.samples.get(0).info.get('instance_state')).to.deep.equals('ALIVE')
    // Unregister the instance to get NO_WRITERS
    testOutput.write({ action: 'unregister' })
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    expect(testInput.samples.get(0).info.get('instance_state')).to.deep.equals('NOT_ALIVE_NO_WRITERS')
  })

  it('test getting sample view state', async () => {
    // View state is per-instance
    testOutput.instance.setString('my_key_string', 'Brown')
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    expect(testInput.samples.get(0).info.get('view_state')).to.deep.equals('NEW')
    // Updating that instance should update the view state
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    expect(testInput.samples.get(0).info.get('view_state')).to.deep.equals('NOT_NEW')
    // Writing a new instance should have a NEW view state
    testOutput.instance.setString('my_key_string', 'Maroon')
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    expect(testInput.samples.get(0).info.get('view_state')).to.deep.equals('NEW')
  })
})

describe('accessing key values after instance disposal', () => {
  let connector = null
  // Do not create inputs or outputs here since each of the tests
  // requires a different type

  beforeEach(() => {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
    expect(connector).to.exist.and.be.an.instanceof(rti.Connector)
  })

  afterEach(async () => {
    await connector.close()
  })

  // Uses the following type:
  // struct ShapeType {
  //     @key string<128> color;
  //     long x;
  //     long y;
  //     bool z;
  //     long shapesize;
  // };
  it('access key value of disposed instance', async () => {
    const input = connector.getInput('MySubscriber::MySquareReader')
    expect(input).to.exist
    const output = connector.getOutput('MyPublisher::MySquareWriter')
    expect(input).to.exist
    // Wait for discovery between the 2 entities
    try {
      let newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
      newMatches = await input.waitForPublications(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
    // Set some of the fields within the shape type (including the key)
    output.instance.setString('color', 'Yellow')
    output.instance.setNumber('x', 2)
    output.instance.setNumber('y', 5)
    output.instance.setBoolean('z', true)
    // Write the sample
    output.write()
    try {
      await input.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw (err)
    }
    input.take()
    // Now dispose the instance we just wrote
    output.write({ action: 'dispose' })
    try {
      await input.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw (err)
    }
    input.take()
    const sample = input.samples.get(0)
    // Sample should contain invalid data, and instance state disposed
    expect(sample.info.get('valid_data')).to.deep.equals(false)
    expect(sample.info.get('instance_state')).to.deep.equals('NOT_ALIVE_DISPOSED')
    // It should be possible to access the key field
    expect(sample.get('color')).to.deep.equals('Yellow')
    expect(sample.getString('color')).to.deep.equals('Yellow')
    // All non key fields should not be accessed.
    // Can also obtain the JSON representation of the sample.
    const expectedJson = {
      color: 'Yellow',
      x: 0,
      y: 0,
      z: false,
      shapesize: 0
    }
    expect(sample.getJson()).to.deep.equals(expectedJson)
  })

  // Uses the following type:
  // struct MultipleKeyedShapeType {
  //     @key string<128> color;
  //     @key string<128> other_color;
  //     long x;
  //     @key long y;
  //     @key bool z;
  //     long shapesize;
  // };
  it('access key values of disposed instance with multiple keys', async () => {
    const input = connector.getInput('MySubscriber::MyMultipleKeyedSquareReader')
    expect(input).to.exist
    const output = connector.getOutput('MyPublisher::MyMultipleKeyedSquareWriter')
    expect(input).to.exist
    // Wait for discovery between the 2 entities
    try {
      let newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
      newMatches = await input.waitForPublications(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
    // This type has multiple key fields, set them all
    output.instance.setString('color', 'Brown')
    output.instance.setString('other_color', 'Blue')
    output.instance.setNumber('y', 9)
    output.instance.setBoolean('z', false)
    // Also set some of the non-key fields
    output.instance.setNumber('x', 12)
    output.instance.setNumber('shapesize', 0)
    // Write the sample and take it on the input
    output.write()
    try {
      await input.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw (err)
    }
    input.take()
    // Now dispose the instance we just wrote
    output.write({ action: 'dispose' })
    try {
      await input.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw (err)
    }
    input.take()
    const sample = input.samples.get(0)
    // Check key fields
    expect(sample.get('color')).to.deep.equals('Brown')
    expect(sample.get('other_color')).to.deep.equals('Blue')
    expect(sample.get('y')).to.deep.equals(9)
    expect(sample.get('z')).to.deep.equals(false)
    expect(sample.getString('color')).to.deep.equals('Brown')
    expect(sample.getString('other_color')).to.deep.equals('Blue')
    expect(sample.getNumber('y')).to.deep.equals(9)
    expect(sample.getBoolean('z')).to.deep.equals(false)
    // Do not access non-key values
    // Check access via JSON object
    const expectedJson = {
      color: 'Brown',
      other_color: 'Blue',
      y: 9,
      x: 0,
      z: false,
      shapesize: 0
    }
    expect(sample.getJson()).to.deep.equals(expectedJson)
  })

  // Uses the following type:
  // struct ShapeType {
  //     @key string<128> color;
  //     long x;
  //     long y;
  //     bool z;
  //     long shapesize;
  // };
  //
  // struct UnkeyedShapeType {
  //     string<128> color;
  //     long x;
  //     long y;
  //     bool z;
  //     long shapesize;
  // };
  //
  // struct NestedKeyedShapeType {
  //     @key UnkeyedShapeType keyed_shape;
  //     UnkeyedShapeType unkeyed_shape;
  //     @key ShapeType keyed_nested_member;
  //     @default(12) long unkeyed_toplevel_member;
  //     @key long keyed_toplevel_member;
  // };
  it('access the complex key of a disposed instance', async () => {
    const input = connector.getInput('MySubscriber::MyNestedKeyedSquareReader')
    expect(input).to.exist
    const output = connector.getOutput('MyPublisher::MyNestedKeyedSquareWriter')
    expect(input).to.exist
    // Wait for discovery between the 2 entities
    try {
      let newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
      newMatches = await input.waitForPublications(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
    // Set the sample's fields
    output.instance.setString('keyed_shape.color', 'Black')
    output.instance.setNumber('keyed_shape.x', 2)
    output.instance.setNumber('keyed_shape.y', 0)
    output.instance.setNumber('keyed_shape.shapesize', 100)
    output.instance.setBoolean('keyed_shape.z', true)
    output.instance.setNumber('unkeyed_toplevel_member', 1)
    output.instance.setNumber('keyed_toplevel_member', 1)
    output.instance.setNumber('unkeyed_shape.shapesize', 100)
    output.instance.setString('keyed_nested_member.color', 'White')
    output.instance.setNumber('keyed_nested_member.x', 4)
    // Write the sample and take it on the input
    output.write()
    try {
      await input.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw (err)
    }
    input.take()
    // Now dispose the instance we just wrote
    output.write({ action: 'dispose' })
    try {
      await input.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw (err)
    }
    input.take()
    const sample = input.samples.get(0)
    expect(sample.info.get('valid_data')).to.deep.equals(false)
    expect(sample.info.get('instance_state')).to.deep.equals('NOT_ALIVE_DISPOSED')
    // Everything within keyed_shape is a key
    expect(sample.getNumber('keyed_shape.x')).to.deep.equals(2)
    expect(sample.getNumber('keyed_shape.y')).to.deep.equals(0)
    expect(sample.getNumber('keyed_shape.shapesize')).to.deep.equals(100)
    expect(sample.getBoolean('keyed_shape.z')).to.deep.equals(true)
    expect(sample.get('keyed_shape.x')).to.deep.equals(2)
    expect(sample.get('keyed_shape.y')).to.deep.equals(0)
    expect(sample.get('keyed_shape.shapesize')).to.deep.equals(100)
    expect(sample.get('keyed_shape.z')).to.deep.equals(true)
    expect(sample.get('keyed_shape.color')).to.deep.equals('Black')
    expect(sample.getString('keyed_shape.color')).to.deep.equals('Black')
    // keyed_toplevel_member is also a key
    expect(sample.getNumber('keyed_toplevel_member')).to.deep.equals(1)
    expect(sample.get('keyed_toplevel_member')).to.deep.equals(1)
    // Only the 'color' field in keyed_nested_member is keyed
    expect(sample.get('keyed_nested_member.color')).to.deep.equals('White')
    expect(sample.get('keyed_nested_member.x')).to.deep.equals(0)
    // Do not access any of the non-key values
    // The unkeyed_toplevel_member field has a default value explicitly set
    // in the type. This should not effect the returned value.
    expect(sample.get('unkeyed_toplevel_member')).to.deep.equals(0)
    expect(sample.getNumber('unkeyed_toplevel_member')).to.deep.equals(0)
    let expectedJson = {
      keyed_shape: {
        color: 'Black',
        x: 2,
        y: 0,
        shapesize: 100,
        z: true
      },
      // unkeyed_shape not keyed -> default values
      unkeyed_shape: {
        color: '',
        x: 0,
        y: 0,
        shapesize: 0,
        z: false
      },
      keyed_nested_member: {
        color: 'White',
        // All other members default value
        x: 0,
        y: 0,
        shapesize: 0,
        z: false
      },
      // unkeyed_toplevel_member is unkeyed -> default value
      unkeyed_toplevel_member: 0,
      keyed_toplevel_member: 1
    }
    expect(sample.getJson()).to.deep.equals(expectedJson)
    // Can also obtain the keyed members as a JSON since they are complex
    expectedJson = {
      color: 'Black',
      x: 2,
      y: 0,
      shapesize: 100,
      z: true
    }
    expect(sample.getJson('keyed_shape')).to.deep.equals(expectedJson)
    expectedJson = {
      color: 'White',
      x: 0,
      y: 0,
      shapesize: 0,
      z: false
    }
    expect(sample.getJson('keyed_nested_member')).to.deep.equals(expectedJson)
  })

  it('access the key fields using an iterator', async () => {
    const input = connector.getInput('MySubscriber::MySquareReader')
    expect(input).to.exist
    const output = connector.getOutput('MyPublisher::MySquareWriter')
    expect(input).to.exist
    // Wait for discovery between the 2 entities
    try {
      let newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
      newMatches = await input.waitForPublications(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
    // Set some of the fields within the shape type (including the key)
    output.instance.setString('color', 'Yellow')
    output.instance.setNumber('x', 2)
    // Write the sample
    output.write()
    try {
      await input.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw (err)
    }
    input.take()
    // Now dispose the instance we just wrote
    output.write({ action: 'dispose' })
    try {
      await input.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw (err)
    }
    input.take()
    // There should be no samples accessible within the validDataIter
    let hadData = false
    // eslint-disable-next-line no-unused-vars
    for (const sample of input.samples.validDataIter) {
      hadData = true
    }
    expect(hadData).to.deep.equals(false)
    // Should be possible to access key fields in the dataIter
    for (const sample of input.samples) {
      expect(sample.info.get('valid_data')).to.deep.equals(false)
      expect(sample.info.get('instance_state')).to.deep.equals('NOT_ALIVE_DISPOSED')
      expect(sample.getString('color')).to.deep.equals('Yellow')
      expect(sample.get('color')).to.deep.equals('Yellow')
      const expectedJson = {
        color: 'Yellow',
        x: 0,
        y: 0,
        shapesize: 0,
        z: false
      }
      expect(sample.getJson()).to.deep.equals(expectedJson)
    }
  })

  // struct ShapeType {
  //     @key string<128> color;
  //     long x;
  //     long y;
  //     bool z;
  //     long shapesize;
  // };
  // struct ShapeTypeWithoutToplevelKeyType {
  //     @key ShapeType keyed_shape;
  //     ShapeType unkeyed_shape;
  // };
  it('keys within nested structures are not keys unless tagged as keys in top level', async () => {
    const input = connector.getInput('MySubscriber::MySquareWithoutTopLevelKeyReader')
    expect(input).to.exist
    const output = connector.getOutput('MyPublisher::MySquareWithoutTopLevelKeyWriter')
    expect(input).to.exist
    // Wait for discovery between the 2 entities
    try {
      let newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
      newMatches = await input.waitForPublications(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
    // Set some of the fields within the shape type (including the key)
    output.instance.setString('unkeyed_shape.color', 'Yellow')
    output.instance.setNumber('unkeyed_shape.x', 2)
    output.instance.setString('keyed_shape.color', 'Yellow')
    output.instance.setNumber('keyed_shape.x', 2)
    // Write the sample
    output.write()
    try {
      await input.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw (err)
    }
    input.take()
    // Now dispose the instance we just wrote
    output.write({ action: 'dispose' })
    try {
      await input.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw (err)
    }
    input.take()
    // The 'color' field we set is not actually a key. Fields need to be tagged
    // in the top-level type in order to be part of the key. This means that
    // nothing in this type should be non-default.
    const sample = input.samples.get(0)
    const expectedJson = {
      keyed_shape: {
        color: 'Yellow',
        x: 0,
        y: 0,
        shapesize: 0,
        z: false
      },
      unkeyed_shape: {
        color: '',
        x: 0,
        y: 0,
        shapesize: 0,
        z: false
      }
    }
    expect(sample.getJson()).to.deep.equals(expectedJson)
  })
})

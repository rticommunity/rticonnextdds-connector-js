/******************************************************************************
* (c) 2019 Copyright, Real-Time Innovations.  All rights reserved.            *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
const assert = require('node:assert/strict')
const { describe, it, beforeEach, afterEach } = require('node:test')
const rti = require('../../rticonnextdds-connector')

// We provide a timeout of 10s to operations that we expect to succeed. This
// is so that if they fail, we know for sure something went wrong
const testExpectSuccessTimeout = 10000

describe('Test operations involving meta data', () => {
  /** @type {rti.Connector} */
  let connector
  /** @type {rti.Output} */
  let testOutput
  /** @type {rti.Input} */
  let testInput
  const testJsonObject = { my_string: 'hello_world' }

  beforeEach(async () => {
    const participantProfile = 'MyParticipantLibrary::DataAccessTest'
    const xmlProfile = path.resolve(__dirname, '../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
    assert.ok(connector instanceof rti.Connector)
    testInput = connector.getInput('TestSubscriber::TestReader2')
    assert.ok(testInput)
    testOutput = connector.getOutput('TestPublisher::TestWriter2')
    assert.ok(testOutput)

    // Wait for the input and output to dicovery each other
    const newMatches = await testOutput.waitForSubscriptions(testExpectSuccessTimeout)
    assert.strictEqual(newMatches, 1)
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
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()

    for (const sample of testInput.samples) {
      assert.strictEqual(sample.info.get('source_timestamp'), sourceTimestamp)
      assert.strictEqual(sample.get('my_string'), testJsonObject.my_string)
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
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()

    for (const sample of testInput.samples) {
      assert.deepStrictEqual(sample.info.get('identity').writer_guid, identWriterGuid)
      assert.strictEqual(sample.info.get('identity').sequence_number, identSeqNumber)
      assert.strictEqual(sample.get('my_string'), testJsonObject.my_string)
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
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()

    for (const sample of testInput.samples.validDataIter) {
      assert.deepStrictEqual(sample.info.get('related_sample_identity').writer_guid, rIdentWriterGuid)
      assert.strictEqual(sample.info.get('related_sample_identity').sequence_number, rIdentSeqNumber)
      assert.strictEqual(sample.get('my_string'), testJsonObject.my_string)
    }
  })

  it('test write with unsupported params', async () => {
    testOutput.instance.setFromJson(testJsonObject)

    assert.throws(() => {
      testOutput.write({ unsupported_param: 5 })
    }, rti.DDSError)
  })

  it('test write with invalid action', async () => {
    testOutput.instance.setFromJson(testJsonObject)

    assert.throws(() => {
      testOutput.write({ action: 'this_should_be_write_unregister_dispose' })
    }, rti.DDSError)
  })

  it('test write with invalid source_timestamp', async () => {
    testOutput.instance.setFromJson(testJsonObject)

    assert.throws(() => {
      testOutput.write({ source_timestamp: 'this_should_be_positive_integer' })
    }, rti.DDSError)
  })

  it('test write with invalid guid', async () => {
    testOutput.instance.setFromJson(testJsonObject)
    const identSeqNumber = 1

    assert.throws(() => {
      testOutput.write(
        {
          identity: {
            writer_guid: 'this_should_be_an_array_of_integers',
            sequence_number: identSeqNumber
          }
        })
    }, rti.DDSError)
  })

  it('test write with invalid sequence_number', async () => {
    testOutput.instance.setFromJson(testJsonObject)
    const identWriterGuid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

    assert.throws(() => {
      testOutput.write(
        {
          identity: {
            writer_guid: identWriterGuid,
            sequence_number: 'this_should_be_an_integer'
          }
        })
    }, rti.DDSError)
  })

  it('test metadata from write without params', async () => {
    testOutput.instance.setFromJson(testJsonObject)

    testOutput.write()
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()

    for (const sample of testInput.samples.validDataIter) {
      // Source timestamp will either be returned as a string or as a number,
      // depending on whether or not it is larger than 2^53.
      assert.ok(typeof sample.info.get('source_timestamp') === 'string' || typeof sample.info.get('source_timestamp') === 'number')
      assert.ok(Array.isArray(sample.info.get('identity').writer_guid))
      assert.strictEqual(typeof sample.info.get('identity').sequence_number, 'number')
      assert.ok(Array.isArray(sample.info.get('related_sample_identity').writer_guid))
      assert.strictEqual(typeof sample.info.get('related_sample_identity').sequence_number, 'number')
      assert.strictEqual(sample.get('my_string'), testJsonObject.my_string)
    }
  })

  it('test getting sample_state', async () => {
    testOutput.write()
    await testInput.wait(testExpectSuccessTimeout)

    // Since this is the first time that we are accessing the sample, it should
    // have a sample state of NOT_READ
    testInput.read()
    assert.strictEqual(testInput.samples.get(0).info.get('sample_state'), 'NOT_READ')
    // Now that we have already accessed the sample once time, accessing it
    // again should result in a sample state of READ
    testInput.read()
    assert.strictEqual(testInput.samples.get(0).info.get('sample_state'), 'READ')
    // Taking after a read should also have a sample state of READ
    testInput.take()
    assert.strictEqual(testInput.samples.get(0).info.get('sample_state'), 'READ')
  })

  it('test getting instance state', async () => {
    testOutput.write()
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()
    // Instance is currently alive
    assert.strictEqual(testInput.samples.get(0).info.get('instance_state'), 'ALIVE')
    // Disposing the sample should update the instance state
    testOutput.write({ action: 'dispose' })
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()
    assert.strictEqual(testInput.samples.get(0).info.get('instance_state'), 'NOT_ALIVE_DISPOSED')
    // Writing the sample again should transition it back to alive
    testOutput.write()
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()
    // Instance is currently alive
    assert.strictEqual(testInput.samples.get(0).info.get('instance_state'), 'ALIVE')
    // Unregister the instance to get NO_WRITERS
    testOutput.write({ action: 'unregister' })
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()
    assert.strictEqual(testInput.samples.get(0).info.get('instance_state'), 'NOT_ALIVE_NO_WRITERS')
  })

  it('test getting sample view state', async () => {
    // View state is per-instance
    testOutput.instance.setString('my_key_string', 'Brown')
    testOutput.write()
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()
    assert.strictEqual(testInput.samples.get(0).info.get('view_state'), 'NEW')
    // Updating that instance should update the view state
    testOutput.write()
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()
    assert.strictEqual(testInput.samples.get(0).info.get('view_state'), 'NOT_NEW')
    // Writing a new instance should have a NEW view state
    testOutput.instance.setString('my_key_string', 'Maroon')
    testOutput.write()
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()
    assert.strictEqual(testInput.samples.get(0).info.get('view_state'), 'NEW')
  })
})

describe('accessing key values after instance disposal', () => {
  /** @type {rti.Connector} */
  let connector
  // Do not create inputs or outputs here since each of the tests
  // requires a different type

  beforeEach(() => {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.resolve(__dirname, '../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
    assert.ok(connector instanceof rti.Connector)
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
    assert.ok(input)
    const output = connector.getOutput('MyPublisher::MySquareWriter')
    assert.ok(input)
    // Wait for discovery between the 2 entities
    try {
      let newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
      newMatches = await input.waitForPublications(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
    } catch (err) {
      throw err
    }
    // Set some of the fields within the shape type (including the key)
    output.instance.setString('color', 'Yellow')
    output.instance.setNumber('x', 2)
    output.instance.setNumber('y', 5)
    output.instance.setBoolean('z', true)
    // Write the sample
    output.write()
    await input.wait(testExpectSuccessTimeout)
    input.take()
    // Now dispose the instance we just wrote
    output.write({ action: 'dispose' })
    await input.wait(testExpectSuccessTimeout)
    input.take()
    const sample = input.samples.get(0)
    // Sample should contain invalid data, and instance state disposed
    assert.strictEqual(sample.info.get('valid_data'), false)
    assert.strictEqual(sample.info.get('instance_state'), 'NOT_ALIVE_DISPOSED')
    // It should be possible to access the key field
    assert.strictEqual(sample.get('color'), 'Yellow')
    assert.strictEqual(sample.getString('color'), 'Yellow')
    // All non key fields should not be accessed.
    // Can also obtain the JSON representation of the sample.
    const expectedJson = {
      color: 'Yellow',
      x: 0,
      y: 0,
      z: false,
      shapesize: 0
    }
    assert.deepStrictEqual(sample.getJson(), expectedJson)
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
    assert.ok(input)
    const output = connector.getOutput('MyPublisher::MyMultipleKeyedSquareWriter')
    assert.ok(input)
    // Wait for discovery between the 2 entities
    try {
      let newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
      newMatches = await input.waitForPublications(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
    } catch (err) {
      throw err
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
    await input.wait(testExpectSuccessTimeout)
    input.take()
    // Now dispose the instance we just wrote
    output.write({ action: 'dispose' })
    await input.wait(testExpectSuccessTimeout)
    input.take()
    const sample = input.samples.get(0)
    // Check key fields
    assert.strictEqual(sample.get('color'), 'Brown')
    assert.strictEqual(sample.get('other_color'), 'Blue')
    assert.strictEqual(sample.get('y'), 9)
    assert.strictEqual(sample.get('z'), false)
    assert.strictEqual(sample.getString('color'), 'Brown')
    assert.strictEqual(sample.getString('other_color'), 'Blue')
    assert.strictEqual(sample.getNumber('y'), 9)
    assert.strictEqual(sample.getBoolean('z'), false)
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
    assert.deepStrictEqual(sample.getJson(), expectedJson)
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
    assert.ok(input)
    const output = connector.getOutput('MyPublisher::MyNestedKeyedSquareWriter')
    assert.ok(input)
    // Wait for discovery between the 2 entities
    try {
      let newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
      newMatches = await input.waitForPublications(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
    } catch (err) {
      throw err
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
    await input.wait(testExpectSuccessTimeout)
    input.take()
    // Now dispose the instance we just wrote
    output.write({ action: 'dispose' })
    await input.wait(testExpectSuccessTimeout)
    input.take()
    const sample = input.samples.get(0)
    assert.strictEqual(sample.info.get('valid_data'), false)
    assert.strictEqual(sample.info.get('instance_state'), 'NOT_ALIVE_DISPOSED')
    // Everything within keyed_shape is a key
    assert.strictEqual(sample.getNumber('keyed_shape.x'), 2)
    assert.strictEqual(sample.getNumber('keyed_shape.y'), 0)
    assert.strictEqual(sample.getNumber('keyed_shape.shapesize'), 100)
    assert.strictEqual(sample.getBoolean('keyed_shape.z'), true)
    assert.strictEqual(sample.get('keyed_shape.x'), 2)
    assert.strictEqual(sample.get('keyed_shape.y'), 0)
    assert.strictEqual(sample.get('keyed_shape.shapesize'), 100)
    assert.strictEqual(sample.get('keyed_shape.z'), true)
    assert.strictEqual(sample.get('keyed_shape.color'), 'Black')
    assert.strictEqual(sample.getString('keyed_shape.color'), 'Black')
    // keyed_toplevel_member is also a key
    assert.strictEqual(sample.getNumber('keyed_toplevel_member'), 1)
    assert.strictEqual(sample.get('keyed_toplevel_member'), 1)
    // Only the 'color' field in keyed_nested_member is keyed
    assert.strictEqual(sample.get('keyed_nested_member.color'), 'White')
    assert.strictEqual(sample.get('keyed_nested_member.x'), 0)
    // Do not access any of the non-key values
    // The unkeyed_toplevel_member field has a default value explicitly set
    // in the type. This should not effect the returned value.
    assert.strictEqual(sample.get('unkeyed_toplevel_member'), 0)
    assert.strictEqual(sample.getNumber('unkeyed_toplevel_member'), 0)
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
    assert.deepStrictEqual(sample.getJson(), expectedJson)
    // Can also obtain the keyed members as a JSON since they are complex
    expectedJson = {
      color: 'Black',
      x: 2,
      y: 0,
      shapesize: 100,
      z: true
    }
    assert.deepStrictEqual(sample.getJson('keyed_shape'), expectedJson)
    expectedJson = {
      color: 'White',
      x: 0,
      y: 0,
      shapesize: 0,
      z: false
    }
    assert.deepStrictEqual(sample.getJson('keyed_nested_member'), expectedJson)
  })

  it('access the key fields using an iterator', async () => {
    const input = connector.getInput('MySubscriber::MySquareReader')
    assert.ok(input)
    const output = connector.getOutput('MyPublisher::MySquareWriter')
    assert.ok(input)
    // Wait for discovery between the 2 entities
    try {
      let newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
      newMatches = await input.waitForPublications(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
    } catch (err) {
      throw err
    }
    // Set some of the fields within the shape type (including the key)
    output.instance.setString('color', 'Yellow')
    output.instance.setNumber('x', 2)
    // Write the sample
    output.write()
    await input.wait(testExpectSuccessTimeout)
    input.take()
    // Now dispose the instance we just wrote
    output.write({ action: 'dispose' })
    await input.wait(testExpectSuccessTimeout)
    input.take()
    // There should be no samples accessible within the validDataIter
    let hadData = false
    // eslint-disable-next-line no-unused-vars
    for (const sample of input.samples.validDataIter) {
      hadData = true
    }
    assert.strictEqual(hadData, false)
    // Should be possible to access key fields in the dataIter
    for (const sample of input.samples) {
      assert.strictEqual(sample.info.get('valid_data'), false)
      assert.strictEqual(sample.info.get('instance_state'), 'NOT_ALIVE_DISPOSED')
      assert.strictEqual(sample.getString('color'), 'Yellow')
      assert.strictEqual(sample.get('color'), 'Yellow')
      const expectedJson = {
        color: 'Yellow',
        x: 0,
        y: 0,
        shapesize: 0,
        z: false
      }
      assert.deepStrictEqual(sample.getJson(), expectedJson)
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
    assert.ok(input)
    const output = connector.getOutput('MyPublisher::MySquareWithoutTopLevelKeyWriter')
    assert.ok(input)
    // Wait for discovery between the 2 entities
    try {
      let newMatches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
      newMatches = await input.waitForPublications(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
    } catch (err) {
      throw err
    }
    // Set some of the fields within the shape type (including the key)
    output.instance.setString('unkeyed_shape.color', 'Yellow')
    output.instance.setNumber('unkeyed_shape.x', 2)
    output.instance.setString('keyed_shape.color', 'Yellow')
    output.instance.setNumber('keyed_shape.x', 2)
    // Write the sample
    output.write()
    await input.wait(testExpectSuccessTimeout)
    input.take()
    // Now dispose the instance we just wrote
    output.write({ action: 'dispose' })
    await input.wait(testExpectSuccessTimeout)
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
    assert.deepStrictEqual(sample.getJson(), expectedJson)
  })
})

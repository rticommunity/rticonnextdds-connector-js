/******************************************************************************
* (c) 2019 Copyright, Real-Time Innovations.  All rights reserved.            *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
const os = require('os')
const assert = require('node:assert/strict')
const { describe, it, beforeEach, afterEach } = require('node:test')
const rti = require('../../rticonnextdds-connector')

// We provide a timeout of 10s to operations that we expect to succeed. This
// is so that if they fail, we know for sure something went wrong
const testExpectSuccessTimeout = 10000
// We provide a much shorter timeout to operations that we expect to timeout.
// This is to prevent us from hanging the tests for 10s
const testExpectFailureTimeout = 500

// These tests test the different ways to access data in Instance and SampleIterator
describe('Data access tests with a pre-populated input', () => {
  /** @type {rti.Connector} */
  let connector
  /** @type {rti.Output} */
  let output
  /** @type {rti.Input} */
  let prepopulatedInput
  /** @type {object} */
  let sample
  const testJsonObject = {
    my_long: 10,
    my_double: 3.3,
    my_optional_bool: true,
    my_enum: 1,
    my_string: 'hello',
    my_point: { x: 3, y: 4 },
    my_point_alias: { x: 30, y: 40 },
    my_union: { my_int_sequence: [10, 20, 30] },
    my_int_union: { my_long: 222 },
    my_point_sequence: [{ x: 10, y: 20 }, { x: 11, y: 21 }],
    my_int_sequence: [1, 2, 3],
    my_point_array: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 5, y: 15 }],
    my_boolean: false,
    my_int64: -18014398509481984,
    my_uint64: 18014398509481984,
    my_key_string: 'hello'
  }

  beforeEach(async () => {
    const participantProfile = 'MyParticipantLibrary::DataAccessTest'
    const xmlPath = path.join(__dirname, '/../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlPath)
    assert.ok(connector instanceof rti.Connector)
    prepopulatedInput = connector.getInput('TestSubscriber::TestReader2')
    assert.ok(prepopulatedInput)
    output = connector.getOutput('TestPublisher::TestWriter2')
    assert.ok(output)

    // Wait for the input and output to dicovery each other
    try {
      const matches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      assert.ok(matches >= 1)
    } catch (err) {
      console.log('Caught err: ' + err)
      // Fail the test
      throw (err)
    }
    // Write data on the the output
    output.instance.setFromJson(testJsonObject)
    output.write()
    // Wait for data to arrive on input
    try {
      await prepopulatedInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught err: ' + err)
      // Fail the test
      throw (err)
    }
    // Take the data on the input so that we can access it from the test
    prepopulatedInput.take()
    assert.strictEqual(prepopulatedInput.samples.length, 1)
    sample = prepopulatedInput.samples.get(0)
    assert.ok(sample.validData)
  })

  afterEach(async () => {
    // Take all samples here to ensure that next test case has a clean input
    prepopulatedInput.take()
    await connector.close()
  })

  it('getNumber should return a number', () => {
    assert.strictEqual(sample.getNumber('my_long'), 10)
    assert.strictEqual(sample.get('my_long'), 10)
  })

  it('getNumber requires a valid index', () => {
    assert.throws(() => {
      prepopulatedInput.samples.getNumber('NAN', 'my_long')
    }, TypeError)
  })

  it('getNumber requires a valid field name', () => {
    assert.throws(() => {
      prepopulatedInput.samples.getNumber(0, 1)
    }, TypeError)
  })

  it('getString on a number field should return a string', () => {
    assert.strictEqual(sample.getString('my_long'), '10')
    // Even though 3.3 was set, it cannot be perfectly represetned as a double
    assert.strictEqual(sample.getString('my_double'), '3.2999999999999998')
  })

  it('getString requires a valid index', () => {
    assert.throws(() => {
      prepopulatedInput.samples.getString('NaN', 'my_string')
    }, TypeError)
  })

  it('getString requires a valid field name', () => {
    assert.throws(() => {
      prepopulatedInput.samples.getString(0, 1)
    }, TypeError)
  })

  it('getBoolean should return a boolean', () => {
    assert.strictEqual(sample.getBoolean('my_optional_bool'), true)
    assert.strictEqual(sample.get('my_optional_bool'), true)
  })

  it('getBoolean requires a valid index', () => {
    assert.throws(() => {
      prepopulatedInput.samples.getBoolean('NAN', 'my_optional_bool')
    }, TypeError)
  })

  it('getBoolean requires a valid field name', () => {
    assert.throws(() => {
      prepopulatedInput.samples.getBoolean(0, 1)
    }, TypeError)
  })

  it('getValue requires a valid index', () => {
    assert.throws(() => {
      prepopulatedInput.samples.getValue('NAN', 'my_optional_bool')
    }, TypeError)
  })

  it('getValue requires a valid field name', () => {
    assert.throws(() => {
      prepopulatedInput.samples.getValue(0, 1)
    }, TypeError)
  })

  it('getNumber on a boolean field should return a number', () => {
    assert.strictEqual(sample.getNumber('my_optional_bool'), 1)
  })

  it('getNumber on an enum should return the set value', () => {
    assert.strictEqual(sample.getNumber('my_enum'), 1)
  })

  it('access a value nested within a struct', () => {
    assert.strictEqual(sample.getNumber('my_point.x'), 3)
    assert.strictEqual(sample.getNumber('my_point.y'), 4)
  })

  it('access values and sizes of sequences and arrays', () => {
    assert.strictEqual(sample.getNumber('my_point_sequence[0].y'), 20)
    assert.strictEqual(sample.get('my_point_sequence[0].y'), 20)
    assert.strictEqual(sample.getNumber('my_int_sequence[1]'), 2)
    assert.strictEqual(sample.get('my_int_sequence[1]'), 2)
    // The '#' appended to the type name should provide the length
    assert.strictEqual(sample.getNumber('my_point_sequence#'), 2)
    assert.strictEqual(sample.get('my_point_sequence#'), 2)
    assert.strictEqual(sample.getNumber('my_int_sequence#'), 3)
    assert.strictEqual(sample.get('my_int_sequence#'), 3)
    assert.strictEqual(sample.getNumber('my_point_array[4].x'), 5)
    assert.strictEqual(sample.get('my_point_array[4].x'), 5)
  })

  it('access values past the end of a sequence', () => {
    assert.strictEqual(sample.getNumber('my_point_sequence[9].y'), null)
    assert.strictEqual(sample.getNumber('my_int_sequence[9]'), null)
  })

  it('attempt to access non-existent members', () => {
    assert.throws(() => {
      sample.getNumber('my_nonexistent_member')
    }, rti.DDSError)
  })

  it('attempt to access members with bad sequence syntax', () => {
    assert.throws(() => {
      sample.getNumber('my_point_sequence[9[.y')
    }, rti.DDSError)
  })

  it('attempt to access the negative member of a sequence', () => {
    assert.throws(() => {
      sample.getNumber('my_point_sequence[-1].y')
    }, rti.DDSError)
  })

  it('getNumber on unions', () => {
    assert.strictEqual(sample.getNumber('my_union.my_int_sequence#'), 3)
    assert.strictEqual(sample.getNumber('my_union.my_int_sequence[1]'), 20)
    assert.strictEqual(sample.getNumber('my_int_union.my_long'), 222)
  })

  it('obtain the selected member of a union with # syntax', () => {
    assert.strictEqual(sample.getString('my_int_union#'), 'my_long')
    assert.strictEqual(sample.getString('my_union#'), 'my_int_sequence')
    assert.strictEqual(sample.get('my_union#'), 'my_int_sequence')
  })

  it('obtain an unset optional member', () => {
    assert.strictEqual(sample.getNumber('my_optional_long'), null)
    assert.strictEqual(sample.get('my_optional_long'), null)
    assert.strictEqual(sample.getJson().my_optional_long, undefined)
  })

  it('obtain an unset optional member as a string', () => {
    assert.strictEqual(sample.getString('my_optional_long'), null)
  })

  it('obtain an unset optional complex member', () => {
    assert.strictEqual(sample.getNumber('my_optional_point.x'), null)
  })

  it('unset optional members should not be in JSON objects returned by getJSON', () => {
    assert.strictEqual(sample.getNumber('my_optional_point.x'), null)
    const jsonObj = sample.getJson()
    assert.strictEqual(Object.prototype.hasOwnProperty.call(jsonObj, 'my_optional_point'), false)
  })

  it('get non-existent member with getJson', () => {
    assert.throws(() => {
      sample.getJson('IDoNotExist')
    }, rti.DDSError)
  })

  it('getJson requires valid index', () => {
    assert.throws(() => {
      prepopulatedInput.samples.getJson('NAN')
    }, TypeError)
  })

  it('if a member name is supplied to getJson, it must be a string', () => {
    assert.throws(() => {
      prepopulatedInput.samples.getJson(1, 0)
    }, TypeError)
  })

  it('attempt to get non-complex members with getJson', () => {
    assert.throws(() => {
      sample.getJson('my_long')
    }, rti.DDSError)
    assert.throws(() => {
      sample.getJson('my_double')
    }, rti.DDSError)
    assert.throws(() => {
      sample.getJson('my_optional_bool')
    }, rti.DDSError)
    assert.throws(() => {
      sample.getJson('my_optional_long')
    }, rti.DDSError)
    assert.throws(() => {
      sample.getJson('my_string')
    }, rti.DDSError)
    assert.throws(() => {
      sample.getJson('my_enum')
    }, rti.DDSError)
    assert.throws(() => {
      sample.getJson('my_point.x')
    }, rti.DDSError)
  })

  it('get complex members using getJson', () => {
    const thePoint = sample.getJson('my_point')
    assert.deepStrictEqual(JSON.parse(JSON.stringify(thePoint)), thePoint)
    assert.strictEqual(thePoint.x, 3)
    assert.strictEqual(thePoint.y, 4)

    const thePointAlias = sample.getJson('my_point_alias')
    assert.deepStrictEqual(JSON.parse(JSON.stringify(thePointAlias)), thePointAlias)
    assert.strictEqual(thePointAlias.x, 30)
    assert.strictEqual(thePointAlias.y, 40)

    const theUnion = sample.getJson('my_union')
    assert.deepStrictEqual(JSON.parse(JSON.stringify(theUnion)), theUnion)
    assert.deepStrictEqual(theUnion.my_int_sequence, [10, 20, 30])

    const thePointSequence = sample.getJson('my_point_sequence')
    assert.deepStrictEqual(JSON.parse(JSON.stringify(thePointSequence)), thePointSequence)
    assert.deepStrictEqual(thePointSequence, [{ x: 10, y: 20 }, { x: 11, y: 21 }])

    const thePointSequence0 = sample.getJson('my_point_sequence[0]')
    assert.deepStrictEqual(JSON.parse(JSON.stringify(thePointSequence0)), thePointSequence0)
    assert.strictEqual(thePointSequence0.x, 10)
    assert.strictEqual(thePointSequence0.y, 20)

    const theArray = sample.getJson('my_point_array')
    assert.deepStrictEqual(JSON.parse(JSON.stringify(theArray)), theArray)

    const theArray0 = sample.getJson('my_point_array[0]')
    assert.deepStrictEqual(JSON.parse(JSON.stringify(theArray0)), theArray0)
    assert.strictEqual(theArray0.x, 0)
    assert.strictEqual(theArray0.y, 0)
  })

  it('get an unset optional complex member using getJson', () => {
    const unsetOptionalComplex = sample.getJson('my_optional_point')
    assert.strictEqual(unsetOptionalComplex, null)
  })

  // We do not run these tests on Windows since the symbols are not exported in the DLL
  if (os.platform() !== 'win32') {
    it('access native dynamic data pointer', () => {
      // eslint-disable-next-line camelcase
      const DDS_DynamicData_get_member_count = rti.connectorBinding.api.func('DDS_DynamicData_get_member_count', 'uint', ['RTI_HANDLE'])
      const memberCount = DDS_DynamicData_get_member_count(sample.native)
      assert.ok(memberCount > 0)
    })
  }

  it('get complex members using get', () => {
    const thePoint = sample.get('my_point')
    // Since my_point is a struct it should have been converted to a JSON object
    assert.deepStrictEqual(JSON.parse(JSON.stringify(thePoint)), thePoint)
    assert.strictEqual(thePoint.x, 3)
    assert.strictEqual(thePoint.y, 4)

    const thePointSequence = sample.get('my_point_sequence')
    assert.deepStrictEqual(JSON.parse(JSON.stringify(thePointSequence)), thePointSequence)
    assert.ok(Array.isArray(thePointSequence))
    assert.deepStrictEqual(thePointSequence[0], { x: 10, y: 20 })
    assert.deepStrictEqual(thePointSequence[1], { x: 11, y: 21 })

    const thePointArray = sample.get('my_point_array')
    assert.deepStrictEqual(JSON.parse(JSON.stringify(thePointArray)), thePointArray)
    assert.ok(Array.isArray(thePointArray))
    assert.deepStrictEqual(thePointArray[0], { x: 0, y: 0 })
    assert.deepStrictEqual(thePointArray[4], { x: 5, y: 15 })

    const thePointAlias = sample.get('my_point_alias')
    // Alias should be resolved so we now have a JSON object
    assert.deepStrictEqual(JSON.parse(JSON.stringify(thePointAlias)), thePointAlias)
    assert.strictEqual(thePointAlias.x, 30)
    assert.strictEqual(thePointAlias.y, 40)

    const theOptionalPoint = sample.get('my_optional_point')
    // Unset optional should return null
    assert.strictEqual(theOptionalPoint, null)

    const theUnion = sample.get('my_union')
    // Since no trailing '#' was supplied we should now have the JSON object
    assert.deepStrictEqual(JSON.parse(JSON.stringify(theUnion)), theUnion)
    assert.deepStrictEqual(theUnion, { my_int_sequence: [10, 20, 30] })
  })

  it('Try to obtain complex members with getNumber', () => {
    assert.throws(() => {
      sample.getNumber('my_point')
    }, rti.DDSError)
  })

  it('Try to obtain complex members with getBoolean', () => {
    assert.throws(() => {
      sample.getBoolean('my_point')
    }, rti.DDSError)
  })

  it('Try to obtain complex members with getString', () => {
    // It should be possible to complex members with getString, but the returned
    // object will have a type of 'string', not a JSON object
    const complexString = sample.getString('my_point')
    assert.strictEqual(typeof complexString, 'string')
    // The string should be parsable by JSON
    const complexJson = JSON.parse(complexString)
    assert.ok(complexJson !== null && typeof complexJson === 'object' && !Array.isArray(complexJson))
    assert.strictEqual(complexJson.x, 3)
  })

  it('Try to obtain complex arrays with getString', () => {
    // It should be possible to complex members with getString, but the returned
    // object will have a type of 'string', not a JSON object
    const complexString = sample.getString('my_point_array')
    assert.strictEqual(typeof complexString, 'string')
    // The string should be parsable by JSON
    const complexJson = JSON.parse(complexString)
    assert.ok(Array.isArray(complexJson))
    assert.strictEqual(complexJson[0].x, 0)
  })

  it('Obtain JSON string of dictionary', () => {
    const jsonInstance = output.instance.getJson()
    assert.deepStrictEqual(jsonInstance, testJsonObject)
  })

  it('samples.getNative requires valid index', () => {
    assert.throws(() => {
      prepopulatedInput.samples.getNative('NAN')
    }, TypeError)
  })
})

describe('Tests with a testOutput and testInput', () => {
  /** @type {rti.Connector} */
  let connector
  /** @type {rti.Output} */
  let testOutput
  /** @type {rti.Input} */
  let testInput
  const testJsonObject = {
    my_long: 10,
    my_double: 3.3,
    my_optional_bool: true,
    my_enum: 1,
    my_string: 'hello',
    my_point: { x: 3, y: 4 },
    my_point_alias: { x: 30, y: 40 },
    my_union: { my_int_sequence: [10, 20, 30] },
    my_int_union: { my_long: 222 },
    my_point_sequence: [{ x: 10, y: 20 }, { x: 11, y: 21 }],
    my_int_sequence: [1, 2, 3],
    my_point_array: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 5, y: 15 }],
    my_boolean: false,
    my_int64: -18014398509481984,
    my_uint64: 18014398509481984,
    my_key_string: 'hello'
  }

  beforeEach(async () => {
    const participantProfile = 'MyParticipantLibrary::DataAccessTest'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
    assert.ok(connector instanceof rti.Connector)
    testInput = connector.getInput('TestSubscriber::TestReader2')
    assert.ok(testInput)
    testOutput = connector.getOutput('TestPublisher::TestWriter2')
    assert.ok(testOutput)

    // Wait for the input and output to dicovery each other
    try {
      const newMatches = await testOutput.waitForSubscriptions(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
    } catch (err) {
      console.log('Caught err ' + err)
      throw (err)
    }
  })

  afterEach(async () => {
    // Take all samples here to ensure that next test case has a clean input
    testInput.take()
    await connector.close()
  })

  if (os.platform() !== 'win32') {
    it('test native API on output', () => {
      // eslint-disable-next-line camelcase
      const DDS_DynamicData_get_member_count = rti.connectorBinding.api.func('DDS_DynamicData_get_member_count', 'uint', ['RTI_HANDLE'])
      const memberCount = DDS_DynamicData_get_member_count(testOutput.instance.native)
      assert.ok(memberCount > 0)
    })
  }

  it('pass null as field name to setX APIs on output', () => {
    assert.throws(() => {
      testOutput.instance.setBoolean(null, true)
    }, TypeError)

    assert.throws(() => {
      testOutput.instance.setNumber(null, 1)
    }, TypeError)

    assert.throws(() => {
      testOutput.instance.setString(null, 'hello')
    }, TypeError)
  })

  it('try to set a number with a string', () => {
    assert.throws(() => {
      testOutput.instance.setNumber('my_long', 'hello')
    }, TypeError)
  })

  it('try to set a boolean with a string', () => {
    assert.throws(() => {
      testOutput.instance.setBoolean('my_optional_bool', 'hello')
    }, TypeError)
  })

  it('try to set non-existent field names', () => {
    assert.throws(() => {
      testOutput.instance.setNumber('NonExistent', 1)
    }, rti.DDSError)

    assert.throws(() => {
      testOutput.instance.setBoolean('NonExistent', false)
    }, rti.DDSError)

    assert.throws(() => {
      testOutput.instance.setString('NonExistent', 'hello')
    }, rti.DDSError)
  })

  it('Supply a JSON object where everything is a string', async () => {
    testOutput.instance.setFromJson({
      my_long: '10',
      my_double: '3.3',
      my_optional_bool: true,
      my_enum: '1',
      my_string: 'hello',
      my_point: { x: '3', y: '4' },
      my_point_alias: { x: '30', y: '40' },
      my_union: { my_int_sequence: ['10', '20', '30'] },
      my_int_union: { my_long: '222' },
      my_point_sequence: [{ x: '10', y: '20' }, { x: '11', y: '21' }],
      my_int_sequence: ['1', '2', '3'],
      my_point_array: [{ x: '0', y: '0' }, { x: '0', y: '0' }, { x: '0', y: '0' }, { x: '0', y: '0' }, { x: '5', y: '15' }],
      my_boolean: false,
      my_int64: '-18014398509481984',
      my_uint64: '18014398509481984',
      my_key_string: 'hello'
    })
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught err: ' + err)
      // Fail the test
      throw err
    }
    testInput.take()
    const receivedJsonObject = testInput.samples.get(0).getJson()
    assert.deepStrictEqual(receivedJsonObject, testJsonObject)
  })

  it('Bad conversion from string in JSON object', () => {
    // For each numeric field, test that setFromJson fails when the value we provide
    // does not represent a number
    const fieldNames = [
      'my_long',
      'my_int64',
      'my_double',
      'my_point_array[1]',
      'my_int_sequence[1]',
      'my_enum',
      'my_uint64']
    for (const field of fieldNames) {
      assert.throws(() => {
        testOutput.instance.setFromJson({ field: 'this is not a number' })
        console.log(field + ' did not raise an exception')
      }, rti.DDSError)
    }
  })

  it('Attempt to access past the end of a sequence using setFromJson', async () => {
    assert.throws(() => {
      // my_int_sequence has a bound of 10 and we are supplying 11 elements
      testOutput.instance.setFromJson({ my_int_sequence: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10] })
    }, rti.DDSError)
    // Ensure that the previous error didn't corrupt the instance
    const sent = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
    testOutput.instance.set('my_int_sequence', sent)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
    testInput.take()
    const received = testInput.samples.get(0).get('my_int_sequence')
    assert.deepStrictEqual(received, sent)
  })

  it('Attempt to pass an invalid JSON object to setFromJson', async () => {
    assert.throws(() => {
      testOutput.instance.setFromJson({ my_point_sequence: [{ x: 1, y: 2 }, { x: 3, bad: 4 }] })
    }, rti.DDSError)
    // Ensure that the previous error did not corrupt the instance
    const sent = [{ x: 1, y: 2 }, { x: 3, y: 4 }]
    testOutput.instance.set('my_point_sequence', sent)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught error: ' + err)
      throw (err)
    }
    testInput.take()
    const received = testInput.samples.get(0).get('my_point_sequence')
    assert.deepStrictEqual(received, sent)
  })

  it('The type-independent get should return the same result as getJson', async () => {
    testOutput.instance.setFromJson({ my_point_sequence: [{ x: 1, y: 2 }, { x: 3, y: 4 }] })
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught error: ' + err)
      throw (err)
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.deepStrictEqual(sample.getJson('my_point_sequence'), sample.get('my_point_sequence'))
  })

  it('Set a boolean field using setNumber and check the resultant value on an input', async () => {
    testOutput.instance.setNumber('my_optional_bool', 1)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught err: ' + err)
      // Fail the test
      throw err
    }
    testInput.take()
    const theOptionalBool = testInput.samples.get(0).get('my_optional_bool')
    assert.strictEqual(theOptionalBool, true)
  })

  it('Set a string with a number and check the resultant value on an input', async () => {
    testOutput.instance.setString('my_string', '1234')
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught err: ' + err)
      // Fail the test
      throw err
    }
    testInput.take()
    const theNumericString = testInput.samples.get(0).get('my_string')
    assert.strictEqual(theNumericString, '1234')
  })

  it('Test output sequences', async () => {
    testOutput.instance.setNumber('my_point_sequence[0].y', 20)
    testOutput.instance.setNumber('my_int_sequence[1]', 2)
    testOutput.instance.setNumber('my_point_array[4].x', 5)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Caught error: ' + err)
      throw err
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.strictEqual(sample.get('my_point_sequence[0].y'), 20)
    assert.strictEqual(sample.get('my_int_sequence[1]'), 2)
    assert.strictEqual(sample.get('my_point_array[4].x'), 5)
    assert.strictEqual(sample.get('my_point_sequence#'), 1)
    assert.strictEqual(sample.get('my_int_sequence#'), 2)
  })

  it('Change union members', async () => {
    testOutput.instance.setNumber('my_union.my_int_sequence[1]', 3)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Caught error: ' + err)
      throw err
    }
    testInput.take()
    let sample = testInput.samples.get(0)
    assert.strictEqual(sample.getString('my_union#'), 'my_int_sequence')

    // Change the union to long
    testOutput.instance.setNumber('my_union.my_long', 3)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Caught error: ' + err)
      throw err
    }
    testInput.take()
    sample = testInput.samples.get(0)
    assert.strictEqual(sample.getString('my_union#'), 'my_long')
    assert.strictEqual(sample.getNumber('my_union.my_long'), 3)
  })

  it('Change union members', async () => {
    testOutput.instance.setNumber('my_union.my_int_sequence[1]', 3)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Caught error: ' + err)
      throw err
    }
    testInput.take()
    let sample = testInput.samples.get(0)
    assert.strictEqual(sample.getString('my_union#'), 'my_int_sequence')
    // Change the union
    testOutput.instance.setNumber('my_union.my_long', 3)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught error: ' + err)
      throw err
    }
    testInput.take()
    sample = testInput.samples.get(0)
    assert.strictEqual(sample.getString('my_union#'), 'my_long')
  })

  it('Set an optional', async () => {
    testOutput.instance.setNumber('my_optional_point.x', 101)
    testOutput.instance.setNumber('my_point_alias.x', 202)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Caught error: ' + err)
      throw err
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.strictEqual(sample.getNumber('my_optional_point.x'), 101)
    assert.strictEqual(sample.getNumber('my_point_alias.x'), 202)
  })

  it('Get an unset optional boolean', async () => {
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Caught error: ' + err)
      throw err
    }
    testInput.take()
    const unsetOptional = testInput.samples.get(0).getBoolean('my_optional_bool')
    assert.strictEqual(unsetOptional, null)
  })

  it('Returns samples', async () => {
    testOutput.instance.setNumber('my_long', 33)
    testOutput.write()
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()
    assert.strictEqual(testInput.samples.length, 1)
    assert.strictEqual(testInput.samples.get(0).getNumber('my_long'), 33)
    testInput.returnSamples()
    assert.strictEqual(testInput.samples.length, 0)
  })

  it('Returns samples with a timeout', async () => {
    testOutput.instance.setNumber('my_long', 33)

    // Initial set-up
    testOutput.write() // Write1
    await testInput.wait(testExpectSuccessTimeout)
    testInput.take()
    assert.strictEqual(testInput.samples.length, 1) // Write1

    // Wait without returning samples
    testOutput.write() // Write2
    await testInput.wait({ timeout: testExpectSuccessTimeout, returnSamples: false })
    assert.strictEqual(testInput.samples.length, 1) // Write1 was not returned
    testInput.take()
    assert.strictEqual(testInput.samples.length, 1) // Write2

    // Wait with returning samples
    testOutput.write() // Write3
    await testInput.wait({ timeout: testExpectSuccessTimeout, returnSamples: true })
    assert.strictEqual(testInput.samples.length, 0) // Write2 was returned
    testInput.take()
    assert.strictEqual(testInput.samples.length, 1) // Write3
  })

  it('Reset an optional number', async () => {
    testOutput.instance.setNumber('my_optional_long', 33)
    testOutput.instance.setNumber('my_optional_long', null)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.strictEqual(sample.getNumber('my_optional_long'), null)
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sample.getJson(), 'my_optional_long'), false)
  })

  it('Reset an optional bool', async () => {
    testOutput.instance.setBoolean('my_optional_bool', true)
    testOutput.instance.setBoolean('my_optional_bool', null)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.strictEqual(sample.getNumber('my_optional_bool'), null)
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sample.getJson(), 'my_optional_bool'), false)
  })

  it('Reset an optional complex', async () => {
    testOutput.instance.setNumber('my_optional_point.x', 44)
    testOutput.instance.setNumber('my_point_alias.x', 55)
    testOutput.instance.clearMember('my_optional_point')
    testOutput.instance.clearMember('my_point_alias')
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.strictEqual(sample.getNumber('my_optional_point.x'), null)
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sample.getJson(), 'my_optional_point'), false)
    assert.strictEqual(sample.getNumber('my_point_alias.x'), null)
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sample.getJson(), 'my_point_alias'), false)
  })

  it('Clear a sequence', async () => {
    testOutput.instance.setNumber('my_union.my_int_sequence[2]', 10)
    testOutput.instance.setNumber('my_point.x', 3)
    testOutput.instance.clearMember('my_union.my_int_sequence')
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.strictEqual(sample.getNumber('my_union.my_int_sequence#'), 0)
    assert.strictEqual(sample.getNumber('my_point.x'), 3)
  })

  it('Clear a sequence with a JSON object', async () => {
    // Set the non-default values
    testOutput.instance.setFromJson(testJsonObject)
    testOutput.instance.setBoolean('my_optional_bool', true)
    // Reset members using null in a JSON object. Optional members are set to null,
    // other members are initialized to their default value
    testOutput.instance.setFromJson({
      my_optional_point: null,
      my_optional_long: null,
      my_point: null,
      my_point_alias: null,
      my_long: null,
      my_optional_bool: null,
      my_point_sequence: null,
      my_string: null,
      my_union: null,
      my_enum: null
    })
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.strictEqual(sample.getNumber('my_optional_point.x'), null)
    assert.strictEqual(sample.getNumber('my_optional_long'), null)
    assert.strictEqual(sample.getNumber('my_point.x'), 0)
    assert.strictEqual(sample.getNumber('my_point.y'), 0)
    assert.strictEqual(sample.getNumber('my_point_alias.y'), null)
    assert.strictEqual(sample.getNumber('my_long'), 0)
    assert.strictEqual(sample.getBoolean('my_optional_bool'), null)
    assert.strictEqual(sample.getNumber('my_point_sequence#'), 0)
    assert.strictEqual(sample.getString('my_string'), '')
    assert.strictEqual(sample.getString('my_union#'), 'point')
    assert.strictEqual(sample.getNumber('my_enum'), 2)
    const jsonObj = sample.getJson()
    assert.strictEqual(Object.prototype.hasOwnProperty.call(jsonObj, 'my_optional_bool'), false)
    assert.strictEqual(Object.prototype.hasOwnProperty.call(jsonObj, 'my_optional_long'), false)
    assert.strictEqual(Object.prototype.hasOwnProperty.call(jsonObj, 'my_point_alias'), false)
    assert.strictEqual(Object.prototype.hasOwnProperty.call(jsonObj, 'my_optional_point'), false)
  })

  it('Clear a non-existent member', () => {
    assert.throws(() => {
      testOutput.instance.clearMember('nonexistent_member')
    }, rti.DDSError)
  })

  it('Reset a sequence', async () => {
    testOutput.instance.setNumber('my_union.my_int_sequence[2]', 10)
    testOutput.instance.setNumber('my_point.x', 3)
    testOutput.instance.setNumber('my_point_sequence[1].x', 44)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    let sample = testInput.samples.get(0)
    assert.strictEqual(sample.getNumber('my_union.my_int_sequence#'), 3)
    assert.strictEqual(sample.getNumber('my_point.x'), 3)
    assert.strictEqual(sample.getNumber('my_point_sequence#'), 2)

    testOutput.instance.setFromJson({ my_int_sequence: [] })
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    sample = testInput.samples.get(0)
    assert.strictEqual(sample.getNumber('my_int_sequence#'), 0)
    // The other fields are unchanged
    assert.strictEqual(sample.getNumber('my_point.x'), 3)
    assert.strictEqual(sample.getNumber('my_point_sequence#'), 2)
  })

  it('Can clear an entire instance on an output', async () => {
    testOutput.instance.setBoolean('my_optional_bool', true)
    testOutput.instance.setNumber('my_optional_point.x', 44)
    testOutput.clearMembers()
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.strictEqual(sample.getBoolean('my_optional_bool'), null)
    assert.strictEqual(sample.getBoolean('my_optional_point'), null)
  })

  it('Can clear a value via the generic set function', async () => {
    testOutput.instance.setBoolean('my_optional_bool', true)
    testOutput.instance.setNumber('my_optional_point.x', 44)
    testOutput.instance.set('my_optional_bool', null)
    testOutput.instance.set('my_optional_point', null)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.strictEqual(sample.getBoolean('my_optional_bool'), null)
    assert.strictEqual(sample.getBoolean('my_optional_point'), null)
  })

  it('Can clear a value via setString', async () => {
    testOutput.instance.setString('my_string', 'Hello, World!')
    testOutput.instance.setString('my_string', null)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.strictEqual(sample.getString('my_string'), '')
  })

  it('Check that setFromJson shrinks a sequence when it receives a smaller one', async () => {
    // Set the length to 3
    testOutput.instance.setNumber('my_int_sequence[2]', 10)
    testOutput.instance.setNumber('my_point_sequence[0].x', 11)
    testOutput.instance.setNumber('my_point_sequence[0].y', 12)
    testOutput.instance.setNumber('my_point_sequence[2].x', 10)
    testOutput.instance.setFromJson({
      my_point_array: [
        { x: 10, y: 20 },
        { x: 11, y: 21 },
        { x: 12, y: 22 },
        { x: 13, y: 23 },
        { x: 14, y: 24 }]
    })
    // Reduce sequences to a length of 1 (arrays should retain existing values)
    testOutput.instance.setFromJson({
      my_int_sequence: [40],
      my_point_sequence: [{ y: 2 }],
      my_point_array: [{ x: 100 }, { y: 200 }]
    })
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.strictEqual(sample.getNumber('my_int_sequence#'), 1)
    assert.strictEqual(sample.getNumber('my_point_sequence#'), 1)
    assert.strictEqual(sample.getNumber('my_int_sequence[0]'), 40)
    assert.strictEqual(sample.getNumber('my_point_sequence[0].y'), 2)
    assert.strictEqual(sample.getNumber('my_point_sequence[0].x'), 0)
    assert.strictEqual(sample.getNumber('my_point_array[0].x'), 100)
    assert.strictEqual(sample.getNumber('my_point_array[0].y'), 20)
    assert.strictEqual(sample.getNumber('my_point_array[4].x'), 14)
  })

  it('Check the type-independent Instance.set and Sample.get method', async () => {
    // Set one of each type using the type-independent set API
    testOutput.instance.set('my_string', 'Hello, World!')
    testOutput.instance.set('my_boolean', true)
    testOutput.instance.set('my_int64', 42)
    testOutput.instance.set('my_point_sequence[0].x', 3)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    assert.strictEqual(sample.get('my_string'), 'Hello, World!')
    assert.strictEqual(sample.get('my_boolean'), true)
    assert.strictEqual(sample.get('my_int64'), 42)
    assert.strictEqual(sample.get('my_point_sequence[0].x'), 3)
  })

  it('Reset an optional member using the type independent set method', async () => {
    testOutput.instance.set('my_optional_bool', null)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    assert.strictEqual(testInput.samples.get(0).get('my_optional_bool'), null)
  })

  it('Test nested JSON object syntax', async () => {
    testOutput.instance.setFromJson({ 'my_point_sequence[2].y': 153 })
    testOutput.instance.setFromJson({ 'my_point_sequence[2].x': 111 })
    testOutput.instance.set('my_point_sequence[3]', { x: 444, y: 555 })
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    assert.deepStrictEqual(testInput.samples.get(0).get('my_point_sequence[2]'), { x: 111, y: 153 })
    assert.deepStrictEqual(testInput.samples.get(0).get('my_point_sequence[3]'), { x: 444, y: 555 })
  })

  // Confirm desired behaviour for this
  it('Use Instance.set to set a complex member', async () => {
    const jsonObj = { x: 9, y: 12 }
    testOutput.instance.set('my_point', jsonObj)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    assert.deepStrictEqual(testInput.samples.get(0).get('my_point'), jsonObj)
  })

  it('Use Instance.set to set a list', async () => {
    const intSeq = [11, 22, 33]
    const pointSeq = [{ x: 100, y: 200 }, { x: 300, y: 400 }]
    testOutput.instance.set('my_int_sequence', intSeq)
    testOutput.instance.set('my_point_sequence', pointSeq)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    assert.deepStrictEqual(testInput.samples.get(0).get('my_int_sequence'), intSeq)
    assert.deepStrictEqual(testInput.samples.get(0).get('my_point_sequence'), pointSeq)
  })

  it('Can clear an element of a complex sequence', async () => {
    let pointSeq = [{ x: 100, y: 200 }, { x: 300, y: 400 }, { x: 500, y: 600 }]
    testOutput.instance.set('my_point_sequence', pointSeq)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    assert.deepStrictEqual(testInput.samples.get(0).get('my_point_sequence'), pointSeq)
    // Now we clear an element in the middle of the sequence
    pointSeq = [{ x: 100, y: 200 }, null, { x: 500, y: 600 }]
    testOutput.instance.set('my_point_sequence', pointSeq)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    assert.deepStrictEqual(testInput.samples.get(0).get('my_point_sequence[0]'), { x: 100, y: 200 })
    assert.deepStrictEqual(testInput.samples.get(0).get('my_point_sequence[1]'), { x: 0, y: 0 })
    assert.deepStrictEqual(testInput.samples.get(0).get('my_point_sequence[2]'), { x: 500, y: 600 })
  })

  it('Can set enum via name', async () => {
    testOutput.instance.setFromJson({ my_enum: 'GREEN' })
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      throw err
    }
    testInput.take()
    assert.strictEqual(testInput.samples.get(0).get('my_enum'), 1)
  })

  // Both Lua v5.2 (used within Connector native libraries) and JavaScript have
  // the same restriction on 64-bit integers - their only Number type is a double
  // precision floating point value, meaning they cannot accurately represent
  // integers large than 2^53.
  // Due to this, there are restrictions on how 64-bit numbers (uint64 and int64)
  // can be communicated, the following verify that the behaviour is as follows:
  // - The getNumber and setNumber operations throw an error if used with a value
  //   outside of their supported range:
  //     - Max |value| for setNumber is 2^53 - 1
  //     - Max |value| for getNumber is 2^53
  // - The type-agnostic setter can be used with numbers outside of this range,
  //   if they are supplied as strings (note in Python we also accept numbers).
  // - The type-agnostic getter can be used with numbers outside of the range.
  //   If the value is <= 2^53 it will be returned as a Number, otherwise as a
  //   string.
  // - The getString and setString operations can be used on all number types
  //   and has no restriction on size.
  // - The setFromJson  operation can be used to set large integers, they must
  //   be supplied as strings (otherwise they would be corrupted by JavaScript)
  // - the getJSON operation should not be used to obtain large integers, the
  //   largest integer it can be used with is the same as getNumber (2^53), however
  //   we have no way of detecting if a value larger than this is being retrieved,
  //   so no error will be thrown otherwise.
  describe('Tests with 64-bit integers', () => {
    it('getNumber throws an error if value is out of range', async () => {
      // Highest value retrievable is 2^53, so set 1 higher. We set via Json
      // to work around the limitation with setNumber (could also use setString,
      // or setAnyValue)
      testOutput.instance.setFromJson({
        my_uint64: '9007199254740993',
        my_int64: '9007199254740993'
      })
      testOutput.write()
      try {
        await testInput.wait(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Error caught: ' + err)
        throw err
      }
      testInput.take()

      // The values of the 64-bit integers is too large to retrieve with getNumber
      assert.throws(() => {
        testInput.samples.get(0).getNumber('my_uint64')
      }, rti.DDSError)
      assert.throws(() => {
        testInput.samples.get(0).getNumber('my_int64')
      }, rti.DDSError)

      // Also check the most negative value
      testOutput.instance.setFromJson({
        my_int64: '-9007199254740993'
      })
      testOutput.write()
      try {
        await testInput.wait(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Error caught: ' + err)
        throw err
      }
      testInput.take()
      assert.throws(() => {
        testInput.samples.get(0).getNumber('my_int64')
      }, rti.DDSError)
    })

    // Check that the getNumber API can handle values stated in documentation
    it('getNumber can retrieve values up to 2^53', async () => {
      testOutput.instance.setFromJson({
        my_uint64: '9007199254740992',
        my_int64: '-9007199254740992'
      })
      testOutput.write()
      try {
        await testInput.wait(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Error caught: ' + err)
        throw err
      }
      testInput.take()

      // Obtain the values and confirm they are correct
      const obtainedUint64 = testInput.samples.get(0).getNumber('my_uint64')
      const obtainedInt64 = testInput.samples.get(0).getNumber('my_int64')
      assert.strictEqual(obtainedUint64, Number.MAX_SAFE_INTEGER + 1)
      assert.strictEqual(obtainedInt64, Number.MIN_SAFE_INTEGER - 1)
    })

    // Check that setNumber throws an error if value is too large
    it('setNumber throws an error if value out of range', () => {
      // Max value for set is 2^53 - 1, anything larger will throw an error
      assert.throws(() => {
        testOutput.instance.setNumber('my_uint64', Number.MAX_SAFE_INTEGER + 1)
      }, rti.DDSError)
      assert.throws(() => {
        testOutput.instance.setNumber('my_int64', Number.MAX_SAFE_INTEGER + 1)
      }, rti.DDSError)
      assert.throws(() => {
        testOutput.instance.setNumber('my_int64', Number.MIN_SAFE_INTEGER - 1)
      }, rti.DDSError)
    })

    // Check that setNumber can handle the values stated in the documentation
    it('setNumber can set values up to 2^53 - 1', async () => {
      // setNumber can set up to 2^53 - 1 (which is === Number.MAX_SAFE_INTEGER)
      testOutput.instance.setNumber('my_uint64', Number.MAX_SAFE_INTEGER)
      testOutput.instance.setNumber('my_int64', Number.MAX_SAFE_INTEGER)
      testOutput.write()
      try {
        await testInput.wait(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Error caught: ' + err)
        throw err
      }
      testInput.take()
      // Confirm that the values are correct and not corrupted
      assert.strictEqual(testInput.samples.get(0).getNumber('my_uint64'), Number.MAX_SAFE_INTEGER)
      assert.strictEqual(testInput.samples.get(0).getNumber('my_int64'), Number.MAX_SAFE_INTEGER)

      // Also do same test with minimum value
      testOutput.instance.setNumber('my_int64', Number.MIN_SAFE_INTEGER)
      testOutput.write()
      try {
        await testInput.wait(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Error caught: ' + err)
        throw err
      }
      testInput.take()
      assert.strictEqual(testInput.samples.get(0).getNumber('my_int64'), Number.MIN_SAFE_INTEGER)
    })

    it('Can communicate large 64-bit numbers using getString and setString', async () => {
      testOutput.instance.setString('my_uint64', '9007199254740993')
      testOutput.instance.setString('my_int64', '-9007199254740993')
      testOutput.write()
      try {
        await testInput.wait(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Error caught: ' + err)
        throw err
      }
      testInput.take()
      assert.strictEqual(testInput.samples.get(0).getString('my_uint64'), '9007199254740993')
      assert.strictEqual(testInput.samples.get(0).getString('my_int64'), '-9007199254740993')
    })

    it('64-bit values larger than 2^53 are returned as strings by get', async () => {
      const largeIntAsString = '9007199254740993'
      testOutput.instance.setFromJson({
        my_int64: largeIntAsString,
        my_uint64: largeIntAsString
      })
      testOutput.write()
      try {
        await testInput.wait(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Error caught: ' + err)
        throw err
      }
      testInput.take()
      assert.strictEqual(typeof testInput.samples.get(0).get('my_uint64'), 'string')
      assert.strictEqual(testInput.samples.get(0).get('my_uint64'), largeIntAsString)
      assert.strictEqual(typeof testInput.samples.get(0).get('my_int64'), 'string')
      assert.strictEqual(testInput.samples.get(0).get('my_int64'), largeIntAsString)
    })

    it('64-bit values smaller or equal to 2^53 are returned as numbers by get', async () => {
      testOutput.instance.setFromJson({
        my_uint64: Number.MAX_SAFE_INTEGER,
        my_int64: Number.MIN_SAFE_INTEGER
      })
      testOutput.write()
      try {
        await testInput.wait(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Error caught: ' + err)
        throw err
      }
      testInput.take()
      assert.strictEqual(testInput.samples.get(0).get('my_uint64'), Number.MAX_SAFE_INTEGER)
      assert.strictEqual(typeof testInput.samples.get(0).get('my_uint64'), 'number')
      assert.strictEqual(testInput.samples.get(0).get('my_int64'), Number.MIN_SAFE_INTEGER)
      assert.strictEqual(typeof testInput.samples.get(0).get('my_int64'), 'number')
    })

    it('Can set large 64-bit numbers using type-agnostic setter', async () => {
      // Any integer value can be set via the type-agnostic setter when supplied
      // as a string (this differs from Python, where you could also supply it as
      // an int))
      testOutput.instance.set('my_uint64', '18446744073709551615')
      testOutput.instance.set('my_int64', '9223372036854775807')
      testOutput.write()
      try {
        await testInput.wait(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Error caught: ' + err)
        throw err
      }
      testInput.take()
      // The values will be returned as strings since they are > 2^53
      assert.strictEqual(testInput.samples.get(0).get('my_uint64'), '18446744073709551615')
      assert.strictEqual(testInput.samples.get(0).get('my_int64'), '9223372036854775807')
    })

    it('The JSON getter cannot handle large integers', async () => {
      // Provided the values are supplied as strings to the JSON object, there should
      // be no restriction on the size of the integer
      const jsonTx = {
        my_uint64: '18446744073709551615',
        my_int64: '9223372036854775807'
      }
      testOutput.instance.setFromJson(jsonTx)
      testOutput.write()
      try {
        await testInput.wait(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Error caught: ' + err)
        throw err
      }
      testInput.take()

      // The JSON.parse() call done in getFromJSON will result in the
      // values > Number.MAX_SAFE_INT being corrupted. We cannot detect this.
      const jsonRx = testInput.samples.get(0).getJson()
      assert.notDeepStrictEqual(jsonRx.my_int64, jsonTx.my_int64)
      assert.notDeepStrictEqual(jsonRx.my_uint64, jsonTx.my_uint64)
    })
  })
})

describe('Tests with two readers and two writers', () => {
  let connector = null
  let testOutput1 = null
  let testInput1 = null
  let testOutput2 = null
  let testInput2 = null

  beforeEach(async () => {
    const participantProfile = 'MyParticipantLibrary::DataAccessTest'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
    assert.ok(connector instanceof rti.Connector)
    testInput1 = connector.getInput('TestSubscriber::TestReader')
    assert.ok(testInput1)
    testOutput1 = connector.getOutput('TestPublisher::TestWriter')
    assert.ok(testOutput1)
    testInput2 = connector.getInput('TestSubscriber::TestReader2')
    assert.ok(testInput2)
    testOutput2 = connector.getOutput('TestPublisher::TestWriter2')
    assert.ok(testOutput2)

    // Wait for the input and output to dicovery each other
    try {
      const newMatches = await testOutput1.waitForSubscriptions(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
    try {
      const newMatches = await testOutput2.waitForSubscriptions(testExpectSuccessTimeout)
      assert.strictEqual(newMatches, 1)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
  })

  afterEach(async () => {
    // Take any data
    testInput1.take()
    testInput2.take()
    await connector.close()
  })

  // Since we have not written any data, all different forms of wait for data
  // should timeout
  it('waiting for data on connector should timeout', async () => {
    try {
      await connector.wait(testExpectFailureTimeout)
      assert.fail('Expected timeout but connector.wait succeeded')
    } catch (err) {
      assert.ok(err instanceof rti.TimeoutError)
    }
  })

  it('waiting for data on testInput should timeout', async () => {
    try {
      await testInput1.wait(testExpectFailureTimeout)
      assert.fail('Expected timeout but testInput1.wait succeeded')
    } catch (err) {
      assert.ok(err instanceof rti.TimeoutError)
    }
  })

  it('waiting for data on testInput2 should timeout', async () => {
    try {
      await testInput2.wait(testExpectFailureTimeout)
      assert.fail('Expected timeout but testInput2.wait succeeded')
    } catch (err) {
      assert.ok(err instanceof rti.TimeoutError)
    }
  })

  it('Writing data on a testOutput1 should wake up connector.wait', async () => {
    testOutput1.write()
    try {
      await connector.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
  })

  it('Writing data on a testOutput1 should wake up testInput1.wait', async () => {
    testOutput1.write()
    try {
      await testInput1.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
  })

  it('Writing data on a testOutput1 should not wake up testInput2.wait', async () => {
    testOutput1.write()
    try {
      await testInput2.wait(testExpectFailureTimeout)
      assert.fail('Expected timeout but testInput2.wait succeeded')
    } catch (err) {
      assert.ok(err instanceof rti.TimeoutError)
    }
  })

  it('Writing data on a testOutput2 should wake up connector.wait', async () => {
    testOutput2.write()
    try {
      await connector.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
  })

  it('Writing data on a testOutput2 should wake up testInput2.wait', async () => {
    testOutput2.write()
    try {
      await testInput2.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
  })

  it('Writing data on a testOutput2 should not wake up testInput1.wait', async () => {
    testOutput2.write()
    try {
      await testInput1.wait(testExpectFailureTimeout)
      assert.fail('Expected timeout but testInput1.wait succeeded')
    } catch (err) {
      assert.ok(err instanceof rti.TimeoutError)
    }
  })
})

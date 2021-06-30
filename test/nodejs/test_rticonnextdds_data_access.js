/******************************************************************************
* (c) 2019 Copyright, Real-Time Innovations.  All rights reserved.            *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
const os = require('os')
const ffi = require('ffi-napi')
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
// We provide a much shorter timeout to operations that we expect to timeout.
// This is to prevent us from hanging the tests for 10s
const testExpectFailureTimeout = 500

// These tests test the different ways to access data in Instance and SampleIterator
describe('Data access tests with a pre-populated input', function () {
  let connector = null
  let output = null
  let prepopulatedInput = null
  let sample = null
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
    expect(connector).to.exist.and.be.an.instanceof(rti.Connector)
    prepopulatedInput = connector.getInput('TestSubscriber::TestReader2')
    expect(prepopulatedInput).to.exist
    output = connector.getOutput('TestPublisher::TestWriter2')
    expect(output).to.exist

    // Wait for the input and output to dicovery each other
    try {
      const matches = await output.waitForSubscriptions(testExpectSuccessTimeout)
      expect(matches).to.be.at.least(1)
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
    expect(prepopulatedInput.samples.length).to.deep.equals(1)
    sample = prepopulatedInput.samples.get(0)
    expect(sample.validData).to.be.true
  })

  afterEach(() => {
    // Take all samples here to ensure that next test case has a clean input
    prepopulatedInput.take()
    connector.close()
  })

  it('getNumber should return a number', () => {
    expect(sample.getNumber('my_long')).to.deep.equals(10).and.is.a('number')
    expect(sample.get('my_long')).to.deep.equals(10).and.is.a('number')
  })

  it('getNumber requires a valid index', () => {
    expect(() => {
      prepopulatedInput.samples.getNumber('NAN', 'my_long')
    }).to.throw(TypeError)
  })

  it('getNumber requires a valid field name', () => {
    expect(() => {
      prepopulatedInput.samples.getNumber(0, 1)
    }).to.throw(TypeError)
  })

  it('getString on a number field should return a string', () => {
    expect(sample.getString('my_long')).to.deep.equals('10').and.is.a('string')
    expect(sample.getString('my_double')).to.deep.equals('3.3').and.is.a('string')
  })

  it('getString requires a valid index', () => {
    expect(() => {
      prepopulatedInput.samples.getString('NAN', 'my_string')
    }).to.throw(TypeError)
  })

  it('getString requires a valid field name', () => {
    expect(() => {
      prepopulatedInput.samples.getString(0, 1)
    }).to.throw(TypeError)
  })

  it('getBoolean should return a boolean', () => {
    expect(sample.getBoolean('my_optional_bool')).to.be.true.and.is.a('boolean')
    expect(sample.get('my_optional_bool')).to.be.true.and.is.a('boolean')
  })

  it('getBoolean requires a valid index', () => {
    expect(() => {
      prepopulatedInput.samples.getBoolean('NAN', 'my_optional_bool')
    }).to.throw(TypeError)
  })

  it('getBoolean requires a valid field name', () => {
    expect(() => {
      prepopulatedInput.samples.getBoolean(0, 1)
    }).to.throw(TypeError)
  })

  it('getValue requires a valid index', () => {
    expect(() => {
      prepopulatedInput.samples.getValue('NAN', 'my_optional_bool')
    }).to.throw(TypeError)
  })

  it('getValue requires a valid field name', () => {
    expect(() => {
      prepopulatedInput.samples.getValue(0, 1)
    }).to.throw(TypeError)
  })

  it('getNumber on a boolean field should return a number', () => {
    expect(sample.getNumber('my_optional_bool')).to.deep.equals(1).and.is.a('number')
  })

  it('getNumber on an enum should return the set value', () => {
    expect(sample.getNumber('my_enum')).to.deep.equals(1).and.is.a('number')
  })

  it('access a value nested within a struct', () => {
    expect(sample.getNumber('my_point.x')).to.deep.equals(3).and.is.a('number')
    expect(sample.getNumber('my_point.y')).to.deep.equals(4).and.is.a('number')
  })

  it('access values and sizes of sequences and arrays', () => {
    expect(sample.getNumber('my_point_sequence[0].y')).to.deep.equals(20).and.is.a('number')
    expect(sample.get('my_point_sequence[0].y')).to.deep.equals(20).and.is.a('number')
    expect(sample.getNumber('my_int_sequence[1]')).to.deep.equals(2).and.is.a('number')
    expect(sample.get('my_int_sequence[1]')).to.deep.equals(2).and.is.a('number')
    // The '#' appended to the type name should provide the length
    expect(sample.getNumber('my_point_sequence#')).to.deep.equals(2).and.is.a('number')
    expect(sample.get('my_point_sequence#')).to.deep.equals(2).and.is.a('number')
    expect(sample.getNumber('my_int_sequence#')).to.deep.equals(3).and.is.a('number')
    expect(sample.get('my_int_sequence#')).to.deep.equals(3).and.is.a('number')
    expect(sample.getNumber('my_point_array[4].x')).to.deep.equals(5).and.is.a('number')
    expect(sample.get('my_point_array[4].x')).to.deep.equals(5).and.is.a('number')
  })

  it('access values past the end of a sequence', () => {
    expect(sample.getNumber('my_point_sequence[9].y')).to.deep.equals(null)
    expect(sample.getNumber('my_int_sequence[9]')).to.deep.equals(null)
  })

  it('attempt to access non-existent members', () => {
    expect(() => {
      sample.getNumber('my_nonexistent_member')
    }).to.throw(rti.DDSError)
  })

  it('attempt to access members with bad sequence syntax', () => {
    expect(() => {
      sample.getNumber('my_point_sequence[9[.y')
    }).to.throw(rti.DDSError)
  })

  it('attempt to access the negative member of a sequence', () => {
    expect(() => {
      sample.getNumber('my_point_sequence[-1].y')
    }).to.throw(rti.DDSError)
  })

  it('getNumber on unions', () => {
    expect(sample.getNumber('my_union.my_int_sequence#')).to.deep.equals(3).and.is.a('number')
    expect(sample.getNumber('my_union.my_int_sequence[1]')).to.deep.equals(20).and.is.a('number')
    expect(sample.getNumber('my_int_union.my_long')).to.deep.equals(222).and.is.a('number')
  })

  it('obtain the selected member of a union with # syntax', () => {
    expect(sample.getString('my_int_union#')).to.deep.equals('my_long').and.is.a('string')
    expect(sample.getString('my_union#')).to.deep.equals('my_int_sequence').and.is.a('string')
    expect(sample.get('my_union#')).to.deep.equals('my_int_sequence').and.is.a('string')
  })

  it('obtain an unset optional member', () => {
    expect(sample.getNumber('my_optional_long')).to.deep.equals(null)
    expect(sample.get('my_optional_long')).to.deep.equals(null)
    expect(sample.getJson().my_optional_long).to.deep.equals(undefined)
  })

  it('obtain an unset optional member as a string', () => {
    expect(sample.getString('my_optional_long')).to.deep.equals(null)
  })

  it('obtain an unset optional complex member', () => {
    expect(sample.getNumber('my_optional_point.x')).to.deep.equals(null)
  })

  it('unset optional members should not be in JSON objects returned by getJSON', () => {
    expect(sample.getNumber('my_optional_point.x')).to.deep.equals(null)
    const jsonObj = sample.getJson()
    expect(Object.prototype.hasOwnProperty.call(jsonObj, 'my_optional_point')).to.be.false
  })

  it('get non-existent member with getJson', () => {
    expect(() => {
      sample.getJson('IDoNotExist')
    }).to.throw(rti.DDSError)
  })

  it('getJson requires valid index', () => {
    expect(() => {
      prepopulatedInput.samples.getJson('NAN')
    }).to.throw(TypeError)
  })

  it('if a member name is supplied to getJson, it must be a string', () => {
    expect(() => {
      prepopulatedInput.samples.getJson(1, 0)
    }).to.throw(TypeError)
  })

  it('attempt to get non-complex members with getJson', () => {
    expect(() => {
      sample.getJson('my_long')
    }).to.throw(rti.DDSError)
    expect(() => {
      sample.getJson('my_double')
    }).to.throw(rti.DDSError)
    expect(() => {
      sample.getJson('my_optional_bool')
    }).to.throw(rti.DDSError)
    expect(() => {
      sample.getJson('my_optional_long')
    }).to.throw(rti.DDSError)
    expect(() => {
      sample.getJson('my_string')
    }).to.throw(rti.DDSError)
    expect(() => {
      sample.getJson('my_enum')
    }).to.throw(rti.DDSError)
    expect(() => {
      sample.getJson('my_point.x')
    }).to.throw(rti.DDSError)
  })

  it('get complex members using getJson', () => {
    const thePoint = sample.getJson('my_point')
    expect(JSON.parse(JSON.stringify(thePoint))).to.deep.equals(thePoint)
    expect(thePoint.x).to.deep.equals(3).and.is.a('number')
    expect(thePoint.y).to.deep.equals(4).and.is.a('number')

    const thePointAlias = sample.getJson('my_point_alias')
    expect(JSON.parse(JSON.stringify(thePointAlias))).to.deep.equals(thePointAlias)
    expect(thePointAlias.x).to.deep.equals(30).and.is.a('number')
    expect(thePointAlias.y).to.deep.equals(40).and.is.a('number')

    const theUnion = sample.getJson('my_union')
    expect(JSON.parse(JSON.stringify(theUnion))).to.deep.equals(theUnion)
    expect(theUnion.my_int_sequence).to.be.an.instanceof([].constructor)
      .and.to.deep.equals([10, 20, 30])

    const thePointSequence = sample.getJson('my_point_sequence')
    expect(JSON.parse(JSON.stringify(thePointSequence))).to.deep.equals(thePointSequence)
    expect(thePointSequence).to.be.an.instanceof([].constructor)
      .and.to.deep.equals([{ x: 10, y: 20 }, { x: 11, y: 21 }])

    const thePointSequence0 = sample.getJson('my_point_sequence[0]')
    expect(JSON.parse(JSON.stringify(thePointSequence0))).to.deep.equals(thePointSequence0)
    expect(thePointSequence0.x).to.deep.equals(10)
    expect(thePointSequence0.y).to.deep.equals(20)

    const theArray = sample.getJson('my_point_array')
    expect(JSON.parse(JSON.stringify(theArray))).to.deep.equals(theArray)

    const theArray0 = sample.getJson('my_point_array[0]')
    expect(JSON.parse(JSON.stringify(theArray0))).to.deep.equals(theArray0)
    expect(theArray0.x).to.deep.equals(0)
    expect(theArray0.y).to.deep.equals(0)
  })

  it('get an unset optional complex member using getJson', () => {
    const unsetOptionalComplex = sample.getJson('my_optional_point')
    expect(unsetOptionalComplex).to.deep.equals(null)
  })

  // We do not run these tests on Windows since the symbols are not exported in the DLL
  if (os.platform() !== 'win32') {
    it('access native dynamic data pointer', () => {
      const additionalApi = ffi.Library(rti.connectorBinding.library, {
        DDS_DynamicData_get_member_count: ['uint', ['pointer']]
      })
      const memberCount = additionalApi.DDS_DynamicData_get_member_count(sample.native)
      expect(memberCount).to.be.greaterThan(0)
    })
  }

  it('get complex members using get', () => {
    const thePoint = sample.get('my_point')
    // Since my_point is a struct it should have been converted to a JSON object
    expect(JSON.parse(JSON.stringify(thePoint))).to.deep.equals(thePoint)
    expect(thePoint.x).to.deep.equals(3)
    expect(thePoint.y).to.deep.equals(4)

    const thePointSequence = sample.get('my_point_sequence')
    expect(JSON.parse(JSON.stringify(thePointSequence))).to.deep.equals(thePointSequence)
    expect(thePointSequence).to.be.an.instanceof([].constructor)
    expect(thePointSequence[0]).to.deep.equals({ x: 10, y: 20 })
    expect(thePointSequence[1]).to.deep.equals({ x: 11, y: 21 })

    const thePointArray = sample.get('my_point_array')
    expect(JSON.parse(JSON.stringify(thePointArray))).to.deep.equals(thePointArray)
    expect(thePointArray).to.be.an.instanceof([].constructor)
    expect(thePointArray[0]).to.deep.equals({ x: 0, y: 0 })
    expect(thePointArray[4]).to.deep.equals({ x: 5, y: 15 })

    const thePointAlias = sample.get('my_point_alias')
    // Alias should be resolved so we now have a JSON object
    expect(JSON.parse(JSON.stringify(thePointAlias))).to.deep.equals(thePointAlias)
    expect(thePointAlias.x).to.deep.equals(30)
    expect(thePointAlias.y).to.deep.equals(40)

    const theOptionalPoint = sample.get('my_optional_point')
    // Unset optional should return null
    expect(theOptionalPoint).to.deep.equals(null)

    const theUnion = sample.get('my_union')
    // Since no trailing '#' was supplied we should now have the JSON object
    expect(JSON.parse(JSON.stringify(theUnion))).to.deep.equals(theUnion)
    expect(theUnion).to.deep.equals({ my_int_sequence: [10, 20, 30] })
  })

  it('Try to obtain complex members with getNumber', () => {
    expect(() => {
      sample.getNumber('my_point')
    }).to.throw(rti.DDSError)
  })

  it('Try to obtain complex members with getBoolean', () => {
    expect(() => {
      sample.getBoolean('my_point')
    }).to.throw(rti.DDSError)
  })

  it('Try to obtain complex members with getString', () => {
    // It should be possible to complex members with getString, but the returned
    // object will have a type of 'string', not a JSON object
    const complexString = sample.getString('my_point')
    expect(complexString).to.be.a('string')
    // The string should be parsable by JSON
    const complexJson = JSON.parse(complexString)
    expect(complexJson).to.be.an.instanceof({}.constructor)
    expect(complexJson.x).to.deep.equals(3)
  })

  it('Try to obtain complex arrays with getString', () => {
    // It should be possible to complex members with getString, but the returned
    // object will have a type of 'string', not a JSON object
    const complexString = sample.getString('my_point_array')
    expect(complexString).to.be.a('string')
    // The string should be parsable by JSON
    const complexJson = JSON.parse(complexString)
    expect(complexJson).to.be.an.instanceof([].constructor)
    expect(complexJson[0].x).to.deep.equals(0)
  })

  it('Obtain JSON string of dictionary', () => {
    const jsonInstance = output.instance.getJson()
    expect(jsonInstance).to.deep.equals(testJsonObject)
  })

  it('samples.getNative requires valid index', () => {
    expect(() => {
      prepopulatedInput.samples.getNative('NAN')
    }).to.throw(TypeError)
  })
})

describe('Tests with a testOutput and testInput', () => {
  let connector = null
  let testOutput = null
  let testInput = null
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
      console.log('Caught err ' + err)
      throw (err)
    }
  })

  afterEach(() => {
    // Take all samples here to ensure that next test case has a clean input
    testInput.take()
    connector.close()
  })

  if (os.platform() !== 'win32') {
    it('test native API on output', () => {
      const additionalApi = ffi.Library(rti.connectorBinding.library, {
        DDS_DynamicData_get_member_count: ['uint', ['pointer']]
      })
      const memberCount = additionalApi.DDS_DynamicData_get_member_count(testOutput.instance.native)
      expect(memberCount).to.be.greaterThan(0)
    })
  }

  it('pass null as field name to setX APIs on output', () => {
    expect(() => {
      testOutput.instance.setBoolean(null, true)
    }).to.throw(TypeError)

    expect(() => {
      testOutput.instance.setNumber(null, 1)
    }).to.throw(TypeError)

    expect(() => {
      testOutput.instance.setString(null, 'hello')
    }).to.throw(TypeError)
  })

  it('try to set a number with a string', () => {
    expect(() => {
      testOutput.instance.setNumber('my_long', 'hello')
    }).to.throw(TypeError)
  })

  it('try to set a boolean with a string', () => {
    expect(() => {
      testOutput.instance.setBoolean('my_optional_bool', 'hello')
    }).to.throw(TypeError)
  })

  it('try to set non-existent field names', () => {
    expect(() => {
      testOutput.instance.setNumber('NonExistent', 1)
    }).to.throw(rti.DDSError)

    expect(() => {
      testOutput.instance.setBoolean('NonExistent', false)
    }).to.throw(rti.DDSError)

    expect(() => {
      testOutput.instance.setString('NonExistent', 'hello')
    }).to.throw(rti.DDSError)
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const receivedJsonObject = testInput.samples.get(0).getJson()
    expect(receivedJsonObject).to.deep.equals(testJsonObject)
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
      expect(() => {
        testOutput.instance.setFromJson({ field: 'this is not a number' })
        console.log(field + ' did not raise an exception')
      }).to.throw(rti.DDSError)
    }
  })

  it('Attempt to access past the end of a sequence using setFromJson', async () => {
    expect(() => {
      // my_int_sequence has a bound of 10 and we are supplying 11 elements
      testOutput.instance.setFromJson({ my_int_sequence: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10] })
    }).to.throw(rti.DDSError)
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
    expect(received).to.deep.equals(sent)
  })

  it('Attempt to pass an invalid JSON object to setFromJson', async () => {
    expect(() => {
      testOutput.instance.setFromJson({ my_point_sequence: [{ x: 1, y: 2 }, { x: 3, bad: 4 }] })
    }).to.throw(rti.DDSError)
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
    expect(received).to.deep.equals(sent)
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
    expect(sample.getJson('my_point_sequence')).to.deep.equals(sample.get('my_point_sequence'))
  })

  it('Set a boolean field using setNumber and check the resultant value on an input', async () => {
    testOutput.instance.setNumber('my_optional_bool', 1)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught err: ' + err)
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const theOptionalBool = testInput.samples.get(0).get('my_optional_bool')
    expect(theOptionalBool).to.be.a('boolean').and.deep.equals(true)
  })

  it('Set a string with a number and check the resultant value on an input', async () => {
    testOutput.instance.setString('my_string', '1234')
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught err: ' + err)
      // Fail the test
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const theNumericString = testInput.samples.get(0).get('my_string')
    // Due to CON-139 get returns strings as numbers if they represent a number
    expect(theNumericString).to.be.a('number').and.deep.equals(1234)
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    expect(sample.get('my_point_sequence[0].y')).to.be.a('number').and.deep.equals(20)
    expect(sample.get('my_int_sequence[1]')).to.be.a('number').and.deep.equals(2)
    expect(sample.get('my_point_array[4].x')).to.be.a('number').and.deep.equals(5)
    expect(sample.get('my_point_sequence#')).to.be.a('number').and.deep.equals(1)
    expect(sample.get('my_int_sequence#')).to.be.a('number').and.deep.equals(2)
  })

  it('Change union members', async () => {
    testOutput.instance.setNumber('my_union.my_int_sequence[1]', 3)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Caught error: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    let sample = testInput.samples.get(0)
    expect(sample.getString('my_union#')).to.be.a('string').that.deep.equals('my_int_sequence')

    // Change the union to long
    testOutput.instance.setNumber('my_union.my_long', 3)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Caught error: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    sample = testInput.samples.get(0)
    expect(sample.getString('my_union#')).to.be.a('string').that.deep.equals('my_long')
    expect(sample.getNumber('my_union.my_long')).to.be.a('number').that.deep.equals(3)
  })

  it('Change union members', async () => {
    testOutput.instance.setNumber('my_union.my_int_sequence[1]', 3)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Caught error: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    let sample = testInput.samples.get(0)
    expect(sample.getString('my_union#')).to.deep.equals('my_int_sequence')
      .and.is.a('string')
    // Change the union
    testOutput.instance.setNumber('my_union.my_long', 3)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Caught error: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    sample = testInput.samples.get(0)
    expect(sample.getString('my_union#')).to.deep.equals('my_long')
      .and.is.a('string')
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    expect(sample.getNumber('my_optional_point.x')).to.deep.equals(101)
      .and.is.a('number')
    expect(sample.getNumber('my_point_alias.x')).to.deep.equals(202)
      .and.is.a('number')
  })

  it('Get an unset optional boolean', async () => {
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Caught error: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const unsetOptional = testInput.samples.get(0).getBoolean('my_optional_bool')
    expect(unsetOptional).to.deep.equals(null)
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    expect(sample.getNumber('my_optional_long'))
      .to.deep.equals(null)
    expect(Object.prototype.hasOwnProperty.call(sample.getJson(), 'my_optional_long'))
      .to.be.false
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    expect(sample.getNumber('my_optional_bool'))
      .to.deep.equals(null)
    expect(Object.prototype.hasOwnProperty.call(sample.getJson(), 'my_optional_bool'))
      .to.be.false
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    expect(sample.getNumber('my_optional_point.x'))
      .to.deep.equals(null)
    expect(Object.prototype.hasOwnProperty.call(sample.getJson(), 'my_optional_point'))
      .to.be.false
    expect(sample.getNumber('my_point_alias.x'))
      .to.deep.equals(null)
    expect(Object.prototype.hasOwnProperty.call(sample.getJson(), 'my_point_alias'))
      .to.be.false
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    expect(sample.getNumber('my_union.my_int_sequence#')).to.deep.equals(0)
    expect(sample.getNumber('my_point.x')).to.deep.equals(3)
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    expect(sample.getNumber('my_optional_point.x')).to.deep.equals(null)
    expect(sample.getNumber('my_optional_long')).to.deep.equals(null)
    expect(sample.getNumber('my_point.x')).to.deep.equals(0)
    expect(sample.getNumber('my_point.y')).to.deep.equals(0)
    expect(sample.getNumber('my_point_alias.y')).to.deep.equals(null)
    expect(sample.getNumber('my_long')).to.deep.equals(0)
    expect(sample.getBoolean('my_optional_bool')).to.deep.equals(null)
    expect(sample.getNumber('my_point_sequence#')).to.deep.equals(0)
    expect(sample.getString('my_string')).to.deep.equals('')
    expect(sample.getString('my_union#')).to.deep.equals('point')
    expect(sample.getNumber('my_enum')).to.deep.equals(2)
    const jsonObj = sample.getJson()
    expect(Object.prototype.hasOwnProperty.call(jsonObj, 'my_optional_bool')).to.be.false
    expect(Object.prototype.hasOwnProperty.call(jsonObj, 'my_optional_long')).to.be.false
    expect(Object.prototype.hasOwnProperty.call(jsonObj, 'my_point_alias')).to.be.false
    expect(Object.prototype.hasOwnProperty.call(jsonObj, 'my_optional_point')).to.be.false
  })

  it('Clear a non-existent member', () => {
    expect(() => {
      testOutput.instance.clearMember('nonexistent_member')
    }).to.throw(rti.DDSError)
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    let sample = testInput.samples.get(0)
    expect(sample.getNumber('my_union.my_int_sequence#')).to.deep.equals(3)
    expect(sample.getNumber('my_point.x')).to.deep.equals(3)
    expect(sample.getNumber('my_point_sequence#')).to.deep.equals(2)

    testOutput.instance.setFromJson({ my_int_sequence: [] })
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    sample = testInput.samples.get(0)
    expect(sample.getNumber('my_int_sequence#')).to.deep.equals(0)
    // The other fields are unchanged
    expect(sample.getNumber('my_point.x')).to.deep.equals(3)
    expect(sample.getNumber('my_point_sequence#')).to.deep.equals(2)
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    sample = testInput.samples.get(0)
    expect(sample.getBoolean('my_optional_bool')).to.be.null
    expect(sample.getBoolean('my_optional_point')).to.be.null
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    sample = testInput.samples.get(0)
    expect(sample.getBoolean('my_optional_bool')).to.be.null
    expect(sample.getBoolean('my_optional_point')).to.be.null
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    sample = testInput.samples.get(0)
    expect(sample.getString('my_string')).to.deep.equals('')
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    expect(sample.getNumber('my_int_sequence#')).to.deep.equals(1)
    expect(sample.getNumber('my_point_sequence#')).to.deep.equals(1)
    expect(sample.getNumber('my_int_sequence[0]')).to.deep.equals(40)
    expect(sample.getNumber('my_point_sequence[0].y')).to.deep.equals(2)
    expect(sample.getNumber('my_point_sequence[0].x')).to.deep.equals(0)
    expect(sample.getNumber('my_point_array[0].x')).to.deep.equals(100)
    expect(sample.getNumber('my_point_array[0].y')).to.deep.equals(20)
    expect(sample.getNumber('my_point_array[4].x')).to.deep.equals(14)
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    const sample = testInput.samples.get(0)
    expect(sample.get('my_string')).to.deep.equals('Hello, World!')
    expect(sample.get('my_boolean')).to.deep.equals(true)
    expect(sample.get('my_int64')).to.deep.equals(42)
    expect(sample.get('my_point_sequence[0].x')).to.deep.equals(3)
  })

  it('Reset an optional member using the type independent set method', async () => {
    testOutput.instance.set('my_optional_bool', null)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    expect(testInput.samples.get(0).get('my_optional_bool')).to.deep.equals(null)
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    expect(testInput.samples.get(0).get('my_point_sequence[2]')).to.deep.equals({ x: 111, y: 153 })
    expect(testInput.samples.get(0).get('my_point_sequence[3]')).to.deep.equals({ x: 444, y: 555 })
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    expect(testInput.samples.get(0).get('my_point')).to.deep.equals(jsonObj)
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
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    expect(testInput.samples.get(0).get('my_int_sequence')).to.deep.equals(intSeq)
    expect(testInput.samples.get(0).get('my_point_sequence')).to.deep.equals(pointSeq)
  })

  it('Can clear an element of a complex sequence', async () => {
    let pointSeq = [{ x: 100, y: 200 }, { x: 300, y: 400 }, { x: 500, y: 600 }]
    testOutput.instance.set('my_point_sequence', pointSeq)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    expect(testInput.samples.get(0).get('my_point_sequence')).to.deep.equals(pointSeq)
    // Now we clear an element in the middle of the sequence
    pointSeq = [{ x: 100, y: 200 }, null, { x: 500, y: 600 }]
    testOutput.instance.set('my_point_sequence', pointSeq)
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    expect(testInput.samples.get(0).get('my_point_sequence[0]')).to.deep.equals({ x: 100, y: 200 })
    expect(testInput.samples.get(0).get('my_point_sequence[1]')).to.deep.equals({ x: 0, y: 0 })
    expect(testInput.samples.get(0).get('my_point_sequence[2]')).to.deep.equals({ x: 500, y: 600 })
  })

  it('Can set enum via name', async () => {
    testOutput.instance.setFromJson({ my_enum: 'GREEN' })
    testOutput.write()
    try {
      await testInput.wait(testExpectSuccessTimeout)
    } catch (err) {
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
    testInput.take()
    expect(testInput.samples.get(0).get('my_enum')).to.deep.equals(1)
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
    expect(connector).to.exist.and.be.an.instanceof(rti.Connector)
    testInput1 = connector.getInput('TestSubscriber::TestReader')
    expect(testInput1).to.exist
    testOutput1 = connector.getOutput('TestPublisher::TestWriter')
    expect(testOutput1).to.exist
    testInput2 = connector.getInput('TestSubscriber::TestReader2')
    expect(testInput2).to.exist
    testOutput2 = connector.getOutput('TestPublisher::TestWriter2')
    expect(testOutput2).to.exist

    // Wait for the input and output to dicovery each other
    try {
      const newMatches = await testOutput1.waitForSubscriptions(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
    try {
      const newMatches = await testOutput2.waitForSubscriptions(testExpectSuccessTimeout)
      expect(newMatches).to.deep.equals(1)
    } catch (err) {
      console.log('Caught err: ' + err)
      throw (err)
    }
  })

  afterEach(() => {
    // Take any data
    testInput1.take()
    testInput2.take()
    connector.close()
  })

  // Since we have not written any data, all different forms of wait for data
  // should timeout
  it('waiting for data on connector should timeout', async () => {
    try {
      await connector.wait(testExpectFailureTimeout)
      console.log('Expected connector.wait to timeout but it did not')
      throw (err)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }
  })

  it('waiting for data on testInput should timeout', async () => {
    try {
      await testInput1.wait(testExpectFailureTimeout)
      console.log('Expected testInput1.wait to timeout but it did not')
      throw (err)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }
  })

  it('waiting for data on testInput2 should timeout', async () => {
    try {
      await testInput2.wait(testExpectFailureTimeout)
      console.log('Expected testInput2.wait to timeout but it did not')
      throw (err)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
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
      console.log('Expected testInput2.wait to timeout but it did not')
      throw (err)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
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
      console.log('Expected testInput2.wait to timeout but it did not')
      throw (err)
    } catch (err) {
      expect(err).to.be.an.instanceof(rti.TimeoutError)
    }
  })
})

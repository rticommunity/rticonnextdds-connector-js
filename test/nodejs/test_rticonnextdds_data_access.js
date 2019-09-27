/******************************************************************************
* (c) 2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

var path = require('path')
var os = require('os')
var ffi = require('ffi')
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var expect = chai.expect
chai.config.includeStack = true
chai.use(chaiAsPromised)
var should = chai.should
var rti = require(path.join(__dirname, '/../../rticonnextdds-connector'))

// We have to do this due to the expect() syntax of chai and the fact
// that we install mocha globally
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

// These tests test the different wats to access data in Instance and SampleIterator
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
    my_point_array: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, {x: 5, y: 15 }],
    my_boolean: false,
    my_int64: -18014398509481984,
    my_uint64: 18014398509481984
  }

  beforeEach(() => {
    const participantProfile = 'MyParticipantLibrary::DataAccessTest'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
    expect(connector).to.exist.and.be.an.instanceof(rti.Connector)
    prepopulatedInput = connector.getInput('TestSubscriber::TestReader2')
    expect(prepopulatedInput).to.exist
    output = connector.getOutput('TestPublisher::TestWriter2')
    expect(output).to.exist

    // Wait for the input and output to dicovery each other
    expect(output.waitForSubscriptions(2000)).to.eventually.become(1)
    // Write data on the the output
    output.instance.setFromJson(testJsonObject)
    output.write()
    // Wait for data to arrive on input
    expect(prepopulatedInput.wait()).to.eventually.be.fulfilled
    // Take the data on the input so that we can access it from the test
    prepopulatedInput.take()
    expect(prepopulatedInput.sampleCount).to.deep.equals(1)
    sample = prepopulatedInput.getSample(0)
    expect(sample.validData).to.be.true
  })

  afterEach(() => {
    // Take all samples here to ensure that next test case has a clean input
    prepopulatedInput.take()
    connector.close()
  })

  // it('getNumber should return a number', () => {
  //   expect(sample.getNumber('my_long')).to.deep.equals(10).and.is.a('number')
  //   expect(sample.getValue('my_long')).to.deep.equals(10).and.is.a('number')
  // })

  // it('getString on a number field should return a string', () => {
  //   expect(sample.getString('my_long')).to.deep.equals('10').and.is.a('string')
  //   expect(sample.getString('my_double')).to.deep.equals('3.3').and.is.a('string')
  // })

  // it('getBoolean should return a boolean', () => {
  //   expect(sample.getBoolean('my_optional_bool')).to.be.true.and.is.a('boolean')
  //   expect(sample.getValue('my_optional_bool')).to.be.true.and.is.a('boolean')
  // })

  // it('getNumber on a boolean field should return a number', () => {
  //   expect(sample.getNumber('my_optional_bool')).to.deep.equals(1).and.is.a('number')
  // })

  // it('getNumber on an enum should return the set value', () => {
  //   expect(sample.getNumber('my_enum')).to.deep.equals(1).and.is.a('number')
  // })

  // it('access a value nested within a struct', () => {
  //   expect(sample.getNumber('my_point.x')).to.deep.equals(3).and.is.a('number')
  //   expect(sample.getNumber('my_point.y')).to.deep.equals(4).and.is.a('number')
  // })

  // it('access values and sizes of sequences and arrays', () => {
  //   expect(sample.getNumber('my_point_sequence[0].y')).to.deep.equals(20).and.is.a('number')
  //   expect(sample.getValue('my_point_sequence[0].y')).to.deep.equals(20).and.is.a('number')
  //   expect(sample.getNumber('my_int_sequence[1]')).to.deep.equals(2).and.is.a('number')
  //   expect(sample.getValue('my_int_sequence[1]')).to.deep.equals(2).and.is.a('number')
  //   // The '#' appended to the type name should provide the length
  //   expect(sample.getNumber('my_point_sequence#')).to.deep.equals(2).and.is.a('number')
  //   expect(sample.getValue('my_point_sequence#')).to.deep.equals(2).and.is.a('number')
  //   expect(sample.getNumber('my_int_sequence#')).to.deep.equals(3).and.is.a('number')
  //   expect(sample.getValue('my_int_sequence#')).to.deep.equals(3).and.is.a('number')
  //   expect(sample.getNumber('my_point_array[4].x')).to.deep.equals(5).and.is.a('number')
  //   expect(sample.getValue('my_point_array[4].x')).to.deep.equals(5).and.is.a('number')
  // })

  // it('access values past the end of a sequence', () => {
  //   expect(sample.getNumber('my_point_sequence[9].y')).to.deep.equals(null)
  //   expect(sample.getNumber('my_int_sequence[9]')).to.deep.equals(null)
  // })

  // it('attempt to access non-existent members', () => {
  //   expect(() => {
  //     sample.getNumber('my_nonexistent_member')
  //   }).to.throw(rti.DDSError)
  // })

  // it('attempt to access members with bad sequence syntax', () => {
  //   expect(() => {
  //     sample.getNumber('my_point_sequence[9[.y')
  //   }).to.throw(rti.DDSError)
  // })

  // it('attempt to access the negative member of a sequence', () => {
  //   expect(() => {
  //     sample.getNumber('my_point_sequence[-1].y')
  //   }).to.throw(rti.DDSError)
  // })

  // it('getNumber on unions', () => {
  //   expect(sample.getNumber('my_union.my_int_sequence#')).to.deep.equals(3).and.is.a('number')
  //   expect(sample.getNumber('my_union.my_int_sequence[1]')).to.deep.equals(20).and.is.a('number')
  //   expect(sample.getNumber('my_int_union.my_long')).to.deep.equals(222).and.is.a('number')
  // })

  // it('obtain the selected member of a union with # syntax', () => {
  //   expect(sample.getString('my_int_union#')).to.deep.equals('my_long').and.is.a('string')
  //   expect(sample.getString('my_union#')).to.deep.equals('my_int_sequence').and.is.a('string')
  //   expect(sample.getValue('my_union#')).to.deep.equals('my_int_sequence').and.is.a('string')
  // })

  // it('obtain an unset optional member', () => {
  //   expect(sample.getNumber('my_optional_long')).to.deep.equals(null)
  //   expect(sample.getValue('my_optional_long')).to.deep.equals(null)
  //   expect(sample.getJson().my_optional_long).to.deep.equals(undefined)
  // })

  // it('obtain an unset optional member as a string', () => {
  //   expect(sample.getString('my_optional_long')).to.deep.equals(null)
  // })

  // it('obtain an unset optional complex member', () => {
  //   expect(sample.getNumber('my_optional_point.x')).to.deep.equals(null)
  // })

  // it('unset optional members should not be in JSON objects returned by getJSON', () => {
  //   // expect(sample.getNumber('my_optional_point.x')).to.deep.equals(null)
  //   const jsonObj = sample.getJson()
  //   expect(Object.prototype.hasOwnProperty.call(jsonObj, 'my_optional_point')).to.be.false
  // })

  // it('get non-existent member with getJson', () => {
  //   expect(() => {
  //     sample.getJson('IDoNotExist')
  //   }).to.throw(rti.DDSError)
  // })

  // it('attempt to get non-complex members with getJson', () => {
  //   expect(() => {
  //     sample.getJson('my_long')
  //   }).to.throw(rti.DDSError)
  //   expect(() => {
  //     sample.getJson('my_double')
  //   }).to.throw(rti.DDSError)
  //   expect(() => {
  //     sample.getJson('my_optional_bool')
  //   }).to.throw(rti.DDSError)
  //   expect(() => {
  //     sample.getJson('my_optional_long')
  //   }).to.throw(rti.DDSError)
  //   expect(() => {
  //     sample.getJson('my_string')
  //   }).to.throw(rti.DDSError)
  //   expect(() => {
  //     sample.getJson('my_enum')
  //   }).to.throw(rti.DDSError)
  //   expect(() => {
  //     sample.getJson('my_point.x')
  //   }).to.throw(rti.DDSError)
  // })

  // it('get complex members using getJson', () => {
  //   const thePoint = sample.getJson('my_point')
  //   expect(JSON.parse(JSON.stringify(thePoint))).to.deep.equals(thePoint)
  //   expect(thePoint.x).to.deep.equals(3).and.is.a('number')
  //   expect(thePoint.y).to.deep.equals(4).and.is.a('number')

  //   const thePointAlias = sample.getJson('my_point_alias')
  //   expect(JSON.parse(JSON.stringify(thePointAlias))).to.deep.equals(thePointAlias)
  //   expect(thePointAlias.x).to.deep.equals(30).and.is.a('number')
  //   expect(thePointAlias.y).to.deep.equals(40).and.is.a('number')

  //   theUnion = sample.getJson('my_union')
  //   expect(JSON.parse(JSON.stringify(theUnion))).to.deep.equals(theUnion)
  //   expect(theUnion.my_int_sequence).to.be.an.instanceof([].constructor)
  //     .and.to.deep.equals([10, 20, 30])

  //   thePointSequence = sample.getJson('my_point_sequence')
  //   expect(JSON.parse(JSON.stringify(thePointSequence))).to.deep.equals(thePointSequence)
  //   expect(thePointSequence).to.be.an.instanceof([].constructor)
  //     .and.to.deep.equals([{ x: 10, y: 20 }, { x: 11, y: 21 }])

  //   thePointSequence0 = sample.getJson('my_point_sequence[0]')
  //   expect(JSON.parse(JSON.stringify(thePointSequence0))).to.deep.equals(thePointSequence0)
  //   expect(thePointSequence0.x).to.deep.equals(10)
  //   expect(thePointSequence0.y).to.deep.equals(20)

  //   theArray = sample.getJson('my_point_array')
  //   expect(JSON.parse(JSON.stringify(theArray))).to.deep.equals(theArray)

  //   theArray0 = sample.getJson('my_point_array[0]')
  //   expect(JSON.parse(JSON.stringify(theArray0))).to.deep.equals(theArray0)
  //   expect(theArray0.x).to.deep.equals(0)
  //   expect(theArray0.y).to.deep.equals(0)
  // })

  // it('get an unset optional complex member using getJson', () => {
  //   unsetOptionalComplex = sample.getJson('my_optional_point')
  //   expect(unsetOptionalComplex).to.deep.equals(null)
  // })

  // // We do not run these tests on Windows since the symbols are not exported in the DLL
  // if (os.platform() !== 'win32') {
  //   it('access native dynamic data pointer', () => {
  //     const additionalApi = ffi.Library(rti.connectorBinding.library, {
  //       DDS_DynamicData_get_member_count: ['uint', ['pointer']]
  //     })
  //     const memberCount = additionalApi.DDS_DynamicData_get_member_count(sample.native)
  //     expect(memberCount).to.be.greaterThan(0)
  //   })
  // }

  // it('get complex members using getValue', () => {
  //   const thePoint = sample.getValue('my_point')
  //   // Since my_point is a struct it should have been converted to a JSON object
  //   expect(JSON.parse(JSON.stringify(thePoint))).to.deep.equals(thePoint)
  //   expect(thePoint.x).to.deep.equals(3)
  //   expect(thePoint.y).to.deep.equals(4)

  //   const thePointSequence = sample.getValue('my_point_sequence')
  //   expect(JSON.parse(JSON.stringify(thePointSequence))).to.deep.equals(thePointSequence)
  //   expect(thePointSequence).to.be.an.instanceof([].constructor)
  //   expect(thePointSequence[0]).to.deep.equals({ x: 10, y: 20 })
  //   expect(thePointSequence[1]).to.deep.equals({ x: 11, y: 21 })

  //   const thePointArray = sample.getValue('my_point_array')
  //   expect(JSON.parse(JSON.stringify(thePointArray))).to.deep.equals(thePointArray)
  //   expect(thePointArray).to.be.an.instanceof([].constructor)
  //   expect(thePointArray[0]).to.deep.equals({ x: 0, y: 0 })
  //   expect(thePointArray[4]).to.deep.equals({ x: 5, y: 15 })

  //   const thePointAlias = sample.getValue('my_point_alias')
  //   // Alias should be resolved so we now have a JSON object
  //   expect(JSON.parse(JSON.stringify(thePointAlias))).to.deep.equals(thePointAlias)
  //   expect(thePointAlias.x).to.deep.equals(30)
  //   expect(thePointAlias.y).to.deep.equals(40)

  //   const theOptionalPoint = sample.getValue('my_optional_point')
  //   // Unset optional should return null
  //   expect(theOptionalPoint).to.deep.equals(null)

  //   const theUnion = sample.getValue('my_union')
  //   // Since no trailing '#' was supplied we should now have the JSON object
  //   expect(JSON.parse(JSON.stringify(theUnion))).to.deep.equals(theUnion)
  //   expect(theUnion).to.deep.equals({ my_int_sequence: [10, 20, 30] })
  // })

  // it('Try to obtain complex members with getNumber', () => {
  //   expect(() => {
  //     sample.getNumber('my_point')
  //   }).to.throw(rti.DDSError)
  // })

  // it('Try to obtain complex members with getBoolean', () => {
  //   expect(() => {
  //     sample.getBoolean('my_point')
  //   }).to.throw(rti.DDSError)
  // })

  // it('Try to obtain complex members with getString', () => {
  //   // It should be possible to complex members with getString, but the returned
  //   // object will have a type of 'string', not a JSON object
  //   const complexString = sample.getString('my_point')
  //   expect(complexString).to.be.a('string')
  //   // The string should be parsable by JSON
  //   const complexJson = JSON.parse(complexString)
  //   expect(complexJson).to.be.an.instanceof({}.constructor)
  //   expect(complexJson.x).to.deep.equals(3)
  // })

  // it('Try to obtain complex arrays with getString', () => {
  //   // It should be possible to complex members with getString, but the returned
  //   // object will have a type of 'string', not a JSON object
  //   const complexString = sample.getString('my_point_array')
  //   expect(complexString).to.be.a('string')
  //   // The string should be parsable by JSON
  //   const complexJson = JSON.parse(complexString)
  //   expect(complexJson).to.be.an.instanceof([].constructor)
  //   expect(complexJson[0].x).to.deep.equals(0)
  // })
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
    my_point_array: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, {x: 5, y: 15 }],
    my_boolean: false,
    my_int64: -18014398509481984,
    my_uint64: 18014398509481984
  }

  beforeEach(() => {
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

  // if (os.platform() !== 'win32') {
  //   it('test native API on output', () => {
  //     const additionalApi = ffi.Library(rti.connectorBinding.library, {
  //       DDS_DynamicData_get_member_count: ['uint', ['pointer']]
  //     })
  //     const memberCount = additionalApi.DDS_DynamicData_get_member_count(testOutput.instance.native)
  //     expect(memberCount).to.be.greaterThan(0)
  //   })
  // }

  // it('pass null as field name to setX APIs on output', () => {
  //   expect(() => {
  //     testOutput.instance.setBoolean(null, true)
  //   }).to.throw(TypeError)

  //   expect(() => {
  //     testOutput.instance.setNumber(null, 1)
  //   }).to.throw(TypeError)

  //   expect(() => {
  //     testOutput.instance.setString(null, 'hello')
  //   }).to.throw(TypeError)
  // })

  // it('try to set a number with a string', () => {
  //   expect(() => {
  //     testOutput.instance.setNumber('my_long', 'hello')
  //   }).to.throw(TypeError)
  // })

  // it('try to set a boolean with a string', () => {
  //   expect(() => {
  //     testOutput.instance.setBoolean('my_optional_bool', 'hello')
  //   }).to.throw(TypeError)
  // })

  // it('try to set non-existent field names', () => {
  //   expect(() => {
  //     testOutput.instance.setNumber('NonExistent', 1)
  //   }).to.throw(rti.DDSError)

  //   expect(() => {
  //     testOutput.instance.setBoolean('NonExistent', false)
  //   }).to.throw(rti.DDSError)

  //   expect(() => {
  //     testOutput.instance.setString('NonExistent', 'hello')
  //   }).to.throw(rti.DDSError)
  // })

  // it('Supply a JSON object where everything is a string', () => {
  //   testOutput.instance.setFromJson({
  //     my_long: '10',
  //     my_double: '3.3',
  //     my_optional_bool: true,
  //     my_enum: '1',
  //     my_string: 'hello',
  //     my_point: { x: '3', y: '4' },
  //     my_point_alias: { x: '30', y: '40' },
  //     my_union: { my_int_sequence: ['10', '20', '30'] },
  //     my_int_union: { my_long: '222' },
  //     my_point_sequence: [{ x: '10', y: '20' }, { x: '11', y: '21' }],
  //     my_int_sequence: ['1', '2', '3'],
  //     my_point_array: [{ x: '0', y: '0' }, { x: '0', y: '0' }, { x: '0', y: '0' }, { x: '0', y: '0' }, { x: '5', y: '15' }],
  //     my_boolean: false,
  //     my_int64: '-18014398509481984',
  //     my_uint64: '18014398509481984'
  //   })
  //   testOutput.write()
  //   testInput.wait(2000).then(() => {
  //     testInput.take()
  //     const receivedJsonObject = testInput.getSample(0).getJson()
  //     expect(receivedJsonObject).deep.equals(testJsonObject)
  //   }).catch(() => {
  //     // Fail the test
  //     expect(false).to.deep.equals(true)
  //   })
  // })

  // it('Bad conversion from string in JSON object', () => {
  //   // For each numeric field, test that setFromJson fails when the value we provide
  //   // does not represent a number
  //   const fieldNames = [
  //     'my_long',
  //     'my_int64',
  //     'my_double',
  //     'my_point_array[1]',
  //     'my_int_sequence[1]',
  //     'my_enum',
  //     'my_uint64']
  //   for (field of fieldNames) {
  //     expect(() => {
  //       testOutput.instance.setFromJson({ field: 'this is not a number' })
  //       console.log(field + ' did not raise an exception')
  //     }).to.throw(rti.DDSError)
  //   }
  // })

  // it('Attempt to access past the end of a sequence using setFromJson', () => {
  //   expect(() => {
  //     // my_int_sequence has a bound of 10 and we are supplying 11 elements
  //     testOutput.instance.setFromJson({ my_int_sequence: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10] })
  //   }).to.throw(rti.DDSError)
  // })

  // it('Set a boolean field using setNumber and check the resultant value on an input', () => {
  //   testOutput.instance.setNumber('my_optional_bool', 1)
  //   testOutput.write()
  //   testInput.wait(1000).then(() => {
  //     testInput.take()
  //     const theOptionalBool = testInput.getSample(0).getValue('my_optional_bool')
  //     expect(theOptionalBool).to.be.a('boolean').and.deep.equals(true)
  //   }).catch(() => {
  //     // Fail the test
  //     expect(false).to.deep.equals(true)
  //   })
  // })

  // it('Set a string with a number and check the resultant value on an input', () => {
  //   testOutput.instance.setString('my_string', '1234')
  //   testOutput.write()
  //   testInput.wait(1000).then(() => {
  //     testInput.take()
  //     const theNumericString = testInput.getSample(0).getValue('my_string')
  //     // Due to CON-139 getValue returns strings as numbers if they represent a number
  //     expect(theNumericString).to.be.a('number').and.deep.equals(1234)
  //   }).catch(() => {
  //     // Fail the test
  //     expect(false).to.deep.equals(true)
  //   })
  // })

  // it('Test output sequences', () => {
  //   testOutput.instance.setNumber('my_point_sequence[0].y', 20)
  //   testOutput.instance.setNumber('my_int_sequence[1]', 2)
  //   testOutput.instance.setNumber('my_point_array[4].x', 5)
  //   testOutput.write()
  //   testInput.wait(2000).then(() => {
  //     testInput.take()
  //     const sample = testInput.getSample(0)
  //     expect(sample.getValue('my_point_sequence[0].y')).to.be.a('number').and.deep.equals(20)
  //     expect(sample.getValue('my_int_sequence[1]')).to.be.a('number').and.deep.equals(2)
  //     expect(sample.getValue('my_point_array[4].x')).to.be.a('number').and.deep.equals(5)
  //     expect(sample.getValue('my_point_sequence#')).to.be.a('number').and.deep.equals(1)
  //     expect(sample.getValue('my_int_sequence#')).to.be.a('number').and.deep.equals(2)
  //   }).catch(() => {
  //     // Fail the test
  //     expect(false).to.deep.equals(true)
  //   })
  // })

  // it('Change union members', (done) => {
  //   testOutput.instance.setNumber('my_union.my_int_sequence[1]', 3)
  //   testOutput.write()
  //   testInput.wait(2000).then(() => {
  //     testInput.take()
  //     let sample = testInput.getSample(0)
  //     expect(sample.getString('my_union#')).to.be.a('string').that.deep.equals('my_int_sequence')

  //     // Change the union to long
  //     testOutput.instance.setNumber('my_union.my_long', 3)
  //     testOutput.write()
  //     testInput.wait(2000).then(() => {
  //       testInput.take()
  //       sample = testInput.getSample(0)
  //       expect(sample.getString('my_union#')).to.be.a('string').that.deep.equals('my_long')
  //       expect(sample.getNumber('my_union.my_long')).to.be.a('number').that.deep.equals(3).notify(done)
  //     }).catch(() => {
  //       // Fail the test
  //       expect(false).to.deep.equals(true).notify(done)
  //     })
  //   })
  // })

  // it('Change union members', async () => {
  //   testOutput.instance.setNumber('my_union.my_int_sequence[1]', 3)
  //   testOutput.write()
  //   try {
  //     await testInput.wait(2000)
  //     testInput.take()
  //     let sample = testInput.getSample(0)
  //     expect(sample.getString('my_union#')).to.deep.equals('my_int_sequence')
  //       .and.is.a('string')
  //     // Change the union
  //     testOutput.instance.setNumber('my_union.my_long', 3)
  //     testOutput.write()
  //     await testInput.wait(2000)
  //     testInput.take()
  //     sample = testInput.getSample(0)
  //     expect(sample.getString('my_union#')).to.deep.equals('my_long')
  //       .and.is.a('string')
  //   } catch (err) {
  //     // Fail the test
  //     console.log('Error caught: ' + err)
  //     expect(false).to.deep.equals(true)
  //   }
  // })

  // it('Set an optional', async () => {
  //   testOutput.instance.setNumber('my_optional_point.x', 101)
  //   testOutput.instance.setNumber('my_point_alias.x', 202)
  //   testOutput.write()
  //   try {
  //     await testInput.wait(0)
  //     const sample = testInput.getSample(0)
  //     expect(sample.getNumber('my_optional_point.x')).to.deep.equals(101)
  //       .and.is.a('number')
  //     expect(sample.getNumber('my_point_alias.x')).to.deep.equals(202)
  //       .and.is.a('number')
  //   } catch (err) {
  //     // Fail the test
  //     console.log('Error caught: ' + err)
  //     expect(false).to.deep.equals(true)
  //   }
  // })

  // it('Get an unset optional boolean', async () => {
  //   testOutput.write()
  //   try {
  //     await testInput.wait(2000)
  //     testInput.take()
  //     const unsetOptional = testInput.getSample(0).getBoolean('my_optional_bool')
  //     expect(unsetOptional).to.deep.equals(null)
  //   } catch (err) {
  //     // Fail the test
  //     console.log('Error caught: ' + err)
  //     expect(false).to.deep.equals(true)
  //   }
  // })

  // it('Reset an optional number', async () => {
  //   testOutput.instance.setNumber('my_optional_long', 33)
  //   testOutput.instance.setNumber('my_optional_long', null)
  //   testOutput.write()
  //   try {
  //     await testInput.wait(2000)
  //     testInput.take()
  //     const sample = testInput.getSample(0)
  //     expect(sample.getNumber('my_optional_long'))
  //       .to.deep.equals(null)
  //     expect(Object.prototype.hasOwnProperty.call(sample.getJson(), 'my_optional_long'))
  //       .to.be.false
  //   } catch (err) {
  //     // Fail the test
  //     console.log('Error caught: ' + err)
  //     expect(false).to.deep.equals(true)
  //   }
  // })

  // it('Reset an optional bool', async () => {
  //   testOutput.instance.setBoolean('my_optional_bool', true)
  //   testOutput.instance.setBoolean('my_optional_bool', null)
  //   testOutput.write()
  //   try {
  //     await testInput.wait(2000)
  //     testInput.take()
  //     const sample = testInput.getSample(0)
  //     expect(sample.getNumber('my_optional_bool'))
  //       .to.deep.equals(null)
  //     expect(Object.prototype.hasOwnProperty.call(sample.getJson(), 'my_optional_bool'))
  //       .to.be.false
  //   } catch (err) {
  //     // Fail the test
  //     console.log('Error caught: ' + err)
  //     expect(false).to.deep.equals(true)
  //   }
  // })

  // it('Reset an optional complex', async () => {
  //   testOutput.instance.setNumber('my_optional_point.x', 44)
  //   testOutput.instance.setNumber('my_point_alias.x', 55)
  //   testOutput.instance.clearMember('my_optional_point')
  //   testOutput.instance.clearMember('my_point_alias')
  //   testOutput.write()
  //   try {
  //     await testInput.wait(2000)
  //     testInput.take()
  //     const sample = testInput.getSample(0)
  //     expect(sample.getNumber('my_optional_point.x'))
  //       .to.deep.equals(null)
  //     expect(Object.prototype.hasOwnProperty.call(sample.getJson(), 'my_optional_point'))
  //       .to.be.false
  //     expect(sample.getNumber('my_point_alias.x'))
  //       .to.deep.equals(null)
  //     expect(Object.prototype.hasOwnProperty.call(sample.getJson(), 'my_point_alias'))
  //       .to.be.false
  //   } catch (err) {
  //     // Fail the test
  //     console.log('Error caught: ' + err)
  //     expect(false).to.deep.equals(true)
  //   }
  // })

  it('Clear a sequence', async () => {
    testOutput.instance.setNumber('my_union.my_int_sequence[2]', 10)
    testOutput.instance.setNumber('my_point.x', 3)
    testOutput.instance.clearMember('my_union.my_int_sequence')
    testOutput.write()
    try {
      await testInput.wait(2000)
      testInput.take()
      const sample = testInput.getSample(0)
      expect(sample.getNumber('my_union.my_int_sequence#'))
    } catch (err) {
      // Fail the test
      console.log('Error caught: ' + err)
      expect(false).to.deep.equals(true)
    }
  })
})

  // def test_clear_sequence(self, test_output, test_input):
  //   test_output.instance.set_number("my_union.my_int_sequence[2]", 10)
  //   test_output.instance.set_number("my_point.x", 3)
  //   test_output.instance.clear_member("my_union.my_int_sequence")
  //   test_output.write()

  //   wait_for_data(test_input)
  //   assert test_input[0].get_number("my_union.my_int_sequence#") == 0
  //   assert test_input[0].get_number("my_point.x") == 3

  // def test_clear_with_dictionary(self, test_dictionary, test_output, test_input):
  //   """Tests using None in a dictionary to clear a member"""

  //   # Set non-default values
  //   test_output.instance.set_dictionary(test_dictionary)
  //   test_output.instance.set_boolean("my_optional_bool", True)

  //   # Reset members using None in a dictionary--optional members are set to None,
  //   # other members are initialized to their default value
  //   test_output.instance.set_dictionary({
  //     'my_optional_point': None,
  //     'my_optional_long': None,
  //     'my_point': None,
  //     'my_point_alias': None,
  //     'my_long': None,
  //     'my_optional_bool': None,
  //     'my_point_sequence': None,
  //     'my_string': None,
  //     'my_union': None,
  //     'my_enum': None,
  //   })
  //   test_output.write()
  //   wait_for_data(test_input)

  //   sample = test_input[0]
  //   assert sample.get_number("my_optional_point.x") is None
  //   assert sample.get_number("my_optional_long") is None
  //   assert sample.get_number("my_point.x") == 0
  //   assert sample.get_number("my_point.y") == 0
  //   assert sample.get_number("my_point_alias.x") is None
  //   assert sample.get_number("my_long") == 0
  //   assert sample.get_boolean("my_optional_bool") is None
  //   assert sample.get_number("my_point_sequence#") == 0
  //   assert sample.get_string("my_string") == ""
  //   assert sample["my_string"] == ""
  //   assert sample.get_string("my_union#") == "point"
  //   assert sample.get_number("my_enum") == 2
  //   assert sample.get_number("my_double") == test_dictionary['my_double']
  //   dictionary = sample.get_dictionary()

  //   assert not "my_optional_bool" in dictionary
  //   assert not "my_optional_long" in dictionary
  //   assert not "my_point_alias" in dictionary
  //   assert not "my_optional_point" in dictionary

  // def test_bad_clear_member(self, test_output):
  //   with pytest.raises(rti.Error) as excinfo:
  //     test_output.instance.clear_member("my_nonexistent_member")

  // def test_reset_sequence(self, test_output, test_input):
  //   test_output.instance.set_number("my_union.my_int_sequence[2]", 10)
  //   test_output.instance.set_number("my_point.x", 3)
  //   test_output.instance["my_point_sequence[1].x"] = 44

  //   sample = send_data(test_output, test_input)
  //   assert sample.get_number("my_point.x") == 3
  //   assert sample.get_number("my_union.my_int_sequence#") == 3
  //   assert sample.get_number("my_point_sequence#") == 2

  //   test_output.instance.set_dictionary({'my_int_sequence':[]})

  //   sample = send_data(test_output, test_input)
  //   assert sample.get_number("my_int_sequence#") == 0
  //   # The other fields are unchanged:
  //   assert sample.get_number("my_point.x") == 3
  //   assert sample.get_number("my_point_sequence#") == 2


  // def test_shrink_sequence(self, test_output, test_input, test_dictionary):
  //   """Tests that set_dictionary shrinks sequences when it receives a smaller one"""

  //   test_output.instance.set_number("my_int_sequence[2]", 10) # set length to 3
  //   test_output.instance.set_number("my_point_sequence[0].x", 11)
  //   test_output.instance.set_number("my_point_sequence[0].y", 12)
  //   test_output.instance.set_number("my_point_sequence[2].x", 10)
  //   test_output.instance.set_dictionary(
  //     {"my_point_array":[{'x': 10, 'y': 20}, {'x': 11, 'y': 21}, {'x': 12, 'y': 22}, {'x': 13, 'y': 23}, {'x': 14, 'y': 24}]})

  //   # Reduce sequences to 1, while arrays retain exiting values
  //   test_output.instance.set_dictionary({
  //     "my_int_sequence":[40],
  //     "my_point_sequence":[{"y":2}],
  //     "my_point_array":[{"x":100}, {"y":200}]})
  //   test_output.write()
  //   wait_for_data(test_input)

  //   sample = test_input[0]
  //   assert sample["my_int_sequence#"] == 1 # Length reduced
  //   assert sample["my_point_sequence#"] == 1 # Length reduced
  //   assert sample["my_int_sequence[0]"] == 40 # New value
  //   assert sample["my_point_sequence[0].y"] == 2 # New value
  //   assert sample["my_point_sequence[0].x"] == 0 # Doesn't retain previous value
  //   assert sample["my_point_array[0].x"] == 100 # New value
  //   assert sample["my_point_array[0].y"] == 20 # Retains value
  //   assert sample["my_point_array[4].x"] == 14 # Retains value

  // def test_too_large_uint64_output(self, test_output):
  //   with pytest.raises(rti.Error, match=r".*value of my_uint64 is too large.*") as execinfo:
  //     test_output.instance.set_number("my_uint64", 9007199254740992)
  //   with pytest.raises(rti.Error, match=r".*value of my_int64 is too large.*") as execinfo:
  //     test_output.instance.set_number("my_int64", -9007199254740992)

  // def verify_large_integer(self, output, input, number):
  //   with pytest.raises(rti.Error, match=r".*value of my_uint64 is too large.*") as execinfo:
  //     output.instance.set_number("my_uint64", number)
  //   with pytest.raises(rti.Error, match=r".*value of my_int64 is too large.*") as execinfo:
  //     output.instance.set_number("my_int64", -number)

  //   output.instance.set_dictionary({"my_uint64": number, "my_int64":-number})
  //   sample = send_data(output, input)
  //   dictionary = sample.get_dictionary()
  //   assert dictionary["my_uint64"] == number
  //   assert dictionary["my_int64"] == -number
  //   with pytest.raises(rti.Error, match=r".*value of my_uint64 is too large.*") as execinfo:
  //     sample.get_number("my_uint64")
  //   with pytest.raises(rti.Error, match=r".*value of my_int64 is too large.*") as execinfo:
  //     sample.get_number("my_int64")

  // def test_large_uint64(self, test_output, test_input):
  //   max_int_get = 2**53 # 9007199254740992
  //   max_int_set = 2**53 - 1

  //   # largest integer allowed in set_number
  //   test_output.instance.set_number("my_uint64", max_int_set)
  //   test_output.instance.set_number("my_int64", -max_int_set)
  //   sample = send_data(test_output, test_input)
  //   assert sample.get_number("my_uint64") == max_int_set
  //   assert sample.get_number("my_int64") == -max_int_set

  //   # largest integer allowed in get_number; ok in set_dictionary, which
  //   # __setitem__ will also use
  //   test_output.instance["my_uint64"] = max_int_get
  //   test_output.instance.set_dictionary({"my_int64":-max_int_get})
  //   sample = send_data(test_output, test_input)
  //   assert sample.get_number("my_uint64") == max_int_get
  //   assert sample.get_number("my_int64") == -max_int_get

  //   # too large for get_number, but ok in get_dictionary
  //   self.verify_large_integer(test_output, test_input, max_int_get + 1)

  //   # 9007199254740999 -> 9007199254741000.0
  //   self.verify_large_integer(test_output, test_input, 9007199254740999)

  //   # largest long long
  //   self.verify_large_integer(test_output, test_input, 2**63 - 1)



// describe('Tests with two readers and two writers', () => {
//   let connector = null
//   let testOutput1 = null
//   let testInput1 = null
//   let testOutput2 = null
//   let testInput2 = null

//   beforeEach(() => {
//     const participantProfile = 'MyParticipantLibrary::DataAccessTest'
//     const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
//     connector = new rti.Connector(participantProfile, xmlProfile)
//     expect(connector).to.exist.and.be.an.instanceof(rti.Connector)
//     testInput1 = connector.getInput('TestSubscriber::TestReader')
//     expect(testInput1).to.exist
//     testOutput1 = connector.getOutput('TestPublisher::TestWriter')
//     expect(testOutput1).to.exist
//     testInput2 = connector.getInput('TestSubscriber::TestReader2')
//     expect(testInput2).to.exist
//     testOutput2 = connector.getOutput('TestPublisher::TestWriter2')
//     expect(testOutput2).to.exist

//     // Wait for the input and output to dicovery each other
//     expect(testOutput1.waitForSubscriptions(2000)).to.eventually.become(1)
//     expect(testOutput2.waitForSubscriptions(2000)).to.eventually.become(1)
//   })

//   afterEach(() => {
//     connector.close()
//   })

//   Since we have not written any data, all different forms of wait for data
//   should timeout
//   it('waiting for data on connector should timeout', () => {
//     return expect(connector.waitForData(500)).to.be.rejectedWith(rti.TimeoutError)
//   })
//   it('waiting for data on testInput should timeout', () => {
//     return expect(testInput1.wait(500)).to.be.rejectedWith(rti.TimeoutError)
//   })
//   it('waiting for data on testInput2 should timeout', () => {
//     return expect(testInput2.wait(500)).to.be.rejectedWith(rti.TimeoutError)
//   })

//   it('Writing data on a testOutput1 should wake up connector.waitForData', () => {
//     testOutput1.write()
//     return expect(connector.waitForData(500)).to.eventually.be.fulfilled
//   })

//   it('Writing data on a testOutput1 should wake up testInput1.wait', () => {
//     testOutput1.write()
//     return expect(testInput1.wait(500)).to.eventually.be.fulfilled
//   })

//   it('Writing data on a testOutput1 should not wake up testInput2.wait', () => {
//     testOutput1.write()
//     return expect(testInput2.wait(500)).to.eventually.be.rejectedWith(rti.TimeoutError)
//   })

//   it('Writing data on a testOutput2 should wake up connector.waitForData', () => {
//     testOutput2.write()
//     return expect(connector.waitForData(500)).to.eventually.be.fulfilled
//   })

//   it('Writing data on a testOutput2 should wake up testInput2.wait', () => {
//     testOutput2.write()
//     return expect(testInput2.wait(500)).to.eventually.be.fulfilled
//   })

//   it('Writing data on a testOutput2 should not wake up testInput1.wait', () => {
//     testOutput2.write()
//     return expect(testInput1.wait(500)).to.eventually.be.rejectedWith(rti.TimeoutError)
//   })
// })
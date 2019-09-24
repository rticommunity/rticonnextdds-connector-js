/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

var path = require('path')
var expect = require('chai').expect
var rti = require(path.join(__dirname, '/../../rticonnextdds-connector'))

// We have to do this due to the expect() syntax of chai and the fact
// that we install mocha globally
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

describe('Output Tests', function () {
  let connector = null
  // Initialization before all tests execute
  before(function () {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
  })

  // Cleanup after all tests have executed
  after(function () {
    this.timeout(0)
    connector.delete()
  })

  it('Output object should not get instantiated for invalid DataWriter', function () {
    const invalidDW = 'invalidDW'
    expect(function () {
      connector.getWriter(invalidDW)
    }).to.throw(Error)
  })

  it('Output object should get instantiated for valid ' +
      'Publication::DataWriter name', function () {
    const validDW = 'MyPublisher::MySquareWriter'
    const output = connector.getOutput(validDW)
    expect(output).to.exist
    expect(output.name).to.equal(validDW)
    expect(output.connector).to.equal(connector)
  })

  describe('Tests on Output\'s Instance', function () {
    let output = null
    // Initialization before all tests execute in this describe block
    before(function () {
      output = connector.getOutput('MyPublisher::MySquareWriter')
    })

    it('output\'s instance should exist', function () {
      expect(output.instance).to.exist
    })

    // skipped test: Condition being tested has not been accounted for yet
    it.skip('setNumber on non-existent field should throw error and ' +
      'subscriber should not get a message with default values', function () {
      expect(function () {
        output.instance.setNumber('invalid_field', 1)
      }).to.throw(Error)
    })

    // skipped test: Condition being tested has not been accounted for yet
    it.skip('setString on non-existent field should throw error and ' +
      'subscriber should not get a message with default values', function () {
      expect(function () {
        output.instance.setString('invalid_field', 'value')
      }).to.throw(Error)
    })

    // skipped test: Condition being tested has not been accounted for yet
    it.skip('setBoolean on non-existent field should throw error and ' +
      'subscriber should not get a message with default values',function () {
      expect(function () {
        output.instance.setBoolean('invalid_field', true)
      }).to.throw(Error)
    })

    // skipped test: Condition being tested has not been accounted for yet
    it.skip('setFromJSON should throw error for a JSON object ' +
      'with non-existent fields and subscriber should not get ' +
      'a message with default values', function () {
      expect(function () {
        const invalidData = '{"invalid_field":1}'
        output.instance.setFromJSON(JSON.parse(invalidData))
      }).to.throw(Error)
    })

    it('setString with boolean value should throw Error', function () {
      expect(function () {
        const stringField = 'color'
        output.instance.setString(stringField, true)
      }).to.throw(Error)
    })

    it('setString with number value should throw Error', function () {
      expect(function () {
        const stringField = 'color'
        output.instance.setString(stringField, 11)
      }).to.throw(Error)
    })

    it('setString with dictionary value should throw Error', function () {
      expect(function () {
        const stringField = 'color'
        output.instance.setString(stringField, { key: 'value' })
      }).to.throw(Error)
    })

    // skipped test: Condition being tested has not been accounted for yet
    it.skip('setNumber with string value should throw Error and' +
      'subscriber should not get a message with erroneous field data', function () {
      expect(function () {
        var numberField = 'x'
        output.instance.setNumber(numberField, 'value')
      }).to.throw(Error)
    })

    // un-implemented test
    it('Note: implicit type-conversion for setNumber with boolean value')

    // skipped test: Condition being tested has not been accounted for yet
    it.skip('setNumber with dictionary value should throw Error and ' +
      'subscriber should not get a message with erroneous field data', function () {
      expect(function () {
        const numberField = 'x'
        output.instance.setNumber(numberField, { key: 'value' })
      }).to.throw(Error)
    })

    // skipped test: Condition being tested has not been accounted for yet
    it.skip('setBoolean with string value should throw Error and ' +
      'subscriber should not get a  message with erroneous field data', function () {
      expect(function () {
        const booleanField = 'z'
        output.instance.setBoolean(booleanField, 'value')
      }).to.throw(Error)
    })

    // unimplemented test
    it('Note: implicit type-conversion for setBoolean with number value')

    // skipped test: Condition being tested has not been accounted for yet
    it.skip('setBoolean with dictionary value should throw Error and ' +
      'subscriber should not get a  message with erroneous field data', function () {
      expect(function () {
        const booleanField = 'z'
        output.instance.setBoolean(booleanField, { key: 'value' })
      }).to.throw(Error)
    })

    // skipped test: Condition being tested has not been accounted for yet
    it.skip('setFromJSON for JSON object with incompatible value types ' +
    'should throw Error and subscriber should not get a message with ' +
    'erroneous field data', function () {
      expect(function () {
        const str = '{"x":"5","y":true,"color":true,"shapesize":"5","z":"value"}'
        output.instance.setFromJSON(JSON.parse(str))
      }).to.throw(Error)
    })
  })
})

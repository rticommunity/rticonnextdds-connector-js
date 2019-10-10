/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
const expect = require('chai').expect
const rti = require(path.join(__dirname, '/../../rticonnextdds-connector'))

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
      connector.getOutput(invalidDW)
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

    it('setNumber on non-existent field should throw error and ' +
      'subscriber should not get a message with default values', function () {
      expect(function () {
        output.instance.setNumber('invalid_field', 1)
      }).to.throw(Error)
    })

    it('setString on non-existent field should throw error and ' +
      'subscriber should not get a message with default values', function () {
      expect(function () {
        output.instance.setString('invalid_field', 'value')
      }).to.throw(Error)
    })

    it('setBoolean on non-existent field should throw error and ' +
      'subscriber should not get a message with default values',function () {
      expect(function () {
        output.instance.setBoolean('invalid_field', true)
      }).to.throw(Error)
    })

    it('setFromJSON should throw error for a JSON object ' +
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

    it('setString with JSON value should throw Error', function () {
      expect(function () {
        const stringField = 'color'
        output.instance.setString(stringField, { key: 'value' })
      }).to.throw(Error)
    })

    it('setNumber with string value should throw Error and' +
      'subscriber should not get a message with erroneous field data', function () {
      expect(function () {
        const numberField = 'x'
        output.instance.setNumber(numberField, 'value')
      }).to.throw(Error)
    })

    it('Implicit type-conversion for setNumber with boolean value', function () {
      expect(function () {
        const numberField = 'x'
        output.instance.setNumber(numberField, true)
      }).to.throw(Error)
    })

    it('setNumber with JSON value should throw Error and ' +
      'subscriber should not get a message with erroneous field data', function () {
      expect(function () {
        const numberField = 'x'
        output.instance.setNumber(numberField, { key: 'value' })
      }).to.throw(Error)
    })

    it('setBoolean with string value should throw Error and ' +
      'subscriber should not get a  message with erroneous field data', function () {
      expect(function () {
        const booleanField = 'z'
        output.instance.setBoolean(booleanField, 'value')
      }).to.throw(Error)
    })

    it('Implicit type-conversion for setBoolean with number value', function () {
      expect(function () {
        const booleanField = 'z'
        output.instance.setBoolean(booleanField, 1)
      }).to.throw(Error)
    })

    it('setBoolean with JSON value should throw Error and ' +
      'subscriber should not get a  message with erroneous field data', function () {
      expect(function () {
        const booleanField = 'z'
        output.instance.setBoolean(booleanField, { key: 'value' })
      }).to.throw(Error)
    })

    it('setFromJSON for JSON object with incompatible value types ' +
    'should throw Error and subscriber should not get a message with ' +
    'erroneous field data', function () {
      expect(function () {
        const str = '{"x":"5","y":true,"color":true,"shapesize":"5","z":"value"}'
        output.instance.setFromJSON(JSON.parse(str))
      }).to.throw(Error)
    })

    it('Use the type independent set with invalid fieldName', function () {
      expect(function () {
        output.instance.set(123, 123)
      }).to.throw(TypeError)
    })

    it('Calling the type-independent set with non-existent field name', function () {
      expect(function () {
        output.instance.set('non-existent-member', 123)
      }).to.throw(rti.DDSError)
    })

    it('Try to set a bad JSON value', function () {
      expect(function () {
        output.instance.set('whatever', { x: 12, y: 30 })
      }).to.throw(rti.DDSError)
    })
  })
})

/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
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

describe('Output Tests', () => {
  /** @type {rti.Connector} */
  let connector
  /** @type {rti.Output} */
  let output
  /** @type {rti.Input} */
  let input

  beforeEach(() => {
    const participantProfile = 'MyParticipantLibrary::Zero'
    const xmlProfile = path.resolve(__dirname, '../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
    output = connector.getOutput('MyPublisher::MySquareWriter')
    input = connector.getInput('MySubscriber::MySquareReader')
  })

  afterEach(async () => {
    input.take()
    await connector.close()
  })

  it('Output object should not get instantiated for invalid DataWriter', () => {
    const invalidDW = 'invalidDW'
    assert.throws(() => {
      connector.getOutput(invalidDW)
    }, Error)
  })

  it('Output object should get instantiated for valid ' +
    'Publication::DataWriter name', () => {
      assert.ok(output)
      assert.strictEqual(output.name, 'MyPublisher::MySquareWriter')
      assert.strictEqual(output.connector, connector)
    })

  it('Can wait for acknowledgements on a reliable DataWriter', async () => {
    // Write data on the writer, and wait for it to be ACK'd by the reader
    output.write()
    // Since the writer is reliable transient local, no need to to wait for
    // discovery
    await output.wait(testExpectSuccessTimeout)
    await input.wait(testExpectSuccessTimeout)
    input.take()
    assert.strictEqual(input.samples.length, 1)
  })

  it('output\'s instance should exist', () => {
    assert.ok(output.instance)
  })

  it('setNumber on non-existent field should throw error and ' +
    'subscriber should not get a message with default values', () => {
      assert.throws(() => {
        output.instance.setNumber('invalid_field', 1)
      }, Error)
    })

  it('setString on non-existent field should throw error and ' +
    'subscriber should not get a message with default values', () => {
      assert.throws(() => {
        output.instance.setString('invalid_field', 'value')
      }, Error)
    })

  it('setBoolean on non-existent field should throw error and ' +
    'subscriber should not get a message with default values', () => {
      assert.throws(() => {
        output.instance.setBoolean('invalid_field', true)
      }, Error)
    })

  it('setFromJSON should throw error for a JSON object ' +
    'with non-existent fields and subscriber should not get ' +
    'a message with default values', () => {
      assert.throws(() => {
        const invalidData = '{"invalid_field":1}'
        output.instance.setFromJSON(JSON.parse(invalidData))
      }, Error)
    })

  it('setString with boolean value should throw Error', () => {
    assert.throws(() => {
      const stringField = 'color'
      output.instance.setString(stringField, true)
    }, Error)
  })

  it('setString with number value should throw Error', () => {
    assert.throws(() => {
      const stringField = 'color'
      output.instance.setString(stringField, 11)
    }, Error)
  })

  it('setString with JSON value should throw Error', () => {
    assert.throws(() => {
      const stringField = 'color'
      output.instance.setString(stringField, { key: 'value' })
    }, Error)
  })

  it('setNumber with string value should throw Error and' +
    'subscriber should not get a message with erroneous field data', () => {
      assert.throws(() => {
        const numberField = 'x'
        output.instance.setNumber(numberField, 'value')
      }, Error)
    })

  it('Implicit type-conversion for setNumber with boolean value', () => {
    assert.throws(() => {
      const numberField = 'x'
      output.instance.setNumber(numberField, true)
    }, Error)
  })

  it('setNumber with JSON value should throw Error and ' +
    'subscriber should not get a message with erroneous field data', () => {
      assert.throws(() => {
        const numberField = 'x'
        output.instance.setNumber(numberField, { key: 'value' })
      }, Error)
    })

  it('setBoolean with string value should throw Error and ' +
    'subscriber should not get a  message with erroneous field data', () => {
      assert.throws(() => {
        const booleanField = 'z'
        output.instance.setBoolean(booleanField, 'value')
      }, Error)
    })

  it('Implicit type-conversion for setBoolean with number value', () => {
    assert.throws(() => {
      const booleanField = 'z'
      output.instance.setBoolean(booleanField, 1)
    }, Error)
  })

  it('setBoolean with JSON value should throw Error and ' +
    'subscriber should not get a  message with erroneous field data', () => {
      assert.throws(() => {
        const booleanField = 'z'
        output.instance.setBoolean(booleanField, { key: 'value' })
      }, Error)
    })

  it('setFromJSON for JSON object with incompatible value types ' +
    'should throw Error and subscriber should not get a message with ' +
    'erroneous field data', () => {
      assert.throws(() => {
        const str = '{"x":"5","y":true,"color":true,"shapesize":"5","z":"value"}'
        output.instance.setFromJSON(JSON.parse(str))
      }, Error)
    })

  it('Use the type independent set with invalid fieldName', () => {
    assert.throws(() => {
      output.instance.set(123, 123)
    }, TypeError)
  })

  it('Calling the type-independent set with non-existent field name', () => {
    assert.throws(() => {
      output.instance.set('non-existent-member', 123)
    }, rti.DDSError)
  })

  it('Try to set a bad JSON value', () => {
    assert.throws(() => {
      output.instance.set('whatever', { x: 12, y: 30 })
    }, rti.DDSError)
  })
})

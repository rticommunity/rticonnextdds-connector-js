/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
const assert = require('node:assert/strict')
const { describe, it, before, after, beforeEach, afterEach } = require('node:test')
const rti = require('../../rticonnextdds-connector')

// We provide a timeout of 10s to operations that we expect to succeed. This
// is so that if they fail, we know for sure something went wrong
const testExpectSuccessTimeout = 10000

// Test Parameterization- describe block will execute once for each param
const params = ['read', 'take']

params.forEach((retrievalMethod) => {
  describe('DataflowTests for ' + retrievalMethod, () => {
    const testMsg = { x: 1, y: 1, z: true, color: 'BLUE', shapesize: 5 }
    /** @type {rti.Connector} */
    let connector
    /** @type {rti.Input} */
    let input
    /** @type {rti.Output} */
    let output

    // Initialization before all tests execute
    before(async () => {

      const participantProfile = 'MyParticipantLibrary::Zero'
      const xmlProfile = path.resolve(__dirname, '../xml/TestConnector.xml')
      connector = new rti.Connector(participantProfile, xmlProfile)
      input = connector.getInput('MySubscriber::MySquareReader')
      output = connector.getOutput('MyPublisher::MySquareWriter')
      const matches = await input.waitForPublications(testExpectSuccessTimeout)
      assert.ok(matches >= 1)
    })

    // Clean-up after all tests execute
    after(async () => {
      await connector.close()
    })

    // Initialization done before each test executes
    beforeEach(async () => {
      output.instance.setFromJSON(testMsg)
      output.write()
      await input.wait(testExpectSuccessTimeout)
      input[retrievalMethod]()
      assert.ok(input.samples.length >= 1)
    })

    afterEach(() => {
      // take any samples from middleware cache
      input.take()
    })

    it('samples length should be 1', () => {
      const len = input.samples.getLength()
      assert.strictEqual(len, 1)
    })

    it('infos length should be 1', () => {
      const len = input.infos.getLength()
      assert.strictEqual(len, 1)
    })

    it('data received should be valid', () => {
      const validity = input.infos.isValid(0)
      assert.strictEqual(validity, true)
    })

    it('received JSON representation of data should be the same as ' +
      'the JSON object sent', () => {
        const receivedJson = input.samples.getJSON(0)
        assert.deepStrictEqual(receivedJson, JSON.parse(JSON.stringify(testMsg)))
      })

    it('received fields of data should be the same as ' +
      'that of the JSON object sent', () => {
        const x = input.samples.getNumber(0, 'x')
        const y = input.samples.getNumber(0, 'y')
        const z = input.samples.getBoolean(0, 'z')
        const color = input.samples.getString(0, 'color')
        const shapesize = input.samples.getNumber(0, 'shapesize')

        assert.strictEqual(x, testMsg.x)
        assert.strictEqual(y, testMsg.y)
        // NOTE: getBoolean returns an Integer representation of Boolean (legacy reasons)
        assert.strictEqual(z, +testMsg.z)
        assert.strictEqual(shapesize, testMsg.shapesize)
        assert.strictEqual(color, testMsg.color)
      })

    it('getting a number or string field as a boolean should fail in the core', () => {
      const numberField = 'x'
      const stringField = 'color'
      assert.throws(() => {
        input.samples.getBoolean(0, numberField)
      }, rti.DDSError)

      assert.throws(() => {
        input.samples.getBoolean(0, stringField)
      }, rti.DDSError)
    })

    it('should be possible to obtain a number as a string', () => {
      const numberField = 'x'
      const numberAsString = input.samples.getString(0, numberField)
      assert.strictEqual(numberAsString, '1')
    })

    it('should not be possible to obtain a boolean as a string', () => {
      const booleanField = 'z'
      assert.throws(() => {
        input.samples.getString(0, booleanField)
      }, rti.DDSError)
    })

    it('should be possible to get a boolean field as a number', () => {
      const booleanField = 'z'
      const booleanAsNumber = input.samples.getNumber(0, booleanField)
      assert.strictEqual(booleanAsNumber, 1)
    })

    it('should not be possible to get a string field as a number', () => {
      const stringField = 'color'
      assert.throws(() => {
        input.samples.getNumber(0, stringField)
      }, rti.DDSError)
    })
  })
})

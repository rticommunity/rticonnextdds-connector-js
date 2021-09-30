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

// We provide a timeout of 10s to operations that we expect to succeed. This
// is so that if they fail, we know for sure something went wrong
const testExpectSuccessTimeout = 10000

// Test Parameterization- describe block will execute once for each param
const params = ['read', 'take']

params.forEach((retrievalMethod) => {
  describe('DataflowTests for ' + retrievalMethod, function () {
    let input, output, testMsg

    // Initialization before all tests execute
    before(async function () {
      testMsg = { x: 1, y: 1, z: true, color: 'BLUE', shapesize: 5 }
      const participantProfile = 'MyParticipantLibrary::Zero'
      const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
      connector = new rti.Connector(participantProfile, xmlProfile)
      input = connector.getInput('MySubscriber::MySquareReader')
      output = connector.getOutput('MyPublisher::MySquareWriter')
      try {
        const matches = await input.waitForPublications(testExpectSuccessTimeout)
        expect(matches).to.be.at.least(1)
      } catch (err) {
        console.log('Caught err: ' + err)
        throw (err)
      }
    })

    // Clean-up after all tests execute
    after(async function () {
      this.timeout(0)
      await connector.close()
    })

    // Initialization done before each test executes
    beforeEach(async function () {
      output.instance.setFromJSON(testMsg)
      output.write()
      try {
        await input.wait(testExpectSuccessTimeout)
      } catch (err) {
        console.log('Caught err: ' + err)
        throw (err)
      }
      input[retrievalMethod]()
      expect(input.samples.length).to.be.at.least(1)
    })

    afterEach(function () {
      // take any samples from middleware cache
      input.take()
    })

    it('samples length should be 1', function () {
      const len = input.samples.getLength()
      expect(len).to.equal(1)
    })

    it('infos length should be 1', function () {
      const len = input.infos.getLength()
      expect(len).to.equal(1)
    })

    it('data received should be valid', function () {
      const validity = input.infos.isValid(0)
      expect(validity).to.equal(1)
    })

    it('')

    it('received JSON representation of data should be the same as ' +
      'the JSON object sent', function () {
      const receivedJson = input.samples.getJSON(0)
      expect(receivedJson).to.deep.equal(JSON.parse(JSON.stringify(testMsg)))
    })

    it('received fields of data should be the same as ' +
      'that of the JSON object sent', function () {
      const x = input.samples.getNumber(0, 'x')
      const y = input.samples.getNumber(0, 'y')
      const z = input.samples.getBoolean(0, 'z')
      const color = input.samples.getString(0, 'color')
      const shapesize = input.samples.getNumber(0, 'shapesize')

      expect(x).to.equal(testMsg.x)
      expect(y).to.equal(testMsg.y)
      // NOTE: getBoolean returns an Integer representation of Boolean (legacy reasons)
      expect(z).to.equal(+testMsg.z)
      expect(shapesize).to.equal(testMsg.shapesize)
      expect(color).to.equal(testMsg.color)
    })

    it('getting a number or string field as a boolean should fail in the core', () => {
      const numberField = 'x'
      const stringField = 'color'
      expect(() => {
        input.samples.getBoolean(0, numberField)
      }).to.throw(rti.DDSError)

      expect(() => {
        input.samples.getBoolean(0, stringField)
      }).to.throw(rti.DDSError)
    })

    it('should be possible to obtain a number as a string', () => {
      const numberField = 'x'
      const numberAsString = input.samples.getString(0, numberField)
      expect(numberAsString).to.equal('1')
    })

    it('should not be possible to obtain a boolean as a string', () => {
      const booleanField = 'z'
      expect(() => {
        input.samples.getString(0, booleanField)
      }).to.throw(rti.DDSError)
    })

    it('should be possible to get a boolean field as a number', () => {
      const booleanField = 'z'
      const booleanAsNumber = input.samples.getNumber(0, booleanField)
      expect(booleanAsNumber).to.equal(1)
    })

    it('should not be possible to get a string field as a number', () => {
      const stringField = 'color'
      expect(() => {
        input.samples.getNumber(0, stringField)
      }).to.throw(rti.DDSError)
    })
  })
})

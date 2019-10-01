/******************************************************************************
* (c) 2019 Copyright, Real-Time Innovations.  All rights reserved.            *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

var path = require('path')
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var expect = chai.expect
chai.config.includeStack = true
chai.use(chaiAsPromised)
var rti = require(path.join(__dirname, '/../../rticonnextdds-connector'))

// We have to do this due to the expect() syntax of chai and the fact
// that we install mocha globally
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

describe('Test the iteration of Input Samples', () => {
  const expectedSampleCount = 4 // one of which is a dispose
  const expectedData = [
    {
      x: 1,
      y: 1,
      z: true,
      color: 'BLUE',
      shapesize: 5
    },
    {
      x: 2,
      y: 2,
      z: false,
      color: 'RED',
      shapesize: 10
    },
    {
      x: 3,
      y: 3,
      z: true,
      color: 'YELLOW',
      shapesize: 15
    }
  ]
  let connector = null
  let input = null
  let output = null

  beforeEach(async () => {
    // Create the connector object and get the input and output
    const xmlPath = path.join(__dirname, '/../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::Zero'
    connector = new rti.Connector(profile, xmlPath)
    expect(connector).to.exist.and.be.an.instanceof(rti.Connector)
    input = connector.getInput('MySubscriber::MySquareReader')
    expect(input).to.exist
    output = connector.getOutput('MyPublisher::MySquareWriter')
    expect(output).to.exist

    // Wait for the entities to match
    try {
      const newMatches = await input.waitForPublications(2000)
      expect(newMatches).to.be.at.least(1)
    } catch (err) {
      // Fail the test
      expect(true).to.be.false
    }

    // Populate the input with data from the output
    for (let i = 0; i < expectedSampleCount - 1; i++) {
      output.instance.setFromJson(expectedData[i])
      output.write()
    }

    output.write({ action: 'dispose' })

    // Read on the input until we have all 3 samples
    for (let i = 0; i < 20; i++) {
      try {
        await input.wait(500)
        input.read()
        if (input.samples.length === expectedSampleCount) {
          break
        }
      } catch (err) {
        console.log(err)
        continue
      }
    }
    expect(input.samples.length).to.deep.equals(expectedSampleCount)
  })

  afterEach(() => {
    connector.close()
  })

  it('Check sample iterator and iterable', () => {
    expect(input.samples.length).to.deep.equals(expectedSampleCount)

    // Check that it is possible to use the iterable object
    let count = 0
    for (const sample of input.samples.dataIterator) {
      if (count === 3) {
        expect(sample.validData).to.deep.equals(false)
      } else {
        expect(sample.validData).to.deep.equals(true)
        expect(sample.getNumber('x')).to.deep.equals(expectedData[count].x)
        expect(sample.getNumber('y')).to.deep.equals(expectedData[count].y)
        expect(sample.getBoolean('z')).to.deep.equals(expectedData[count].z)
        expect(sample.getString('color')).to.deep.equals(expectedData[count].color)
        expect(sample.getValue('shapesize')).to.deep.equals(expectedData[count].shapesize)
      }
      count++
    }
    expect(count).to.deep.equals(expectedSampleCount)

    // Check that it is possible to manually specify which sample we want to access
    expect(input.samples.get(0).getNumber('x')).to.deep.equals(expectedData[0].x)
    expect(input.samples.get(1).getNumber('x')).to.deep.equals(expectedData[1].x)
    expect(input.samples.get(2).getNumber('x')).to.deep.equals(expectedData[2].x)

    // Check that it is possible to use the iterator manually (by progressing
    // the iterator using next())
    const iterator = input.samples.dataIterator.iterator()
    for (count = 0; count < input.samples.length; count++) {
      const singleSample = iterator.next().value
      if (count <= 2) {
        expect(singleSample.validData).to.deep.equals(true)
        expect(singleSample.getNumber('x')).to.deep.equals(expectedData[count].x)
        expect(singleSample.getNumber('y')).to.deep.equals(expectedData[count].y)
        expect(singleSample.getBoolean('z')).to.deep.equals(expectedData[count].z)
        expect(singleSample.getString('color')).to.deep.equals(expectedData[count].color)
        expect(singleSample.getValue('shapesize')).to.deep.equals(expectedData[count].shapesize)
      } else {
        expect(singleSample.validData).to.deep.equals(false)
      }
    }
  })

  it('Check valid data sample iterator and iterable', () => {
    expect(input.samples.length).to.deep.equals(expectedSampleCount)

    let count = 0
    for (const sample of input.samples.validDataIterator) {
      expect(sample.validData).to.deep.equals(true)
      expect(sample.getNumber('y')).to.deep.equals(expectedData[count].y)
      expect(sample.getBoolean('z')).to.deep.equals(expectedData[count].z)
      expect(sample.getString('color')).to.deep.equals(expectedData[count].color)
      expect(sample.getValue('shapesize')).to.deep.equals(expectedData[count].shapesize)
      count++
    }

    // We should have iterated over all but the last (dispose) sample
    expect(count).to.deep.equals(expectedSampleCount - 1)

    // Manually incrementing the iterator
    const iterator = input.samples.validDataIterator.iterator()
    count = 0
    while (count < input.samples.length) {
      const singleSample = iterator.next()
      if (count < input.samples.length - 1) {
        expect(singleSample.value.validData).to.deep.equals(true)
        expect(singleSample.value.getNumber('x')).to.deep.equals(expectedData[count].x)
        expect(singleSample.value.getNumber('y')).to.deep.equals(expectedData[count].y)
        expect(singleSample.value.getBoolean('z')).to.deep.equals(expectedData[count].z)
        expect(singleSample.value.getString('color')).to.deep.equals(expectedData[count].color)
        expect(singleSample.value.getValue('shapesize')).to.deep.equals(expectedData[count].shapesize)
      } else {
        expect(singleSample.done).to.be.true
      }
      count++
    }
  })
})

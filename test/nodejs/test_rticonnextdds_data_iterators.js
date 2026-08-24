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
  /** @type {rti.Connector} */
  let connector
  /** @type {rti.Input} */
  let input
  /** @type {rti.Output} */
  let output

  beforeEach(async () => {
    // Create the connector object and get the input and output
    const xmlPath = path.resolve(__dirname, '../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::Zero'
    connector = new rti.Connector(profile, xmlPath)
    assert.ok(connector instanceof rti.Connector)
    input = connector.getInput('MySubscriber::MySquareReader')
    assert.ok(input)
    output = connector.getOutput('MyPublisher::MySquareWriter')
    assert.ok(output)

    // Wait for the entities to match
    const newMatches = await input.waitForPublications(testExpectSuccessTimeout)
    assert.ok(newMatches >= 1)

    // Populate the input with data from the output
    for (let i = 0; i < expectedSampleCount - 1; i++) {
      output.instance.setFromJson(expectedData[i])
      output.write()
    }

    output.write({ action: 'dispose' })

    // Read on the input until we have all 3 samples
    for (let i = 0; i < 20; i++) {
      try {
        await input.wait(testExpectSuccessTimeout)
        input.read()
        if (input.samples.length === expectedSampleCount) {
          break
        }
      } catch (err) {
        console.log(err)
        continue
      }
    }
    assert.strictEqual(input.samples.length, expectedSampleCount)
  })

  afterEach(async () => {
    await connector.close()
  })

  it('Check sample iterator and iterable', () => {
    assert.strictEqual(input.samples.length, expectedSampleCount)

    // Check that it is possible to use the iterable object
    let count = 0
    for (const sample of input.samples) {
      if (count === 3) {
        assert.strictEqual(sample.validData, false)
      } else {
        assert.strictEqual(sample.validData, true)
        assert.strictEqual(sample.getNumber('x'), expectedData[count].x)
        assert.strictEqual(sample.getNumber('y'), expectedData[count].y)
        assert.strictEqual(sample.getBoolean('z'), expectedData[count].z)
        assert.strictEqual(sample.getString('color'), expectedData[count].color)
        assert.strictEqual(sample.get('shapesize'), expectedData[count].shapesize)
      }
      count++
    }
    assert.strictEqual(count, expectedSampleCount)

    // Check that it is possible to manually specify which sample we want to access
    assert.strictEqual(input.samples.get(0).getNumber('x'), expectedData[0].x)
    assert.strictEqual(input.samples.get(1).getNumber('x'), expectedData[1].x)
    assert.strictEqual(input.samples.get(2).getNumber('x'), expectedData[2].x)

    // Check that it is possible to use the iterator manually (by progressing
    // the iterator using next())
    const iterator = input.samples.iterator()
    for (count = 0; count < input.samples.length; count++) {
      const singleSample = iterator.next().value
      if (count <= 2) {
        assert.strictEqual(singleSample.validData, true)
        assert.strictEqual(singleSample.getNumber('x'), expectedData[count].x)
        assert.strictEqual(singleSample.getNumber('y'), expectedData[count].y)
        assert.strictEqual(singleSample.getBoolean('z'), expectedData[count].z)
        assert.strictEqual(singleSample.getString('color'), expectedData[count].color)
        assert.strictEqual(singleSample.get('shapesize'), expectedData[count].shapesize)
      } else {
        assert.strictEqual(singleSample.validData, false)
      }
    }
  })

  it('Check valid data sample iterator and iterable', () => {
    assert.strictEqual(input.samples.length, expectedSampleCount)

    let count = 0
    for (const sample of input.samples.validDataIter) {
      assert.strictEqual(sample.validData, true)
      assert.strictEqual(sample.getNumber('y'), expectedData[count].y)
      assert.strictEqual(sample.getBoolean('z'), expectedData[count].z)
      assert.strictEqual(sample.getString('color'), expectedData[count].color)
      assert.strictEqual(sample.get('shapesize'), expectedData[count].shapesize)
      count++
    }

    // We should have iterated over all but the last (dispose) sample
    assert.strictEqual(count, expectedSampleCount - 1)

    // Manually incrementing the iterator
    const iterator = input.samples.validDataIter.iterator()
    count = 0
    while (count < input.samples.length) {
      const singleSample = iterator.next()
      if (count < input.samples.length - 1) {
        assert.strictEqual(singleSample.value.validData, true)
        assert.strictEqual(singleSample.value.getNumber('x'), expectedData[count].x)
        assert.strictEqual(singleSample.value.getNumber('y'), expectedData[count].y)
        assert.strictEqual(singleSample.value.getBoolean('z'), expectedData[count].z)
        assert.strictEqual(singleSample.value.getString('color'), expectedData[count].color)
        assert.strictEqual(singleSample.value.get('shapesize'), expectedData[count].shapesize)
      } else {
        assert.strictEqual(singleSample.done, true)
      }
      count++
    }
  })

  it('Check that validDataIter does not iterate over no data', () => {
    // The beforeEach does a read(), take here to clear the queue
    input.take()
    // Take again, there should now be zero samples available
    input.take()
    assert.strictEqual(input.samples.length, 0)
    let hasData = false
    // eslint-disable-next-line no-unused-vars
    for (const sample of input.samples.validDataIter) {
      hasData = true
    }
    assert.strictEqual(hasData, false)
  })

  it('Check that iterator does not iterate over no data', () => {
    // The beforeEach does a read(), take here to clear the queue
    input.take()
    // Take again, there should now be zero samples available
    input.take()
    assert.strictEqual(input.samples.length, 0)
    let hasData = false
    // eslint-disable-next-line no-unused-vars
    for (const sample of input.samples) {
      hasData = true
    }
    assert.strictEqual(hasData, false)
  })
})

describe('Test dispose', () => {
  const expectedSampleCount = 2
  /** @type {rti.Connector} */
  let connector
  /** @type {rti.Input} */
  let input
  /** @type {rti.Output} */
  let output

  beforeEach(async () => {
    // Create the connector object and get the input and output
    const xmlPath = path.resolve(__dirname, '../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::Zero'
    connector = new rti.Connector(profile, xmlPath)
    assert.ok(connector instanceof rti.Connector)
    input = connector.getInput('MySubscriber::MySquareReader')
    assert.ok(input)
    output = connector.getOutput('MyPublisher::MySquareWriter')
    assert.ok(output)

    // Wait for the entities to match
    const newMatches = await input.waitForPublications(testExpectSuccessTimeout)
    assert.ok(newMatches >= 1)

    // Write one sample with valid data, one unregister and one dispose
    output.write()
    output.write({ action: 'dispose' })

    // Wait for the input to receive all the samples
    while (input.samples.length !== expectedSampleCount) {
      await input.wait(testExpectSuccessTimeout)
      input.read()
    }
    assert.strictEqual(input.samples.length, expectedSampleCount)
  })

  afterEach(async () => {
    await connector.close()
  })

  it('Dispose should not have validData set to true', () => {
    let count = 0
    for (const sample of input.samples) {
      if (count === 0) {
        assert.strictEqual(sample.validData, true)
      } else {
        assert.strictEqual(sample.validData, false)
      }
      count++
    }
    assert.strictEqual(count, expectedSampleCount)
  })

  it('ValidSampleIterator should not iterator over disposes', () => {
    let count = 0
    for (const sample of input.samples.validDataIter) { // eslint-disable-line no-unused-vars
      count++
    }
    assert.strictEqual(count, expectedSampleCount - 1)
  })
})

describe('Test unregister', () => {
  const expectedSampleCount = 2
  /** @type {rti.Connector} */
  let connector
  /** @type {rti.Input} */
  let input
  /** @type {rti.Output} */
  let output

  beforeEach(async () => {
    // Create the connector object and get the input and output
    const xmlPath = path.resolve(__dirname, '../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::Zero'
    connector = new rti.Connector(profile, xmlPath)
    assert.ok(connector instanceof rti.Connector)
    input = connector.getInput('MySubscriber::MySquareReader')
    assert.ok(input)
    output = connector.getOutput('MyPublisher::MySquareWriter')
    assert.ok(output)

    // Wait for the entities to match
    const newMatches = await input.waitForPublications(testExpectSuccessTimeout)
    assert.ok(newMatches >= 1)

    // Write one sample with valid data, one unregister and one dispose
    output.write()
    output.write({ action: 'unregister' })

    // Wait for the input to receive all the samples
    while (input.samples.length !== expectedSampleCount) {
      await input.wait(testExpectSuccessTimeout)
      input.read()
    }
    assert.strictEqual(input.samples.length, expectedSampleCount)
  })

  afterEach(async () => {
    await connector.close()
  })

  it('Unregister should not have validData set to true', () => {
    let count = 0
    for (const sample of input.samples) {
      if (count === 0) {
        assert.strictEqual(sample.validData, true)
      } else {
        assert.strictEqual(sample.validData, false)
      }
      count++
    }
    assert.strictEqual(count, expectedSampleCount)
  })

  it('ValidSampleIterator should not iterator over unregisters', () => {
    let count = 0
    for (const sample of input.samples.validDataIter) { // eslint-disable-line no-unused-vars
      count++
    }
    assert.strictEqual(count, expectedSampleCount - 1)
  })
})

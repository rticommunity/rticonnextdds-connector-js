/******************************************************************************
* (c) 2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
const assert = require('node:assert/strict')
const { describe, it, beforeEach, afterEach, mock } = require('node:test')
const rti = require('../../rticonnextdds-connector')
const events = require('events')

// We provide a timeout of 10s to operations that we expect to succeed. This
// is so that if they fail, we know for sure something went wrong
const testExpectSuccessTimeout = 10000

describe('Connector EventEmitter tests', () => {
  /** @type {rti.Connector} */
  let connector
  /** @type {rti.Input} */
  let input
  /** @type {rti.Output} */
  let output

  beforeEach(async () => {
    // Create the connector object
    const xmlPath = path.resolve(__dirname, '../xml/TestConnector.xml')
    const profile = 'MyParticipantLibrary::DataAccessTest'
    connector = new rti.Connector(profile, xmlPath)
    assert.ok(connector instanceof rti.Connector)
    input = connector.getInput('TestSubscriber::TestReader')
    assert.ok(input)
    output = connector.getOutput('TestPublisher::TestWriter')
    assert.ok(output)

    // Wait for the entities to match
    const newMatches = await input.waitForPublications(testExpectSuccessTimeout)
    assert.ok(newMatches >= 1)
  })

  afterEach(async () => {
    await connector.close()
  })

  it('Callback should be called when event is emitted', () => {
    const spy = mock.fn()
    connector.on('on_data_available', spy)
    connector.emit('on_data_available')
    assert.strictEqual(spy.mock.callCount(), 1)
    connector.removeListener('on_data_available', spy)
  })

  it('When no data is written, no event should be emitted', async () => {
    const spy = mock.fn()
    connector.on('on_data_available', spy)
    await new Promise(resolve => setTimeout(resolve, 250))
    assert.strictEqual(spy.mock.callCount(), 0)
  })

  it('It should not be possible to register the event listener and have a Promise waiting for data simultaneously', async () => {
    const spy = mock.fn()
    connector.on('on_data_available', spy)
    const err = await connector.wait(500).then(() => null).catch(e => e)
    assert.strictEqual(err.message, 'Can not concurrently wait on the same Connector object')
  })

  it('Using .removeAllListeners() should remove all eventListeners', () => {
    const spy1 = mock.fn()
    const spy2 = mock.fn()
    connector.on('on_data_available', spy1)
    connector.on('on_data_available', spy2)
    assert.strictEqual(connector.listenerCount('on_data_available'), 2)
    connector.removeAllListeners('on_data_available')
    assert.strictEqual(connector.listenerCount('on_data_available'), 0)
  })

  it('Should be possible to re-use a Connector after calling waitForCallbackFinalization', async () => {
    const spy = mock.fn()
    connector.on('on_data_available', spy)
    assert.strictEqual(connector.listenerCount('on_data_available'), 1)
    connector.emit('on_data_available')
    assert.strictEqual(spy.mock.callCount(), 1)
    connector.removeListener('on_data_available', spy)
    assert.strictEqual(connector.listenerCount('on_data_available'), 0)
    await connector.waitForCallbackFinalization()
    connector.on('on_data_available', spy)
    assert.strictEqual(connector.listenerCount('on_data_available'), 1)
    connector.emit('on_data_available')
    assert.strictEqual(spy.mock.callCount(), 2)
  })

  it('Event should be emitted when data is available on an input', async () => {
    const spy = mock.fn()
    connector.on('on_data_available', spy)
    output.write()
    await events.once(connector, 'on_data_available')
    assert.strictEqual(spy.mock.callCount(), 1)
  })

  it('Connector.once() should automatically unregister the callback after data is received', async () => {
    const spy = mock.fn()
    connector.once('on_data_available', spy)
    output.write()
    await events.once(connector, 'on_data_available')
    assert.strictEqual(spy.mock.callCount(), 1)
    assert.strictEqual(connector.listenerCount('on_data_available'), 0)
    output.write()
    await events.once(connector, 'on_data_available')
    assert.strictEqual(spy.mock.callCount(), 1)
  })

  it('Should be possible to add multiple callbacks for the same event', async () => {
    const spy1 = mock.fn()
    const spy2 = mock.fn()
    connector.on('on_data_available', spy1)
    connector.on('on_data_available', spy2)
    assert.strictEqual(connector.listenerCount('on_data_available'), 2)
    output.write()
    await events.once(connector, 'on_data_available')
    assert.strictEqual(spy1.mock.callCount(), 1)
    assert.strictEqual(spy2.mock.callCount(), 1)
  })

  it('Possible to uninstall the eventListener with .off()', async () => {
    const spy = mock.fn()
    connector.on('on_data_available', spy)
    output.write()
    await events.once(connector, 'on_data_available')
    assert.strictEqual(spy.mock.callCount(), 1)
    connector.removeListener('on_data_available', spy)
    assert.strictEqual(connector.listenerCount('on_data_available'), 0)
    output.write()
    await new Promise(resolve => setTimeout(resolve, 250))
    assert.strictEqual(spy.mock.callCount(), 1)
  })

  it('Using .off() should only unregister the supplied callback, if multiple are registered', async () => {
    const spy1 = mock.fn()
    const spy2 = mock.fn()
    connector.on('on_data_available', spy1)
    connector.on('on_data_available', spy2)
    assert.strictEqual(connector.listenerCount('on_data_available'), 2)
    output.write()
    await events.once(connector, 'on_data_available')
    assert.strictEqual(spy1.mock.callCount(), 1)
    assert.strictEqual(spy2.mock.callCount(), 1)
    connector.removeListener('on_data_available', spy1)
    assert.strictEqual(connector.listenerCount('on_data_available'), 1)
    output.write()
    await events.once(connector, 'on_data_available')
    assert.strictEqual(spy1.mock.callCount(), 1)
    assert.strictEqual(spy2.mock.callCount(), 2)
  })
})

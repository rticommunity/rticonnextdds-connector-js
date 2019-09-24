/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

var rti = require('rticonnextdds-connector')
var path = require('path')

const fullpath = path.join(__dirname, '/../ShapeExample.xml')
const connector = new rti.Connector('MyParticipantLibrary::Zero', fullpath)
const input = connector.getInput('MySubscriber::MySquareReader')

const printNewMatches = (input, newMatches) => {
  console.log('Matched with ' + newMatches + ' publications:')
  input.matchedPublications.forEach((match) => {
    console.log(match.name)
  })
}

const printNewData = (input) => {
  for (var sample of input.validDataIterator) {
    console.log(JSON.stringify(sample.getJson()))
  }
  var iterator = input.validDataIterator[Symbol.iterator]()
  for (var j = 0; j < input.sampleCount; j++) {
    iterator = iterator.next()
    console.log(JSON.stringify(iterator.value.getJson()))
  }
}

const waitForDiscovery = async (input) => {
  try {
    const newMatches = await input.waitForPublications(5000)
    printNewMatches(input, newMatches)
    return newMatches
  } catch (err) {
    console.log('Error whilst waiting for discovery: ' + err)
  }
}

const getData = async (input) => {
  try {
    await input.wait(5000)
    input.take()
  } catch (err) {
    console.log('Error whilst waiting for data: ' + err)
  }
}

const run = async (input) => {
  try {
    await waitForDiscovery(input)
    for (;;) {
      await getData(input)
      printNewData(input)
    }
  } catch (err) {
    console.log('Caught error: ' + err)
  }
}

run(input)

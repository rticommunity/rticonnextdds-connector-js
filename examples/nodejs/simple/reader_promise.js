/******************************************************************************
* (c) 2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/
var rti = require('rticonnextdds-connector')
var path = require('path')
var fullpath = path.join(__dirname, '/../ShapeExample.xml')
var connector = new rti.Connector('MyParticipantLibrary::Zero', fullpath)

const waitForDiscovery = (theInput, publicationName) => {
  console.log('Waiting to match with ' + publicationName)
  let matches = []
  while (!matches.some(item => item.name === publicationName)) {
    if (input.waitForPublications(2000) > 0) {
      matches = input.matchedPublications
    }
  }
  console.log('Matched with: ')
  matches.forEach((match) => {
    console.log(match.name)
  })
}

const takeAndLogData = (input) => {
  input.take()
  for (const sample of input.validDataIterator) {
    console.log(JSON.stringify(sample.getJson()))
  }
}

const waitForData = async (connector, input) => {
  for (;;) {
    try {
      await connector.waitForData(500)
      takeAndLogData(input)
    } catch (error) {
      console.log(error)
      break
    }
  }
}

const input = connector.getInput('MySubscriber::MySquareReader')

// Wait for discovery to occur
waitForDiscovery(input, 'MySquareWriter')
// Use the modern async / await syntax:
waitForData(connector, input)
// Alternatively, use the more traditional Promise syntax:
// connector.waitForData(500)
//   .then(() => {
//     takeAndLogData(input)
//   }, (err) => {
//     console.log('Error: ' + err)
//   })
//   .catch(error => console.log(error))

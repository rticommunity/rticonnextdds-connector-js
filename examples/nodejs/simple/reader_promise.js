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
var input = connector.getInput('MySubscriber::MySquareReader')

function waitForDiscovery (theInput, publicationName) {
  console.log('Waiting to match with ' + publicationName)
  var matches = []
  while (!matches.some(item => item.name === publicationName)) {
    var changesInMatches = input.waitForPublications(2000)
    if (changesInMatches > 0) {
      matches = input.matchedPublications
    }
  }
  console.log('Matched with: ')
  matches.forEach(function (match) {
    console.log(match.name)
  })
}

async function handleData (connector, input) {
  for (;;) {
    const promise = connector.waitForDataPromise()
      .then(() => {
        input.take()
        for (var sample of input.validDataIterator) {
          console.log(JSON.stringify(sample.getJson()))
        }
      })
      .catch((ret) => {
        console.log('Error occurred whilst waiting for data: ' + ret)
      })
    await promise;
  }
}

// Wait for discovery to occur
waitForDiscovery(input, 'MySquareWriter')

handleData(connector, input)

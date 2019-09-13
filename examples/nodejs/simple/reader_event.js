/******************************************************************************
* (c) 2005-2015 Copyright, Real-Time Innovations.  All rights reserved.       *
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
      matches = input.getMatchedPublications()
    }
  }
  console.log('Matched with: ')
  matches.forEach(function (match) {
    console.log(match.name)
  })
}

// Wait for discovery to occur
waitForDiscovery(input, 'MySquareWriter')

input.wait() 
console.log('input.wait works')
input.take()
for (var o = 0; o < input.samples.getLength(); o++) {
  if (input.infos.isValid(o)) {
    console.log(JSON.stringify(input.samples.getJson(o)))
  }
}

// THIS IS WHAT IS BROKEN
connector.waitForData(5000) 
console.log('connector.wait works')
input.take()
for (var o = 0; o < input.samples.getLength(); o++) {
  if (input.infos.isValid(o)) {
    console.log(JSON.stringify(input.samples.getJson(o)))
  }
}

connector.on('on_data_available',
  function () {
    console.log('in the call back')
    input.take()
    for (var i = 0; i < input.samples.getLength(); i++) {
      if (input.infos.isValid(i)) {
        console.log(JSON.stringify(input.samples.getJSON(i)))
      }
    }
  })

console.log('Waiting for data')
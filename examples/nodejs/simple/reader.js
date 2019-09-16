/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

var sleep = require('sleep')
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

// Wait for discovery to occur
waitForDiscovery(input, 'MySquareWriter')

for (;;) {
  console.log('Waiting for samples...')
  input.take()
  for (var i=0; i < input.samples.length; i++) {
    if (input.infos.isValid(i)) {
      console.log(JSON.stringify(input.samples.getJSON(i)))
      console.log(input.samples.getNumber(i, 'x'))
      console.log(input.samples.getString(i, 'color'))
    }
  }

  sleep.sleep(2)
}

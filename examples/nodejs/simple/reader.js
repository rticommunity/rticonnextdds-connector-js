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

// Wait up to 5 for discovery
console.log('Waiting for discovery...')
input.waitForPublications(5000)
const matches = input.matchedPublications
console.log('Matched with: ')
matches.forEach((match) => {
  console.log(match.name)
})

for (;;) {
  console.log('Waiting for samples...')
  input.wait(5000)
  input.take()
  for (var sample of input.validDataIterator) {
    console.log(JSON.stringify(sample.getJson()))
    console.log(sample.getNumber('x'))
    console.log(sample.getString('color'))
  }
}

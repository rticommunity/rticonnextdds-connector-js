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
var output = connector.getOutput('MyPublisher::MySquareWriter')

// Wait up to 5 for discovery
console.log('Waiting for discovery...')
output.waitForSubscriptions(5000)
const matches = output.matchedPublications
console.log('Matched with: ')
matches.forEach((match) => {
  console.log(match.name)
})

for (let i = 0; i < 500; i++) {
  // We clear the instance associated with this output, otherwise the sample
  // will have the values set in the previous iteration
  output.clear_members()
  i = i + 1
  output.instance.setNumber('x', i)
  output.instance.setNumber('y', i * 2)
  output.instance.setNumber('shapesize', 30)
  output.instance.setString('color', 'BLUE')
  console.log('Writing...')
  output.write()
  sleep.sleep(1)
}

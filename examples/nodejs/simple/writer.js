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

function waitForDiscovery (theOutput, subscriptionName) {
  console.log('Waiting to match with ' + subscriptionName)
  var matches = []
  while (!matches.some(item => item.name === subscriptionName)) {
    var changesInMatches = output.waitForSubscriptions(2000)
    if (changesInMatches > 0) {
      matches = output.matchedSubscriptions
    }
  }
  console.log('Matched with: ')
  matches.forEach(function (match) {
    console.log(match.name)
  })
}

// Wait for discovery to occur
waitForDiscovery(output, 'MySquareReader')

var i = 0
for (;;) {
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
  sleep.sleep(2)
}

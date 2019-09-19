/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

var rti = require('rticonnextdds-connector')
var path = require('path')

var fullpath = path.join(__dirname, '/../ShapeExample.xml')
var connector = new rti.Connector('MyParticipantLibrary::Zero', fullpath)
var output = connector.getOutput('MyPublisher::MySquareWriter')

const printNewMatches = (output, newMatches) => {
  console.log('Matched with ' + newMatches + ' publications:')
  output.matchedSubscriptions.forEach((match) => {
    console.log(match.name)
  })
}

const waitForDiscovery = async (output) => {
  try {
    const newMatches = await output.waitForSubscriptions(5000)
    printNewMatches(output, newMatches)
    return newMatches
  } catch (err) {
    console.log('Error whilst waiting for discovery: ' + err)
  }
}

const run = async (output) => {
  try {
    await waitForDiscovery(output)
    for (let i = 0; i < 500; i++) {
      // We clear the instance associated with this output, otherwise the sample
      // will have the values set in the previous iteration
      output.clear_members()
      output.instance.setNumber('x', i)
      output.instance.setNumber('y', i * 2)
      output.instance.setNumber('shapesize', 30)
      output.instance.setString('color', 'BLUE')
      console.log('Writing...')
      output.write()
      await new Promise(function (resolve, reject) {
        setTimeout(() => {
          resolve(0)
        }, 1000)
      })
    }
    // Wait for all matched subscriptions to acknowledge the sample (if using
    // reliable communication)
    await output.wait(5000)
  } catch (err) {
    console.log('Error encountered: ' + err)
  }
}

run(output)

/******************************************************************************
* (c) 2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const rti = require('rticonnextdds-connector')
const path = require('path')
const fullpath = path.join(__dirname, '/../ShapeExample.xml')

const run = async () => {
  const connector = new rti.Connector('MyParticipantLibrary::MySubParticipant', fullpath)
  const input = connector.getInput('MySubscriber::MyCircleReader')
  try {
    for (;;) {
      await input.wait()
      input.take()
      for (const sample of input.samples.validDataIter) {
        console.log('Received Circle: ' + JSON.stringify(sample.getJson()))
      }
    }
  } catch (err) {
    console.log('Error encountered: ' + err)
  }
  connector.close()
}

run()

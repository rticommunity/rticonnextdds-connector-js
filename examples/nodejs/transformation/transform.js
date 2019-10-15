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
  const connector = new rti.Connector('MyParticipantLibrary::TransformationParticipant', fullpath)
  const input = connector.getInput('MySubscriber::MySquareReader')
  const output = connector.getOutput('MyPublisher::MyCircleWriter')
  try {
    // Read the data on the input, transform it and write it into the output
    console.log('Waiting for data...')
    for (;;) {
      await input.wait()
      input.take()
      for (const sample of input.samples.validDataIter) {
        // You can obtain all the fields as a JSON object
        const data = sample.getJson()
        data.x = data.y
        data.shapesize *= 0.5
        data.color = 'RED'

        output.instance.setFromJson(data)
        output.write()
      }
    }
  } catch (err) {
    console.log('Error encountered: ' + err)
  }
  connector.close()
}

run()

/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const path = require('path')
const rti = require('rticonnextdds-connector')
const configFile = path.join(__dirname, './RequestReplyQoS.xml')

const run = async () => {
  const connector = new rti.Connector('DomainParticipantLibraryRR::ParticipantReplier', configFile)
  const input = connector.getInput('ReplierSubscriber::ReplierReader')
  const output = connector.getOutput('ReplierPublisher::ReplierWriter')
  try {
    console.log('Waiting for publications...')
    await input.waitForPublications()

    console.log('Waiting for data...')
    for (let i = 0; i < 500; i++) {
      await input.wait()
      input.take()
      for (const sample of input.samples.validDataIter) {
        console.log('Request received')
        //Send reply
        output.instance.set('reply_member', i)
        console.log(sample.info.get('identity'))
        output.write({related_sample_identity: sample.info.get('identity')})
        console.log('Reply sent')
      }
    }
  } catch (err) {
    console.log('Error encountered: ' + err)
  }
  connector.close()
}

run()

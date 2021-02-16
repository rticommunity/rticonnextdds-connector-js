/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const sleep = require('sleep')
const path = require('path')
const rti = require('rticonnextdds-connector')
const configFile = path.join(__dirname, './RequestReplyQoS.xml')

const run = async () => {
  const connector = new rti.Connector('DomainParticipantLibraryRR::ParticipantRequester', configFile)

  /*
    A initial sample is sent to get a Writer GUID generated by DDS.
    If we use a hard-coded writer GUID, samples could be discarded
    as a sample with the same writer GUID and sequence number may have been
    received before.
    This can happen if we restart the requester or we have several executions from the same code.
  */
  output = connector.getOutput('RequesterPublisher::GUIDGetterWriter')
  input = connector.getInput('RequesterSubscriber::GUIDGetterReader')
  writer_guid = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  output.write()
  await input.wait()
  input.take()
  for (const sample of input.samples.validDataIter) {
    writer_guid=sample.info.get('identity')['writer_guid']
  }

  output = connector.getOutput('RequesterPublisher::RequesterWriter')
  input = connector.getInput('RequesterSubscriber::RequesterReader')

  try {
    console.log('Waiting for subscriptions...')
    await output.waitForSubscriptions()

    console.log('Writing...')
    for (let i = 1; i < 50000; i++) {
      output.instance.set('request_member', i)
      //Writer GUID will have 16 uint of 8 bits maximum
      request_id={writer_guid: writer_guid, sequence_number: i}
      output.write({identity :request_id})
      console.log('Request sent')
      reply_received=false

      /* 
      We use a while loop as this requester may receive samples from other requester,
      We make sure we get the reply before sending more request.
      Other way we couldn't correlate samples because of the sequence number
      */
      while (!reply_received){
        await input.wait()
        input.take()
        for (const sample of input.samples.validDataIter) {
          if (JSON.stringify(sample.info.get('related_sample_identity'))===JSON.stringify(request_id)){
            console.log('Reply received')
            reply_received=true
          }
        }
      }
      sleep.msleep(500)
    }

    console.log('Exiting...')
    // Wait for all subscriptions to receive the data before exiting
    await output.wait()
  } catch (err) {
    console.log('Error encountered: ' + err)
  }
  connector.close()
}

run()

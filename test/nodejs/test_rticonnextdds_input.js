/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

var path = require('path')
var expect = require('chai').expect
var rti = require(path.join(__dirname, '/../../rticonnextdds-connector'))

// We have to do this due to the expect() syntax of chai and the fact
// that we install mocha globally
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

describe('Input Tests', function () {
  let connector = null
  // Initialization before all tests are executed
  before(function () {
    const participantProfile = 'MyParticipantLibrary::Zero'
    var xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
    connector = new rti.Connector(participantProfile, xmlProfile)
  })

  // cleanup after all tests have executed
  after(function () {
    this.timeout(0)
    connector.delete()
  })

  it('Input object should not get instantiated for invalid DataReader', function () {
    const invalidDR = 'invalidDR'
    expect(function () {
      connector.getInput(invalidDR)
    }).to.throw(Error)
  })

  it('Input object should get instantiated for valid ' +
      'Subscription::DataReader name', function () {
    const validDR = 'MySubscriber::MySquareReader'
    const input = connector.getInput(validDR)
    expect(input).to.exist
    expect(input.name).to.equal(validDR)
    expect(input.connector).to.equal(connector)
  })
})

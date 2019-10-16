/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/
const rti = require('rticonnextdds-connector')
const path = require('path')
const http = require('http')
const fullpath = path.join(__dirname, '/../ShapeExample.xml')

const connector = new rti.Connector('MyParticipantLibrary::MySubParticipant', fullpath)
const input = connector.getInput('MySubscriber::MySquareReader')

http.createServer(function (req, res) {
  if (req.url === '/read') {
    console.log('read')
    input.read()
  } else if (req.url === '/take') {
    console.log('take')
    input.take()
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write('Click <a href=\'read\'>read</a> or <a href=\'take\'>take</a>')
    res.end()
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' })
  for (const sample of input.samples.validDataIter) {
    res.write(JSON.stringify(sample.getJson()))
  }
  res.end()
}).listen(7400, '127.0.0.1')

console.log('Server running at http://127.0.0.1:7400/')

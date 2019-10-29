/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const http = require('http')
const fs = require('fs')
const rti = require('rticonnextdds-connector')
const socketsio = require('socket.io')
const path = require('path')
const fullpath = path.join(__dirname, '/../ShapeExample.xml')

// Create the HTTP server (and configure it to serve the requested visualisation)
const server = http.createServer(function (req, res) {
  if (req.url === '/simple') {
    fs.readFile(path.join(__dirname, 'indexSimple.html'), (error, data) => {
      if (error) {
        console.log('Error: ' + error)
        throw new Error(error)
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(data, 'utf-8')
      }
    })
  } else if (req.url === '/maps') {
    fs.readFile(path.join(__dirname, 'indexMaps.html'), (error, data) => {
      if (error) {
        console.log('Error: ' + error)
        throw new Error(error)
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(data, 'utf-8')
      }
    })
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write("Select your visualisation: <a href='simple'>simple</a> or <a href='maps'>maps</a>")
    res.end()
  }
}).listen(7400, '127.0.0.1')
console.log('Server running at http://127.0.0.1:7400/')

// Create the DDS entities required for this example - a reader of Triangle, Circle
// and Square (all under the same participant).
const connector = new rti.Connector('MyParticipantLibrary::MySubParticipant', fullpath)
const io = socketsio.listen(server)
const squareInput = connector.getInput('MySubscriber::MySquareReader')
const triangleInput = connector.getInput('MySubscriber::MyTriangleReader')
const circleInput = connector.getInput('MySubscriber::MyCircleReader')

squareInput.on('on_data_available', () => {
  squareInput.take()
  for (const sample of squareInput.samples.validDataIter) {
    io.sockets.emit('square', sample.getJson())
  }
})
triangleInput.on('on_data_available', () => {
  triangleInput.take()
  for (const sample of triangleInput.samples.validDataIter) {
    io.sockets.emit('triangle', sample.getJson())
  }
})
circleInput.on('on_data_available', () => {
  circleInput.take()
  for (const sample of circleInput.samples.validDataIter) {
    io.sockets.emit('circle', sample.getJson())
  }
})

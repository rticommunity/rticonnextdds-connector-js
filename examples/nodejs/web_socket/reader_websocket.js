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
  } else if (req.url === '/chart') {
    fs.readFile(path.join(__dirname, 'indexChart.html'), (error, data) => {
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
    res.write("Select your visualisation: <a href='simple'>simple</a>, <a href='chart'>chart</a>  or <a href='maps'>maps</a>")
    res.end()
  }
}).listen(7400, '127.0.0.1')
console.log('Server running at http://127.0.0.1:7400/')

// Create the DDS entities required for this example - a reader of Triangle, Circle
// and Square (all under the same participant).
const connector = new rti.Connector('MyParticipantLibrary::MySubParticipant', fullpath)
const io = socketsio(server)
// Create an array of each input which we want to receive data on, and its associated
// topic name. We will emit the topic name from the io object.
const inputs = [
  { input: connector.getInput('MySubscriber::MySquareReader'), topic: 'square' },
  { input: connector.getInput('MySubscriber::MyTriangleReader'), topic: 'triangle' },
  { input: connector.getInput('MySubscriber::MyCircleReader'), topic: 'circle' }
]

connector.on('on_data_available', () => {
  // We have received data on one of the inputs within this connector
  // Iterate through each one, checking if it has any valid data
  inputs.forEach(element => {
    element.input.take()
    for (const sample of element.input.samples.validDataIter) {
      io.sockets.emit(element.topic, sample.getJson())
    }
  })
})

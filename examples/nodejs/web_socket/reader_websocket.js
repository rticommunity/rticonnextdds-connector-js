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

const waitForShapeOnInput = async (io, input, shapeName) => {
  try {
    await input.wait()
    input.take()
    for (const sample of input.samples.validDataIter) {
      io.sockets.emit(shapeName, sample.getJson())
    }
  } catch (err) {
    if (err !== rti.TimeoutError) {
      console.log('Caught error: ' + err)
    }
  }
}

const run = async () => {
  // Create the DDS entities required for this example - a reader of Triangle, Circle
  // and Square (all under the same participant).
  const connector = new rti.Connector('MyParticipantLibrary::MySubParticipant', fullpath)
  const inputSquare = connector.getInput('MySubscriber::MySquareReader')
  const inputTriangle = connector.getInput('MySubscriber::MyTriangleReader')
  const inputCircle = connector.getInput('MySubscriber::MyCircleReader')
  const io = socketsio.listen(server)

  for (;;) {
    const promisesToWait = []

    // Only wait for data on an input if it has a matched publication
    if (inputSquare.matchedPublications.length > 0) {
      promisesToWait.push(waitForShapeOnInput(io, inputSquare, 'square'))
    }
    if (inputTriangle.matchedPublications.length > 0) {
      promisesToWait.push(waitForShapeOnInput(io, inputTriangle, 'triangle'))
    }
    if (inputCircle.matchedPublications.length > 0) {
      promisesToWait.push(waitForShapeOnInput(io, inputCircle, 'circle'))
    }
    // If we are not waiting on any data currently, add a delay before checking again.
    // This is so that we don't hang the server
    if (promisesToWait.length === 0) {
      promisesToWait.push(new Promise(resolve => setTimeout(resolve, 500)))
    }

    // Take data on each input and emit the corresponding socket event
    try {
      await Promise.all(promisesToWait)
    } catch (err) {
      console.log('Caught err: ' + err)
    }
  }
}

// To allow for async/await syntax we write the javascript code in a non-anonymous function
run()

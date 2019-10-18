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

const server = http.createServer(function (req, res) {
  if (req.url === '/simple') {
    fs.readFile(path.join(__dirname, '/indexShape.html'), (error, data) => {
      if (error) {
        console.log('Error: ' + error)
        throw new Error(error)
      }
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(data, 'utf-8')
    })
  } else if (req.url === '/chart') {
    fs.readFile(path.join(__dirname, '/indexChart.html'), (error, data) => {
      if (error) {
        console.log('Error: ' + error)
        throw new Error(error)
      }
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(data, 'utf-8')
    })
  } else if (req.url === '/maps') {
    fs.readFile(path.join(__dirname, '/indexMaps.html'), (error, data) => {
      if (error) {
        console.log('Error: ' + error)
        throw new Error(error)
      }
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(data, 'utf-8')
    })
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write("Click <a href='simple'>simple</a>, <a href='chart'>D3 chart</a> or <a href='maps'>maps</a>")
    res.end()
  }
}).listen(7400, '127.0.0.1')
console.log('Server running at http://127.0.0.1:7400/')

const run = async () => {
  const connector = new rti.Connector('MyParticipantLibrary::MySubParticipant', fullpath)
  const input = connector.getInput('MySubscriber::MySquareReader')
  const io = socketsio.listen(server)

  for (;;) {
    try {
      await input.wait()
      input.take()
      for (const sample of input.samples.validDataIter) {
        console.log('reader_websocket.js: emitting: ' + sample.getJson())
        io.sockets.emit('shape', sample.getJson())
      }
    } catch (err) {
      console.log('Caught err: ' + err)
    }
  }
}

run()

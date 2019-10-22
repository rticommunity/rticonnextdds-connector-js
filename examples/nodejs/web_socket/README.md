# Web socket example

## Example description
In this example, we create a simple application which visualises the data DDS data it receives
by overlaying it on a map.
`reader_websocket.js` listens at [http://127.0.0.1:7400](http://127.0.0.1:7400) receives
data of the Shape type (either Circle, Square or Triangle topic) and overlays the data
on a map. The receives ``shapesize``, ``color``, ``x`` and ``y`` are converted into
a map feature.

## Dependencies
This example requires additional packages:
* [socket.io](https://www.npmjs.com/package/socket.io)
* [ol](https://www.npmjs.com/package/ol)
They can be installed using `npm install socket.io ol`

## Running the example
* Run any *DDS* application that publishes the *Square*, *Circle* or *Triangle* topic. For example run
`node ../simple/writer.js`; or run
[RTI Shapes Demo](https://www.rti.com/free-trial/shapes-demo) and create a *Square*
publisher.
* Run the web server `node ./reader_web_socket.js`
* In a browser, navigate to [http:/localhost:7400](http://127.0.0.1:7400)

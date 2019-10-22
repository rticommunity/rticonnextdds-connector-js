# Web socket example

## Example description
In this example, we create a simple application which visualises the data DDS data it receives.
`reader_websocket.js` listens at [http://127.0.0.1:7400](http://127.0.0.1:7400) for requests
on how it should visualise the data. There are three options:
* simple: Prints the information about the current shape
* chart: Uses the [D3.js](https://www.d3-graph-gallery.com/) Graph Library to visualise the data on a graph
* maps: Prints the received shape data on a map

## Dependencies
This example requires additional packages:
* [socket.io](https://www.npmjs.com/package/socket.io)
* [ol](https://www.npmjs.com/package/ol)
They can be installed using `npm install socket.io ol`

## Running the example
* Run any *DDS* application that publishes the *Square* topic. For example run
`node ../simple/writer.js`; or run
[RTI Shapes Demo](https://www.rti.com/free-trial/shapes-demo) and create a *Square*
publisher.
* Run the web server `node ./reader_web_socket.js`
* In a browser, navigate to [http:/localhost:7400](http://127.0.0.1:7400)
* Select how you would like to visualise the data (simple, chart or maps).
* Navigating to [http://localhost:7400/chart](http://localhost:7400/chart) will display the chart,
[http://localhost:7400/simple](http://localhost:7400/simple) will show the simple visualisation and
[http://localhost:7400/maps](http://localhost:7400/maps) will show the maps visualation.

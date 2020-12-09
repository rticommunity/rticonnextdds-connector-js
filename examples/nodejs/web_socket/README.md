# Web socket example

## Example description
In this example, we create a simple application which visualises the data DDS data it receives.
`reader_websocket.js` listens at [http://127.0.0.1:7400](http://127.0.0.1:7400) for requests
on how it should visualise the data. There are the following visualisation are available:
* simple: Prints the information about the current shape
* maps: Prints the received shapes data on a map
* charts: Displays the x-position of thereceived shapes data on a chart

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
* Run the web server `node ./reader_websocket.js`
* In a browser, navigate to [http:/localhost:7400](http://127.0.0.1:7400)
* Select how you would like to visualize the data (simple or maps).
* Navigating to [http://localhost:7400/simple](http://localhost:7400/simple) will show the simple visualisation, [http://localhost:7400/maps](http://localhost:7400/maps) will show the maps visualisation and [http://localhost:7400/chart](http://localhost:7400/chart) will show the chart visualisation.
  * Note: The simple visualizasion may not work in the Safari browser.
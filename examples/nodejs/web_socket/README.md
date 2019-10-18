# Web socket example

## Example description
In this example, we create a simple application which visualises the data DDS data it receives.
`reader_web_socket.js` listens at `http://127.0.0.1:7400 <http://127.0.0.1:7400>`__ for requests
on how it should visualise the data. There are three options:
* simple: Prints the information about the current shape
* chart: Uses the `D3.js <https://www.d3-graph-gallery.com/>`__ Graph Library to visualise the data on a graph
* maps: Prints the received shape data on a map

## Dependencies
This example requires additional packages:
* socket.io
* ol
* parcel (**TODO** check if parcel is actually required (i don't think it is))

## Running the example
* Run any *DDS* application that publishes the *Square* topic. For example run
`node ../simple/writer.js`; or run
[RTI Shapes Demo](https://www.rti.com/free-trial/shapes-demo) and create a *Square*
publisher.
* Run the web server `node ./reader_web_socket.js`
* In a browser, navigate to `http:/localhost:7400 <http://127.0.0.1:7400>`__
* Select how you would like to visualise the data (chart, simple or **TODO**).
* Navigating to `http://localhost:7400/chart <http://localhost:7400/chart>`__ will display the chart,
`http://localhost:7400/simple <http://localhost:7400/simple>`__ will show the simple visualisation and
`http://localhost:7400/maps <http://localhost:7400/maps>`__ will show the maps visualation.

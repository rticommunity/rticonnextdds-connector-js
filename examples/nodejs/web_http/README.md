# Web HTTP example

## Example description
In this example, we create a simple http server application which listens for
requests.
`reader_web.js` listens at [http://127.0.0.1:7400](http://127.0.0.1:7400) for requests
to either ``read`` or ``take`` data.
The requested operation is printed on the console, and the data is sent in the http response.

## Running the example
* Run any *DDS* application that publishes the *Square* topic. For example run
`node ../simple/writer.js`; or run
[RTI Shapes Demo](https://www.rti.com/free-trial/shapes-demo) and create a *Square*
publisher.
* Run the web server `node ./reader_web.js`
* In a browser, navigate to [http:/localhost:7400](http://127.0.0.1:7400)
* Click either the `read` or `take` button to perform an operation
* Navigating to [http://localhost:7400/read](http://localhost:7400/read) will read data,
whilst [http://localhost:7400/take](http://localhost:7400/take) will take data

You will notice that if ``read`` is called repeatedly, the number of samples obtained grows.
This is because a call to ``read`` does not remove the sample from the Input's queue, but leaves
it there for future access.
Contrarily, a call to ``take`` obtains any samples available in the Input's queue and removes them.

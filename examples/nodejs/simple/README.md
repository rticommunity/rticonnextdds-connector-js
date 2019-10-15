# Simple Example

## Example description
In this simple example, `writer.js` periodically publishes data for a *Square*
topic, and `reader.js` subscribes to the topic and print all of the data samples
that it receives.

## Running the example
Run the following command in different shells

  `$ node reader.js`

  `$ node writer.js`

You can run these commands in any order, and you can run multiple instances of
the publisher and/or the reader.
You can also run any other *DDS* application that publishes or subscribes to the
*Square* topic. For example, you can use
[RTI Shapes Demo](https://www.rti.com/free-trial/shapes-demo).
RTI Connector for JavaScript
============================

RTI® Connext® DDS is a connectivity software framework for integrating data
sources of all types. At its core is the world's leading ultra-high performance,
distributed networking databus.

*RTI Connector* provides a quick and easy way to write applications that
publish and subscribe to the *RTI Connext DDS databus* in JavaScript and other
languages.

## Documentation

To get started and learn more about *RTI Connector for JavaScript* see the
[documentation here.](https://community.rti.com/static/documentation/connector/1.0.0/api/javascript/index.html)

## Examples

The `examples/nodejs` directory provides several examples:
* `simple` shows how to create basic publisher and subscriber applications
* In `transformation`, an application reads, transforms and publishes back the data
 * `web_http` shows how an HTTP client can request DDS data using REST
 * `web_socket` shows how to push DDS data to a browser through [socket.io](https://github.com/Automattic/socket.io)

## Dependencies

RTI Connector for JavaScript has the following dependencies, which are also listed in `package.json`:
* [ref](https://www.npmjs.com/package/ref): turns Buffer instances into "pointers"
* [ffi](https://www.npmjs.com/package/ffi): used for loading and calling dynamic libraries using pure JavaScript
* [events](https://www.npmjs.com/package/events): used for the 'EventEmitter' (legacy implementation of RTI Connector)

Additionally to run the `web_socket` example, [socket.io](https://github.com/Automattic/socket.io) and [OpenLayers](hhttps://openlayers.org] are required.

Additional dependencies are required to run the unit tests and some of the examples. Please see the README files in the appropriate directory.

### Python dependency

Some of the dependencies are shipped as source code and use [node-gyp](https://github.com/nodejs/node-gyp) to be compiled locally. `node-gyp` requires Python 2.7 and does not work with Python 3. The requirements for `node-gyp` can be found at:
* [unix](https://github.com/nodejs/node-gyp#on-unix)
* [darwin](https://github.com/nodejs/node-gyp#on-macos)
* [windows](https://github.com/nodejs/node-gyp#on-windows)

### C/C++ compiler dependency

The dependency [ref](https://www.npmjs.com/package/ref) is shipped as source code and requires a C++11 compiler.

## Version

The library used by Connector is built on top of RTI® Connext® DDS, currently the version used is 6.0.1.
This library is statically linked and a dynamically linked variant is not currently available.

## License

With the sole exception of the contents of the "examples" subdirectory, all use
of the software shall be governed by this license. RTI Connector for JavaScript
and RTI Connector for Python is part of the Connext DDS Professional Package.
If you have a valid license for the RTI Connext DDS Professional Package,
such license shall govern your use of RTI Connector for Python and RTI Connector
for JavaScript. All other use of this software shall be governed solely by the
terms of RTI’s Software License for Non-Commercial Use #4040, included at the
top level of this repository.

(return to [rticonnextdds-connector](https://github.com/rticommunity/rticonnextdds-connector))

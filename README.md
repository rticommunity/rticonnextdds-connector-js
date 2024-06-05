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
[documentation here.](https://community.rti.com/static/documentation/connector/current/api/javascript/index.html)

## Examples

The `examples/nodejs` directory provides several examples:

* `simple` shows how to create basic publisher and subscriber applications
* In `transformation`, an application reads, transforms and publishes back the data
 * `web_http` shows how an HTTP client can request DDS data using REST
 * `web_socket` shows how to push DDS data to a browser through [socket.io](https://github.com/Automattic/socket.io)

## Dependencies

RTI Connector for JavaScript has the following dependencies, which are also listed in `package.json`:
* [koffi](https://koffi.dev/): used for loading and calling dynamic libraries using pure JavaScript
* [events](https://www.npmjs.com/package/events): used for the 'EventEmitter' (legacy implementation of RTI Connector)

Additionally to run the `web_socket` example, [socket.io](https://github.com/Automattic/socket.io) and [OpenLayers](https://openlayers.org) are required.

Additional dependencies are required to run the unit tests and some of the examples. Please see the README files in the appropriate directory.

### C/C++ compiler dependency

The dependency [ref](https://www.npmjs.com/package/ref) is shipped as source code and requires a C++11 compiler.

## License

RTI Connector for JavaScript is part of the Connext
Professional Package. If you have a valid license for the RTI Connext
Professional Package, such license shall govern your use of
RTI Connector for JavaScript. All other use of this software shall
be governed solely by the terms of RTI’s Software License for Non-Commercial
Use #4040.

RTI Connector for Javascript
============================

RTI® Connext® DDS is a connectivity software framework for integrating data
sources of all types. At its core is the world's leading ultra-high performance,
distributed networking databus.

*RTI Connector* provides a quick and easy way to write applications that
publish and subscribe to the *RTI Connext DDS databus* in Javascript and other
languages.

## Documentation

To get started and learn more about *RTI Connector for Javascript* see the
[documentation here.](https://community.rti.com/static/documentation/connector/1.0.0/api/javascript/index.html)

## Examples

The `examples/nodejs` directory provides several examples:
* `simple` shows how to create basic publisher and subscriber applications
* In `transformation`, an application reads, transforms and publishes back the data
 * `web_http` shows how an HTTP client can request DDS data using REST
 * `web_socket` shows how to push DDS data to a browser through [socket.io](https://github.com/Automattic/socket.io)

## Dependencies

RTI Connector for Javascript has the following dependencies, which are also listed in `package.json`:
* [ref](https://www.npmjs.com/package/ref): turns Buffer instances into "pointers"
* [ffi](https://www.npmjs.com/package/ffi): used for loading and calling dynamic libraries using pure JavaScript
* [events](https://www.npmjs.com/package/events): used for the 'EventEmitter' (legacy implementation of RTI Connector)

Additionally to run the `web_socket` example, [socket.io](https://github.com/Automattic/socket.io) is required.

Additional dependencies are required to run the unit tests. Please see the corresponding [README](https://github.com/rticommunity/rticonnextdds-connector-js/blob/master/test/nodejs/README.md).

### Python dependency

Some of the dependencies are shipped as source code and use [node-gyp](https://github.com/nodejs/node-gyp) to be compiled locally. `node-gyp` requires Python 2.7 and does not work with Python 3. The requirements for `node-gyp` can be found at:
* [unix](https://github.com/nodejs/node-gyp#on-unix)
* [dawin](https://github.com/nodejs/node-gyp#on-macos)
* [windows](https://github.com/nodejs/node-gyp#on-windows)

### C/C++ compiler dependency

The dependency [ref](https://www.npmjs.com/package/ref) is shipped as source code and requires a C++11 compiler.

## License
With the sole exception of the contents of the "examples" subdirectory, all use of this product is subject to the RTI Software License Agreement included at the top level of this repository. Files within the "examples" subdirectory are licensed as marked within the file.

This software is an experimental ("pre-production") product. The Software is provided "as is," with no warranty of any type, including any warranty for fitness for any purpose. RTI is under no obligation to maintain or support the software. RTI shall not be liable for any incidental or consequential damages arising out of the use or inability to use the software.

(return to [rticonnextdds-connector](https://github.com/rticommunity/rticonnextdds-connector))

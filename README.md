rticonnextdds-connector: Node.js/JavaScript
=======

(return to [rticonnextdds-connector](https://github.com/rticommunity/rticonnextdds-connector))

### RTI Connector for Connext DDS
*RTI Connector* for Connext DDS is a quick and easy way to access the power and
functionality of [RTI Connext DDS](http://www.rti.com/products/index.html).
It is based on [XML Application Creation](https://community.rti.com/static/documentation/connext-dds/6.0.0/doc/manuals/connext_dds/xml_application_creation/RTI_ConnextDDS_CoreLibraries_XML_AppCreation_GettingStarted.pdf) and Dynamic Data.

____
**Warning**: The Node.js/JavaScript *Connector* uses 0-based indexing for sequences since
v0.4.0. Previously sequences started at index 1. See *read/take data* more more
information.
____

### Dependencies

#### Node.js packages:
 The Node.js/JavaScript *Connector* has the following dependencies, which are also listed in package.json:
* [ref](https://www.npmjs.com/package/ref): turns Buffer instances into "pointers"
* [util](https://www.npmjs.com/package/util): used for 'inherits' and for formatting strings
* [ffi](https://www.npmjs.com/package/ffi): used for loading and calling dynamic libraries using pure JavaScript
* [events](): used for the 'EventEmitter'

There are also some dependencies for the examples:
* [sleep](https://www.npmjs.com/package/sleep): to sleep x amount of seconds
* [socket.io](https://www.npmjs.com/package/socket.io): for an example of integration between DDS and a web browser

#### node-gyp and python
Some of the dependencies are not pure JavaScript and are shipped as source code. They use [node-gyp](https://github.com/nodejs/node-gyp) to compile. node-gpy requires python 2.7; it does not work with python 3.x.x. Please check the requirement for node-gpy at the following links:
* [unix](https://github.com/nodejs/node-gyp#on-unix)
* [dawin](https://github.com/nodejs/node-gyp#on-macos)
* [windows](https://github.com/nodejs/node-gyp#on-windows)

#### C/C++ compiler
Some of the *Connector* dependencies, such as [ref](https://www.npmjs.com/package/ref), are distributed in source code and they depend on [nan](https://www.npmjs.com/package/nan) (Native Abstractions for Node.js). If you are using a modern version of Node.js, have a modern C++ compiler on your machine (C++11).

*Connector* may work with older versions of OS/Compiler/Node if you are able to get all the dependencies compiled.

### Language Support
This repository is specific to Node.js/JavaScript. For other languages (python, lua, C, etc.), refer to the [main *Connector* repository](https://github.com/rticommunity/rticonnextdds-connector).

We use [libffi](https://github.com/node-ffi/node-ffi) to call our library; these details are hidden in a JavaScript wrapper. RTI tested its Node.js/JavaScript implementation with node v8.7.0; it should also work with lower versions.

### Platform support
Node.js/JavaScript *Connector* builds its library for [select architectures](https://github.com/rticommunity/rticonnextdds-connector/tree/master/lib).
__Be sure to read the dependencies section above.__
If you need another architecture, please contact your RTI account manager or sales@rti.com.

**Windows Note**: RTI tested the Node.js/JavaScript *Connector* on Windows® 10 64-bit. Those tests showed that npm works best with Visual Studio Express 2013.
Feel free to ask questions on the [RTI Community forum](https://community.rti.com/forums/technical-questions) for more details on Windows and *Connector*.

To check the version of the libraries, run the following command. For example:

### Testing
We tested on:
* For MacOS 64 bit : Darwin 18  clang 10
* For Windows 64 bit: Windows 10 64 bit VS2015
* For Windows 32 bit: Windows 7 32 bit VS2017
* For Linux 64 bit: CentOS 6.5 gcc 4.8.2
* For Linux 32 bit: Ubuntu 16.04 gcc 5.4.0
* For ARM: Yocto linux 2.0.3 gcc 5.2.0

### Version of Connext
``` bash
strings librtiddsconnector.dylib | grep BUILD
```

### Threading model
The *Connector* Native API does not yet implement any mechanism for thread safety. For now, you are responsible for protecting calls to *Connector*. (In future, thread safety may be added in the native layer.)
In Node.js/JavaScript, threading should not be a problem due to the 'callback' style of the language.

### Support
*Connector* is an experimental RTI product. If you have questions, use the [RTI Community forum](https://community.rti.com/forums/technical-questions).

### Getting started with Node.js
Be sure you have all the tools to work with Node.js. Then invoke:

``` bash
$ npm install rticonnextdds-connector
```

When the installation is complete, cd into the node_modules directory.


### Available examples
You can find several sets of examples in the [examples/nodejs](examples/nodejs) directory.  If you used npm to install, you will need to clone the this repository to access the examples.

 * **simple**: shows how to write samples, how to read/take, and how to use event-based reading.
 * **transform**: shows how to write a simple transformation using *Connector*. This is also a good place to understand how to use the setFromJSON and getJSON APIs to interact with samples and instances.
 * **web_http**: shows how an HTTP client can request DDS data using REST.
 * **web_socket**: shows how to push DDS data to a browser through [socket.io](https://github.com/Automattic/socket.io).

### API overview
#### require the *Connector* library
To use `rticonnextdds-connector`, require it as follows:

```js
var rti = require('rticonnextdds-connector');
```

#### instantiate a new *Connector*
To create a new *Connector*, pass an XML file and a configuration name:    

```js
var connector = new rti.Connector("MyParticipantLibrary::Zero","./ShapeExample.xml");
```
For more information on
the XML format, see the [XML-Based Application Creation Getting Started Guide](https://community.rti.com/static/documentation/connext-dds/6.0.0/doc/manuals/connext_dds/xml_application_creation/RTI_ConnextDDS_CoreLibraries_XML_AppCreation_GettingStarted.pdf) or
look at the [ShapeExample.xml](examples/nodejs/ShapeExample.xml) file included in the examples directory.

#### delete a *Connector*
To destroy all the DDS entities that belong to a *Connector* previously created, call the ```delete``` function:

```js
var connector = new rti.Connector("MyParticipantLibrary::Zero","./ShapeExample.xml");
...
...
connector.delete();
```

#### write a sample
To write a sample, first get a reference to the output port:

```js
var output = connector.getOutput("MyPublisher::MySquareWriter");
```

Then set the instance's fields:

```js
output.instance.setNumber("x",1);
output.instance.setNumber("y",2);
output.instance.setNumber("shapesize",30);
output.instance.setString("color", "BLUE");
```

Then write:

```js
output.write();
```

#### set the instance's fields:
The content of an instance can be set in two ways:

 * **Field by field**:

```js
output.instance.setNumber("y",2);
```

The following APIs set an instance field by field: `setNumber(fieldName, number);` `setBoolean(fieldName, boolean);` and `setString(fieldName, string);`.

Nested fields can be accessed with the dot notation `"x.y.z"`. Arrays or sequences can be accessed with square brackets: `"x.y[1].z"`. For more information on how to access
fields, see the "Data Access API" section of the
[RTI Prototyper Getting Started Guide](https://community.rti.com/static/documentation/connext-dds/6.0.0/doc/manuals/connext_dds/prototyper/RTI_ConnextDDS_CoreLibraries_Prototyper_GettingStarted.pdf).


 * **Passing a JSON object**:

```js
output.setFromJSON(jsonObj)
```


#### read/take data
To read/take samples, first get a reference to the input port:

```js
var input = connector.getInput("MySubscriber::MySquareReader");
```

Then call the `read()` or `take()` API:

```js
input.read();
```

 or

```js
input.take();
```

The read/take operation can return multiple samples. Therefore, you must iterate on an array:

```js
for (i=0; i <= input.samples.getLength(); i++) {
  if (input.infos.isValid(i)) {
    console.log(JSON.stringify(input.samples.getJSON(i)));
  }
}
```

#### access sample fields after a read/take
A `read()` or `take()` operation can return multiple samples. They are stored in an array.

We can access the samples in two ways:

 * **Field by field**:

 ```js
 for (i=0; i <= input.samples.getLength(); i++) {
   if (input.infos.isValid(i)) {
     console.log(input.samples.getNumber(i, "x"));
   }
 }
 ```

 The following APIs access the samples field by field: `getNumber(indexm fieldName);` `getBoolean(index, fieldName);` and `getString(index, fieldName);`.

 * **As a JSON object**:

 ```js
 for (i=0; i <= input.samples.getLength(); i++) {
   if (input.infos.isValid(i)) {
     console.log(JSON.stringify(input.samples.getJSON(i)));
   }
 }
 ```

#### event-based reading

 If you don't want to do polling, ask *Connector* to notify you when data is available:

 ```js
 connector.on('on_data_available',
   function() {
     input.take();
     for (i=0; i <= input.samples.getLength(); i++) {
         if (input.infos.isValid(i)) {
             console.log(JSON.stringify(input.samples.getJSON(i)));
         }
     }

});
```

Notice that if you have multiple inputs, you will have to check all of them.  

### License
With the sole exception of the contents of the "examples" subdirectory, all use of this product is subject to the RTI Software License Agreement included at the top level of this repository. Files within the "examples" subdirectory are licensed as marked within the file.

This software is an experimental ("pre-production") product. The Software is provided "as is," with no warranty of any type, including any warranty for fitness for any purpose. RTI is under no obligation to maintain or support the software. RTI shall not be liable for any incidental or consequential damages arising out of the use or inability to use the software.

(return to [rticonnextdds-connector](https://github.com/rticommunity/rticonnextdds-connector))

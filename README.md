rticonnextdds-connector: Node.js/JavaScript
=======

### RTI Connector for Connext DDS
*RTI Connector* for Connext DDS is a quick and easy way to access the power and
functionality of [RTI Connext DDS](http://www.rti.com/products/index.html).
It is based on [XML Application Creation](https://community.rti.com/static/documentation/connext-dds/5.3.1/doc/manuals/connext_dds/xml_application_creation/RTI_ConnextDDS_CoreLibraries_XML_AppCreation_GettingStarted.pdf) and Dynamic Data.

### Language Support
This repository is specific to Node.js/JavaScript, for other languages (python, lua, C) refer to the [main repository of connector](https://github.com/rticommunity/rticonnextdds-connector)
### Platform support
We are building our library for a few architectures only. Check them out [here](https://github.com/rticommunity/rticonnextdds-connector/tree/master/lib). If you need another architecture, please contact your RTI account manager or sales@rti.com.

**Windows Note**: We tested the Node.js/JavaScript Connector on Win10 64 bit. We notice that npm works best with VS Express 2013.
Feel free to ask questions on the [RTI Community forum](https://community.rti.com/forums/technical-questions) for more details on Windows and Connector.

If you want to check the version of the libraries, run the following command:

``` bash
strings librtiddsconnector.dylib | grep BUILD
```

### Threading model
The *Connector* Native API does not yet implement any mechanism for thread safety. For now, the responsibility of protecting calls to the *Connector* is left to you. (In future we may add thread safety in the native layer.)
In Node.js/JavaScript, threading should not be a problem due to the 'callback' style of the language itself.

### Support
This is an experimental RTI product. As such, we offer support through the [RTI Community forum](https://community.rti.com/forums/technical-questions).

### Getting started with Node.js
Be sure you have all the tools to work with Node.js. Then invoke:

``` bash
$ npm install rticonnextdds-connector
```

When the installation is complete, cd into your node_modules directory and have a look at .


### Available examples
You can find several sets of examples in this directory: [examples/nodejs/README.md](examples/nodejs/README.md)

 * **simple**: shows how to write samples, how to read/take, and how to use event-based reading.
 * **transform**: shows how to write a simple transformation using *Connector*. This is also a good place to understand how to use the setFromJSON and getJSON APIs to interact with samples and instances.
 * **web_http**: shows how an HTTP client can request DDS data using REST.
 * **web_socket**: shows how to push DDS data to a browser through [socket.io](https://github.com/Automattic/socket.io).

### API overview
#### require the *Connector* library
If you want to use the `rticonnextdds-connector`, you have to require it:

```js
var rti = require('rticonnextdds-connector');
```

#### instantiate a new *Connector*
To create a new *Connector*, you have to pass an XML file and a configuration name. For more information on
the XML format, see the [XML Application Creation Getting Started Guide](https://community.rti.com/static/documentation/connext-dds/5.3.1/doc/manuals/connext_dds/xml_application_creation/RTI_ConnextDDS_CoreLibraries_XML_AppCreation_GettingStarted.pdf) or
have a look at the [ShapeExample.xml](examples/nodejs/ShapeExample.xml) file included in the example directory.   

```js
var connector = new rti.Connector("MyParticipantLibrary::Zero","./ShapeExample.xml");
```

#### delete a *Connector*
To destroy all the DDS entities that belong to a *Connector* previously created, call the ```delete``` function.

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

The APIs to set an instance field by field are three: `setNumber(fieldName, number);` `setBoolean(fieldName, boolean);` and `setString(fieldName, string);`.

Nested fields can be accessed with the dot notation: `"x.y.z"`. Arrays or sequences can be accessed with square brackets: `"x.y[1].z"`. For more information on how to access
fields, see Section 6.4 *Data Access API* of the
[RTI Prototyper Getting Started Guide](https://community.rti.com/static/documentation/connext-dds/5.3.1/doc/manuals/connext_dds/prototyper/RTI_ConnextDDS_CoreLibraries_Prototyper_GettingStarted.pdf).


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

The read/take operation can return multiple samples. So, we have to iterate on an array:

```js
for (i=1; i <= input.samples.getLength(); i++) {
  if (input.infos.isValid(i)) {
    console.log(JSON.stringify(input.samples.getJSON(i)));
  }
}
```

#### access sample fields after a read/take
A `read()` or `take()` operation can return multiple samples. They are stored in an array.

We can access them in two ways:

 * **Field by field**:

 ```js
 for (i=1; i <= input.samples.getLength(); i++) {
   if (input.infos.isValid(i)) {
     console.log(input.samples.getNumber(i, "x"));
   }
 }
 ```

 The APIs to access the samples are three: `getNumber(indexm fieldName);` `getBoolean(index, fieldName);` and `getString(index, fieldName);`.

 * **As a JSON object**:

 ```js
 for (i=1; i <= input.samples.getLength(); i++) {
   if (input.infos.isValid(i)) {
     console.log(JSON.stringify(input.samples.getJSON(i)));
   }
 }
 ```

#### event-based reading

 If you don't want to do polling, you can ask *Connector* to notify you when data is available:

 ```js
 connector.on('on_data_available',
   function() {
     input.take();
     for (i=1; i <= input.samples.getLength(); i++) {
         if (input.infos.isValid(i)) {
             console.log(JSON.stringify(input.samples.getJSON(i)));
         }
     }

});
```

Notice that if you have multiple inputs, you will have to check all of them yourself.  

### License
With the sole exception of the contents of the "examples" subdirectory, all use of this product is subject to the RTI Software License Agreement included at the top level of this repository. Files within the "examples" subdirectory are licensed as marked within the file.

This software is an experimental ("pre-production") product. The Software is provided "as is," with no warranty of any type, including any warranty for fitness for any purpose. RTI is under no obligation to maintain or support the software. RTI shall not be liable for any incidental or consequential damages arising out of the use or inability to use the software.

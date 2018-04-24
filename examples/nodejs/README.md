rticonnextdds-connector: Node.js/JavaScript
========

### Installation and platform support
Check [here](https://github.com/rticommunity/rticonnextdds-connector#getting-started-with-nodejs) and [here](https://github.com/rticommunity/rticonnextdds-connector#platform-support).
If you still have trouble, visit the [RTI Community forum](https://community.rti.com/forums/technical-questions).

### Available examples
In this directory, you can find several sets of examples

 * **simple**: shows how to write samples, how to read/take, and how to use event-based reading
 * **transform**: shows how to write a simple transformation using Connector. This is also a good place to understand how to use the setFromJSON and getJSON APIs to interact with samples and instances.
 * **web_http**: shows how an HTTP client can request DDS data using REST.
 * **web_socket**: shows how to push DDS data to a browser through [socket.io](https://github.com/Automattic/socket.io).

### API overview
#### require the connector library
If you want to use the `rticonnextdds-connector`, you have to require it:

```js
var rti = require('rticonnextdds-connector');
```

#### instantiate a new connector
To create a new connector, you have to pass an XML file and a configuration name. For more information on
the XML format, see the [XML Application Creation Getting Started Guide](https://community.rti.com/rti-doc/510/ndds.5.1.0/doc/pdf/RTI_CoreLibrariesAndUtilities_XML_AppCreation_GettingStarted.pdf) or
have a look at the [ShapeExample.xml](ShapeExample.xml) file included in this directory.  

```js
var connector = new rti.Connector("MyParticipantLibrary::Zero","./ShapeExample.xml");
```

#### delete a connector
To destroy all the DDS entities that belong to a connector previously created, call the ```delete``` function.

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

#### setting the instance's fields:
The content of an instance can be set in two ways:

 * **Field by field**:

```js
output.instance.setNumber("y",2);
```

The APIs to set an instance field by field are just three: `setNumber(fieldName, number);` `setBoolean(fieldName, boolean);` and `setString(fieldName, string);`.

Nested fields can be accessed with the dot notation, `"x.y.z"`; arrays or sequences with square brakets: `"x.y[1].z"`. For more information on how to access
fields, see Section 6.4 'Data Access API' of the
[RTI Prototyper Getting Started Guide](https://community.rti.com/rti-doc/510/ndds.5.1.0/doc/pdf/RTI_CoreLibrariesAndUtilities_Prototyper_GettingStarted.pdf).


 * **Passing a JSON object**:

```js
output.setFromJSON(jsonObj)
```


#### reading/taking data
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

#### accessing sample fields after a read/take
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

 The APIs to access the samples are just three: `getNumber(indexm fieldName);` `getBoolean(index, fieldName);` and `getString(index, fieldName);`.

 * **As a JSON object**:

 ```js
 for (i=1; i <= input.samples.getLength(); i++) {
   if (input.infos.isValid(i)) {
     console.log(JSON.stringify(input.samples.getJSON(i)));
   }
 }
 ```

#### event-based reading

 If you don't want to do polling, you can ask Connector to notify you when data is available:

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

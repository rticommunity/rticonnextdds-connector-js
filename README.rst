RTI Connector for JavaScript
============================

RTI® Connext® DDS is a connectivity software framework for integrating
data sources of all types. At its core is the world's leading ultra-high
performance, distributed networking databus.

*RTI Connector* provides a quick and easy way to write applications that
publish and subscribe to the *RTI Connext DDS databus* in JavaScript and
other languages.

Documentation
-------------

To get started and learn more about *RTI Connector for JavaScript* see
the `documentation
here. <https://community.rti.com/static/documentation/connector/current/api/javascript/index.html>`__

Examples
--------

The ``examples/nodejs`` directory provides several examples:

-  ``simple`` shows how to create basic publisher and subscriber
   applications
-  In ``transformation``, an application reads, transforms and publishes
   back the data
-  ``web_http`` shows how an HTTP client can request DDS data using REST
-  ``web_socket`` shows how to push DDS data to a browser through
   `socket.io <https://github.com/Automattic/socket.io>`__

Dependencies
------------

RTI Connector for JavaScript has the following dependencies, which are
also listed in ``package.json``: \*
`ref-napi <https://www.npmjs.com/package/ref-napi>`__: turns Buffer
instances into "pointers" \*
`ref-struct-napi <https://www.npmjs.com/package/ref-struct-napi>`__:
create ABI-compilant "Struct" instances on top of Buffers \*
`ffi-napi <https://www.npmjs.com/package/ffi-napi>`__: used for loading
and calling dynamic libraries using pure JavaScript \*
`events <https://www.npmjs.com/package/events>`__: used for the
'EventEmitter' (legacy implementation of RTI Connector)

Additionally to run the ``web_socket`` example,
`socket.io <https://github.com/Automattic/socket.io>`__ and
`OpenLayers <https://openlayers.org>`__ are required.

Additional dependencies are required to run the unit tests and some of
the examples. Please see the README files in the appropriate directory.

Python dependency
~~~~~~~~~~~~~~~~~

Some of the dependencies are shipped as source code and use
`node-gyp <https://github.com/nodejs/node-gyp>`__ to be compiled
locally. ``node-gyp`` requires Python 2.7 and does not work with Python
3. The requirements for ``node-gyp`` can be found at: \*
`unix <https://github.com/nodejs/node-gyp#on-unix>`__ \*
`darwin <https://github.com/nodejs/node-gyp#on-macos>`__ \*
`windows <https://github.com/nodejs/node-gyp#on-windows>`__

C/C++ compiler dependency
~~~~~~~~~~~~~~~~~~~~~~~~~

The dependency `ref <https://www.npmjs.com/package/ref>`__ is shipped as
source code and requires a C++11 compiler.

License
-------

RTI Connector for JavaScript and RTI Connector for Python are part of
the Connext DDS Professional Package. If you have a valid license for
the RTI Connext DDS Professional Package, such license shall govern your
use of RTI Connector for Python and RTI Connector for JavaScript. All
other use of this software shall be governed solely by the terms of
RTI’s Software License for Non-Commercial Use #4040, included at the top
level of the \`Connector for Python repository

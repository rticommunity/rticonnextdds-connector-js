Getting Started
===============

.. highlight:: javascript

Installing RTI Connector for JavaScript
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

*RTI Connector for JavaScript* can be installed with npm in two ways:

You can pass the package name:

.. code:: bash

    $ npm install rticonnextdds-connector

Or the GitHub repository:

.. code:: bash

   $ npm install https://www.github.com/rticommunity/rticonnextdds-connector-js.git

In order to gain access to the examples, run npm with the GitHub repository.

npm uses `node-gyp <https://github.com/nodejs/node-gyp>`__ to locally compile some of *Connector*'s
dependencies. This requires Python 2.7 (it will not work with Python 3) and a relatively recent C++
compiler (such as gcc 4.8+).

On Windows you can install the `Windows Build Tools <https://www.npmjs.com/package/windows-build-tools>`__,
which include both the Visual C++ compiler and Python 2.7.

Running the examples
~~~~~~~~~~~~~~~~~~~~

The examples are located in the `examples/nodejs <https://github.com/rticommunity/rticonnextdds-connector-js/tree/master/examples/nodejs>`__
directory of the *RTI Connector for JavaScript* GitHub repository. The npm installation
will copy the examples under ``<installation directory>/node_modules/rticonnextdds-connector/``.

In the simple example, `writer.js` periodically publishes data for a
*Square* topic, and `reader.js` subscribes to the topic and prints all the
data samples it receives.

Run the reader as follows:

.. code:: bash

    node examples/nodejs/simple/reader.js

And, in another shell, run the writer:

.. code:: bash

    node examples/nodejs/simple/writer.js

This is how ``reader.js`` looks like:

.. literalinclude:: ../examples/nodejs/simple/reader.js
    :lines: 10-

And this is ``writer.js``:

.. literalinclude:: ../examples/nodejs/simple/writer.js
    :lines: 11-

You can run the reader and the writer in any order, and you can run multiple
instances of each at the same time. You can also run any other *DDS* application
that publishes or subscribes to the *Square* topic. For example, you can use
`RTI Shapes Demo <https://www.rti.com/free-trial/shapes-demo>`__.

To learn more about *RTI Connector* continue to the next section,
:ref:`Using a Connector`.

Supported Platforms
~~~~~~~~~~~~~~~~~~~

*RTI Connector for JavaScript* has been tested with Node.js versions 8.7.0, 10.4.0 and 11.15.0.
*Connector* currently does not work with Node.js 12 because some of its dependencies,
such as *ffi* are not yet compatible with this version.

*Connector* uses a native C library that works on most Windows, Linux and
MacOS platforms. It has been tested on the following systems:


    * Windows: Windows 7 and Windows 10
    * x86/x86_64 Linux: CentOS 7.6, 8.0; Ubuntu 18.04; SUSE 15
    * ARM Linux (Raspberry Pi)
    * Mac: OS X 10.10.2, macOS 10.12.2, macOS 10.14

*RTI Connector* is supported in other languages in addition to JavaScript, see
`the main Connector
repository <https://github.com/rticommunity/rticonnextdds-connector>`__.

Version
~~~~~~~

The library used by Connector is built on top of RTI® Connext® DDS, currently the version built against is 6.0.1.
This library is statically linked and a dynamically linked variant is not currently available.

License
~~~~~~~

With the sole exception of the contents of the "examples" subdirectory, all use
of the software shall be governed by this license. RTI Connector for JavaScript
and RTI Connector for Python is part of the Connext DDS Professional Package.
If you have a valid license for the RTI Connext DDS Professional Package,
such license shall govern your use of RTI Connector for Python and RTI Connector
for JavaScript. All other use of this software shall be governed solely by the
terms of RTI’s Software License for Non-Commercial Use #4040, included at the
top level of this repository.

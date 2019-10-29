Getting Started
===============

.. highlight:: javascript

Installing RTI Connector for JavaScript
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

*RTI Connector for JavaScript* can be installed in two ways.

You can install the *RTI Connector for JavaScript* package via npm:

.. code:: bash

    $ npm install rticonnextdds-connector

Alternatively, running ``npm install`` with the git repository as the argument will fetch the required
files from the github repository, and also install all of the required dependencies:

.. code:: bash

   $ npm install https://www.github.com/rticommunity/rticonnextdds-connector-js.git

The examples can then be run as follows:

.. code:: bash

    $ node node_modules/rticonnextdds-connector/examples/nodejs/simple/reader.js

In order to gain access to the examples, run ``npm install`` with the git repository.

Running the examples
~~~~~~~~~~~~~~~~~~~~

The examples are located in the `examples/nodejs <https://github.com/rticommunity/rticonnextdds-connector-js/tree/master/examples/nodejs>`__
directory of the *RTI Connector for JavaScript* GitHub repository.

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
    :lines: 13-

And this is ``writer.js``:

.. literalinclude:: ../examples/nodejs/simple/writer.js
    :lines: 14-

You can run the reader and the writer in any order, and you can run multiple
instances of each at the same time. You can also run any other *DDS* application
that publishes or subscribes to the *Square* topic. For example, you can use
`RTI Shapes Demo <https://www.rti.com/free-trial/shapes-demo>`__.

To learn more about *RTI Connector* continue to the next section,
:ref:`Using a Connector`.

Supported Platforms
~~~~~~~~~~~~~~~~~~~

*RTI Connector for JavaScript* has not been tested with versions of Node.js older than v8.7.0.
It has been tested with Node.js versions v8.7.0, v10.4.0 and v11.15.0. *RTI Connector for JavaScript* current
does not work with newer versions of Node.js (v12.13.0) because some of its dependencies (ffi) are not
yet compatible with this version.

*RTI Connector* uses a native C library that works on most Windows, Linux and
MacOS platforms. It has been tested on the following systems:
**TODO**

*RTI Connector* is supported in other languages in addition to JavaScript, see
`the main Connector
repository <https://github.com/rticommunity/rticonnextdds-connector>`__.

Dependencies
~~~~~~~~~~~~

npm uses `node-gyp <https://github.com/nodejs/node-gyp>`__ to locally compile some of Connector's
dependencies. This requires Python 2.7 (it will not work with Python 3) and a relatively recent C++
compiler (such as gcc 4.8+).

On Windows systems you can install the `Windows Build Tools <https://www.npmjs.com/package/windows-build-tools>`__,
which include both the Visual C++ compiler and Python 2.7.

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

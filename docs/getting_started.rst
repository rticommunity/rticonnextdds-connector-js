Getting Started
===============

.. highlight:: javascript

Installing RTI Connector for JavaScript
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

*RTI Connector for JavaScript* can be installed with npm:

.. code:: bash

    $ npm install rticonnextdds-connector

npm uses `node-gyp <https://github.com/nodejs/node-gyp>`__ to locally compile some of *Connector*'s
dependencies. node-gyp requires a Python installation and a C++ compiler. Please refer
to the `node-gyp documentation <https://github.com/nodejs/node-gyp#installation>`__
for more details.

For more information, see :ref:`Supported Platforms`.

Running the examples
~~~~~~~~~~~~~~~~~~~~

The examples are in the `examples/nodejs <https://github.com/rticommunity/rticonnextdds-connector-js/tree/master/examples/nodejs>`__
directory of the *RTI Connector for JavaScript* GitHub repository. The npm installation
will copy the examples under ``<installation directory>/node_modules/rticonnextdds-connector/``.

In the simple example, ``writer.js`` periodically publishes data for a
*Square* topic, and ``reader.js`` subscribes to the topic and prints all the
data samples it receives.

Run the reader as follows:

.. code:: bash

    node examples/nodejs/simple/reader.js

And, in another shell, run the writer:

.. code:: bash

    node examples/nodejs/simple/writer.js

This is what ``reader.js`` looks like:

.. literalinclude:: ../examples/nodejs/simple/reader.js
    :lines: 10-

And this is ``writer.js``:

.. literalinclude:: ../examples/nodejs/simple/writer.js
    :lines: 11-

You can run the reader and the writer in any order, and you can run multiple
instances of each at the same time. You can also run any other *DDS* application
that publishes or subscribes to the *Square* topic. For example, you can use
`RTI Shapes Demo <https://www.rti.com/free-trial/shapes-demo>`__.

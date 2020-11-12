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

In order to access the examples, run npm with the GitHub repository.

*Connector* works with Node.js versions 10.x.x to 13.x.x [#f1]_. It currently doesn't work
with versions 14+ because one of its dependencies is not yet compatible with that version.

npm uses `node-gyp <https://github.com/nodejs/node-gyp>`__ to locally compile some of *Connector*'s
dependencies. This requires Python 2.7 (it will not work with Python 3) and a relatively recent C++
compiler (such as gcc 4.8+).

On Windows systems, you can install the `Windows Build Tools <https://www.npmjs.com/package/windows-build-tools>`__,
which include both the Visual C++ compiler and Python 2.7.

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

.. rubric:: Footnotes
.. [#f1] Note that Connector for JavaScript is not compatible with Node.js v12.19.0
   due to a regression that was introduced in that version of Node.js. Connector for JavaScript
   works with Node.js versions 12.18.x and 12.20.x.
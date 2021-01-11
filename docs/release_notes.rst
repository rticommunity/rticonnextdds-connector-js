Release Notes
=============

Supported Platforms
~~~~~~~~~~~~~~~~~~~

*RTI Connector for JavaScript* has been tested with Node.js versions
10.4.0, 11.15.0 and 12.13.0.

*Connector* uses a native C library that works on most Windows®, Linux® and
macOS® platforms. It has been tested on the following systems:

    * Windows: Windows 7 and Windows 10
    * x86/x86_64 Linux: CentOS 7.6, 8.0; Ubuntu® 18.04; SUSE® 15
    * Arm® Linux (Raspberry Pi)
    * Mac®: OS X 10.10.2, macOS 10.12.2, macOS 10.14

*Connector* is supported in other languages in addition to JavaScript, see
`the main Connector
repository <https://github.com/rticommunity/rticonnextdds-connector>`__.

Version 1.1.0
~~~~~~~~~~~~~

*RTI Connector* 1.1.0 is built on `RTI Connext DDS 6.1.0 <https://community.rti.com/documentation/rti-connext-dds-610>`__.

What's New in 1.1.0
^^^^^^^^^^^^^^^^^^^

Support added for Node.js version 12
""""""""""""""""""""""""""""""""""""
.. CON-173 

Previously, Node.js version 12 was not supported *Connector* for JavaScript.
Support has been added for Node.js version 12 (the current LTS), and support has
been dropped for Node.js version 8 (which has been deprecated). Note that Node.js
version 12.19.0 is incompatible with Connector for JavaScript due to a regression
in that release of Node.js. Versions 12.18.x and 12.20.x are compatible with
Connector for JavaScript.


Sample state, instance state and view state can now be obtained in Connector
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
.. CON-177 

The :class:`SampleInfo` class in *Connector* has been extended to provide access to the
sample state, view state, and instance state fields. These new fields work the
same as the existing fields in the structure (in *Connector* for Python they are
the keys to the dictionary, in *Connector* for JavaScript they are the keys to the
JSON Object). See :ref:`Accessing sample meta-data` for more information on this
new feature.


Support for accessing the key values of disposed instances
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
.. CON-188 

Support for disposing instances was added in *Connector* 1.0.0.
However, it was not possible to access the key values of the disposed instance.
This functionality is now available in the Python and JavaScript bindings.
When a disposed sample is received, the key values can be accessed.
The syntax for accessing these key values is the same as when the sample
contains valid data (i.e., using type-specific getters, or obtaining the entire
sample as an object). When the instance state is NOT_ALIVE_DISPOSED, only the
key values in the sample should be accessed.
See :ref:`Accessing key values of disposed samples` for more
information on this new feature.


What's Fixed in 1.1.0
^^^^^^^^^^^^^^^^^^^^^

Creating two instances of Connector resulted in a license error
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

Under some circumstances, it was not possible to create two *Connector* objects.
The creation of the second *Connector* object failed due to a license error.
This issue affected all of the *Connector* APIs (Python, JavaScript).
This issue has been fixed.

[RTI Issue ID CON-163]


Some larger integer values may have been corrupted by Connector's internal JSON parser
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

The internal JSON parser used in *Connector* failed to identify integer numbers
from double-precision floating-point numbers for certain values.
For example, if a number could not be represented as a 64-bit integer, the
parser may have incorrectly identified it as an integer, causing the value to
become corrupted. This problem has been resolved.

[RTI Issue ID CON-170]


Support for loading multiple configuration files
""""""""""""""""""""""""""""""""""""""""""""""""

A *Connector* object now supports loading multiple files. This allows separating
the definition of types, QoS profiles, and *DomainParticipants* into different
files:

.. code-block::

  const connector = new rti.Connector("my_profiles.xml;my_types.xml;my_participants.xml", configName)

[RTI Issue ID CON-209]


Creating a Connector instance with a participant_qos tag in the XML may have resulted in a license error
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

In some cases, if the XML configuration file of *Connector* contained a
`<participant_qos>` tag within the definition of the *DomainParticipant*,
the creation of the *Connector* would fail with a "license not found" error.
This problem has been resolved.

[RTI Issue ID CON-214]


Version 1.0.0
~~~~~~~~~~~~~

1.0.0 is the first official release of *RTI Connector for JavaScript* as well as
`RTI Connector for Python <https://community.rti.com/static/documentation/connector/1.0.0/api/python/index.html>`__.

If you had access to previous experimental releases, this release makes the product
more robust, modifies many APIs and adds new functionality. However the old 
APIs have been preserved for backward compatibility as much as possible.

*RTI Connector* 1.0.0 is built on `RTI Connext DDS 6.0.1 <https://community.rti.com/documentation/rti-connext-dds-601>`__.

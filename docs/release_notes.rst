Release Notes
*************

Supported Platforms
===================

*Connector* has been validated to run with the following Node.js versions:
  * v18
  * v19
  * v20
  * v22
  * v24

Other versions may also work, but have not been validated internally.
If you run into an issue, make sure that the issue can be reproduced
in any of the versions listed above.

*Connector* uses a native C library that works on most Windows®, Linux® and
macOS® platforms. It has been tested on the following systems:

**Linux**
  * CentOS™ 7.0 (x64)
  * Red Hat® Enterprise Linux 7, 7.3, 7.5, 7.6, 8, 9 (x64)
  * Ubuntu® 18.04 LTS (x64, Arm v7, Arm v8), 20.04 LTS (x64), 22.04 LTS (x64, Arm v8)

**macOS**
  * macOS 11, 12, 13 (x64)

**Windows**
  * Windows 10, 11 (x64)
  * Windows Server 2016, 2022 (x64)

*Connector* is supported in other languages in addition to JavaScript, see
`the main Connector
repository <https://github.com/rticommunity/rticonnextdds-connector>`__.

Current Release
=============

Version 1.4.0
-------------

*RTI Connector* 1.4.0 is built on *RTI Connext 7.6.0*.
For more details on what's new and fixed in 7.6.0, see
`RTI Connext 7.6.0 Release Notes <https://community.rti.com/documentation/rti-connext-dds-760>`__.

What's New in 1.4.0
^^^^^^^^^^^^^^^^^^^

Support for Node.js 22
""""""""""""""""""""""

*Connector* 1.4.0 adds support for Node.js 22, which is the current LTS version.

What's Fixed in 1.4.0
^^^^^^^^^^^^^^^^^^^^^

Potential errors on copying strings when using JSON
"""""""""""""""""""""""""""""""""""""""""""""""""""
*This issue was fixed in version 1.3.0 but not documented at that time*

*Connector* did not check the return value of snprintf, which could fail 
in scenarios where, for example, the input buffer was not big enough. 
This issue affected code related to:

* Getting JSON list of matched publication names
* Getting JSON list of matched subscription names
* Getting JSON representation of sample identity

[RTI Issue ID CON-307]

Connector did not perform range checks when setting numbers into samples
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

When setting numeric values into a sample that natively used the ``RTI_Connector_set_number_into_samples``
function, *Connector* did not perform any type of range checking.
This issue could have led to unexpected values in fields that couldn't represent the given numeric
values. For example, if the value ``364`` was set in a char field.

An error is now raised when a provided value does not fit into the selected field, preventing unexpected values.

[RTI Issue ID CON-324]

Previous Releases
=================

Version 1.3.1
--------------

What's New in 1.3.1
^^^^^^^^^^^^^^^^^^^

*RTI Connector* 1.3.1 is built on *RTI Connext* 7.3.0.2.
For details on what's new and fixed in 7.3.0.2, contact support@rti.com.


Replaced Foreign Function Interface third-party library
"""""""""""""""""""""""""""""""""""""""""""""""""""""""
.. CON-304

In this release, *Connector* has replaced ``node-ffi-napi`` with ``koffi`` as the
Foreign Function Interface library. This change shouldn't affect your use of
*Connector*, but makes the product more stable and reliable.

This change addresses `Github Issue #198 <https://github.com/rticommunity/rticonnextdds-connector-js/issues/198>`_.


What's Fixed in 1.3.1
^^^^^^^^^^^^^^^^^^^^^

Failed to create Connectors for configurations using Types containing empty structs
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

When using a configuration that included Types containing empty structs, a
Connector failed to be created, with the following error:

.. code:: 

   DDS_DynamicData2_allocateMembers: Could not reserve buffer of 0 bytes for values

[RTI Issue ID CON-318]


Version 1.3.0
-------------

What's New in 1.3.0
^^^^^^^^^^^^^^^^^^^

*RTI Connector* 1.3.0 is built on 
`RTI Connext DDS 7.3.0 <https://community.rti.com/documentation/rti-connext-dds-730>`__.


Failed to create a Connector in certain Node versions (18.8 or greater)
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
.. CON-299

Due to an incompatibility in some *Connector* dependencies, it was not 
possible to create a *Connector* when using certain Node.js versions. Trying
to create a *Connector* showed the following backtrace:

.. code:: 

  rticonnextdds-connector-js/node_modules/ffi-napi/lib/dynamic_library.js:67
    if (match = err.match(/^(([^ \t()])+\.so([^ \t:()])*):([ \t])*/)) {
                    ^
   TypeError: Cannot read properties of null (reading 'match')
..

This issue is known to have affected Node.js versions 18.8 and 20; other
versions may also have been affected.

Version 1.2.2
-------------

What's New in 1.2.2
^^^^^^^^^^^^^^^^^^^

*RTI Connector* 1.2.2 is built on 
`RTI Connext DDS 6.1.2 <https://community.rti.com/documentation/rti-connext-dds-612>`__.

Native Windows libraries updated to Visual Studio 2015
""""""""""""""""""""""""""""""""""""""""""""""""""""""
.. CON-276

Previously, the native libraries shipped with Connector were built using Visual
Studio 2013 (and accompanied by Microsoft's mscvr120 redistributable). These
libraries are now built using Visual Studio 2015. The redistributable that is
shipped has been updated accordingly.

Version 1.2.1
-------------

What's New in 1.2.1
^^^^^^^^^^^^^^^^^^^

*Connector* 1.2.1 updates some third party dependencies that were found to contain
vulnerabilities. *Connector* was not affected by these vulnerabilities.

Version 1.2.0
-------------

What's New in 1.2.0
^^^^^^^^^^^^^^^^^^^

*RTI Connector* 1.2.0 is built on 
`RTI Connext DDS 6.1.1 <https://community.rti.com/documentation/rti-connext-dds-611>`__.

New Platforms
"""""""""""""

*Connector* has been validated on macOS 11 (Big Sur) systems on x64 and Arm v8 
CPUs (via x64 libraries).


New API makes it easier to query what version of Connector is being used
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
.. CON-92 

A new API, :meth:`Connector.getVersion`, has been added that provides the
caller with the version of *Connector* and the version of the native
libraries being used.


What's Fixed in 1.2.0
^^^^^^^^^^^^^^^^^^^^^

Error logged when accessing string longer than 128 bytes
""""""""""""""""""""""""""""""""""""""""""""""""""""""""

Previously, on an input, when accessing a string longer than 128 bytes, the
following error was printed:

.. code-block::

    Output buffer too small for member (name = "frame", id = 1). Provided size (128), requires size (x).

This error message was innocuous; there was actually no issue with retrieving
the string. The message is no longer printed.

[RTI Issue ID CON-157]


Support added for handling large 64-bit integers
""""""""""""""""""""""""""""""""""""""""""""""""

Support has been improved for both getting and setting large (greater than 2^53)
64-bit values. See :ref:`section-access-64-bit-integers-js` for more information.

[RTI Issue ID CON-190]


Promise returned by Output.wait did not resolve/reject
""""""""""""""""""""""""""""""""""""""""""""""""""""""

The Promise being returned by the Output.wait method (used to wait for
acknowledgements on an output) was not being resolved or rejected. This
is no longer the case; the returned Promise will now be resolved if all
samples within the *DataWriter's* queue are acknowledged within the given
timeout, or rejected if there are still outstanding samples after the
supplied timeout has elapsed.

[RTI Issue ID CON-227]

Version 1.1.1
-------------

*Connector* 1.1.1 is built on *RTI Connext DDS* 6.1.0.3, which fixes several
bugs in the Core Libraries. If you want more details on the bugs fixed in 6.1.0.3,
contact support@rti.com. These bugs are also fixed in
`RTI Connext DDS 6.1.1 <https://community.rti.com/documentation/rti-connext-dds-611>`__,
upon which *RTI Connector* 1.2.0 is built.

Version 1.1.0
-------------

What's New in 1.1.0
^^^^^^^^^^^^^^^^^^^

*RTI Connector* 1.1.0 is built on `RTI Connext DDS 6.1.0 <https://community.rti.com/documentation/rti-connext-dds-610>`__.

Support added for ARMv8 architectures
"""""""""""""""""""""""""""""""""""""
.. CON-174 

Connector for JavaScript now runs on ARMv8 architectures. Native libraries
built for ARMv8 Ubuntu 16.04 are now shipped alongside Connector. These libraries
have been tested on ARMv8 Ubuntu 16.04 and ARMv8 Ubuntu 18.04.

Support added for Node.js version 12
""""""""""""""""""""""""""""""""""""
.. CON-173 

Previously, Node.js version 12 was not supported in *Connector* for JavaScript.
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
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
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

Connector for Javascript dependencies now locked to specific versions
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
.. CON-220 

``package-lock.json`` has been committed, fixing the versions of *Connector for 
Javascript's* dependencies.


Support for Security, Monitoring and other Connext DDS add-on libraries
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

.. CON-221

It is now possible to load additional Connext DDS libraries at runtime. This means
that Connext DDS features such as Monitoring and Security Plugins are now supported.
Refer to :ref:`Loading Connext DDS Add-On Libraries` for more information.

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


Websocket example may have failed to run
""""""""""""""""""""""""""""""""""""""""

The websocket example (available only in *Connector for Javascript*) may have 
failed to run due to one of its dependencies, socket.io, removing a public API. 
This problem has been resolved.

[RTI Issue ID CON-217]


Version 1.0.0
-------------

1.0.0 is the first official release of *RTI Connector for JavaScript* as well as
`RTI Connector for Python <https://community.rti.com/static/documentation/connector/1.0.0/api/python/index.html>`__.

If you had access to previous experimental releases, this release makes the product
more robust, modifies many APIs and adds new functionality. However the old 
APIs have been preserved for backward compatibility as much as possible.

*RTI Connector* 1.0.0 is built on `RTI Connext DDS 6.0.1 <https://community.rti.com/documentation/rti-connext-dds-601>`__.


Vulnerability Assessments
=========================
Internally, *Connector* relies on Lua. RTI has assessed the current version of 
Lua used by *Connector*, version 5.2, and found that *Connector* is not currently 
affected by any of the publicly disclosed vulnerabilities in Lua 5.2.

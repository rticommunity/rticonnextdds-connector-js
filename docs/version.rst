Checking the version
====================

The API used by **Connector** can be found in the rtiddsconnector library which is shipped.
To confirm the version of RTI® Connext® DDS that this library was built against, it is necessary
to perform the following:

.. code-block:: bash

  strings librtiddsconnector.so | grep BUILD

This will provide you with the BUILD_ID of this library (``NDDSCORE_BUILD_``).
Note that the name of this library depends on the architecture you are using. On Windows
it is called ``rtiddsconnector.dll``, on Linux ``rtiddsconnector.so`` and on Darwin ``librtiddsconnector.dylib``.

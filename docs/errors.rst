Error Handling
==============

.. :currentmodule:: rticonnextdds_connector

*Connector* reports internal errors in *RTI Connext DDS* by raising an
:class:`rticonnextdds_connector.DDSError`. This exception may contain a description
of the error.

A subclass, :class:`rticonnextdds_connector.TimeoutError`, indicates that an operation that can block
has timed out.

Other errors may be raised as ``Error``, ``TypeError``, or other built-in Node.js exceptions.

Class reference: DDSError, TimeoutError
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Error class
^^^^^^^^^^^

.. autoclass:: DDSError


TimeoutError class
^^^^^^^^^^^^^^^^^^

.. autoclass:: TimeoutError

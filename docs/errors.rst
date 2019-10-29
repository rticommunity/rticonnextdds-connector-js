Error Handling
==============

.. highlight:: javascript

*Connector* reports internal errors in *RTI Connext DDS* by raising an
:class:`rticonnextdds_connector.DDSError`. This exception may contain a description
of the error.

A subclass, :class:`rticonnextdds_connector.TimeoutError`, indicates that an operation that can block
has timed out.

Other errors may be raised as ``Error``, ``TypeError``, or other built-in Node.js exceptions.

If the ``'on_data_available'`` event is used to be notified of new data, errors will
be propagated as the ``'error'`` event. If the ``'error'`` event is emitted and the
object that emits it has no attached listeners for the ``'error'`` event, the program will
be terminated with a non-zero error code and the stack trace will be printed.

Class reference: DDSError, TimeoutError
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Error class
^^^^^^^^^^^

.. autoclass:: DDSError


TimeoutError class
^^^^^^^^^^^^^^^^^^

.. autoclass:: TimeoutError

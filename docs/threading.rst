Threading model
===============

.. testsetup:: *

   const rti = require('rticonnextdds_connector')

Operations on the same :class:`Connector` instance or any contained :class:`Input`,
:class:`Output` are in general not protected for multi-threaded access. The only
exceptions are the following *wait* operations.

Thread-safe operations:
   * :meth:`Connector.wait` (wait for data on any ``Input``)
   * :meth:`Output.wait` (wait for acknowledgments)
   * :meth:`Output.waitForSubscriptions`
   * :meth:`Input.wait` (wait for data on this ``Input``)
   * :meth:`Input.waitForPublications`

These operations can block a thread while the same ``Connector`` is used in
a different thread.

.. note::
   All of the operations listed above are asynchronous (and return a ``Promise``
   which will eventually be resolved or rejected).

.. note::

   :meth:`Output.write` can block the current thread under certain
   circumstances, but :meth:`Output.write` is not thread-safe.

.. warning::

   :meth:`Output.wait` and :meth:`Output.waitForSubscriptions` are not reentrant
   (it is currently not possible to have more than one ``Promise`` pending on
   :meth:`Output.wait` or :meth:`Output.waitForSubscriptions`). Since internally
   the same resource is used for both of these operations, it is not possible to
   wait on both :meth:`Output.wait` or :meth:`Output.waitForSubscriptions` simulatenously.

.. warning::

   :meth:`Input.wait` and :meth:`Input.waitForPublications` are not reentrant
   (it is currently not possible to have more than one ``Promise`` pending on
   :meth:`Input.wait` or :meth:`Input.waitForPublications`). Since internally
   the same resource is used for both of these operations, it is not possible to
   wait on both :meth:`Input.wait` or :meth:`Input.waitForPublications` simulatenously.

All operations on **different** :class:`Connector` instances are thread-safe.

Applications can implement their own thread-safety mechanism around a ``Connector``
instance. The following section provides an example.

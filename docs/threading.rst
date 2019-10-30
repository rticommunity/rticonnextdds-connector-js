Threading model
===============

.. highlight:: javascript

All operations on **different** :class:`Connector` instances are thread-safe.

Operations on the same :class:`Connector` instance or any contained :class:`Input` or
:class:`Output` are in general not protected for multi-threaded access. The only
exceptions are the following *wait* operations with the caveats mentioned below.

.. note::
   If you are using the event-based functionality (e.g., ``connector.on('on_data_available', () => {})``),
   refer to the additional restraints described in the :ref:`Additional considerations when using event-based functionality`
   section below.

Thread-safe operations:
   * :meth:`Connector.waitForData` (wait for data on any ``Input``)
   * :meth:`Output.wait` (wait for acknowledgments)
   * :meth:`Output.waitForSubscriptions` (wait to (un)match a subscription)
   * :meth:`Input.wait` (wait for data on this ``Input``)
   * :meth:`Input.waitForPublications` (wait to (un)match a publication)

.. note::
   All of the operations listed above are asynchronous (and return a ``Promise``
   which will eventually be resolved or rejected).

.. note::

   :meth:`Output.write` can block the current thread under certain
   circumstances, but :meth:`Output.write` is not thread-safe.

.. warning::

   :meth:`Input.wait` and :meth:`Input.waitForPublications` are not reentrant
   (it is currently not possible to have more than one ``Promise`` pending on
   :meth:`Input.wait` or :meth:`Input.waitForPublications`). Since internally
   the same resource is used for both of these operations, it is not possible to
   wait on both :meth:`Input.wait` or :meth:`Input.waitForPublications` simultaneously.

   For example, the following code will throw an :class:`DDSError`::

      const waitForDiscovery = async () => {
         try {
            await input.waitForSubscriptions()
         } catch (err) {
            console.log('Caught error: ' + err)
         }
      }

      const waitForData = async () => {
         try {
            await input.wait()
         } catch (err) {
            console.log('Caught error: ' + err)
         }
      }

      waitForDiscovery()
      waitForData()

   The ``input.wait`` call within the asynchronous function ``waitForData`` will
   fail since there is a simultaneous request to ``input.waitForSubscriptions``.
   This can be avoided by ensuring you only have a single ``wait`` operation pending
   at a time::

      const waitForDiscovery = async () => {
         try {
            await input.waitForSubscriptions()
         } catch (err) {
            console.log('Caught error: ' + err)
         }
      }

      const waitForData = async () => {
         try {
            await input.wait()
         } catch (err) {
            console.log('Caught error: ' + err)
         }
      }

      const myApplication = async () => {
         await waitForDiscovery()
         await waitForData()
      }

      myApplication()

   The same limitation exists between :meth:`Output.wait` and
   :meth:`Output.waitForSubscriptions`.

Additional considerations when using event-based functionality
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If using event-based notifications (that is, if you have installed a listener for
the ``'on_data_available'`` event on a :class:`Connector`), there are
additional restrictions to be aware of.

It is possible to install multiple listeners for the ``'on_data_available'`` event::

  connector.on('on_data_available', () => { console.log('Data received!') })
  connector.on('on_data_available', () => { input.take() })

In the above example, when data is received both the installed callbacks will be run.
These callbacks are run sequentially, so it is not necessary to protect them manually
at an application level.

It is not possible to call :meth:`Connector.waitForData` if there is an installed listener
for the ``'on_data_available'`` event. This is due to the fact that whilst the ``'on_data_available'``
listener is installed, the resource required internally for :meth:`Connector.waitForData` is busy.

In your application, if you need to remove the listener for ``'on_data_available'`` and later
re-add it (or later wait for data using :meth:`Connector.waitForData`), it is necessary to call
:meth:`Connector.waitForInternalResources`. This method returns a Promise that will resolve once
the resources used internally by the :class:`Connector` are no longer in use.

.. warning::

  It is important to note that :meth:`Connector.waitForInternalResources` does **not**
  free any resources. It should only be used for notification of when a :class:`Connector`
  can be re-used for other wait operations. It is still necessary to call :meth:`Connector.close`
  to free the resources.

When a ``'on_data_available'`` listener is installed on a :class:`Connetor`, it is necessary
to wait for the ``Promise`` returned by :meth:`Connector.close` to resolve before continuing
with the applications shutdown procedure. This is due to the fact that the internal resources
used must be freed, but this application happens asynchronously.

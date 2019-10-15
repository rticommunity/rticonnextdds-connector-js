Threading model
===============

.. highlight:: javascript

Operations on the same :class:`Connector` instance or any contained :class:`Input`,
:class:`Output` are in general not protected for multi-threaded access. The only
exceptions are the following *wait* operations (with the caveats mentioned in the
warning below).

Thread-safe operations:
   * :meth:`Connector.wait` (wait for data on any ``Input``)
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
   wait on both :meth:`Input.wait` or :meth:`Input.waitForPublications` simulatenously.

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
   fail since there is a simulatenous request to ``input.waitForSubscriptions``.
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

All operations on **different** :class:`Connector` instances are thread-safe.


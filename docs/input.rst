Reading Data (Input)
====================

.. highlight:: javascript

Getting the input
~~~~~~~~~~~~~~~~~

To read/take samples, first get a reference to the :class:`Input`:

.. code-block::

   input = connector.getInput('MySubscriber::MySquareReader')

:meth:`Connector.getInput()` returns an :class:`Input` object. This example,
obtains the Input defined by the ``data_reader`` named *MySquareReader* within
the ``<subscriber>`` named *MySubscriber*:

.. code-block:: xml

   <subscriber name="MySubscriber">
     <data_reader name="MySquareReader" topic_ref="Square" />
   </subscriber>

This ``<subscriber>`` is defined inside the ``<domain_participant>`` selected to 
create this ``connector`` (see :ref:`Creating a new Connector`).

Reading or taking the data
~~~~~~~~~~~~~~~~~~~~~~~~~~

Call :meth:`Input.take()` to access and remove the samples::

   input.take()

or :meth:`Input.read()` to access the samples but leave them available for
a future ``read()`` or ``take()``::

   input.read()

The method :meth:`Input.wait()` can be used to identify when there is new data
available on a specific :class:`Input`. It returns a ``Promise`` that will be
resolved when new data is available, or rejected if the supplied timeout 
expires.

You can wait for the ``Promise`` using ``await`` in an async function::

  await input.wait()
  input.take()

Or using the ``then`` method::

  input.wait()
    .then(() => {
      input.take()
    })

The method :meth:`Connector.wait()` has the same behavior as :meth:`Input.wait()`,
but the returned promise will be resolved when data is available on *any* of the
:class:`Input` objects within the :class:`Connector`::

  await connector.wait()

You can also install a listener in a :class:`Connector`. :class:`Connector`
inherits from 
`EventEmitter <https://nodejs.org/api/events.html#events_class_eventemitter>`__.
If a listener for the ``on_data_available`` event is attached to a 
:class:`Connector`, this event will be emitted whenever new data is available 
on any :class:`Input defined within the :class:`Connector`.

.. code-block::

  // Store all the inputs in an array
  const inputs = [
    connector.getInput('MySubscriber::MySquareReader'),
    connector.getInput('MySubscriber::MyCircleReader'),
    connector.getInput('MySubscriber::MyTriangleReader')
  ]

  // Install the listener
  connector.on('on_data_available', () => {
    // One or more inputs have data
    inputs.forEach(input => {
      input.take()
      for (const sample of input.samples.validDataIter) {
        // Access the data
      }
    }
  })

For more information on how to use the event-based notification, refer to the
`documentation of the events module <https://nodejs.org/api/events.html>`__.

The `web_socket example 
<https://github.com/rticommunity/rticonnextdds-connector-js/tree/master/examples/nodejs/web_socket>`__
shows how to use this event.

.. warning::
  There are additional threading concerns to take into account when using the
  ``on_data_available`` event. Refer to 
  :ref:`Additional considerations when using event-based functionality`
  for more information.

.. note::
  When using the event-based methods to be notified of available data, errors 
  are propagated using the ``error`` event. 
  See :ref:`Error Handling` for more information.

Accessing the data samples
~~~~~~~~~~~~~~~~~~~~~~~~~~

After calling :meth:`Input.read()` or :meth:`Input.take()`, 
:attr:`Input.samples` contains the data samples:

.. code-block::

   for (const sample of input.samples) {
      if (sample.validData) {
         console.log(JSON.stringify(sample.getJson()))
      }
   }

:meth:`SampleIterator.getJson()` retrieves all the fields of a sample.

If you don't need to access the meta-data (see :ref:`Accessing sample meta-data`),
the simplest way to access the data is to use :attr:`Samples.validDataIter` 
to skip samples with invalid data:

.. code-block::

   for (const sample of input.samples.validDataIter) {
      // It is not necessary to check the sample.validData field
      console.log(JSON.stringify(sample.getJson()))
   }

It is also possible to access an individual sample:

.. code-block::

   // Obtain the first sample in the Input's queue
   const theSample = input.samples.get(0)
   if (theSample.validData) {
      console.log(JSON.stringify(theSample.getJson()))
   }


Both of the iterables shown above also provide iterator implementations, 
allowing them to be incremented outside of a ``for`` loop:

.. code-block::

   const iterator = input.samples.validDataIter.iterator()
   let sample = iterator.next()
   // sample.value contains contains the current sample and sample.done is a
   // boolean value which will become true when we have iterated over all of
   // the available samples
   console.log(JSON.stringify(sample.value.getJson()))

.. warning::
   All the methods described in this section return generators.
   Calling read/take again invalidates all generators currently in
   use.

:meth:`Samples.getJson` can receive a ``fieldName`` to only return the fields 
of a complex member. In addition to ``getJson``, you can get the values of
specific primitive fields using :meth:`SampleIterator.getNumber()`,
:meth:`SampleIterator.getBoolean()` and :meth:`SampleIterator.getString()`,
for example:

.. code-block::

   for (const sample of input.samples.validDataIter) {
      const x = sample.getNumber('x')
      const y = sample.getNumber('y')
      const size = sample.getNumber('shapesize')
      const color = sample.getString('color')
   }

See more information and examples in :ref:`Accessing the data`.

Accessing sample meta-data
~~~~~~~~~~~~~~~~~~~~~~~~~~

Every sample contains an associated *SampleInfo* with meta-information about the
sample:

.. code-block::

   for (const sample of input.samples) {
      const sourceTimestamp = sample.info.get('source_timestamp')
   }

See :attr:`SampleIterator.info` for the list of available meta-data fields.

*Connext DDS* can produce samples with invalid data, which contain meta-data only.
For more information about this, see `Valid Data Flag 
<https://community.rti.com/static/documentation/connext-dds/6.1.2/doc/manuals/connext_dds_professional/users_manual/index.htm#users_manual/AccessingManagingInstances.htm#Valid>`__
in the *RTI Connext DDS Core Libraries User's Manual*.
These samples indicate a change in the instance state. Samples with invalid data
still provide the following information:

* The :class:`SampleInfo`
* When an instance is disposed (``sample.info.get('instance_state')`` is
  ``'NOT_ALIVE_DISPOSED'``), the sample data contains the value of the key that
  has been disposed. You can access the key fields only. See
  :ref:`Accessing key values of disposed samples`.

Matching with a publication
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The method :meth:`Input.waitForPublications()` can be used to detect when a 
compatible DDS publication is matched or unmatched. It returns a promise that 
resolves to the change in the number of matched publications since the last 
time it was called::

   // From within an async function. Otherwise, use the .then() syntax
   let changeInMatches = await input.waitForPublications()

For example, if 1 new compatible publication is discovered within the specified
``timeout``, the promise will resolve to 1; if a previously matching 
publication no longer matches, it resolves to -1.

You can obtain information about the existing matched publications through the
:attr:`Input.matchedPublications` property:

.. code-block::

   input.matchedPublications.forEach((match) => {
      pubName = match.name
   }

Class reference: Input, Samples, SampleIterator
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Input class
^^^^^^^^^^^

.. autoclass:: Input
   :members:

Samples class
^^^^^^^^^^^^^

.. autoclass:: Samples
   :members:

SampleIterator class
^^^^^^^^^^^^^^^^^^^^

.. autoclass:: SampleIterator
   :members:

ValidSampleIterator class
^^^^^^^^^^^^^^^^^^^^^^^^^

.. autoclass:: ValidSampleIterator
   :members:

SampleInfo class
^^^^^^^^^^^^^^^^

.. autoclass:: SampleInfo
   :members:
Reading data (Input)
====================

.. highlight:: javascript

Getting the input
~~~~~~~~~~~~~~~~~

To read/take samples, first get a reference to the :class:`Input`:

.. code-block::

   input = connector.getInput('MySubscriber::MySquareReader')

:meth:`Connector.getInput()` returns an :class:`Input` object. This example,
obtains the *input* defined by the *data_reader* named *MySquareReader* within
the *subscriber* named *MySubscriber*:

.. code-block:: xml

   <subscriber name="MySubscriber">
     <data_reader name="MySquareReader" topic_ref="Square" />
   </subscriber>

This *subscriber* is defined inside the *domain_participant* selected to create
this :class:`Connector` (see :ref:`Creating a new Connector`).

Reading or taking the data
~~~~~~~~~~~~~~~~~~~~~~~~~~

The method :meth:`Input.wait()` can be used to identify when there is new data
available on a specific :class:`Input`. It returns a ``Promise`` that will be
resolved when new data is available, or rejected if the supplied timeout expires:

.. code-block::

  // Within an async function
  await input.wait()

The method :meth:`Connector.wait()` has the same behavior as :meth:`Input.wait()`,
but the returned promise will be resolved when data is available on *any* of the
:class:`Input` objects within the :class:`Connector`.

.. code-block::

  // Within an async function
  await connector.wait()

Both the :class:`Connector` and :class:`Input` classes inherit from the `EventEmitter <https://nodejs.org/api/events.html#events_class_eventemitter>`__
class, which is defined and exposed in the `events module <https://nodejs.org/api/events.html>`__.
If a listener is attached to ``Connector`` or ``Input`` object for the ``'on_data_available'`` event, this event
will be emitted whenever new data is received.
In the case of an :class:`Input`, it is emitted whenever new data is available on that particular :class:`Input`.
In the case of a :class:`Connector`, it is emitted whenever new data is available on *any* of the :class:`Input`same
contained within that ``Connector`` configuration.

On an :class:`Input` we can do:

.. code-block::

  input.on('on_data_available', () => {
    // We must take or read the data to clear the on_data_available event
    input.take()
    for (sample of input.samples.validDataIter) {
        // access the data within sample
    }
  })

Similarily, on a :class:`Connector` we can do:

.. code-block::

  // Assumes that all inputs within this Connector are contained within an
  // array called inputs
  connector.on('on_data_available', () => {
    // One of the contained inputs has available data
    inputs.forEach(input => {
      input.take()
      for (const sample of input.samples.validDataIter) {
        // Access the data
      }
    }
  })

For more information on how to use the event-based notification, please refer to the
`documentation of the events module <https://nodejs.org/api/events.html>`__.

.. warning::
  There are restrictions on adding a listener for the ``'on_data_available'`` event
  at the same time as waiting for data using the alternative methods such as :meth:`Connector.waitForData`
  and :meth:`Input.wait`. See :ref:`Threading model` for more information.

.. note::
  When using the event-based methods to be notified of available data, errors are
  propagated using the ``'error'`` event. See :ref:`Error Handling`.

Call :meth:`Input.take()` to access and remove the samples.

.. code-block::

   input.take()

Or, use :meth:`Input.read()` to access the samples but leave them available for
a future :meth:`Input.read()` or :meth:`Input.take()`.

.. code-block::

   input.read()

Accessing the data samples
~~~~~~~~~~~~~~~~~~~~~~~~~~

After calling :meth:`Input.read()` or :meth:`Input.take()`, :attr:`Input.samples` contains the data
samples:

.. code-block::

   for (const sample of input.samples) {
      if (sample.validData) {
         console.log(JSON.stringify(sample.getJson()))
      }
   }

:meth:`SampleIterator.getJson()` retrieves all the fields of a sample.

If you don't need to access the meta-data (see :ref:`Accessing the SampleInfo`),
the simplest way to access the data is to use :attr:`Samples.validDataIter`, to skip
samples with invalid data:

.. code-block::

   for (const sample of input.samples.validDataIter) {
      // It is not necessary to check the sample.validData field
      console.log(JSON.stringify(sample.getJson()))
   }

It is possible to access an individual sample too:

.. code-block::

   // Obtain the first sample in the Input's queue
   const theSample = input.samples.get(0)
   if (theSample.validData) {
      console.log(JSON.stringify(theSample.getJson()))
   }


Both of the iterables shown above also provide iterator implementations, allowing them to
be incremented outside of a ``for`` loop:

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

:meth:`Samples.getJson` can receive a ``fieldName`` to only return the fields of a
complex member. In addition to ``getJson``, you can get the values of
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

For more ways to access the data, see :ref:`Accessing the data`.

Accessing the SampleInfo
~~~~~~~~~~~~~~~~~~~~~~~~

*Connext DDS* can produce samples with invalid data, which contain meta-data only.
For more information about this, see `Valid Data Flag <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/The_SampleInfo_Structure.htm#receiving_2076951295_727613>`__
in the *Connect DDS Core Libraries* User's Manual.

You can access a field of the sample meta-data, the *SampleInfo*, as follows:

.. code-block::

   for (const sample of input.samples) {
      const sourceTimestamp = sample.info.get('source_timestamp')
   }

See :attr:`SampleIterator.info` for the list of meta-data fields available

Matching with a Publication
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The method :meth:`Input.waitForPublications()` can be used to detect when a compatible
DDS publication is matched or unmatched. It returns a promise which resolves to
the change in the number of matched publications since the last time it was called::

   // From within an async function. Otherwise, use traditional .then() syntax
   let changeInMatches = await input.waitForPublications()

For example, if 1 new compatible publication is discovered within the specified
``timeout``, the promise will resolve to 1. If an existing, matched publication
unmatched within the specified ``timeout``, the promise will resolve to -1.

You can obtain information about the existing matched publications through the
:attr:`Input.matchedPublications` property:

.. code-block::

   input.matchedPublications.forEach((match) => {
      pubName = match.name
   }

:attr:`Input.matchedPublications` returns a JSON object containing meta-information
about matched entities.

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
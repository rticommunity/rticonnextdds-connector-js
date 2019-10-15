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

*Connect DDS* can produce samples with invalid data, which contain meta-data only.
For more information about this see `Valid Data Flag <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/The_SampleInfo_Structure.htm#receiving_2076951295_727613>`__
in the *Connect DDS Core Libraries* User's Manual.

You can access a field of the sample meta-data, the *SampleInfo*, as follows:

.. code-block::

   for (const sample of input.samples.dataIterator) {
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
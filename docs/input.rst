Reading data (Input)
====================

.. :currentmodule:: rticonnextdds_connector

.. testsetup:: *

   var rti = require('rticonnextdds_connector')
   const connector = new rti.Connector('MyParticipantLibrary::MyParticipant', 'ShapeExample.xml')


Getting the input
~~~~~~~~~~~~~~~~~

To read/take samples, first get a reference to the :class:`Input`:

.. testcode::

   input = connector.getInput('MySubscriber::MySquareReader')

:meth:`Connector.getInput()` returns a :class:`Input` object. This example,
obtains the input defined by the *data_reader* named *MySquareReader* within
the *subscriber* named *MySubscriber*::

   <subscriber name="MySubscriber">
     <data_reader name="MySquareReader" topic_ref="Square" />
   </subscriber>

This *subscriber* is defined inside the *domain_participant* selected to create
this ``connector`` (see :ref:`Creating a new Connector`).

Reading or taking the data
~~~~~~~~~~~~~~~~~~~~~~~~~~

The method :meth:`Input.wait()` can be used to identify when there is new data
available on a specific :class:`Input`. It returns a ``Promise`` that will be
resolved when new data is available, or rejected if the supplied timeout expires::

  // Within an async function
  await input.wait()

The method :meth:`Connector.wait()` has the same behavior as :meth:`Input.wait()`,
but the returned promise will be resolved when data is available on any of the
:class:`Input` objects within the :class:`Connector`::

  // Within an async function
  await connector.wait()

Call :meth:`Input.take()` to access and remove the samples::

   input.take()

or :meth:`Input.read()` to access the samples but leaving them available for
a future :meth:`Input.read()` or :meth:`Input.take()`::

   input.read()

Accessing the data samples
~~~~~~~~~~~~~~~~~~~~~~~~~~

After calling :meth:`Input.read()` or :meth:`Input.take()`, :attr:`Input.samples` contains the data
samples. A single sample can be accessed using :meth:`Samples.get()`.

.. testcode::

   // Obtain the first sample in the Input's queue
   const theSample = input.samples.get(0)
   if (theSample.validData) {
      console.log(JSON.stringify(theSample.getJson()))
   }

:meth:`SampleIterator.getJson()` retrieves all the fields of a sample.

It is also possible to iterate through all of the available samples in the ``Inputs``'s queue
using the supplied :attr:`Samples.dataIterator` iterable.

.. testcode::

   for (let sample of input.samples.dataIterator) {
      if (sample.validData) {
         console.log(JSON.stringify(sample.getJson()))
      }
   }

If you don't need to access the meta-data (see :ref:`Accessing the SampleInfo`),
the simplest way to access the data is to use :attr:`Samples.validDataIterator` to skip
samples with invalid data:

.. testcode::

   for (let sample of input.samples.validDataIterator) {
      console.log(JSON.stringify(sample.getJson()))
   }

Both of these iterables also provide iterator implementations, allowing the
incrementation of them outside of a for loop:

.. testcode::

   const iterator = input.samples.validDataIterator.iterator()
   let sample = iterator.next()
   console.log(JSON.stringify(sample.value.getJson()))

.. warning::
   All the methods described in this section return iterators to samples.
   Calling read/take again invalidates all iterators currently in
   use. For that reason, it is not recommended to store any iterator.

:meth:`Samples.getJson` can receive a ``fieldName`` to only return the fields of a
complex member. In addition to ``getJson``, you can get the values of
specific primitive fields using :meth:`SampleIterator.getNumber()`,
:meth:`SampleIterator.getBoolean()` and :meth:`SampleIterator.getString()`,
for example:

.. testcode::

   for (let sample of input.samples.validDataIterator) {
      const x = sample.getNumber('x')
      const y = sample.getNumber('y')
      const size = sample.getNumber('shapesize')
      const color = sample.getString('color)
   }

The :meth:`Samples.getValue` method exists as a type independent way of accessing
data within samples. Using this method it is not required to specify whether the
member is a string, boolean, number or complex member:

.. testcode::

   for (let sample of input.samples.validDataIterator) {
      const x = sample.getValue('x')
      const y = sample.getValue('y')
      const size = sample.getValue('shapesize')
      const color = sample.getValue('color)
   }

See more information in :ref:`Accessing the data`.

Accessing the SampleInfo
~~~~~~~~~~~~~~~~~~~~~~~~

*Connect DDS* can produce samples with invalid data, which contain meta-data only.
For more information about this see `Valid Data Flag <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/The_SampleInfo_Structure.htm#receiving_2076951295_727613>`__
in the *Connect DDS Core Libraries* User's Manual.

You can access a field of the sample meta-data, the *SampleInfo*, as follows:

.. testcode::

   for sample in input.samples:
   for (let sample of input.samples.dataIterator) {
      const sourceTimestamp = sample.info.getValue('source_timestamp')
   }

See :attr:`SampleIterator.info` for the list of meta-data fields available

Matching with a Publication
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The method :meth:`Input.waitForPublications()` can be used to detect when a compatible
DDS publication is matched or stops matching. It returns a promise which resolves to
the change in the number of matched publications since the last time it was called::

   let changeInMatches = await input.waitForPublications()

For example, if a new compatible publication is discovered within the specified
``timeout``, the promise will resolve to 1.

You can obtain information about the existing matched publications with
:attr:`Input.matchedPublications`:

.. testcode::

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
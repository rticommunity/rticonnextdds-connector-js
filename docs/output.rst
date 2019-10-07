Writing data (Output)
=====================

.. testsetup:: *

   const rti = require('rticonnextdds_connector')
   const connector = new rti.Connector('MyParticipantLibrary::MyParticipant', 'ShapeExample.xml')

Getting the Output
~~~~~~~~~~~~~~~~~~

To write a data sample, first look up an output:

.. testcode::

   output = connector.getOutput('MyPublisher::MySquareWriter')

:meth:`Connector.getOutput()` returns an :class:`Output` object. This example,
obtains the output defined by the *data_writer* named *MySquareWriter* within
the *publisher* named *MyPublisher*::

   <publisher name="MyPublisher">
     <data_writer name="MySquareWriter" topic_ref="Square" />
   </publisher>

This *publisher* is defined inside the *domain_participant* selected to create
this ``connector`` (see :ref:`Creating a new Connector`).

Populating the data sample
~~~~~~~~~~~~~~~~~~~~~~~~~~

Then set the ``Output.instance`` fields. You can set them member by member:

.. testcode::

   output.instance.setNumber('x', 1)
   output.instance.setNumber('y', 2)
   output.instance.setNumber('shapesize', 30)
   output.instance.setString('color', 'BLUE')

Or using a JSON object:

.. testcode::

   output.instance.setFromJson({ x: 1, y: 2, shapesize: 30, color: 'BLUE' })

The name of each member corresponds to the type assigned to this output in XML.
For example::

   <struct name="ShapeType">
     <member name="color" type="string" stringMaxLength="128" key="true" default="RED"/>
     <member name="x" type="long" />
     <member name="y" type="long" />
     <member name="shapesize" type="long" default="30"/>
    </struct>

See :class:`Instance` and :ref:`Accessing the data` for more information.

Writing the data sample
~~~~~~~~~~~~~~~~~~~~~~~

To write the values you set in ``Output.instance`` call :meth:`Output.write()`::

   output.write()

If the *datawriter_qos* is reliable, you can use :meth:`Output.wait()`
to block until all matching reliable subscribers acknowledge the reception of the
data sample::

    output.wait()

The write method can also receive a JSON object specifing several options. For example, to
write with a specific timestamp:

.. testcode::

  output.write({ source_timestamp: 100000 })

It is also possible to dispose or unregister an instance:


.. testcode::

  output.write({ action: 'dispose' })
  output.write({ action: 'unregister' })

In these two cases, only the *key* fields in the ``Output.instance`` are relevant.

Matching with a Subscription
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Before writing, the method :meth:`Output.waitForSubscriptions()` can be used to
detect when a compatible DDS subscription is matched or stops matching. It returns
a ``Promise`` that will resolve to the change in the number of matched subscriptions
since the last time it was called::

   // Using async/await
   const waitForMatches = async () => {
     let changeInMatches = await output.waitForSubscriptions()
   }

   // Using traditional Promises
   output.waitForSubscriptions(1000).then((res) => {
     // The Promise resolved successfully
     let changesInMatches = res
   }).catch((err) => {
     // Handle the error
   }

For example, if a new compatible subscription is discovered within the specified
``timeout``, the function returns 1.

You can obtain information about the existing matched subscriptions with
:attr:`Output.matchedSubscriptions`:

.. testcode:: node

   output.matchedSubscriptions.forEach((match) => {
    subName = match.name
   }

Class reference: Output, Instance
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Output class
^^^^^^^^^^^^

.. autoclass:: Output

   :members:

Instance class
^^^^^^^^^^^^^^

.. autoclass:: Instance

   :members:

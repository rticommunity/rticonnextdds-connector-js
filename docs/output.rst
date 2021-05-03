Writing Data (Output)
=====================

.. highlight:: javascript

Getting the Output
~~~~~~~~~~~~~~~~~~

To write a data sample, first look up an output:

.. code-block::

   output = connector.getOutput('MyPublisher::MySquareWriter')

:meth:`Connector.getOutput()` returns an :class:`Output` object. This example
obtains the output defined by the ``data_writer`` named *MySquareWriter* 
within the ``publisher`` named *MyPublisher*:

.. code-block:: xml

   <publisher name="MyPublisher">
     <data_writer name="MySquareWriter" topic_ref="Square" />
   </publisher>

This ``publisher`` is defined inside the ``domain_participant`` 
selected to create this :class:`Connector` (see 
:ref:`Creating a new Connector`).

Populating the data sample
~~~~~~~~~~~~~~~~~~~~~~~~~~

The next step is to set the :class:`Instance` fields. You can set them 
member-by-member:

.. code-block::

   output.instance.setNumber('x', 1)
   output.instance.setNumber('y', 2)
   output.instance.setNumber('shapesize', 30)
   output.instance.setString('color', 'BLUE')

Or using a JSON object:

.. code-block::

   output.instance.setFromJson({ x: 1, y: 2, shapesize: 30, color: 'BLUE' })

The name of each member corresponds to the type assigned to this output in XML.
For example, the XML configuration corresponding to the above code snippets is:

.. code-block:: xml

   <struct name="ShapeType">
     <member name="color" type="string" stringMaxLength="128" key="true" default="RED"/>
     <member name="x" type="long" />
     <member name="y" type="long" />
     <member name="shapesize" type="long" default="30"/>
    </struct>

See :class:`Instance` and :ref:`Accessing the data` for more information.

Writing the data sample
~~~~~~~~~~~~~~~~~~~~~~~

To write the values that have been set in ``Output.instance``, call :meth:`Output.write()`::

   output.write()

If the ``datawriter_qos`` is reliable, you can use :meth:`Output.wait()`
to block until all matching reliable subscribers acknowledge the reception of the
data sample::

    try {
      await output.wait()
    } catch (err) {
      console.log('Error caught: ' + err)
    }

The write method can also receive a JSON object specifing several options. 
For example, to write with a specific timestamp:

.. code-block::

  output.write({ source_timestamp: 100000 })

It is also possible to dispose or unregister an instance:

.. code-block::

  output.write({ action: 'dispose' })
  output.write({ action: 'unregister' })

In these two cases, only the *key* fields in the ``Output.instance`` are relevant.

See :meth:`Output.write` for more information on the supported parameters.

Matching with a subscription
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Before writing, you can use the method :meth:`Output.waitForSubscriptions()` to
detect when a compatible DDS subscription is matched or stops matching. It 
returns a ``Promise`` that will resolve to the change in the number of matched 
subscriptions since the last time it was called.

You can wait for the ``Promise`` using ``await`` in an async function::

   let changeInMatches = await output.waitForSubscriptions()

Or using the ``then`` and ``catch`` methods::

   output.waitForSubscriptions().then((res) => {
     // The Promise resolved successfully and the number of matches is stored in res
   }).catch((err) => {
     // Handle the error (which is possibly a timeout)
   }

For example, if a new compatible subscription is discovered within the 
specified ``timeout``, the Promise will resolve to 1; if a previously 
matching subscription no longer matches (for example, due to the 
application being closed), it resolves to -1.

You can obtain information about the currently matched subscriptions with 
the :attr:`Output.matchedSubscriptions` property:

.. code-block::

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

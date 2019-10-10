Accessing the data
==================

The types you use to write or read data may included nested structs, sequences and
arrays of primitive types or structs, etc.

These types are defined in XML following the format of
`RTI's XML-Based Application Creation <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/xml_application_creation/html_files/RTI_ConnextDDS_CoreLibraries_XML_AppCreation_GettingStarted/index.htm#XMLBasedAppCreation/UnderstandingPrototyper/XMLTagsConfigEntities.htm%3FTocPath%3D5.%2520Understanding%2520XML-Based%2520Application%2520Creation%7C5.5%2520XML%2520Tags%2520for%2520Configuring%2520Entities%7C_____0>`__.

To access the data, :class:`Instance` and :class:`SampleIterator` provide
setters and getters that expect a ``fieldName`` string, used to identify specific
fields within the type. This section describes the format of this string.

We will use the following XML type definition of MyType::

    <types>
        <enum name="Color">
            <enumerator name="RED"/>
            <enumerator name="GREEN"/>
            <enumerator name="BLUE"/>
        </enum>
        <struct name= "Point">
            <member name="x" type="int32"/>
            <member name="y" type="int32"/>
        </struct>
        <union name="MyUnion">
            <discriminator type="nonBasic" nonBasicTypeName="Color"/>
            <case>
              <caseDiscriminator value="RED"/>
              <member name="point" type="nonBasic"  nonBasicTypeName= "Point"/>
            </case>
            <case>
              <caseDiscriminator value="GREEN"/>
              <member name="my_long" type="int32"/>
            </case>
        </union>
        <struct name= "MyType">
            <member name="my_long" type="int32"/>
            <member name="my_double" type="float64"/>
            <member name="my_enum" type="nonBasic"  nonBasicTypeName= "Color" default="GREEN"/>
            <member name="my_boolean" type="boolean" />
            <member name="my_point" type="nonBasic"  nonBasicTypeName= "Point"/>
            <member name="my_union" type="nonBasic"  nonBasicTypeName= "MyUnion"/>
            <member name="my_int_sequence" sequenceMaxLength="10" type="int32"/>
            <member name="my_point_sequence" sequenceMaxLength="10" type="nonBasic"  nonBasicTypeName= "Point"/>
            <member name="my_point_array" type="nonBasic"  nonBasicTypeName= "Point" arrayDimensions="3"/>
            <member name="my_optional_point" type="nonBasic"  nonBasicTypeName= "Point" optional="true"/>
            <member name="my_optional_long" type="int32" optional="true"/>
        </struct>
    </types>

Which corresponds to the following IDL definition::

    enum Color {
        RED,
        GREEN,
        BLUE
    };

    struct Point {
        long x;
        long y;
    };

    union MyUnion switch(Color) {
        case RED: Point point;
        case GREEN: string<512> my_string;
    };

    struct MyType {
        long my_long;
        double my_double;
        Color my_enum;
        boolean my_boolean;
        string<512> my_string;
        Point my_point;
        MyUnion my_union;
        sequence<long, 10> my_int_sequence;
        sequence<Point, 10> my_point_sequence;
        Point my_point_array[3];
        @optional Point my_optional_point;
        @optional long my_optional_long;
    };

.. note::
    You can get the XML definition of an IDL file with ``rtiddsgen -convertToXml MyType.idl``.

We will refer to an ``Output`` named ``output`` and
``Input`` named ``input`` such that ``input.samples.length > 0``.

Using JSON objects vs accessing individual members
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

On an Input or an Output you can access the data all at once, using a JSON object,
or member by member. Using a JSON object is usually more efficient if you intend
to access most or all of the data members of a large type.

On an Output, :meth:`Instance.setFromJson` receives a JSON object with all, or
some, of the Output type members, and in an Input, :meth:`SampleIterator.getJson`
retrieves all of the members.

It is also possible to provide a ``memberName`` to :meth:`SampleIterator.getJson` to obtain
a JSON object containing the fields of that nested member only.

On the other hand the methods described in the following section receive a
``fieldName`` argument to get or set a specific member.

Accessing basic members (numbers, strings and booleans)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

To set a field in an :class:`Output`, use the appropriate setter.

To set any numeric type, including enumerations:

.. code-block:: javascript

    output.instance.setNumber('my_long', 2)
    output.instance.setNumber('my_double', 2.14)
    output.instance.setNumber('my_enum', 2)

.. warning::
    The range of values for a numeric field is determined by the type
    used to define that field in the configuration file. However, ``setNumber`` and
    ``getNumber`` can't handle 64-bit integers (*int64* and *uint64*)
    whose absolute values are larger than 2^53. This is a *Connector* limitation
    due to the use of *double* as an intermediate representation.

To set booleans:

.. code-block:: javascript

    output.instance.setBoolean('my_boolean', True)

To set strings:

.. code-block:: javascript

    output.instance.setString('my_string', 'Hello, World!')

As an alternative to the previous setters, the type-independent method ``set``
can be used as follows:

.. code-block:: javascript

    // The set method works on all basic types
    output.instance.set('my_double') = 2.14
    output.instance.set('my_boolean') = true
    output.instance.set('my_string') = 'Hello, World!'

In all cases, the type of the assigned value must be consistent with the type
of the field, as defined in the configuration file.

Similarly, to get a field in a :class:`Input` sample, use the appropriate
getter: :meth:`SampleIterator.getNumber()`, :meth:`SampleIterator.getBoolean()`,
:meth:`SampleIterator.getString()`, or the type-independent :meth:`SampleIterator.get()`.
``getString`` also works with numeric fields, returning the number as a string:

.. code-block:: javascript

    for (const sample of input.samples.validDataIterator) {
        // Use the basic type specific getters
        let value = sample.getNumber('my_double')
        value = sample.getBoolean('my_boolean')
        value = sample.getString('my_string')

        // or alternatively, use the type-independent get method
        value = sample.get('my_double')
        value = sample.get('my_boolean')
        value = sample.get('my_string')

        // get a number as string:
        value = sample.getString('my_double')
    }


.. note::
    The typed getters and setters perform better than ``set``
    and ``get`` in applications that write or read at high rates.
    Also prefer ``getJson`` and ``setFromJson`` over ``set``
    and ``get`` when accessing all or most of the fields of a sample
    (see previous section).

.. note::
    If a field *my_string*, defined as a string in the configuration file contains
    a value that can be interpreted as a number, ``sample.get('my_string')`` returns
    a number, not a string.

Accessing structs
^^^^^^^^^^^^^^^^^

To access a nested member, use ``.`` to identify the fully-qualified ``fieldName``
and pass it to the corresponding setter or getter.

.. code-block:: javascript

    output.instance.setNumber('my_point.x', 10)
    output.instance.setNumber('my_point.y', 20)

It is possible to reset the value of a complex member back to its default:

.. code-block:: javascript

    output.instance.clearMember('my_point')
    // x and y are now 0

It is also possible to reset members using the ``set`` method:

.. code-block:: javascript

    output.instance.set('my_point', null)

Structs are set via JSON objects as follows:

.. code-block:: javascript

    output.instance.setFromJson({ 'my_point': { 'x':10, 'y':20 } })

When an member of a struct is not set, it retains its previous value. If we run
the following code after the previous call to ``setFromJson``:

.. code-block:: javascript

    output.instance.setFromJson({ 'my_point': {' y': 200 } })

The value of ``my_point`` is now ``{ 'x': 10, 'y':200 }``. If you do not want the values
to be retained you must clear the value first (as described above).

It is possible to obtain the JSON object of a nested struct using
`SampleIterator.getJson('memberName')`:

.. code-block:: javascript

   for (const sample of input.samples.validDataIterator) {
      let point = sample.getJson('my_point')
   }

``memberName`` must be one of the following types: array, sequence,
struct, value or union. If not, the call to getJson will fail:

.. code-block:: javascript

    for (let sample of input.samples.validDataIterator) {
       try {
          let long = sample.getJson('my_long')
       } catch (err) {
          // Error was thrown since my_long is a basic type
       }
   }

It is also possible to obtain the JSON of a struct using the :meth:`SampleIterator.get`
method:

.. code-block:: javascript

    for (const sample of input.samples.validDataIterator) {
        let point = sample.get('my_point')
        // point is a JSON object
   }

The same limitations described in :ref:`Accessing basic members (numbers, strings and booleans)`
of using :meth:`SampleIterator.get` apply here.

Accessing arrays and sequences
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Use ``'fieldName[index]'`` to access an element of a sequence or array,
where ``0 <= index < length``:

.. code-block:: javascript

    let value = input.samples.get(0).getNumber('my_int_sequence[1]')
    value = input.samples.get(0).getNumber('my_point_sequence[2].y')

Another option is to use ``SampleIterator.getJson('fieldName')`` to obtain
a JSON object containing all of the elements of the array or sequence with name ``fieldName``:

.. code-block:: javascript

    for (let sample of input.samples.validDataIterator) {
        let thePointSequence = sample.getJson('my_point_sequence')
    }

It is also possible to supply ``memberName`` as an element of an array (if the
type of the array is complex):

.. code-block:: javascript

   for (let sample of input.samples.validDataIterator) {
      let pointElement = sample.getJson('my_point_sequence[1]')
   }

In an :class:`Output`, sequences are automatically resized:

.. code-block:: javascript

    output.instance.setNumber('my_int_sequence[5]', 10) // length is now 6
    output.instance.setNumber('my_int_sequence[4]', 9) // length still 6

You can clear a sequence:

.. code-block:: javascript

    output.instance.clearMember('my_int_sequence') // my_int_sequence is now empty

To obtain the length of a sequence in an :class:`Input` sample, append ``#`` to
the ``fieldName``:

.. code-block:: javascript

    let length = input.samples[0].getNumber('my_int_sequence#')

This same syntax is used to obtain the selected member of an enum (see :ref:`Accessing unions`).

In JSON objects, sequences and arrays are represented as lists. For example:

.. code-block:: javascript

    output.instance.setFromJson({
        my_int_sequence: [1, 2],
        my_point_sequence: [{ x: 1, y: 1 }, { x: 2, y: 2 }]
    })

Arrays have a constant length that can't be changed. When you don't set all the elements
of an array, the remaining elements retain their previous value. However, sequences
are always overwritten. See the following example:

.. code-block:: javascript

    output.instance.setFromJson({
        my_point_sequence: [{ x: 1, y: 1 }, { x: 2, y: 2 }],
        my_point_array: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }] })

    output.instance.setFromJson({
        my_point_sequence: [{ x: 100 }],
        my_point_array: [{ x: 100}, { y: 200}] })

After the second call to ``setFromJson``, the contents of ``my_point_sequence``
are ``[{ x: 100, y: 0 }]``, but the contents of ``my_point_array`` are:
``[{ x: 100, y: 1 }, { x: 2, y: 200 }, {x: 3, y: 3 }]``.

Accessing optional members
^^^^^^^^^^^^^^^^^^^^^^^^^^

A optional member is a member that applications can decide to send or not as
part of every published sample. Therefore, optional members may have a value or not.
They are accessed the same way as non-optional members, except that ``null`` is
a possible value.

On an Input, any of the getters may return ``null`` if the field is optional:

.. code-block:: javascript

    if (input.samples.get(0).getNumber('my_optional_long') == null) {
        console.log('my_optional_long not set')
    }

    if (input.samples.get(0).getNumber('my_optional_point.x') == null) {
        console.log('my_optional_point not set')
    }

:meth:`SampleIterator.getJson()` returns a JSON object that doesn't include unset
optional members.

To set an optional member on an Output:

.. code-block:: javascript

    output.instance.setNumber('my_optional_long', 10)

If the type of the optional member is not primitive, when any of its members is
first set, the rest are initialized to their default values:

.. code-block:: javascript

    output.instance.setNumber('my_optional_point.x', 10)

If ``my_optional_point`` was not previously set, the previous code also sets
``y`` to 0.

There are several ways to reset an optional member. If the type is primitive:

.. code-block::

    output.instance.setNumber('my_optional_long', null) // Option 1
    output.instance.clearMember('my_optional_long') // Option 2
    output.instance.set('my_optional_long', null) // Option 3

If the member type is complex, all the above options apart from option 1 are available:

.. code-block:: javascript

    output.instance.clearMember('my_optional_point')
    output.instance.set('my_optional_point', null)

Note that :meth:`Instance.setFromJson()` doesn't clear those members that are
not specified; their value remains. For example:

.. code-block:: javascript

    output.instance.setNumber('my_optional_long', 5)
    output.instance.setFormJson({ my_double: 3.3, my_long: 4 })
    // my_optional_long is still 5

To clear a member, set it to ``null`` explicitly::

    output.instance.setFromJson({ my_double: 3.3, my_long: 4, my_optional_long: null })


For more information about optional members in DDS, see the *Getting Started Guide
Addendum for Extensible Types*,
`section 3.2 Optional Members <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/getting_started_extras/html_files/RTI_ConnextDDS_CoreLibraries_GettingStarted_ExtensibleAddendum/index.htm#ExtensibleTypesAddendum/Optional_Members.htm#3.2_Optional_Members%3FTocPath%3D3.%2520Type%2520System%2520Enhancements%7C3.2%2520Optional%2520Members%7C_____0>`__. 

Accessing unions
^^^^^^^^^^^^^^^^

In an Output the union member is automatically selected when you set it:

.. code-block:: javascript

    output.instance.setNumber('my_union.point.x', 10)

You can change it later:

.. code-block:: javascript

    output.instance.setNumber('my_union.my_long', 10)

In an Input, you can obtain the selected member as a string::

    if (input.samples.get(0).getString('my_union#') == 'point') {
        value = input.samples.get(0).getNumber('my_union.point')
    }

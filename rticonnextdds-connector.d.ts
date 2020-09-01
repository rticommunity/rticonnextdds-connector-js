/// <reference types="node" />
export var connectorBinding: _ConnectorBinding;
declare const Connector_base: typeof import("events").EventEmitter;
/**
 * Loads a configuration and creates its Inputs and Outputs.
 *
 * .. note::
 *   The :class:`Connector` class inherits from
 *   `EventEmitter <https://nodejs.org/api/events.html#events_class_eventemitter>`__.
 *   This allows us to support event-based notification for data, using the
 *   following syntax:
 *
 *   .. code-block:: javascript
 *
 *     connector.on('on_data_available', () => { } )
 *
 *   Please refer to :ref:`Reading data (Input)` for more information.
 *
 * A :class:`Connector` instance loads a configuration file from an XML
 * document. For example::
 *   const connector = new rti.Connector('MyParticipantLibrary::MyParticipant', 'MyExample.xml')
 *
 * After creating it, the :class:`Connector` object's Inputs can be used to
 * read data, and the Outputs to write data. The methods
 * :meth:`Connector.getOutput` and :meth:`Connector.getInput` return an
 * :class:`Input` and :class:`Output`, respectively.
 *
 * An application can create multiple :class:`Connector` instances for the
 * same or different configurations.
 */
export class Connector extends Connector_base {
    /**
     * Allows you to increase the number of :class:`Connector` instances that
     * can be created.
     *
     * The default value is 1024 (which allows for approximately 8 instances
     * of :class:`Connector` to be created in a single application). If you need
     * to create more than 8 instances of :class:`Connector`, you can increase
     * the value from the default.
     *
     * .. note::
     *   This is a static method. It can only be called before creating a
     *   :class:`Connector` instance.
     *
     * See `SYSTEM_RESOURCE_LIMITS QoS Policy
     * <https://community.rti.com/static/documentation/connext-dds/6.0.0/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/SYSTEM_RESOURCE_LIMITS_QoS.htm>`__
     * in the *RTI Connext DDS Core Libraries User's Manual* for more information.
     *
     * @param {number} value The value for ``max_objects_per_thread``
     */
    static setMaxObjectsPerThread(value: number): void;
    /**
     * @arg {string} configName The configuration to load. The configName format
     *   is `LibraryName::ParticipantName`, where LibraryName is the name
     *   attribute of a ``<domain_participant_library>`` tag, and
     *   ParticipantName is the name attribute of a ``<domain_participant>`` tag
     *   within that library.
     * @arg {string} url A URL locating the XML document. It can be a file path
     *   (e.g., ``/tmp/my_dds_config.xml``), a string containing the full XML
     *   document with the following format: ``str://"<dds>...</dds>"``, or a
     *   combination of multiple files or strings, as explained in the
     *   `URL Groups <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds_professional/users_manual/index.htm#users_manual/URL_Groups.htm>`__
     *   section of the *Connext DDS Core Libraries User's Manual*.
     *
     */
    constructor(configName: string, url: string);
    native: any;
    onDataAvailableRun: boolean;
    waitSetBusy: boolean;
    /**
     * This method is used internally by the public APIs
     * :meth:`Connector.close` and
     * :meth:`Connector.waitForCallbackFinalization`. It should not be used
     * directly by applications.
     *
     * @param {function} resolve The resolve() callback to call once waitSetBusy
     *   is false.
     * @param {function} reject The reject() callback to call if we timeout,
     *   or if another error occurs.
     * @param {number} iterations Maximum number of iterations to perform
     *   before timing out.
     * @param {boolean} cleanup Whether or not the :class:`Connector` object
     *   should be deleted once the waitset is no longer busy.
     * @private
     */
    private closeImpl;
    /**
     * Returns a ``Promise`` that will resolve once the resources used internally
     * by the :class:`Connector` are no longer in use.
     *
     * .. note::
     *   This returned promise will be rejected if there are any listeners
     *   registered for the ``on_data_available`` event. Ensure that they have
     *   all been removed before calling this method using
     *   ``connector.removeAllListeners(on_data_available)``.
     *
     * It is currently only necessary to call this method if you remove all of
     * the listeners for the ``on_data_available`` event and at some point in the
     * future wish to use the same :class:`Connector` object to get notifications
     * of new data (via the :meth:`Connector.wait` method, or by re-adding a
     * listener for the ``on_data_available`` event).
     *
     * This operation does **not** free any resources. It is still necessary to
     * call :meth:`Connector.close` when the :class:`Connector` is no longer
     * required.
     *
     * @argument {number} [timeout] Optional parameter to indicate the timeout
     *   of the operation, in seconds. By default, 10s. If this operation does
     *   not complete within the specified timeout, the returned Promise will
     *   be rejected.
     * @returns {Promise} A Promise that will be resolved once the resources
     *   being used internally by the :class:`Connector` object are no longer
     *   in use.
     */
    waitForCallbackFinalization(timeout?: number): Promise<any>;
    /**
     * Frees all the resources created by this :class:`Connector` instance.
     *
     * @argument {number} [timeout] Optional parameter to indicate the timeout
     *   of the operation, in seconds. By default, 10s. If this operation does
     *   not complete within the specified timeout, the returned Promise will
     *   be rejected.
     * @returns {Promise} Which resolves once the :class:`Connector` object has
     *   been freed. It is only necessary to wait for this promise to resolve
     *   if you have attached a listener for the ``on_data_available`` event.
     */
    close(timeout?: number): Promise<any>;
    /**
     * Deprecated, use close()
     * @private
     */
    private delete;
    /**
     * Returns the :class:`Input` named inputName.
     *
     * ``inputName`` identifies a ``<data_reader>`` tag in the configuration
     * loaded by the :class:`Connector`. For example::
     *
     *   const connector = new rti.Connector('MyParticipantLibrary::MyParticipant', 'MyExample.xml')
     *   connector.getInput('MySubscriber::MyReader')
     *
     * Loads the Input in this XML:
     *
     * .. code-block:: xml
     *
     *     <domain_participant_library name="MyParticipantLibrary">
     *       <domain_participant name="MyParticipant" domain_ref="MyDomainLibrary::MyDomain">
     *         <subscriber name="MySubscriber">
     *           <data_reader name="MyReader" topic_ref="MyTopic"/>
     *           ...
     *         </subscriber>
     *         ...
     *       </domain_participant>
     *       ...
     *     <domain_participant_library>
     *
     * @param {string} inputName The name of the ``data_reader`` to load, with the
     *   format `SubscriberName::DataReaderName`.
     * @returns {Input} The Input, if it exists.
     */
    getInput(inputName: string): Input;
    /**
     * Returns the :class:`Output` named outputName.
     *
     * ``outputName`` identifies a ``<data_writer>`` tag in the configuration
     * loaded by the :class:`Connector`. For example::
     *
     *   const connector = new rti.Connector('MyParticipantLibrary::MyParticipant', 'MyExample.xml')
     *   connector.getOutput('MyPublisher::MyWriter')
     *
     * Loads the Input in this XML:
     *
     * .. code-block:: xml
     *
     *     <domain_participant_library name="MyParticipantLibrary">
     *       <domain_participant name="MyParticipant" domain_ref="MyDomainLibrary::MyDomain">
     *         <publisher name="MyPublisher">
     *           <data_writer name="MyWriter" topic_ref="MyTopic"/>
     *           ...
     *         </publisher>
     *         ...
     *       </domain_participant>
     *       ...
     *     <domain_participant_library>
     *
     * @param {string} outputName The name of the ``data_writer`` to load, with
     *   the format ``PublisherName::DataWriterName``.
     * @returns {Output} The Output, if it exists.
     */
    getOutput(outputName: string): Output;
    /**
     * Waits for data to be received on any Input.
     *
     * .. note::
     *   This operation is asynchronous.
     *
     * @param {number} timeout The maximum time to wait, in milliseconds.
     *   By default, infinite.
     * @throws {TimeoutError} :class:`TimeoutError` will be thrown if the
     *   timeout expires before data is received.
     * @returns {Promise} A ``Promise`` which will be resolved once data
     *   is available, or rejected once the timeout expires.
     */
    wait(timeout: number): Promise<any>;
    /**
     * Emits the ``on_data_available`` event when any Inputs within this
     * :class:`Connector` object receive data.
     *
     * .. note::
     *   This operation is asynchronous
     *
     * This API is used internally to emit the ``on_data_available`` event when
     * data is received on any of the Inputs contained within this
     * :class:`Connector` object.
     *
     * The :class:`Connector` class extends EventEmitter, meaning that callbacks
     * can be registered for specific events using the following syntax:
     *
     * .. code-block:: javascript
     *
     *    function myCallback() {
     *      // Handle the fact that there is new data on one of the inputs
     *    }
     *    connector.on('on_data_available', myCallback)
     *    // ...
     *    connector.off('on_data_available', myCallback)
     *
     * Once the ``on_data_available`` event has fired, either :meth:`Input.read`
     * or :meth:`Input.take` should be called on the :class:`Input` that has
     * new data. This will prevent ``on_data_available`` from being fired more
     * than once for the same data.
     *
     * @private
     */
    private onDataAvailable;
    /**
     * @private
     */
    private newListenerCallBack;
    /**
     * @private
     */
    private removeListenerCallBack;
}
declare class _ConnectorBinding {
    library: string;
    api: any;
}
/**
 * A timeout error thrown by operations that can block
 */
export class TimeoutError extends Error {
    /**
     * This error is thrown when blocking errors timeout.
     * @private
     */
    private constructor();
    extra: any;
}
/**
 * An error originating from the *RTI Connext DDS* Core
 */
export class DDSError extends Error {
    /**
     * This error is thrown when an error is encountered from within one of the
     * APIs within the *RTI Connext DDS* Core.
     * @private
     */
    private constructor();
    extra: any;
}
/**
 * Allows reading data for a DDS Topic.
 */
declare class Input {
    /**
     * This class is used to subscribe to a specific DDS Topic.
     *
     * To get an Input object, use :meth:`Connector.getInput`.
     *
     * Attributes:
     *  * connector (:class:`Connector`) - The Connector creates this Input.
     *  * name (string) - The name of the Input (the name used in
     *    :meth:`Connector.getInput`).
     *  * native (pointer) - A native handle that allows accessing additional
     *    *Connext DDS* APIs in C.
     *  * matchedPublications (JSON) - A JSON object containing information
     *    about all the publications currently matched with this Input.
     */
    constructor(connector: any, name: any);
    connector: any;
    name: any;
    native: any;
    _samples: Samples;
    infos: Infos;
    waitSetBusy: boolean;
    /**
     * Accesses the samples received by this Input.
     *
     * This operation performs the same operation as :meth:`Input.take` but
     * the samples remain accessible (in the internal queue) after the
     * operation has been called.
     */
    read(): void;
    /**
     * Accesses the samples receieved by this Input.
     *
     * After calling this method, the samples are accessible using
     * :meth:`Input.samples`.
     */
    take(): void;
    /**
     * Allows iterating over the samples returned by this input.
     *
     * This container provides iterators to access the data samples retrieved by
     * the most-recent call to :meth:`Input.take` and :meth:`Input.read`.
     *
     * @type {Samples}
     */
    get samples(): Samples;
    /**
     * Waits for this Input to match or unmatch a compatible DDS Subscription.
     *
     * .. note::
     *   This operation is asynchronous.
     *
     * This method waits for the specified timeout (or if no timeout is
     * specified, it waits forever), for a match (or unmatch) to occur.
     * @param {number} [timeout] The maximum time to wait, in milliseconds.
     *   By default, infinite.
     * @throws {TimeoutError} :class:`TimeoutError` will be thrown if the
     *   timeout expires before any publications are matched.
     * @returns {Promise} Promise object resolving with the change in the
     *   current number of matched outputs. If this is a positive number,
     *   the input has matched with new publishers. If it is negative, the
     *   input has unmatched from an output. It is possible for multiple
     *   matches and/or unmatches to be returned (e.g., 0 could be returned,
     *   indicating that the input matched the same number of outputs as it
     *   unmatched).
     */
    waitForPublications(timeout?: number): Promise<any>;
    /**
     * Returns information about matched publications.
     *
     * This property returns a JSON array, with each element of the
     * array containing information about a matched publication.
     *
     * Currently the only information contained in this JSON object is
     * the publication name of the matched publication. If the matched
     * publication doesn't have a name, the name for that specific
     * publication will be null.
     *
     * Note that :class:`Connector` Outputs are automatically assigned
     * a name from the ``data_writer name`` element in the XML configuration.
     *
     * @type {JSON}
     */
    get matchedPublications(): JSON;
    /**
     * Wait for this Input to receive data.
     *
     * .. note::
     *   This operation is asynchronous.
     *
     * @param {number} [timeout] The maximum time to wait, in milliseconds.
     *   By default, infinite.
     * @throws {TimeoutError} :class:`TimeoutError` will be thrown if the
     *   timeout expires before data is received.
     * @returns {Promise} A ``Promise`` which will be resolved once data is
     *   available, or rejected if the timeout expires.
     */
    wait(timeout?: number): Promise<any>;
}
/**
 * Allows writing data for a DDS Topic.
 */
declare class Output {
    /**
     * This class is used to publish data for a DDS Topic.
     * To get an Output object, use :meth:`Connector.getOutput`.
     *
     * Attributes:
     *  * ``instance`` (:class:`Instance`) - The data that is written when
     *    :meth:`Output.write` is called.
     *  * ``connector`` (:class:`Connector`) - The :class:`Connector` object
     *    that created this object.
     *  * ``name`` (str) - The name of this Output (the name used in
     *    :meth:`Connector.getOutput`).
     *  * ``native`` (pointer) - The native handle that allows accessing
     *    additional *Connext DDS* APIs in C.
     *  * ``matchedSubscriptions`` (JSON) - Information about matched
     *    subscriptions (see below).
     *
     */
    constructor(connector: any, name: any);
    connector: any;
    name: any;
    native: any;
    instance: Instance;
    waitsetBusy: boolean;
    /**
     * Publishes the values of the current Instance.
     *
     * Note that after writing it, the Instance's values remain unchanged.
     * If, for the next write, you need to start from scratch, you must
     * first call :meth:`Output.clearMembers`.
     *
     * This method accepts an optional JSON object as a parameter, which may
     * specify the parameters to use in the `write` call.
     * The supported parameters are a subset of those documented in the
     * `Writing Data section <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/Writing_Data.htm?Highlight=DDS_WriteParams_t>`__
     * of the *RTI Connext DDS Core Libraries User's Manual*. These are:
     *
     * * ``action`` – One of ``write`` (default), ``dispose`` or ``unregister``
     * * ``source_timestamp`` – An integer representing the total number of
     *   nanoseconds
     * * ``identity`` – A JSON object containing the fields ``writer_guid`` and
     *   ``sequence_number``
     * * ``related_sample_identity`` – Used for request-reply communications.
     *   It has the same format as identity
     *
     * @example output.write()
     * @example output.write({
     *     action: 'dispose',
     *     identity: { writer_guid: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], sequence_number: 1 }
     * })
     *
     * @param {JSON} [params] [Optional] The optional parameters described above
     * @throws {TimeoutError} The write method can block under multiple
     *   circumstances (see 'Blocking During a write()' in the `Writing Data section
     *   <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/Writing_Data.htm>`__
     *   of the *RTI Connext DDS Core Libraries User's Manual*.)
     *   If the blocking time exceeds the ``max_blocking_time``, this method
     *   throws :class:`TimeoutError`.
     */
    write(params?: JSON): void;
    /**
     * Resets the values of the members of this :class:`Instance`.
     *
     * If the member is defined with a *default* attribute in the configuration
     * file, it gets that value. Otherwise, numbers are set to 0 and strings are
     * set to empty. Sequences are cleared and optional members are set to 'null'.
     * For example, if this Output's type is *ShapeType*, then ``clearMembers()``
     * sets::
     *  color = 'RED'
     *  shapesize = 30
     *  x = 0
     *  y = 0
     */
    clearMembers(): void;
    /**
     * Waits until all matching reliable subscriptions have acknowledged all the
     * samples that have currently been written.
     *
     * This method only waits if this Output is configured with a reliable QoS.
     *
     * .. note::
     *   This operation is asynchronous
     *
     * @param {timeout} [timeout] The maximum time to wait, in milliseconds.
     *   By default, infinite.
     * @throws {TimeoutError} :class:`TimeoutError` will be thrown if the timeout
     *   expires before all matching reliable subscriptions acknowledge all the
     *   samples.
     * @returns {Promise} Promise object which will be rejected if not all matching
     *   reliable subscriptions acknowledge all of the samples within the specified
     *   timeout.
     */
    wait(timeout?: any): Promise<any>;
    /**
     * Waits for this Output to match or unmatch a compatible DDS Publication.
     *
     * This method waits for the specified timeout (or if no timeout is
     * specified, it waits forever), for a match (or unmatch) to occur.
     *
     * .. note::
     *   This operation is asynchronous
     *
     * @param {number} [timeout] - The maximum time to wait, in milliseconds.
     *   By default, infinite.
     * @throws {TimeoutError} :class:`TimeoutError` will be thrown if the
     *   timeout expires before a subscription is matched.
     * @returns {Promise} Promise object resolving with the change in the
     *   current number of matched inputs. If this is a positive number, the
     *   output has matched with new subscribers. If it is negative, the output
     *   has unmatched from a subscription. It is possible for multiple matches
     *   and/or unmatches to be returned (e.g., 0 could be returned, indicating
     *   that the output matched the same number of inputs as it unmatched).
     */
    waitForSubscriptions(timeout?: number): Promise<any>;
    /**
     * Provides information about matched subscriptions.
     *
     * This property returns a JSON array, with each element of the array
     * containing information about a matched subscription.
     *
     * Currently the only information contained in this JSON object is the
     * subscription name of the matched subscription. If the matched subscription
     * doesn't have a name, the name for that specific subscription will be null.
     *
     * Note that :class:`Connector` Inputs are automatically assigned a name from
     * the ``data_reader name`` element in the XML configuration.
     *
     * @type {JSON}
     */
    get matchedSubscriptions(): JSON;
    clear_members(): void;
}
/**
 * Provides access to the data samples read by an :class:`Input`.
 */
declare class Samples {
    /**
     * This class provides access to data samples read by an
     * :class:`Input` (using either the :meth:`Input.read`
     * or :meth:`Input.take` methods).
     *
     * This class implements a ``[Symbol.iterator]()`` method, making it an
     * iterable. This allows it to be used in ``for... of`` loops, to iterate
     * through available samples::
     *
     *    for (const sample of input.samples) {
     *       console.log(JSON.stringify(sample.getJson()))
     *    }
     *
     * The method :meth:`Samples.get` returns a :class:`SampleIterator` which
     * can also be used to access available samples::
     *
     *    const sample = input.samples.get(0)
     *    console.log(JSON.stringify(sample.getJson()))
     *
     * The samples returned by these methods may only contain meta-data
     * (see :attr:`SampleIterator.info`). The :attr:`Samples.validDataIter`
     * iterable only iterates over samples that contain valid data
     * (a :class:`ValidSampleIterator`).
     *
     * :class:`Samples` and :class:`ValidSampleIterator` both also provide
     * generators to the samples, allowing applications to define their own
     * iterables (see :meth:`Samples.iterator()` and
     * :meth:`ValidSampleIterator.iterator()`).
     *
     * ``Samples`` is the type of the property :meth:`Input.samples`.
     *
     * For more information and examples, see :ref:`Accessing the data samples`.
     *
     * Attributes:
     *  * length (number) - The number of samples available since the last time
     *    :meth:`Input.read` or :meth:`Input.take` was called.
     *  * validDataIter (:class:`ValidSampleIterator`) - The class used to
     *    iterate through the available samples that have valid data.
     */
    constructor(input: any);
    input: any;
    /**
     * Returns an iterator to the data samples, starting at the index specified.
     *
     * The iterator provides access to all the data samples retrieved by the
     * most recent call to :meth:`Input.read` or :meth:`Input.take`.
     *
     * This iterator may return samples with invalid data (samples that only
     * contain meta-data).
     * Use :attr:`Samples.validDataIter` to avoid having to check
     * :attr:`SampleIterator.validData`.
     *
     * @param {number} [index] The index of the sample from which the iteration
     *   should begin. By default, the iterator begins with the first sample.
     *
     * @returns :class:`SampleIterator` - An iterator to the samples (which
     *   implements both iterable and iterator logic).
     */
    get(index?: number): SampleIterator;
    /**
     * Returns an iterable, allowing the samples to be accessed using a for...of loop.
     *
     * The iterable provides access to all the data samples retrieved by the most
     * recent call to :meth:`Input.read` or :meth:`Input.take`.
     *
     * This iterable may return samples with invalid data (samples that only contain
     * meta-data).
     * Use :attr:`Samples.validDataIter` to avoid having to check
     * :attr:`SampleIterator.validData`.
     *
     * Allows for the following syntax::
     *
     *    for (const sample of input.samples) {
     *      // ..
     *    }
     *
     * @returns :class:`SampleIterator` An iterator to the samples.
     */
    [Symbol.iterator](): Generator<SampleIterator, void, unknown>;
    /**
     * The iterator generator (used by the iterable).
     *
     * This method returns a generator, which must be incremented manually by the
     * application (using the iterator.next() method).
     *
     * Once incremented, the data can be accessed via the ``.value`` attribute.
     * Once no more samples are available, the ``.done`` attribute will be true.
     *
     * Using this method, it is possible to create your own iterable::
     *
     *   const iterator = input.samples.iterator()
     *   const singleSample = iterator.next().value
     *
     * @generator
     * @yields {SampleIterator} The next sample in the queue
     */
    iterator(): Generator<SampleIterator, void, unknown>;
    /**
     * Returns an iterator to the data samples that contain valid data.
     *
     * The iterator provides access to all the data samples retrieved by the most
     * recent call to :meth:`Input.read` or :meth:`Input.take`, and skips samples
     * with invalid data (meta-data only).
     *
     * By using this iterator, it is not necessary to check if each sample contains
     * valid data.
     *
     * @returns {ValidSampleIterator} An iterator to the samples containing valid
     *   data (which implements both iterable and iterator logic).
     */
    get validDataIter(): ValidSampleIterator;
    /**
     * The number of samples available.
     */
    get length(): any;
    /**
     * Returns the number of samples available.
     *
     * This method is deprecated, use the getter :meth:`Samples.length`.
     * @private
     */
    private getLength;
    /**
     * Obtains the value of a numeric field within this sample.
     *
     * See :ref:`Accessing the data samples`.
     *
     * @param {number} index The index of the sample.
     * @param {string} fieldName The name of the field.
     * @returns {number} The obtained value.
     */
    getNumber(index: number, fieldName: string): number;
    /**
     * Obtains the value of a boolean field within this sample.
     *
     * See :ref:`Accessing the data samples`.
     *
     * @param {number} index The index of the sample.
     * @param {string} fieldName The name of the field.
     * @returns {number} The obtained value.
     */
    getBoolean(index: number, fieldName: string): number;
    /**
     * Obtains the value of a string field within this sample.
     *
     * See :ref:`Accessing the data samples`.
     *
     * @param {number} index The index of the sample.
     * @param {string} fieldName The name of the field.
     * @returns {string} The obtained value.
     */
    getString(index: number, fieldName: string): string;
    /**
     * Gets the value of a field within this sample.
     *
     * See :ref:`Accessing the data samples`.
     *
     * This API can be used to obtain strings, numbers, booleans and the JSON
     * representation of complex members.
     *
     * @param {string} fieldName - The name of the field.
     * @returns {number|string|boolean|JSON} The value of the field.
     */
    getValue(index: any, fieldName: string): number | string | boolean | JSON;
    /**
     * Gets a JSON object with the values of all the fields of this sample.
     *
     * @param {number} index The index of the sample.
     * @param {string} [memberName] The name of the complex member. The type
     *   of the member with name memberName must be an array, sequence, struct,
     *   value or union.
     * @returns {JSON} The obtained JSON object.
     *
     * See :ref:`Accessing the data samples`.
     */
    getJson(index: number, memberName?: string): JSON;
    /**
     * Obtains a native handle to the sample, which can be used to access
     * additional *Connext DDS* APIs in C.
     *
     * @param {number} index The index of the sample for which to obtain
     *   the native pointer.
     * @returns {pointer} A native pointer to the sample.
     */
    getNative(index: number): any;
    /**
     * This method is deprecated, use :meth:`Samples.getJson`.
     *
     * @param {number} index - The index of the sample for which to obtain
     *   the JSON object.
     * @param {string} [memberName] - The name of the complex member for
     *   which to obtain the JSON object.
     * @returns {JSON} A JSON object representing the current sample.
     * @private
     */
    private getJSON;
}
/**
 * Provides access to the meta-data contained in samples read by an input.
 *
 * Note: The Infos class is deprecated and should not be used directly.
 * Instead, use :meth:`SampleIterator.info`.
 *
 * @private
 */
declare class Infos {
    constructor(input: any);
    input: any;
    /**
     * Obtains the number of samples in the related :class:`Input`'s queue.
     * @private
     */
    private getLength;
    /**
     * Checks if the sample at the given index contains valid data.
     *
     * @param {number} index - The index of the sample in the :class:`Input`'s
     *   queue to check for valid data
     * @returns{boolean} True if the sample contains valid data
     * @private
     */
    private isValid;
}
declare class Instance {
    /**
     * A data sample.
     *
     * :class:`Instance` is the type obtained through ``Output.instance``
     * and is the object that is published by :meth:`Output.write`.
     *
     * An Instance has an associated DDS Type, specified in the XML
     * configuration, and it allows setting the values for the fields of
     * the DDS Type.
     *
     * Attributes:
     *  * ``output`` (:class:`Output`) - The :class:`Output` that owns
     *    this Instance.
     *  * ``native`` (pointer) - Native handle to this Instance that allows
     *    for additional *Connext DDS Pro* C APIs to be called.
     */
    constructor(output: any);
    output: any;
    /**
     * Resets a member to its default value.
     *
     * The effect is the same as that of :meth:`Output.clearMembers`, except
     * that only one member is cleared.
     * @param {string} fieldName The name of the field. It can be a complex
     *   member or a primitive member.
     */
    clearMember(fieldName: string): void;
    /**
     * Sets a numeric field.
     *
     * @param {string} fieldName - The name of the field.
     * @param {number} value - A numeric value, or null, to unset an
     *   optional member.
     */
    setNumber(fieldName: string, value: number): void;
    /**
     * Sets a boolean field.
     *
     * @param {string} fieldName - The name of the field.
     * @param {boolean} value - A boolean value, or null, to unset an
     *   optional member.
     */
    setBoolean(fieldName: string, value: boolean): void;
    /**
     * Sets a string field.
     *
     * @param {string} fieldName - The name of the field.
     * @param {number} value - A string  value, or null, to unset an
     *   optional member.
     */
    setString(fieldName: string, value: number): void;
    /**
     * Sets the member values specified in a JSON object.
     *
     * The keys in the JSON object are the member names of the DDS Type
     * associated with the Output, and the values are the values to set
     * for those members.
     *
     * This method sets the values of those members that are explicitly
     * specified in the JSON object. Any member that is not specified in
     * the JSON object will retain its previous value.
     *
     * To clear members that are not in the JSON object, call
     * :meth:`Output.clearMembers` before this method. You can also
     * explicitly set any value in the JSON object to *null* to reset that
     * field to its default value.
     *
     * @param {JSON} jsonObj - The JSON object containing the keys
     *   (field names) and values (values for the fields).
     */
    setFromJson(jsonObj: JSON): void;
    /**
     * Sets the value of fieldName.
     *
     * The type of the argument ``value`` must correspond with the type of the
     * field with name ``fieldName`` (as defined in the configuration XML file).
     *
     * This method is an alternative to
     * :meth:`Instance.setNumber`, :meth:`Instance.setString` and
     * :meth:`Instance.setBoolean`. The main difference is that it is
     * type-independent (in that the same method can be used for all fields).
     *
     * @param {string} fieldName The name of the field.
     * @param {number|boolean|string|null} value The value to set. Note that
     *   ``null`` is used to unset an optional member.
     */
    set(fieldName: string, value: number | boolean | string | null): void;
    /**
     * Retrives the value of this instance as a JSON object.
     *
     * @returns {JSON} The value of this instance as a JSON object.
     */
    getJson(): JSON;
    /**
     * Depreacted, use setFromJson.
     *
     * This method is supplied for backwards compatibility.
     * @private
     */
    private setFromJSON;
    /**
     * The native C object.
     *
     * This property allows accessing additional *Connext DDS* APIs in C.
     * @type {pointer}
     */
    get native(): any;
}
/**
 * Iterates and provides access to a data sample.
 */
declare class SampleIterator {
    /**
     * A SampleIterator provides access to the data receieved by an :class:`Input`.
     *
     * The :attr:`Input.samples` attribute implements a :class:`SampleIterator`,
     * meaning it can be iterated over. An individual sample can be accessed
     * using :meth:`Input.samples.get`.
     *
     * See :class:`ValidSampleIterator`.
     *
     * This class provides both an iterator and iterable, and is used internally
     * by the :class:`Samples` class. The following options to iterate over the
     * samples exist::
     *
     *   // option 1 - The iterable can be used in for...of loops
     *   for (const sample of input.samples)
     *   // option 2 - Returns an individual sample at the given index
     *   const individualSample = input.samples.get(0)
     *   // option 3 - Returns a generator which must be incremented by the application
     *   const iterator = input.samples.iterator()
     *
     * @property {boolean} validData - Whether or not the current sample
     *   contains valid data.
     * @property {SampleInfo} infos - The meta-data associated with the
     *   current sample.
     * @property {pointer} native - A native handle that allows accessing
     *   additional *Connext DDS* APIs in C.
     */
    constructor(input: any, index: any);
    input: any;
    index: any;
    length: any;
    /**
     * Whether or not this sample contains valid data.
     *
     * If ``false``, the methods to obtain values of the samples
     * (e.g., :meth:`SampleIterator.getNumber`,
     * :meth:`SampleIterator.getBoolean`, :meth:`SampleIterator.getJson`,
     * :meth:`SampleIterator.getString`) should not be called. To avoid
     * this restraint, use a :class:`ValidSampleIterator`.
     * @type {boolean}
     */
    get validData(): boolean;
    /**
     * Provides access to this sample's meta-data.
     *
     * The ``info`` property expects one of the :class:`SampleInfo` field names::
     *
     *   const value = sample.info.get('field')
     *
     * The supported field names are:
     *
     * * ``'source_timestamp'`` returns an integer representing nanoseconds
     * * ``'reception_timestamp'`` returns an integer representing nanoseconds
     * * ``'sample_identity'`` or ``'identity'`` returns a JSON object
     *   (see :meth:`Output.write`)
     * * ``'related_sample_identity'`` returns a JSON object
     *   (see :meth:`Output.write`)
     * * ``'valid_data'`` returns a boolean (equivalent to
     *   :attr:`SampleIterator.validData`)
     * * ``'view_state'``, returns a string (either "NEW" or "NOT_NEW")
     * * ``'instance_state'``, returns a string (one of "ALIVE", "NOT_ALIVE_DISPOSED" or "NOT_ALIVE_NO_WRITERS")
     * * ``'sample_state'``, returns a string (either "READ" or "NOT_READ")
     *
     * These fields are documented in `The SampleInfo Structure
     * <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/The_SampleInfo_Structure.htm>`__
     * section in the *RTI Connext DDS Core Libraries User's Manual*.
     *
     * See :class:`SampleInfo`.
     */
    get info(): SampleInfo;
    /**
     * Returns a JSON object with the values of all the fields of this sample.
     *
     * See :ref:`Accessing the data samples`.
     *
     * @param {string} [memberName] - The name of the complex member or field
     *   to obtain.
     * @returns {JSON} The obtained JSON object.
     */
    getJson(memberName?: string): JSON;
    /**
     * Gets the value of a numeric field in this sample.
     *
     * @param {string} fieldName - The name of the field.
     * @returns {number} The numeric value of the field.
     */
    getNumber(fieldName: string): number;
    /**
     * Gets the value of a boolean field in this sample.
     *
     * @param {string} fieldName - The name of the field.
     * @returns {boolean} The boolean value of the field.
     */
    getBoolean(fieldName: string): boolean;
    /**
     * Gets the value of a string field in this sample.
     *
     * @param {string} fieldName - The name of the field.
     * @returns {string} The string value of the field.
     */
    getString(fieldName: string): string;
    /**
     * Gets the value of a field within this sample.
     *
     * This API can be used to obtain strings, numbers, booleans and the JSON
     * representation of complex members.
     * @param {string} fieldName - The name of the field.
     * @returns {number|string|boolean|JSON} The value of the field.
     */
    get(fieldName: string): number | string | boolean | JSON;
    /**
     * The native pointer to the DynamicData sample.
     *
     * @type {pointer}
     * @private
     */
    private get native();
    /**
     * The iterator generator (used by the iterable).
     *
     * This generator is used internally by the iterable.
     * A public generator is provided :meth:`Samples.iterator`.
     *
     * @private
     */
    private iterator;
    /**
     * Implementation of iterable logic. This allows for the following syntax::
     *   for (const sample of input.samples) {
     *    json = sample.getJson()
     *   }
     */
    [Symbol.iterator](): Generator<SampleIterator, void, unknown>;
}
/**
 * Iterates and provides access to data samples with valid data.
 *
 * This iterator provides the same methods as :class:`SampleIterator`.
 * It can be obtained using :attr:`Input.samples.validDataIter`.
 * @extends SampleIterator
 *
 * Using this class, it is possible to iterate through all valid data samples::
 *   for (let sample of input.samples.validDataIter) {
 *    console.log(JSON.stringify(sample.getJson()))
 *   }
 */
declare class ValidSampleIterator extends SampleIterator {
    /**
     * A SampleIterator provides access to the data receieved by an :class:`Input`.
     *
     * The :attr:`Input.samples` attribute implements a :class:`SampleIterator`,
     * meaning it can be iterated over. An individual sample can be accessed
     * using :meth:`Input.samples.get`.
     *
     * See :class:`ValidSampleIterator`.
     *
     * This class provides both an iterator and iterable, and is used internally
     * by the :class:`Samples` class. The following options to iterate over the
     * samples exist::
     *
     *   // option 1 - The iterable can be used in for...of loops
     *   for (const sample of input.samples)
     *   // option 2 - Returns an individual sample at the given index
     *   const individualSample = input.samples.get(0)
     *   // option 3 - Returns a generator which must be incremented by the application
     *   const iterator = input.samples.iterator()
     *
     * @property {boolean} validData - Whether or not the current sample
     *   contains valid data.
     * @property {SampleInfo} infos - The meta-data associated with the
     *   current sample.
     * @property {pointer} native - A native handle that allows accessing
     *   additional *Connext DDS* APIs in C.
     */
    constructor(input: any, index: any);
}
/**
 * The type returned by the property :meth:`SampleIterator.info`.
 */
declare class SampleInfo {
    /**
     * This class provides a way to access the SampleInfo of a received data sample.
     */
    constructor(input: any, index: any);
    input: any;
    index: any;
    /**
     * Type-independent function to obtain any value from the SampleInfo structure.
     *
     * The supported fieldNames are:
     *
     * * ``'source_timestamp'`` returns an integer representing nanoseconds
     * * ``'reception_timestamp'`` returns an integer representing nanoseconds
     * * ``'sample_identity'`` or ``'identity'`` returns a JSON object
     *   (see :meth:`Output.write`)
     * * ``'related_sample_identity'`` returns a JSON object
     *   (see :meth:`Output.write`)
     * * ``'valid_data'`` returns a boolean (equivalent to
     *   :attr:`SampleIterator.validData`)
     *
     * These fields are documented in `The SampleInfo Structure
     * <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/The_SampleInfo_Structure.htm>`__
     * section in the *RTI Connext DDS Core Libraries User's Manual*.
     *
     * @param {string} fieldName - The name of the ``SampleInfo`` field to obtain
     * @returns The obtained value from the ``SampleInfo`` structure
     * @example const source_timestamp = input.samples.get(0).info.get('source_timestamp')
     */
    get(fieldName: string): any;
}
export {};

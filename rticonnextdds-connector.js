/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

var os = require('os')
var ref = require('ref')
var ffi = require('ffi')
var path = require('path')
var StructType = require('ref-struct')
var EventEmitter = require('events').EventEmitter

/**
 * The Node.js representation of the RTI_Connector_Options structure within
 * the core. We define it here using the module ref-struct such that we can
 * pass it by value into the Core when creating a Connector object.
 * @private
 */
var _ConnectorOptions = StructType({
  enable_on_data_event: ref.types.int,
  one_based_sequence_indexing: ref.types.int
})

class _ConnectorBinding {
  constructor () {
    let libArch = ''
    let libName = ''

    if (os.arch() === 'x64') {
      switch (os.platform()) {
        case 'darwin':
          libArch = 'x64Darwin16clang8.0'
          libName = 'librtiddsconnector.dylib'
          break
        case 'linux':
          libArch = 'x64Linux2.6gcc4.4.5'
          libName = 'librtiddsconnector.so'
          break
        // Windows returns win32 even on 64-bit platforms
        case 'win32':
          libArch = 'x64Win64VS2013'
          libName = 'rtiddsconnector.dll'
          break
        default:
          throw new Error(os.platform() + ' not yet supported')
      }
    } else if (os.arch() === 'ia32') {
      switch (os.platform()) {
        case 'linux':
          libArch = 'i86Linux3.xgcc4.6.3'
          libName = 'librtiddsconnector.so'
          break
        case 'win32':
          libArch = 'i86Win32VS2010'
          libName = 'rtiddsconnector.dll'
          break
        default:
          throw new Error(os.platform() + ' not yet supported')
      }
    } else if (os.arch() === 'arm') {
      switch (os.platform()) {
        case 'linux':
          libArch = 'armv6vfphLinux3.xgcc4.7.2'
          libName = 'librtiddsconnector.so'
          break
        default:
          throw new Error(os.platform() + ' not yet supported')
      }
    }

    this.library = path.join(__dirname, '/rticonnextdds-connector/lib/', libArch, '/', libName)
    this.api = ffi.Library(this.library, {
      RTI_Connector_new: ['pointer', ['string', 'string', ref.refType(_ConnectorOptions)]],
      RTI_Connector_delete: ['void', ['pointer']],
      RTI_Connector_get_datawriter: ['pointer', ['pointer', 'string']],
      RTI_Connector_get_datareader: ['pointer', ['pointer', 'string']],
      RTI_Connector_get_native_sample: ['pointer', ['pointer', 'string', 'int']],
      RTI_Connector_set_number_into_samples: ['int', ['pointer', 'string', 'string', 'double']],
      RTI_Connector_set_boolean_into_samples: ['int', ['pointer', 'string', 'string', 'int']],
      RTI_Connector_set_string_into_samples: ['int', ['pointer', 'string', 'string', 'string']],
      RTI_Connector_clear_member: ['int', ['pointer', 'string', 'string']],
      RTI_Connector_write: ['int', ['pointer', 'string', 'string']],
      RTI_Connector_wait_for_acknowledgments: ['int', ['pointer', 'int']],
      RTI_Connector_read: ['int', ['pointer', 'string']],
      RTI_Connector_take: ['int', ['pointer', 'string']],
      RTI_Connector_wait_for_data: ['int', ['pointer', 'int']],
      RTI_Connector_wait_for_data_on_reader: ['int', ['pointer', 'int']],
      RTI_Connector_wait_for_matched_publication: ['int', ['pointer', 'int', 'pointer']],
      RTI_Connector_wait_for_matched_subscription: ['int', ['pointer', 'int', 'pointer']],
      RTI_Connector_get_matched_subscriptions: ['int', ['pointer', ref.refType('char *')]],
      RTI_Connector_get_matched_publications: ['int', ['pointer', ref.refType('char *')]],
      RTI_Connector_clear: ['int', ['pointer', 'string']],
      RTI_Connector_get_boolean_from_infos: ['int', ['pointer', ref.refType('int'), 'string', 'int', 'string']],
      RTI_Connector_get_json_from_infos: ['int', ['pointer', 'string', 'int', 'string', ref.refType('char *')]],
      RTI_Connector_get_sample_count: ['int', ['pointer', 'string', ref.refType('double')]],
      RTI_Connector_get_number_from_sample: ['int', ['pointer', ref.refType('double'), 'string', 'int', 'string']],
      RTI_Connector_get_boolean_from_sample: ['int', ['pointer', ref.refType('int'), 'string', 'int', 'string']],
      RTI_Connector_get_string_from_sample: ['int', ['pointer', ref.refType('char *'), 'string', 'int', 'string']],
      RTI_Connector_get_any_from_sample: ['int', ['pointer', ref.refType('double'), ref.refType('int'), ref.refType('char *'), ref.refType('int'), 'string', 'int', 'string']],
      RTI_Connector_get_any_from_info: ['int', ['pointer', ref.refType('double'), ref.refType('int'), ref.refType('char *'), ref.refType('int'), 'string', 'int', 'string']],
      RTI_Connector_get_json_sample: ['int', ['pointer', 'string', 'int', ref.refType('char *')]],
      RTI_Connector_get_json_member: ['int', ['pointer', 'string', 'int', 'string', ref.refType('char *')]],
      RTI_Connector_set_json_instance: ['int', ['pointer', 'string', 'string']],
      RTI_Connector_get_last_error_message: ['char *', []],
      RTI_Connector_get_native_instance: ['int', ['pointer', 'string', ref.refType('pointer')]],
      RTI_Connector_free_string: ['void', ['char *']],
      RTI_Connector_create_test_scenario: ['int', ['pointer', 'int', 'pointer']],
      RTI_Connector_set_max_objects_per_thread: ['int', ['int']]
    })
  }
}

// Create the connectorBinding
var connectorBinding = new _ConnectorBinding()

/**
 * Copies a natively-allocated string into a Node.js string and frees the
 * native memory.
 * @param {Buffer} cstring - The string returned by the core
 * @private
 */
function _moveCString (cstring) {
  const ret = ref.readCString(cstring)
  connectorBinding.api.RTI_Connector_free_string(cstring)
  return ret
}

/**
 * Obtain the last error message from the RTI Connext DDS Core
 * @private
 */
function _getLastDdsErrorMessage () {
  const cStr = connectorBinding.api.RTI_Connector_get_last_error_message()
  if (cStr !== null) {
    return _moveCString(cStr)
  }
  return ''
}

/**
 * Node.js representation of DDS_ReturnCode_t
 * @private
 */
const _ReturnCodes = {
  ok: 0,
  timeout: 10,
  noData: 11
}
// Make _ReturnCodes immutable
Object.freeze(_ReturnCodes)

/**
 * Node.js representation of RTI_Connector_AnyValueKind
 * @private
 */
const _AnyValueKind = {
  connector_none: 0,
  connector_number: 1,
  connector_boolean: 2,
  connector_string: 3
}
Object.freeze(_AnyValueKind)

/**
 * A timeout error thrown by operations that can block
 * @private
 */
class TimeoutError extends Error {
  constructor (message, extra) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.message = message
    this.extra = extra
  }
}

/**
 * An error originating from the RTI Connect DDS Core
 * @private
 */
class DDSError extends Error {
  constructor (message, extra) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.message = message
    this.extra = extra
  }
}

/**
 * Checks the value returned by the functions in the core for success and throws
 * the appropriate error on failure.
 *
 * @param {number} retcode - The retcode to check
 * @private
 */
function _checkRetcode (retcode) {
  if (retcode !== _ReturnCodes.ok && retcode !== _ReturnCodes.noData) {
    if (retcode === _ReturnCodes.timeout) {
      throw new TimeoutError('Timeout error')
    } else {
      throw new DDSError('DDS Error: ' + _getLastDdsErrorMessage())
    }
  }
}

/**
 * Checks if a value is a string type
 * @param {string} value - The value to check the type of
 * @private
 */
function _isString (value) {
  return typeof value === 'string' || value instanceof String
}

/**
 * Checks if a value is a valid index
 * @param {number} value - The value to check the type of
 * @private
 */
function _isValidIndex (value) {
  return _isNumber(value) && Number.isInteger(value) && value >= 0
}

/**
 * Checks if a value is a valid number (not NaN or Infinity)
 * @param {number} value - The value to check the type of
 */
function _isNumber (value) {
  return typeof value === 'number' && isFinite(value)
}

/**
 * Function used to get any value from either the samples or infos (depending
 * on the supplied getter). The type of the fieldName need not be specified.
 * @param {function} getter - The function to use to get the value
 * @param {Connector} connector - The Connector
 * @param {string} inputName - The name of the input to access
 * @param {number} index - The index in the samples / infos array
 * @param {string} fieldName - The name of the fields to obtain
 * @private
 */
function _getAnyValue (getter, connector, inputName, index, fieldName) {
  const numberVal = ref.alloc('double')
  const boolVal = ref.alloc('int')
  const stringVal = ref.alloc('char *')
  let selection = ref.alloc('int')
  const retcode = getter(
    connector,
    numberVal,
    boolVal,
    stringVal,
    selection,
    inputName,
    index + 1,
    fieldName)
  _checkRetcode(retcode)
  if (retcode === _ReturnCodes.noData) {
    return null
  }
  selection = selection.deref()
  if (selection === _AnyValueKind.connector_number) {
    return numberVal.deref()
  } else if (selection === _AnyValueKind.connector_boolean) {
    return !!boolVal.deref()
  } else if (selection === _AnyValueKind.connector_string) {
    const nodeStr = _moveCString(stringVal.deref())
    // Try to convert the returned string to a JSON object
    try {
      return JSON.parse(nodeStr)
    } catch (err) {
      return nodeStr
    }
  } else {
    // This shouldn't happen
    throw new Error('Unexpected type returned by ' + getter.name)
  }
}

// The Infos class is deprecated and now used internally
class Infos {
  constructor (input) {
    this.input = input
  }

  getLength () {
    const length = ref.alloc('double')
    const retcode = connectorBinding.api.RTI_Connector_get_sample_count(
      this.input.connector.native,
      this.input.name,
      length)
    _checkRetcode(retcode)
    return length.deref()
  }

  isValid (index) {
    if (!_isValidIndex(index)) {
      throw new TypeError('index must be an integer')
    } else {
      // Increment index since Lua arrays are 1-indexed
      index += 1
      const value = ref.alloc('int')
      const retcode = connectorBinding.api.RTI_Connector_get_boolean_from_infos(
        this.input.connector.native,
        value,
        this.input.name,
        index,
        'valid_data')
      _checkRetcode(retcode)
      if (retcode === _ReturnCodes.noData) {
        return null
      }
      return value.deref()
    }
  }
}

// Public API

/**
 * Provide access to the data samples read by an Input ({@link Input#samples}).
 *
 * This class p...
 *
 * The default iterator provides access to all of the data samples retrieved by
 * most-recent call to {@link Input#read} or {@link Input#take}. Use {@link validDataIterator}
 * to access only samples with valid data.
 *
 * ``Samples`` is the type of the property {@link Input#samples}.
 *
 * For more information and examples see {@link `Accessing the data samples`}.
 *
 * @property {number} sampleCount - The number of samples currently available on this Input.
 * @property {SampleIterator} dataIterator - The class used to iterate through the available samples
 * @property {ValidSampleIterator} validDataIterator - The class used to iterate through the available samples which have valid data.
 */
class Samples {
  constructor (input) {
    this.input = input
  }

  /**
   * Returns an iterator to the data samples, starting at the index specified.
   *
   *
   * The iterator provides access to all the data samples retrieved by the most
   * recent call to {@link Input#read} or {@link Input#take}.
   *
   * This iterator may return samples with invalid data (samples that only contain
   * meta-data). Use {@link Input#validDataIterator} to avoid having to check {@link SampleIterator#validData}.
   *
   * @param {number} [index] The index of the sample from which the iteration should begin
   *
   * @return {SampleIterator} An iterator to the samples.
   */
  get (index) {
    return new SampleIterator(this.input, index)
  }

  /**
   * Returns an iterator to the data samples.
   *
   * The iterator provides access to all the data samples retrieved by the most
   * recent call to {@link Input#read} or {@link Input#take}.
   *
   * This iterator may return samples with invalid data (samples that only contain
   * meta-data). Use {@link Input#validDataIterator} to avoid having to check {@link SampleIterator#validData}.
   *
   * @return {SampleIterator} An iterator to the samples.
   */
  get dataIterator () {
    return new SampleIterator(this.input)
  }

  /**
   * Returns the number of samples available.
   *
   * @type {number} The number of samples available since the last time read/take was called.
   */
  get length () {
    return this.input.samples.getLength()
  }

  /**
   * Returns an iterator to the data samples which contain valid data.
   *
   * The iterator provides access to all the data samples retrieved by the most
   * recent call to {@link Input.read} or {@link Input.take}, and skips samples with
   * invalid data (meta-data only).
   *
   * By using this iterator, it is not necessary to check if each sample contains
   * valid data.
   *
   * @return {ValidSampleIterator} An iterator to the samples.
   */
  get validDataIterator () {
    return new ValidSampleIterator(this.input)
  }

  /**
   * Returns the number of samples available.
   *
   * @see Samples#length
   */
  getLength () {
    const length = ref.alloc('double')
    const retcode = connectorBinding.api.RTI_Connector_get_sample_count(
      this.input.connector.native,
      this.input.name,
      length)
    _checkRetcode(retcode)
    // We use ~~ to convert from double -> int. This is required to allow:
    // for (var i =0; i < input.samples.getLength(); ++i)
    // It works since the we are doing a bitwise complement (double not)
    return ~~length.deref()
  }

  getNumber (index, fieldName) {
    if (!_isValidIndex(index)) {
      throw new TypeError('index must be an integer')
    } else if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else {
      // Increment index since C API based on Lua with 1-based indexes
      index += 1
      const value = ref.alloc('double')
      const retcode = connectorBinding.api.RTI_Connector_get_number_from_sample(
        this.input.connector.native,
        value,
        this.input.name,
        index,
        fieldName)
      _checkRetcode(retcode)
      // Return null if no_data was returned (unset optional)
      if (retcode === _ReturnCodes.noData) {
        return null
      } else {
        return value.deref()
      }
    }
  }

  getBoolean (index, fieldName) {
    if (!_isValidIndex(index)) {
      throw new TypeError('index must be an integer')
    } else if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else {
      // Increment index since C API based on Lua with 1-based indexes
      index += 1
      const value = ref.alloc('int')
      const retcode = connectorBinding.api.RTI_Connector_get_boolean_from_sample(
        this.input.connector.native,
        value,
        this.input.name,
        index,
        fieldName)
      _checkRetcode(retcode)
      // Return null if no_data was returned (unset optional)
      if (retcode === _ReturnCodes.noData) {
        return null
      } else {
        return !!value.deref()
      }
    }
  }

  getString (index, fieldName) {
    if (!_isValidIndex(index)) {
      throw new TypeError('index must be an integer')
    } else if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else {
      // Increment index since C API based on Lua with 1-based indexes
      index += 1
      const value = ref.alloc('char *')
      const retcode = connectorBinding.api.RTI_Connector_get_string_from_sample(
        this.input.connector.native,
        value,
        this.input.name,
        index,
        fieldName)
      _checkRetcode(retcode)
      if (retcode === _ReturnCodes.noData) {
        return null
      } else {
        return _moveCString(value.deref())
      }
    }
  }

  getJson (index, memberName) {
    if (!_isValidIndex(index)) {
      throw new TypeError('index must be an integer')
    } else {
      // Increment index since Lua arrays are 1-indexed
      index += 1
      const cStr = ref.alloc('char *')
      let retcode = _ReturnCodes.noData
      // memberName is "optional" - if supplied we will get the JSON object for
      // a specific complex member in the sample
      if (memberName !== undefined) {
        if (!_isString(memberName)) {
          throw new TypeError('memberName must be a string')
        } else {
          retcode = connectorBinding.api.RTI_Connector_get_json_member(
            this.input.connector.native,
            this.input.name,
            index,
            memberName,
            cStr)
        }
      } else {
        retcode = connectorBinding.api.RTI_Connector_get_json_sample(
          this.input.connector.native,
          this.input.name,
          index,
          cStr)
      }
      _checkRetcode(retcode)
      if (retcode === _ReturnCodes.noData) {
        return null
      }
      return JSON.parse(_moveCString(cStr.deref()))
    }
  }

  getNative (index) {
    if (!_isValidIndex(index)) {
      throw new TypeError('index must be an integer')
    } else {
      // Increment index since Lua arrays are 1-indexed
      index += 1
      return connectorBinding.api.RTI_Connector_get_native_sample(
        this.input.connector.native,
        this.input.name,
        index)
    }
  }

  // Deprecated, use getJson
  getJSON (index, memberName) {
    return this.getJson(index, memberName)
  }
}

/**
 * The type of :attr:`SampleIterator.info`
 */
class SampleInfo {
  constructor (input, index) {
    this.input = input
    this.index = index
  }

  /**
   * Type independent function to obtain any value from the SampleInfo structure.
   * @param {string} fieldName - The value in the SampleInfo to obtain
   * @returns The obtained value
   */
  getValue (fieldName) {
    if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else {
      return _getAnyValue(
        connectorBinding.api.RTI_Connector_get_any_from_info,
        this.input.connector.native,
        this.input.name,
        this.index,
        fieldName)
    }
  }
}

/**
 * Iterates and provides access to a data sample.
 *
 * A SampleIterator provides access to the data receieved by a {@link Input}.
 * SampleIterators are accessed using {@link Input#samples#dataIterator}
 * and {@link Input#samples#getSample}.
 * {@link Input#samples#validDataIterator} returns a subclass; {@link ValidDataIterator}
 *
 * @see :ref:`Reading data (Input)`.
 */
class SampleIterator {
  constructor (input, index) {
    this.input = input
    if (index === undefined) {
      index = -1
    }
    this.index = index
    this.length = input.samples.getLength()
  }

  /**
   * Whether or not this sample contains valid data.
   *
   * If ``false``, this object's getters should not be called.
   * @type {boolean}
   */
  get validData () {
    return !!this.input.infos.isValid(this.index)
  }

  /**
   * Provides access to this sample's meta-data.
   *
   * @type {SampleInfo}
   * @see :class:`SampleInfo`
   */
  get info () {
    return new SampleInfo(this.input, this.index)
  }

  /**
   * Returns a JSON object with the values of all the fields of this sample.
   *
   * @param {string} [memberName] - The name of the complex member or field to obtain.
   * @returns {JSON} The obtained JSON object.
   * @see :ref:`Accessing the data`
   */
  getJson (memberName) {
    return this.input.samples.getJson(this.index, memberName)
  }

  /**
   * Gets the value of a numeric field in this sample.
   *
   * @param {string} fieldName - The name of the field.
   * @returns {number} The numeric value of the field.
   */
  getNumber (fieldName) {
    return this.input.samples.getNumber(this.index, fieldName)
  }

  /**
   * Gets the value of a boolean field in this sample.
   *
   * @param {string} fieldName - The name of the field.
   * @returns {boolean} The boolean value of the field.
   */
  getBoolean (fieldName) {
    return this.input.samples.getBoolean(this.index, fieldName)
  }

  /**
   * Gets the value of a string field in this sample.
   *
   * @param {string} fieldName - The name of the field.
   * @returns {string} The string value of the field.
   */
  getString (fieldName) {
    return this.input.samples.getString(this.index, fieldName)
  }

  /**
   * Get the value of a field within this sample.
   *
   * This API can be used to obtain strings, numbers, booleans and the JSON
   * reprentation of complex members.
   * @param {string} fieldName - The name of the field.
   * @returns {number|string|boolean|JSON} The value of the field.
   */
  getValue (fieldName) {
    if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else {
      return _getAnyValue(
        connectorBinding.api.RTI_Connector_get_any_from_sample,
        this.input.connector.native,
        this.input.name,
        this.index,
        fieldName)
    }
  }

  /**
   * The native pointer to the DynamicData sample.
   *
   * @type {pointer}
   * @private
   */
  get native () {
    return this.input.samples.getNative(this.index)
  }

  /**
   * The iterator generator (used by the iterable). This is exposed separately
   * to make it possible to control the iterable outside of a for loop, e.g.:
   * var iterator = input.validDataIterator[Symbol.iterator]()
   * iterator = iterator.next()
   * jsonDictionary = iterator.value.getJson()
   */
  * iterator () {
    while ((this.index + 1) < this.length) {
      this.index += 1
      yield this
    }
  }

  /**
   * Implementation of iterable logic. This allows for the following syntax:
   * for (var sample of input.dataIterator) {
   *  jsonDictionary = sample.getJson()
   * }
   */
  [Symbol.iterator] () {
    return this.iterator()
  }
}

/**
 * Iterates and provides access to data samples with valid data.
 *
 * This iterator provides the same methods as {@link SampleIterator}.
 * @link Input.validDataIterator
 * @extends SampleIterator
 */
class ValidSampleIterator extends SampleIterator {
  /**
   * Implementation of iterable logic, which only includes valid data.
   * Since this class inherits from SampleIterator, we use the iterable from
   * that class.
   */
  * iterator () {
    while ((this.index + 1) < this.length) {
      // Increment the sample to the next one with valid
      while (((this.index + 1) < this.length) && !this.input.infos.isValid(this.index + 1)) {
        this.index += 1
      }
      if ((this.index + 1) < this.length) {
        this.index += 1
        yield this
      }
    }
  }
}

/**
 * Allows reading data for a topic.
 *
 * To get an Input object, use {@link Connector.getInput}.
 * @property {Connector} connector - The Connector creates this Input
 * @property {string} name - The name of the Input (the name used in {@link Connector.getInput})
 * @property {pointer} native - A native handle that allows accessing additional Connect DDS APIs in C.
 * @property {JSON} matchedPublications - A JSON object containing information about all the publications currently matched with this Input.
 */
class Input {
  constructor (connector, name) {
    this.connector = connector
    this.name = name
    this.native = connectorBinding.api.RTI_Connector_get_datareader(
      this.connector.native,
      this.name)
    if (this.native.isNull()) {
      throw new Error('Invalid Subscription::DataReader name')
    }
    // We use the '_' since samples is the name of the property and we want
    // input.samples to call the getter, not access the internal variable
    this._samples = new Samples(this)
    this.infos = new Infos(this)
    // Internally, we use a StatusCondition for the waitForData and for
    // waitForPublications, making these operations not thread-safe (since each
    // DataReader only has a single StatusCondition associated with it). Since both
    // of these functions are async, we use use this boolean to ensure that they
    // are not used concurrently. This works because the Node.js interpreter is
    // single-threaded.
    this.waitsetBusy = false
  }

  /**
   * Access the samples received by this Input.
   *
   * This operation performs the same operation as {@link Input.take} but the samples
   * remain accessible (in the internal queue) after the operation has been called.
   */
  read () {
    _checkRetcode(connectorBinding.api.RTI_Connector_read(
      this.connector.native,
      this.name))
  }

  /**
   * Access the samples receieved by this Input.
   *
   * After calling this method, the samples are accessible using {@link Input.samples}.
   */
  take () {
    _checkRetcode(connectorBinding.api.RTI_Connector_take(
      this.connector.native,
      this.name))
  }

  /**
   * Allows iterating over the samples returned by this input.
   *
   * This container provides iterators to access the data samples retrieved by
   * the most-recent call to ${@link Input.take} and ${@link Input.read}.
   */
  get samples () {
    return this._samples
  }

  /**
   * Wait for this Input to receive data.
   *
   * This methods wait for the specified timeout (or if no timeout is specified, it waits forever),
   * for data to be received.
   * @param {number} [timeout] - The maximum time to wait in milliseconds. By default, infinite.
   * @throws {TimeoutError} The operation timed out before data was received.
   * @returns {Promise}
   */
  wait (timeout) {
    return new Promise((resolve, reject) => {
      if (timeout === undefined) {
        timeout = -1
      } else if (!_isNumber(timeout)) {
        throw new TypeError('timeout must be a number')
      } else if (this.waitsetBusy) {
        throw new Error('Can not concurrently wait on the same Input')
      } else {
        this.waitsetBusy = true
        connectorBinding.api.RTI_Connector_wait_for_data_on_reader.async(
          this.native,
          timeout,
          (err, res) => {
            this.waitsetBusy = false
            if (err) {
              return reject(err)
            } else if (res === _ReturnCodes.ok) {
              return resolve()
            } else if (res === _ReturnCodes.timeout) {
              return reject(new TimeoutError('Timeout error'))
            } else {
              return reject(new DDSError('DDS error'))
            }
          }
        )
      }
    })
  }

  /**
   * Wait for this Input to match or unmatch a compatible DDS Subscription.
   *
   * This methods wait for the specified timeout (or if no timeout is specified, it waits forever),
   * for a match (or unmatch) to occur.
   * @param {number} [timeout] - The maximum time to wait in milliseconds. By default, infinite.
   * @throws {TimeoutError} The operation timed out before data was received.
   * @returns {Promise} Promise object resolving with the change in the current number of matched outputs. If this is a positive number, the input has matched with new publishers. If it is negative, the input has unmatched from an output. It is possible for multiple matches and/or unmatches to be returned (e.g., 0 could be returned, indicating that the input matched the same number of outputs as it unmatched).
   */
  waitForPublications (timeout) {
    return new Promise((resolve, reject) => {
      if (timeout === undefined) {
        timeout = -1
      } else if (!_isNumber(timeout)) {
        throw new TypeError('timeout must be a number')
      } else if (this.waitsetBusy) {
        throw new Error('Can not concurrently wait on the same Input')
      } else {
        this.waitsetBusy = true
        const currentChangeCount = ref.alloc('int')
        connectorBinding.api.RTI_Connector_wait_for_matched_publication.async(
          this.native,
          timeout,
          currentChangeCount,
          (err, res) => {
            this.waitsetBusy = false
            if (err) {
              return reject(err)
            } else if (res === _ReturnCodes.ok) {
              return resolve(currentChangeCount.deref())
            } else if (res === _ReturnCodes.timeout) {
              return reject(new TimeoutError('Timeout error'))
            } else {
              return reject(new DDSError('DDS error'))
            }
          }
        )
      }
    })
  }

  /**
   * Returns information about matched publications.
   *
   * This property returns a JSON array with each element of the array containing
   * information about a matched publication.
   *
   * Currently the only information contained in this JSON object is the publication name of
   * the matched publication. If the matched publication doesn't have a name, the
   * name for that specific publication will be null.
   *
   * Note that Connector Outputs are automatically assigned a name from the *data_writer name*
   * element in the XML configuration.
   *
   * @type {JSON}
   */
  get matchedPublications () {
    const cStr = ref.alloc('char *')
    const retcode = connectorBinding.api.RTI_Connector_get_matched_publications(
      this.native,
      cStr)
    _checkRetcode(retcode)
    return JSON.parse(_moveCString(cStr.deref()))
  }
}

/**
 * A data sample.
 *
 * {@link Instance} is the type of {@link Output.instance} and is the object that
 * is published by {@link Output.write}.
 *
 * An Instance has an associated DDS Type, specified in the XML configuration, and
 * it allows setting the values for the fields of the DDS Type.
 *
 * @property {Output} output - The {@link Output} that owns this Instance.
 * @property {pointer} native - The native C pointer to this instace.
 */
class Instance {
  constructor (output) {
    this.output = output
  }

  /**
   * Resets a member to its default value.
   *
   * The effect is the same as that of {@link Output.clearMembers}, except that only
   * one member is cleared.
   * @param {string} fieldName  - The name of the field. It can be a complex member or a primitive member.
   */
  clearMember (fieldName) {
    if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else {
      const retcode = connectorBinding.api.RTI_Connector_clear_member(
        this.output.connector.native,
        this.output.name,
        fieldName)
      _checkRetcode(retcode)
    }
  }

  /**
   * Sets a numeric field.
   *
   * @param {string} fieldName - The name of the field.
   * @param {number} value - A numeric value, or null, to unset an optional member.
   */
  setNumber (fieldName, value) {
    if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else if (!_isNumber(value)) {
      if (value === null) {
        this.clearMember(fieldName)
      } else {
        throw new TypeError('value must be a number')
      }
    } else {
      _checkRetcode(connectorBinding.api.RTI_Connector_set_number_into_samples(
        this.output.connector.native,
        this.output.name,
        fieldName,
        value))
    }
  }

  /**
   * Sets a boolean field.
   *
   * @param {string} fieldName - The name of the field.
   * @param {number} value - A boolean value, or null, to unset an optional member.
   */
  setBoolean (fieldName, value) {
    if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else if (typeof value !== 'boolean') {
      if (value === null) {
        this.clearMember(fieldName)
      } else {
        throw new TypeError('value must be a boolean')
      }
    } else {
      const retcode = connectorBinding.api.RTI_Connector_set_boolean_into_samples(
        this.output.connector.native,
        this.output.name,
        fieldName,
        value)
      _checkRetcode(retcode)
    }
  }

  /**
   * Sets a string field.
   *
   * @param {string} fieldName - The name of the field.
   * @param {number} value - A string  value, or null, to unset an optional member.
   */
  setString (fieldName, value) {
    if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else if (!_isString(value)) {
      if (value === null) {
        this.clearMember(fieldName)
      } else {
        throw new TypeError('value must be a boolean')
      }
    } else {
      const retcode = connectorBinding.api.RTI_Connector_set_string_into_samples(
        this.output.connector.native,
        this.output.name,
        fieldName,
        value)
      _checkRetcode(retcode)
    }
  }

  /**
   * Set the member values speciifed in a JSON object.
   *
   * The keys in the JSON object are the member names of the DDS Type associated with the Output,
   * and the values are the values to set for those members.
   *
   * This method sets the values of those members that are explicitly specified
   * in the JSON object. Any member that is not specified in the JSON object will retain its previous
   * value.
   *
   * To clear members that are not in the JSON object, call {@link Output.clearMembers} before this method.
   * You can also explicitly set any value in the JSON object to *null* to reset that field
   * to its default value.
   *
   * @param {JSON} jsonObj - The JSON object containing the keys (field names) and values (values for the fields)
   */
  setFromJson (jsonObj) {
    _checkRetcode(connectorBinding.api.RTI_Connector_set_json_instance(
      this.output.connector.native,
      this.output.name,
      JSON.stringify(jsonObj)))
  }

  /**
   * Depreacted, use setFromJson.
   *
   * This method is supplied for backwards compatibility.
   * @private
   */
  setFromJSON (jsonObj) {
    this.setFromJson(jsonObj)
  }

  /**
   * The native C object.
   *
   * This property allows accessing additional *Connext DDS* APIs in C.
   * @type {pointer}
   */
  get native () {
    const nativePointer = ref.alloc('pointer')
    const retcode = connectorBinding.api.RTI_Connector_get_native_instance(
      this.output.connector.native,
      this.output.name,
      nativePointer)
    _checkRetcode(retcode)
    return nativePointer.deref()
  }
}

/**
 * Allows writing data for a DDS Topic.
 *
 * @property {Instance} instance - The data that is written when {@link Output.write} is called.
 * @property {Connector} connector - The Connector that created this object.
 * @property {string} name - The name of this Output (the name used in {@link Connector.getOutput})
 * @property {pointer} native - The native handle that allows accessing additional *Connext DDS* APIs in C.
 * @property {JSON} matchedSubscriptions - Information about matched subscriptions.
 *
 * {@link Writing Data (Output)}
 * @todo Check all these links actually work
 */
class Output {
  constructor (connector, name) {
    this.connector = connector
    this.name = name
    this.native = connectorBinding.api.RTI_Connector_get_datawriter(
      this.connector.native,
      this.name)
    if (this.native.isNull()) {
      throw new Error('Invalid Publisher::DataWriter name')
    }
    this.instance = new Instance(this)
    this.waitsetBusy = false
  }

  /**
   * Publishes the values of the current Instance.
   *
   * Note that after writing it, Instance's values remain unchanges. If for the
   * next write you need to start from scratch you must first call {@link Output.clearMembers}.
   *
   * This method accepts a number of optional parameters, a subset of those documented in
   * the {@link https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/Writing_Data.htm?Highlight=DDS_WriteParams_t|Writing Data section of the *Connext DDS Core Libraries* User's Manual.}
   *
   * The support parameters are:
   *
   * @throws {TimeoutError} The write method can block under multiple circumstances (see 'Blocking Duraing a write()' in the *Connext DDS Core Libraries* User's Manual.)
   * If the blocking time exceeds the *max_blocking_time* this method throws {@link TimeoutError}.
   */
  write (params) {
    var cStr
    if (params === undefined) {
      cStr = null
    } else {
      // TODO:
      //       Add docs
      cStr = JSON.stringify(params)
    }
    _checkRetcode(connectorBinding.api.RTI_Connector_write(
      this.connector.native,
      this.name,
      cStr))
  }

  /**
   * Resets the values of the memers of this {@link Output.instance}
   *
   * If the members is defined with *default* attribute in the configuration file, it gets
   * that value. Otherwise, numbers are set to 0 and strings are set to empty. Sequences
   * are cleared and optional members are set to 'null'.
   *
   * For example, if this Output's type is *ShapeType*, then clearMembers sets:
   *  color = 'RED'
   *  shapesize = 30
   *  x = 0
   *  y = 0
   */
  clearMembers () {
    _checkRetcode(connectorBinding.api.RTI_Connector_clear(
      this.connector.native,
      this.name))
  }

  /**
   * Waits until all matching reliable subscriptions have acknowledged all the samples
   * that have currently been written.
   *
   * This method only waits if this Output is configured with a reliable QoS.
   *
   * @param {timeout} [timeout] The maximum time to wait in milliseconds. By default, infinite.
   * @throws {TimeoutError} If the operation times out, it raises {@link TimeoutError}.
   */
  wait (timeout) {
    return new Promise((resolve, reject) => {
      if (timeout === undefined) {
        timeout = -1
      } else if (!_isNumber(timeout)) {
        throw new TypeError('timeout must be a number')
      } else {
        connectorBinding.api.RTI_Connector_wait_for_acknowledgments.async(
          this.native,
          timeout,
          (err, res) => {
            if (err) {
              reject(err)
            }
            _checkRetcode(res)
            resolve()
          }
        )
      }
    })
  }

  /**
   * Wait for this Output to match or unmatch a compatible DDS Publication.
   *
   * This methods wait for the specified timeout (or if no timeout is specified, it waits forever),
   * for a match (or unmatch) to occur.
   * @param {number} [timeout] - The maximum time to wait in milliseconds. By default, infinite.
   * @throws {TimeoutError} The operation timed out before data was received.
   * @returns {Promise} Promise object resolving with the change in the current number of matched inputs. If this is a positive number, the output has matched with new subscribers. If it is negative, the output has unmatched from a subscription. It is possible for multiple matches and/or unmatches to be returned (e.g., 0 could be returned, indicating that the output matched the same number of inputs as it unmatched).
   */
  waitForSubscriptions (timeout) {
    return new Promise((resolve, reject) => {
      if (timeout === undefined) {
        timeout = -1
      } else if (!_isNumber(timeout)) {
        throw new TypeError('timeout must be a number')
      } else if (this.waitsetBusy) {
        throw new Error('Can not concurrently wait on the same Output')
      } else {
        const currentChangeCount = ref.alloc('int')
        this.waitsetBusy = true
        connectorBinding.api.RTI_Connector_wait_for_matched_subscription.async(
          this.native,
          timeout,
          currentChangeCount,
          (err, res) => {
            this.waitsetBusy = false
            if (err) {
              return reject(err)
            } else if (res === _ReturnCodes.ok) {
              return resolve(currentChangeCount.deref())
            } else if (res === _ReturnCodes.timeout) {
              return reject(new TimeoutError('Timeout error'))
            } else {
              return reject(new DDSError('DDS error'))
            }
          }
        )
      }
    })
  }

  /**
   * Returns information about matched subscriptions.
   *
   * This property returns a JSON array with each element of the array containing
   * information about a matched subscription.
   *
   * Currently the only information contained in this JSON object is the subscription name of
   * the matched subscription. If the matched subscription doesn't have a name, the
   * name for that specific subscription will be null.
   *
   * Note that Connector Inputs are automatically assigned a name from the *data_reader name*
   * element in the XML configuration.
   *
   * @type {JSON}
   */
  get matchedSubscriptions () {
    const cStr = ref.alloc('char *')
    const retcode = connectorBinding.api.RTI_Connector_get_matched_subscriptions(
      this.native,
      cStr)
    _checkRetcode(retcode)
    return JSON.parse(_moveCString(cStr.deref()))
  }

  // Deprecated, use clearMembers
  clear_members () { // eslint-disable-line camelcase
    return this.clearMembers()
  }
}

/**
 * Loads a configuration and creates its Inputs and Outputs.
 *
 * A **Connector** instance loads a configuration file from an XML document. For example::
 * const connector = new rti.Connector('MyParticipantLibrary::MyParticipant', 'MyExample.xml')
 *
 * After creating it, the Connector's Inputs can be used to read data, and the Outputs to write data.
 * {@link Connector.getInput}
 * {@link Connector.getInput}
 *
 * An application can create multiple **Connector** instances for the same of different configurations.
 *
 * @param {string} configName - The configuration to load. The configName format is 'LibraryName::ParticipantNAme', where LibraryName is the name attribute of a <domain_participant_library> tag, and ParticipantNAme is the name attribute of a <domain_participant> tag inside that library.
 * @param {string} url - A URL locating the XML document. The url can be a file path (e.g., '/tmp/my_dds_config.xml') or a string containing the full XML document with the following format: 'str://"<dds>...</dds>"
 * @class
 */
class Connector extends EventEmitter {
  constructor (configName, url) {
    super()
    const options = new _ConnectorOptions()
    options.one_based_sequence_indexing = 0
    options.enable_on_data_event = 1
    this.native = connectorBinding.api.RTI_Connector_new(
      configName,
      url,
      options.ref())
    if (this.native.isNull()) {
      throw new Error('Invalid participant profile, xml path or xml profile')
    }
    this.on('newListener', this.newListenerCallBack)
    this.on('removeListener', this.removeListenerCallBack)
    this.onDataAvailableRun = false
  }

  /**
   * Frees al the resources created by this Connector instance.
   */
  close () {
    connectorBinding.api.RTI_Connector_delete(this.native)
  }

  /**
   * Deprecated, use close()
   * @private
   */
  delete () {
    this.close()
  }

  /**
   * Returns the {@link Input} named inputName.
   *
   * 'inputName' identifies a <data_reader> tag in the configuration loaded by the 'Connector'. For Example::
   *
   *   const connector = new rti.Connector('MyParticipantLibrary::MyParticipant', 'MyExample.xml')
   *   connector.getInput('MySubscriber::MyReader')
   *
   * Loads the Input in this XML:
   *
   *   <domain_participant_library name="MyParticipantLibrary">
   *     <domain_participant name="MyParticipant" domain_ref="MyDomainLibrary::MyDomain">
   *       <subscriber name="MySubscriber">
   *         <data_reader name="MyReader" topic_ref="MyTopic"/>
   *         ...
   *       </subscriber>
   *       ...
   *     </domain_participant>
   *     ...
   *   <domain_participant_library>
   *
   * @param {string} inputName - The name of the data_reader to load. With the format 'SubscriberName::DataReaderName'
   * @returns {Input} The Input, if it exists.
   */
  getInput (inputName) {
    return new Input(this, inputName)
  }

  /**
   * Returns the {@link Output} named outputName.
   *
   * 'outputName' identifies a <data_writer> tag in the configuration loaded by the 'Connector'. For Example::
   *
   *   const connector = new rti.Connector('MyParticipantLibrary::MyParticipant', 'MyExample.xml')
   *   connector.getOutput('MyPublisher::MyWriter')
   *
   * Loads the Input in this XML:
   *
   *   <domain_participant_library name="MyParticipantLibrary">
   *     <domain_participant name="MyParticipant" domain_ref="MyDomainLibrary::MyDomain">
   *       <publisher name="MyPublisher">
   *         <data_writer name="MyWriter" topic_ref="MyTopic"/>
   *         ...
   *       </publisher>
   *       ...
   *     </domain_participant>
   *     ...
   *   <domain_participant_library>
   *
   * @param {string} outputName - The name of the data_writer to load. With the format 'PublisherName::DataWriterName'
   * @returns {Output} The Output, if it exists.
   */
  getOutput (outputName) {
    return new Output(this, outputName)
  }

  /**
   * This is deprecated. Use waitForData.
   * @private
   */
  onDataAvailable () {
    // No need to cache return value. When using .async() the result
    // is passed as 'res' to the callback function.
    connectorBinding.api.RTI_Connector_wait_for_data.async(
      this.native,
      1000,
      (err, res) => {
        if (err) throw err
        // Since ffi async functoins are not cancellable (https://github.com/node-ffi/node-ffi/issues/413)
        // we call this in a loop (and therefore expect to receive timeout error)
        // for this reason do not raise a timeout exception
        if (res !== _ReturnCodes.timeout) {
          _checkRetcode(res)
        }
        if (this.onDataAvailableRun) {
          this.onDataAvailable()
        }
        // Emitting this from the EventEmitter will trigger the callback created
        // by the user
        if (res === _ReturnCodes.ok) {
          this.emit('on_data_available')
        }
      }
    )
  }

  // This callback was added for the 'newListener' event, meaning it is triggered
  // just before we add a new callback.
  // Since the onDataAvailable() function above is using an asynchronous function
  // and the Connector binding is not thread-safe we have to ensure it is not
  // called concurrently
  /**
   * @private
   */
  newListenerCallBack (eventName, functionListener) {
    if (eventName === 'on_data_available') {
      if (this.onDataAvailableRun === false) {
        this.onDataAvailableRun = true
        this.onDataAvailable()
      }
    }
  }

  /**
   * @private
   */
  removeListenerCallBack (eventName, functionListener) {
    if (this.listenerCount(eventName) === 0) {
      this.onDataAvailableRun = false
    }
  }

  /**
   * Waits for data to be received on any Input.
   *
   * @param {number} timeout - The maximum time to wait in milliseconds. By default, infinite.
   * @throws {TimeoutError} If the operation times out, it raises {@link TimeoutError}
   * @returns {Promise}
   */
  waitForData (timeout) {
    return new Promise((resolve, reject) => {
      // timeout is defaulted to -1 (infinite) if not supplied
      if (timeout === undefined) {
        timeout = -1
      } else if (!_isNumber(timeout)) {
        throw new TypeError('timeout must be a number')
      } else if (this.onDataAvailableRun) {
        throw new Error('Can not concurrently wait on the same Connector object')
      }
      this.onDataAvailableRun = true
      connectorBinding.api.RTI_Connector_wait_for_data.async(
        this.native,
        timeout,
        (err, res) => {
          this.onDataAvailableRun = false
          if (err) {
            return reject(err)
          } else if (res === _ReturnCodes.ok) {
            return resolve()
          } else if (res === _ReturnCodes.timeout) {
            return reject(new TimeoutError('Timeout error'))
          } else {
            return reject(new DDSError('DDS error'))
          }
        })
    })
  }

  /**
   * Allows increasing the number of Connector instances that can be created.
   *
   * The default value is 1024 (which allows for approximately 8 instances of Connector
   * to be created in a single application). If you need to create more than 8
   * instances of Connector you can increase the value from the default.
   *
   * This operation can only be called before creating any Connector instance.
   *
   * See {@link https://community.rti.com/static/documentation/connext-dds/6.0.0/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/SYSTEM_RESOURCE_LIMITS_QoS.htm|SYSTEM_RESOURCE_LIMITS QoS policy}
   * in the *RTI Connext DDS* User's Manual.
   *
   * @param {number} value - the value for *max_objects_per_thread*
   */
  static setMaxObjectsPerThread (value) {
    _checkRetcode(connectorBinding.api.RTI_Connector_set_max_objects_per_thread(value))
  }
}

// Export the API
module.exports.Connector = Connector
// Export the binding, so that the customer has access to the library if desired
module.exports.connectorBinding = connectorBinding
// Export the Error types so the customer can handle them explicitly
module.exports.TimeoutError = TimeoutError
module.exports.DDSError = DDSError

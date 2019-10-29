lass/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const os = require('os')
const ref = require('ref')
const ffi = require('ffi')
const path = require('path')
const StructType = require('ref-struct')
const EventEmitter = require('events').EventEmitter

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

    // Obtain th ename of the library which contains the Connector binding
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
    // Obtain FFI'd methods for all of the APIs which we require from the binding
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
      RTI_Connector_set_max_objects_per_thread: ['int', ['int']],
      // This API is only used in the unit tests
      RTI_Connector_create_test_scenario: ['int', ['pointer', 'int', 'pointer']]
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
 */
class TimeoutError extends Error {
  /**
   * This error is thrown when blocking errors timeout.
   * @private
   */
  constructor (message, extra) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.message = message
    this.extra = extra
  }
}

/**
 * An error originating from the RTI Connext DDS Core
 */
class DDSError extends Error {
  /**
   * This error is thrown when an error is encountered from within one of the APIs
   * within the RTI Connext DDS Core.
   * @private
   */
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
 * We do not handle DDS_RETCODE_NO_DATA here since in some operations (those
 * related with optional members) we need to handle it separately.
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
 *
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
    // Try to convert the returned string to a JSON object. We can now return
    // one of two things:
    // - An actual string (if the JSON.parse call fails)
    // - A JSON object (if the JSON.parse call succeeds)
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

/**
 * Provide access to the metadata contained in samples read by an input.
 *
 * Note: The Infos class is deprecated and should not be used directly. Instead,
 * use :meth:`SampleIterator.info`.
 *
 * @private
 */
class Infos {
  constructor (input) {
    this.input = input
  }

  /**
   * Obtain the number of samples in the related :class:`Input`'s queue.
   * @private
   */
  getLength () {
    const length = ref.alloc('double')
    const retcode = connectorBinding.api.RTI_Connector_get_sample_count(
      this.input.connector.native,
      this.input.name,
      length)
    _checkRetcode(retcode)
    return length.deref()
  }

  /**
   * Checks if the sample at the given index contains valid data.
   *
   * @param {number} index - The index of the sample in the :class:`Input`'s queue
   * to check for valid data.
   * @returns{boolean} True if the sample contains valid data
   * @private
   */
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
 * Iterates and provides access to a data sample.
 */
class SampleIterator {
  /**
   * A SampleIterator provides access to the data receieved by an :class:`Input`.
   *
   * The :attr:`Input.samples` attribute implements a :class:`SampleIterator`, meaning
   * it can be iterated over. An individual sample can be accessed using :meth:`Input.samples.get`.
   *
   * See :class:`ValidSampleIterator`.
   *
   * This class provides both an iterator and iterable, and is internally used
   * by the :class:`Samples` class. The following options to iterate over the samples
   * exist::
   *
   *   // option 1 - The iterable can be used in for...of loops
   *   for (const sample of input.samples)
   *   // option 2 - Returns an inidivudal sample at the given index
   *   const individualSample = input.samples.get(0)
   *   // option 3 - Returns a generator which much be incremented by the application
   *   const iterator = input.samples.iterator()
   *
   * @property {boolean} validData - Whether or not the current sample contains valid data.
   * @property {SampleInfo} infos - The meta data associated with the current sample.
   * @property {pointer} native - A native handle that allows accessing additional *Connext DDS* APIs in C.
   */
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
   * If ``false``, this methods to obtain values of the samples (e.g., :meth:`SampleIterator.getNumber`,
   * :meth:`SampleIterator.getBoolean`, :meth:`SampleIterator.getJson`, :meth:`SampleIterator.getString`)
   * should not be called. To avoid this restraint, use an :class:`ValidSampleIterator`.
   * @type {boolean}
   */
  get validData () {
    return !!this.input.infos.isValid(this.index)
  }

  /**
   * Provides access to this sample's meta-data.
   *
   * The ``info`` property expects one of the :class:`SampleInfo` field names::
   *
   *   const value = sample.info.get('field')
   *
   * The support field names are:
   *
   * * ``'source_timestamp'``, returns an integer representing nanoseconds
   * * ``'reception_timestamp'``, returns an integer representing nanoseconds
   * * ``'sample_identity'`` or ``'identity'``, returns a JSON object (see :meth:`Output.write`)
   * * ``'related_sample_identity'``, returns a JSON object (see :meth:`Output.write`)
   * * ``'valid_data'``, returns a boolean (equivalent to :attr:`SampleIterator.validData`)
   *
   * These fields are documented in `The SampleInfo Structure <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/The_SampleInfo_Structure.htm#7.4.6_The_SampleInfo_Structure%3FTocPath%3DPart%25202%253A%2520Core%2520Concepts%7C7.%2520Receiving%2520Data%7C7.4%2520Using%2520DataReaders%2520to%2520Access%2520Data%2520(Read%2520%2526%2520Take)%7C7.4.6%2520The%2520SampleInfo%2520Structure%7C_____0>`__
   * section in the *Connext DDS Core Libraries User's Manual*.
   *
   * See :class:`SampleInfo`
   */
  get info () {
    return new SampleInfo(this.input, this.index)
  }

  /**
   * Returns a JSON object with the values of all the fields of this sample.
   *
   * see :ref:`Accessing the data samples`.
   *
   * @param {string} [memberName] - The name of the complex member or field to obtain.
   * @returns {JSON} The obtained JSON object.
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
    const ret = this.input.samples.getBoolean(this.index, fieldName)
    // Performing !! on null produces false, but we want to maintain null
    if (ret === null) {
      return ret
    } else {
      // For legacy reasons, Samples.getBoolean returns a number, convert that to
      // a bool here
      return !!ret
    }
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
  get (fieldName) {
    return this.input.samples.getValue(this.index, fieldName)
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
   * The iterator generator (used by the iterable).
   *
   * This generator is used internally by the iterable.
   * A public generator is provided :meth:`Samples.iterator`.
   *
   * @private
   */
  * iterator () {
    while ((this.index + 1) < this.length) {
      this.index += 1
      yield this
    }
  }

  /**
   * Implementation of iterable logic. This allows for the following syntax::
   *   for (const sample of input.samples) {
   *    json = sample.getJson()
   *   }
   */
  [Symbol.iterator] () {
    return this.iterator()
  }
}

/**
 * Iterates and provides access to data samples with valid data.
 *
 * This iterator provides the same methods as :class:`SampleIterator`. It can be
 * obtained using :attr:`Input.samples.validDataIter`.
 * @extends SampleIterator
 *
 * Using this class it is possible to iterator through all valid data samples::
 *   for (let sample of input.samples.validDataIter) {
 *    console.log(JSON.stringify(sample.getJson()))
 *   }
 */
class ValidSampleIterator extends SampleIterator {
  /**
   * The iterator generator (used by the iterable).
   *
   * Using this method it is possible to create your own iterable::
   *
   *  const iterator = input.samples.validDataIter.iterator()
   *  const singleSample = iterator.next().value
   *
   * @generator
   * @yields {ValidSampleIterator} The next sample in the queue with valid data
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
 * Provide access to the data samples read by an :class:`Input`.
 */
class Samples {
  /**
   * This class provides access to data samples read by an :class:`Input` (using either
   * the :meth:`Input.read` or :meth:`Input.take` methods).
   *
   * This class implements a ``[Symbol.iterator]()`` method, making it an iterable.
   * This allows for it to be used in ``for... of`` loops, to iterate through
   * available samples::
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
   * iterable only iterates over samples that contain valid data (a :class:`ValidSampleIterator`).
   *
   * :class:`Samples` and :class:`ValidSampleIterator` both also provide generators to
   * the samples, allowing application to define their own iterables (see :meth:`Samples.iterator()` and
   * :meth:`ValidSampleIterator.iterator()`).
   *
   * ``Samples`` is the type of the property :meth:`Input.samples`.
   *
   * For more information and examples see :ref:`Accessing the data samples`.
   *
   * Attributes:
   *  * length (number) - The number of samples available since the last time :meth:`Input.read` or :meth:`Input.take` was called.
   *  * validDataIter (:class:`ValidSampleIterator`) - The class used to iterate through the available samples which have valid data.
   */
  constructor (input) {
    this.input = input
  }

  /**
   * Returns an iterator to the data samples, starting at the index specified.
   *
   * The iterator provides access to all the data samples retrieved by the most
   * recent call to :meth:`Input.read` or :meth:`Input.take`.
   *
   * This iterator may return samples with invalid data (samples that only contain
   * meta-data).
   * Use :attr:`Samples.validDataIter` to avoid having to check :attr:`SampleIterator.validData`.
   *
   * @param {number} [index] The index of the sample from which the iteration should begin. By default, the iterator begins with the first sample.
   *
   * @returns :class:`SampleIterator` - An iterator to the samples (which implements both iterable and iterator logic).
   */
  get (index) {
    return new SampleIterator(this.input, index)
  }

  /**
   * Returns an iterable, allowing the samples to be accessed using a for...of loop.
   *
   * The iterable provides access to all the data samples retrieved by the most
   * recent call to :meth:`Input.read` or :meth:`Input.take`.
   *
   * This iterable may return samples with invalid data (samples that only contain
   * meta-data).
   * Use :attr:`Samples.validDataIter` to avoid having to check :attr:`SampleIterator.validData`.
   *
   * Allows for the following syntax::
   *
   *    for (const sample of input.samples) {
   *      // ..
   *    }
   *
   * @returns :class:`SampleIterator` An iterator to the samples.
   */
  [Symbol.iterator] () {
    const iterable = new SampleIterator(this.input)
    return iterable.iterator()
  }

  /**
   * The iterator generator (used by the iterable).
   *
   * This method returns a generator, which must be incremented manually by the
   * application (using the iterator.next() method).
   *
   * Once incremented, the data can be accessed via the ``.value`` attribute.
   * Once no more samples are available, the ``.done`` attribute will be true.
   *
   * Using this method it is possible to create your own iterable::
   *
   *   const iterator = input.samples.iterator()
   *   const singleSample = iterator.next().value
   *
   * @generator
   * @yields {SampleIterator} The next sample in the queue
   */
  * iterator () {
    const iterator = new SampleIterator(this.input)
    while ((iterator.index + 1) < iterator.length) {
      iterator.index += 1
      yield iterator
    }
  }

  /**
   * Returns an iterator to the data samples which contain valid data.
   *
   * The iterator provides access to all the data samples retrieved by the most
   * recent call to :meth:`Input.read` or :meth:`Input.take`, and skips samples with
   * invalid data (meta-data only).
   *
   * By using this iterator, it is not necessary to check if each sample contains
   * valid data.
   *
   * @returns {ValidSampleIterator} An iterator to the sample containing valid data (which implements both iterable and iterator logic).
   */
  get validDataIter () {
    return new ValidSampleIterator(this.input)
  }

  /**
   * The number of samples available.
   */
  get length () {
    return this.input.samples.getLength()
  }

  /**
   * Returns the number of samples available.
   *
   * This methos is deprecated , use the getter :meth:`Samples.length`
   * @private
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

  /**
   * Obtain the value of a numeric field within this sample.
   *
   * See :ref:`Accessing the data samples`.
   *
   * @param {number} index The index of the sample.
   * @param {string} fieldName The name of the field.
   * @returns {number} The obtained value.
   */
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

  /**
   * Obtain the value of a boolean field within this sample.
   *
   * See :ref:`Accessing the data samples`.
   *
   * @param {number} index The index of the sample.
   * @param {string} fieldName The name of the field.
   * @returns {number} The obtained value.
   */
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
        return value.deref()
      }
    }
  }

  /**
   * Obtain the value of a string field within this sample
   *
   * See :ref:`Accessing the data samples`.
   *
   * @param {number} index The index of the sample
   * @param {string} fieldName The name of the field
   * @returns {string} The obtained value.
   */
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

  /**
   * Get the value of a field within this sample.
   *
   * See :ref:`Accessing the data samples`.
   *
   * This API can be used to obtain strings, numbers, booleans and the JSON
   * reprentation of complex members.
   *
   * @param {string} fieldName - The name of the field.
   * @returns {number|string|boolean|JSON} The value of the field.
   */
  getValue (index, fieldName) {
    if (!_isValidIndex(index)) {
      throw new TypeError('index must be an integer')
    } else if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else {
      return _getAnyValue(
        connectorBinding.api.RTI_Connector_get_any_from_sample,
        this.input.connector.native,
        this.input.name,
        index,
        fieldName)
    }
  }

  /**
   * Gets a JSON object with the values of all the fields of this sample.
   *
   * @param {number} index The index of the sample.
   * @param {string} [memberName] The name of the complex member. The type of the member with name memberName must be an array, sequence, struct, value or union.
   * @returns {JSON} The obtained JSON object.
   *
   * See :ref:`Accessing the data samples`.
   */
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

  /**
   * Obtains a native handle to the sample, which can be used to access additional *Connext DDS* APIs in C.
   *
   * @param {number} index The index of the sample for which to obtain the native pointer
   * @returns {pointer} A native pointer to the sample.
   */
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

  /**
   * This method is deprecated, use :meth:`Samples.getJson`.
   *
   * @param {number} index - The index of the sample for which to obtain the JSON object.
   * @param {string} [memberName] - The name of the complex member for which to obtain the JSON object.
   * @returns {JSON} A JSON object representing the current sample
   * @private
   */
  getJSON (index, memberName) {
    return this.getJson(index, memberName)
  }
}

/**
 * The type returned by the property :meth:`SampleIterator.info`.
 */
class SampleInfo {
  /**
   * This class provides a way to access the SampleInfo of a recieved data sample.
   */
  constructor (input, index) {
    this.input = input
    this.index = index
  }

  /**
   * Type independent function to obtain any value from the SampleInfo structure.
   *
   * The support fieldNames are:
   *
   * * ``'source_timestamp'``, returns an integer representing nanoseconds
   * * ``'reception_timestamp'``, returns an integer representing nanoseconds
   * * ``'sample_identity'`` or ``'identity'``, returns a JSON object (see :meth:`Output.write`)
   * * ``'related_sample_identity'``, returns a JSON object (see :meth:`Output.write`)
   * * ``'valid_data'``, returns a boolean (equivalent to :attr:`SampleIterator.validData`)
   *
   * These fields are documented in `The SampleInfo Structure <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/The_SampleInfo_Structure.htm#7.4.6_The_SampleInfo_Structure%3FTocPath%3DPart%25202%253A%2520Core%2520Concepts%7C7.%2520Receiving%2520Data%7C7.4%2520Using%2520DataReaders%2520to%2520Access%2520Data%2520(Read%2520%2526%2520Take)%7C7.4.6%2520The%2520SampleInfo%2520Structure%7C_____0>`__
   * section in the *Connext DDS Core Libraries User's Manual*.
   *
   * @param {string} fieldName - The name of the ``SampleInfo`` field to obtain
   * @returns The obtained value from the ``SampleInfo`` structure
   * @example const source_timestamp = input.samples.get(0).info.get('source_timestamp')
   */
  get (fieldName) {
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
 * Allows reading data for a DDS Topic.
 */
class Input extends EventEmitter {
  /**
   * This class is used to subscribe to a specific DDS Topic.
   *
   * To get an Input object, use :meth:`Connector.getInput`.
   *
   * Attributes:
   *  * connector (:class:`Connector`) - The Connector creates this Input.
   *  * name (string) - The name of the Input (the name used in :meth:`Connector.getInput`).
   *  * native (pointer) - A native handle that allows accessing additional *Connext DDS* APIs in C.
   *  * matchedPublications (JSON) - A JSON object containing information about all the publications currently matched with this Input.
   */
  constructor (connector, name) {
    super()
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
    this.waitSetBusy = false
    this.onDataAvailableRun = false
    this.on('newListener', this.newListenerCallBack)
    this.on('removeListener', this.removeListenerCallBack)
  }

  /**
   * Access the samples received by this Input.
   *
   * This operation performs the same operation as :meth:`Input.take` but the samples
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
   * After calling this method, the samples are accessible using :meth:`Input.samples`.
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
   * the most-recent call to :meth:`Input.take` and :meth:`Input.read`.
   *
   * @type {Samples}
   */
  get samples () {
    return this._samples
  }

  /**
   * Wait for this Input to receive data.
   *
   * .. note::
   *   This operation is asynchronous.
   *
   * @param {number} [timeout] The maximum time to wait in milliseconds. By default, infinite.
   * @throws {TimeoutError} :class:`TimeoutError` will be thrown if the timeout expires before data is received
   * @returns {Promise} A ``Promise`` which will be resolved once data is available, or rejected if the timeout expires
   */
  wait (timeout) {
    return new Promise((resolve, reject) => {
      // timeout is defaulted to -1 (infinite) if not supplied
      if (timeout === undefined) {
        timeout = -1
      } else if (!_isNumber(timeout)) {
        throw new TypeError('timeout must be a number')
      }
      if (this.waitSetBusy) {
        throw new Error('Can not concurrently wait on the same Input')
      } else {
        this.waitSetBusy = true
        connectorBinding.api.RTI_Connector_wait_for_data_on_reader.async(
          this.native,
          timeout,
          (err, res) => {
            this.waitSetBusy = false
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
      }
    })
  }

  /**
   * Wait for this Input to match or unmatch a compatible DDS Subscription.
   *
   * .. note::
   *   This operation is asynchronous.
   *
   * This methods wait for the specified timeout (or if no timeout is specified, it waits forever),
   * for a match (or unmatch) to occur.
   * @param {number} [timeout] The maximum time to wait in milliseconds. By default, infinite.
   * @throws {TimeoutError} :class:`TimeoutError` will be thrown if the timeout expires before any publications are matched
   * @returns {Promise} Promise object resolving with the change in the current number of matched outputs. If this is a positive number, the input has matched with new publishers. If it is negative, the input has unmatched from an output. It is possible for multiple matches and/or unmatches to be returned (e.g., 0 could be returned, indicating that the input matched the same number of outputs as it unmatched).
   */
  waitForPublications (timeout) {
    return new Promise((resolve, reject) => {
      if (timeout === undefined) {
        timeout = -1
      } else if (!_isNumber(timeout)) {
        throw new TypeError('timeout must be a number')
      }
      if (this.waitSetBusy) {
        throw new Error('Can not concurrently wait on the same Input')
      } else {
        this.waitSetBusy = true
        const currentChangeCount = ref.alloc('int')
        connectorBinding.api.RTI_Connector_wait_for_matched_publication.async(
          this.native,
          timeout,
          currentChangeCount,
          (err, res) => {
            this.waitSetBusy = false
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

  /**
   * Emits the 'on_data_available' event when new data is available on this Input.
   *
   * .. note::
   *   This operation is asynchronous
   *
   * This API is used internally to emit the 'on_data_available' event when data is
   * received on this Input.
   *
   * The Input class extends EventEmitter, meaning that callbacks can be
   * registered for specific events using the following syntax:
   *
   * .. code-block:: javascript
   *
   *    function myCallback() {
   *      input.take()
   *      for (const sample of input.samples) {
   *        // do something with the data
   *      }
   *    }
   *    input.on('on_data_available', myCallback)
   *    // ...
   *    input.off('on_data_available', myCallback)
   *
   * @private
   */
  onDataAvailable () {
    // FFI async calls cannot be cancelled. For this reason we provide a timeout of 1s.
    // This way, we wake up every second and check if this listener is still installed.
    this.wait(1000)
      .then(() => {
        // Ensure that the entity was not deleted whilst we were waiting
        if (this.native !== null) {
          // Emit the requested event
          this.emit('on_data_available')
          // If still requested, restart the wait
          if (this.onDataAvailableRun) {
            this.onDataAvailable()
          }
        }
      })
      .catch((err) => {
        // If no data was received within one second, the operation will timeout
        // This should not be treated as an error.
        if (!(err instanceof TimeoutError)) {
          console.log('Caught error: ' + err)
          throw err
        } else if (this.onDataAvailableRun) {
          // Only restart the wait if we timed out
          this.onDataAvailable()
        }
      })
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
      if (eventName === 'on_data_available') {
        this.onDataAvailableRun = false
        // Ideally we would cancel the async ffi call here but it is not possible
      }
    }
  }
}

class Instance {
  /**
   * A data sample.
   *
   * :class:`Instance` is the type obtained through ``Output.instance`` and is the object that
   * is published by :meth:`Output.write`.
   *
   * An Instance has an associated DDS Type, specified in the XML configuration, and
   * it allows setting the values for the fields of the DDS Type.
   *
   * Attributes:
   *  * ``output`` (:class:`Output`) - The :class:`Output` that owns this Instance.
   *  * ``native`` (pointer) - Native handle to this Instance that allows for additional *Connext DDS Pro* C APIs to be called.
   */
  constructor (output) {
    this.output = output
  }

  /**
   * Resets a member to its default value.
   *
   * The effect is the same as that of :meth:`Output.clearMembers`, except that only
   * one member is cleared.
   * @param {string} fieldName The name of the field. It can be a complex member or a primitive member.
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
   * @param {boolean} value - A boolean value, or null, to unset an optional member.
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
   * To clear members that are not in the JSON object, call :meth:`Output.clearMembers` before this method.
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
   * Sets the value of fieldName
   *
   * The type of the argument ``value`` must correspond with the type of the field
   * with name ``fieldName`` (as defined in the configuration XML file).
   *
   * This method is an alternative to :meth:`Instance.setNumber`, :meth:`Instance.setString`
   * and :meth:`Instance.setBoolean`. The main difference is that it is type-independent (in
   * that the same method can be used for all fields).
   *
   * @param {string} fieldName The name of the field.
   * @param {number|boolean|string|null} value The value to set. Note that ``null`` is used to unset an optional member.
   */
  set (fieldName, value) {
    if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    }
    if (_isNumber(value)) {
      this.setNumber(fieldName, value)
    } else if (_isString(value)) {
      this.setString(fieldName, value)
    } else if (typeof value === 'boolean') {
      this.setBoolean(fieldName, value)
    } else if (typeof value === 'object') {
      // We need to use computed property names to set use the variable 'fieldName'
      // as the key in a JSON object
      const json = { }
      json[fieldName] = value
      this.setFromJson(json)
    } else if (value === null) {
      this.clearMember(fieldName)
    } else {
      throw new TypeError('value must be one of string, number, boolean, object or null')
    }
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
 */
class Output {
  /**
   * This class is used to publish data for a DDS Topic.
   * To get an Output object, use :meth:`Connector.getOutput`.
   *
   * Attributes:
   *  * ``instance`` (:class:`Instance`) - The data that is written when :meth:`Output.write` is called.
   *  * ``connector`` (:class:`Connector`) - The Connector that created this object.
   *  * ``name`` (str) - The name of this Output (the name used in :meth:`Connector.getOutput`).
   *  * ``native`` (pointer) - The native handle that allows accessing additional *Connext DDS* APIs in C.
   *  * ``matchedSubscriptions`` (JSON) - Information about matched subscriptions (see below).
   *
   */
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
   * next write you need to start from scratch you must first call :meth:`Output.clearMembers`.
   *
   * This method accepts an optional JSON object as a parameter, that may specify the
   * parameters to use in the `write` call.
   * The supported parameters are a subset of those documented in the `Writing Data section <https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/Writing_Data.htm?Highlight=DDS_WriteParams_t>`__
   * of the *Connext DDS Core Libraries* User's Manual. These are:
   *
   * * ``action`` – One of ``'write'`` (default), ``'dispose'`` or ``'unregister'``
   * * ``source_timestamp`` – An integer representing the total number of nanoseconds
   * * ``identity`` – A JSON object containing the fields ``'writer_guid'`` and ``'sequence_number'``
   * * ``related_sample_identity`` – Used for request-reply communications. It has the same format as identity
   *
   * @example output.write({ action: 'write', identity: { writer_guid: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], sequence_number: 1 } })
   *
   * @param {JSON} [params] [Optional] The Write Parameters to use in the `write` call. Filled in by Connector by default.
   * @throws {TimeoutError} The write method can block under multiple circumstances (see 'Blocking During a write()' in the *Connext DDS Core Libraries* User's Manual.)
   * If the blocking time exceeds the *max_blocking_time* this method throws :class:`TimeoutError`.
   */
  write (params) {
    var cStr
    if (params === undefined) {
      cStr = null
    } else {
      cStr = JSON.stringify(params)
    }
    _checkRetcode(connectorBinding.api.RTI_Connector_write(
      this.connector.native,
      this.name,
      cStr))
  }

  /**
   * Resets the values of the memers of this :class:`Instance`.
   *
   * If the members is defined with *default* attribute in the configuration file, it gets
   * that value. Otherwise, numbers are set to 0 and strings are set to empty. Sequences
   * are cleared and optional members are set to 'null'.
   * For example, if this Output's type is *ShapeType*, then clearMembers sets::
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
   * .. note::
   *   This operation is asynchronous
   *
   * @param {timeout} [timeout] The maximum time to wait in milliseconds. By default, infinite.
   * @throws {TimeoutError} :class:`TimeoutError` will be thrown if the timeout expires before all matching reliable subscriptions acknowledge all the samples.
   * @returns {Promise} Promise object which will be rejected if not all matching reliable subscriptions acknowledge all of the samples within the specified timeout.
   */
  wait (timeout) {
    return new Promise((resolve, reject) => {
      if (timeout === undefined) {
        timeout = -1
      } else if (!_isNumber(timeout)) {
        throw new TypeError('timeout must be a number')
      }
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
    })
  }

  /**
   * Wait for this Output to match or unmatch a compatible DDS Publication.
   *
   * This methods wait for the specified timeout (or if no timeout is specified, it waits forever),
   * for a match (or unmatch) to occur.
   *
   * .. note::
   *   This operation is asynchronous
   *
   * @param {number} [timeout] - The maximum time to wait in milliseconds. By default, infinite.
   * @throws {TimeoutError} :class:`TimeoutError` will be thrown if the timeout expires before a subscription is matched
   * @returns {Promise} Promise object resolving with the change in the current number of matched inputs. If this is a positive number, the output has matched with new subscribers. If it is negative, the output has unmatched from a subscription. It is possible for multiple matches and/or unmatches to be returned (e.g., 0 could be returned, indicating that the output matched the same number of inputs as it unmatched).
   */
  waitForSubscriptions (timeout) {
    return new Promise((resolve, reject) => {
      if (timeout === undefined) {
        timeout = -1
      } else if (!_isNumber(timeout)) {
        throw new TypeError('timeout must be a number')
      }
      if (this.waitsetBusy) {
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
   * Provides information about matched subscriptions.
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
 * A **Connector** instance loads a configuration file from an XML document.
 * For example::
 *   const connector = new rti.Connector('MyParticipantLibrary::MyParticipant', 'MyExample.xml')
 *
 * After creating it, the Connector's Inputs can be used to read data, and the Outputs to write data.
 * The methods :meth:`Connector.getOutput` and :meth:`Connector.getInput` return an :class:`Input` and
 * :class:`Output` respectively.
 *
 * An application can create multiple **Connector** instances for the same or different configurations.
 */
class Connector extends EventEmitter {
  /**
   * @arg {string} configName The configuration to load. The configName format is `LibraryName::ParticipantName`, where LibraryName is the name attribute of a <domain_participant_library> tag, and ParticipantName is the name attribute of a <domain_participant> tag within that library.
   * @arg {string} url A URL locating the XML document. The url can be a file path (e.g., `/tmp/my_dds_config.xml`) or a string containing the full XML document with the following format: `str://"<dds>...</dds>"`.
   */
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
    this.waitSetBusy = false
  }

  /**
   * Frees all the resources created by this Connector instance.
   */
  close () {
    // First removeAllListeners('on_data_available')
    // Wait until we are sure that waitSetBusy && onDataAvailableRun are false
    if (this.waitSetBusy) {
      this.removeAllListeners('on_data_available')
      setTimeout(this.close(), 100) // maybe this is closeImpl
    } else {
      connectorBinding.api.RTI_Connector_delete(this.native)
      this.native = null
      // notify user by resolving a promise?
    }
    // return new Promise (resolve, reject) which resolves when 
  }

  /**
   * Deprecated, use close()
   * @private
   */
  delete () {
    this.close()
    this.native = null
  }

  /**
   * Returns the :class:`Input` named inputName.
   *
   * ``inputName`` identifies a `<data_reader>` tag in the configuration loaded by the :class:`Connector`. For Example::
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
   * @param {string} inputName The name of the `data_reader` to load. With the format `SubscriberName::DataReaderName`
   * @returns {Input} The Input, if it exists.
   */
  getInput (inputName) {
    return new Input(this, inputName)
  }

  /**
   * Returns the :class:`Output` named outputName.
   *
   * ``outputName`` identifies a <data_writer> tag in the configuration loaded by the :class:`Connector`. For Example::
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
   * @param {string} outputName The name of the data_writer to load. With the format `PublisherName::DataWriterName`
   * @returns {Output} The Output, if it exists.
   */
  getOutput (outputName) {
    return new Output(this, outputName)
  }

  /**
   * Emits the 'on_data_available' event when any Inputs within this Connector object
   * receive data.
   *
   * .. note::
   *   This operation is asynchronous
   *
   * This API is used internally to emit the 'on_data_available' event when data is
   * received on any of the Inputs contained within this Connector object.
   *
   * The Connector class extends EventEmitter, meaning that callbacks can be
   * registered for specific events using the following syntax:
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
   * @private
   */
  onDataAvailable () {
    // Asynic FFI calls are not cancellable, so we wake up every second to check that
    // this event is still requested
    this.waitForData(1000)
      .then(() => {
        // Ensure that this entity has not been deleted
        if (this.native !== null) {
          // Emit the on_data_available event (envoking the registered callback)
          this.emit('on_data_available')
          // If the listener is still installed, do it all again
          if (this.onDataAvailableRun) {
            this.onDataAvailable()
          }
        }
      })
      .catch((err) => {
        // Since we wake up every 1s, do not treat timeout error as anything
        // significant - just wait again
        if (!(err instanceof TimeoutError)) {
          console.log('Caught error: ' + err)
          this.emit('error', err)
        } else if (this.onDataAvailableRun) {
          this.onDataAvailable()
        }
      })
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
      if (eventName === 'on_data_available' && this.onDataAvailableRun) {
        // Ideally we would cancel the async ffi call here but it is not possible
        this.onDataAvailableRun = false
      }
    }
  }

  /**
   * Waits for data to be received on any Input.
   *
   * .. note::
   *   This operation is asynchronous.
   *
   * @param {number} timeout The maximum time to wait in milliseconds. By default, infinite.
   * @throws {TimeoutError} :class:`TimeoutError` will be thrown if the timeout expires before data is received
   * @returns {Promise} A ``Promise`` which will be resolved once data is available, or rejected once the timeout expires
   */
  waitForData (timeout) {
    return new Promise((resolve, reject) => {
      // timeout is defaulted to -1 (infinite) if not supplied
      if (timeout === undefined) {
        timeout = -1
      } else if (!_isNumber(timeout)) {
        throw new TypeError('timeout must be a number')
      }
      if (this.waitSetBusy) {
        throw new Error('Can not concurrently wait on the same Connector object')
      } else {
        this.waitSetBusy = true
        connectorBinding.api.RTI_Connector_wait_for_data.async(
          this.native,
          timeout,
          (err, res) => {
            this.waitSetBusy = false
            if (err) {
              return reject(err)
            } else if (res === _ReturnCodes.ok) {
              return resolve()
            } else if (res === _ReturnCodes.timeout) {
              return reject(new TimeoutError('Timeout error'))
            } else {
              return reject(new DDSError('res: ' + res))
            }
          })
      }
    })
  }

  /**
   * Allows increasing the number of Connector instances that can be created.
   *
   * The default value is 1024 (which allows for approximately 8 instances of Connector
   * to be created in a single application). If you need to create more than 8
   * instances of Connector you can increase the value from the default.
   *
   * .. note::
   *   This is a static method. It can only be called before creating any Connector instance.
   *
   * See `SYSTEM_RESOURCE_LIMITS QoS Policy <https://community.rti.com/static/documentation/connext-dds/6.0.0/doc/manuals/connext_dds/html_files/RTI_ConnextDDS_CoreLibraries_UsersManual/index.htm#UsersManual/SYSTEM_RESOURCE_LIMITS_QoS.htm>`__
   * in the *RTI Connext DDS* User's Manual for more information.
   *
   * @param {number} value The value for *max_objects_per_thread*
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

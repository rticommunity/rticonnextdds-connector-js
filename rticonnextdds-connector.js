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

// This is a structure which is passed to C from node so we need to define
// it using ref-struct.
// This must match the definition of RTI_Connector_Options
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
      RTI_Connector_create_test_scenario: ['int', ['pointer', 'int', 'pointer']]
    })
  }
}

// Create the connectorBinding
var connectorBinding = new _ConnectorBinding()

// Move a string which is allocated within core to memory space of binding
function _moveCString (cstring) {
  const ret = ref.readCString(cstring)
  connectorBinding.api.RTI_Connector_free_string(cstring)
  return ret
}

// Obtain last error message from the core
function _getLastDdsErrorMessage () {
  const cStr = connectorBinding.api.RTI_Connector_get_last_error_message()
  if (cStr !== null) {
    return _moveCString(cStr)
  }
  return ''
}

// Node.js representation of DDS_ReturnCode_t
const _ReturnCodes = {
  ok: 0,
  timeout: 10,
  noData: 11
}
// Make _ReturnCodes immutable
Object.freeze(_ReturnCodes)

// Node.js representation of RTI_Connector_AnyValueKind
const _AnyValueKind = {
  connector_none: 0,
  connector_number: 1,
  connector_boolean: 2,
  connector_string: 3
}
Object.freeze(_AnyValueKind)

// Check for success and raise exceptions if not
function _checkRetcode (retcode) {
  if (retcode !== _ReturnCodes.ok && retcode !== _ReturnCodes.noData) {
    if (retcode === _ReturnCodes.timeout) {
      throw new Error('Timeout error')
    } else {
      throw new Error('DDS Error: ' + _getLastDdsErrorMessage())
    }
  }
}

// var str = new String; will result in typeof returning Object not string
function _isString (value) {
  return typeof value === 'string' || value instanceof String
}

// Do not want to return true for NaN or Infinity
function _isNumber (value) {
  return typeof value === 'number' && isFinite(value) && Number.isInteger(value)
}

function _getAnyValue (getter, connector, inputName, index, fieldName) {
  if (typeof getter !== 'function') {
    throw new TypeError('getter must be a function')
  } else if (connector.isNull()) {
    throw new Error('connector cannot be null')
  } else if (!_isString(inputName)) {
    throw new TypeError('inputName must be a string')
  } else if (!_isNumber(index)) {
    throw new TypeError('index must be a number')
  } else if (index < 0) {
    throw new RangeError('index must be positive')
  } else if (!_isString(fieldName)) {
    throw new TypeError('fieldName must be a string')
  } else {
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
      return _moveCString(stringVal.deref())
    } else {
      // This shouldn't happen
      throw new Error('Unexpected type returned by ' + getter.name)
    }
  }
}

// Public API

class Samples {
  constructor (input) {
    this.input = input
  }

  get length () {
    const length = ref.alloc('double')
    const retcode = connectorBinding.api.RTI_Connector_get_sample_count(
      this.input.connector.native,
      this.input.name,
      length)
    _checkRetcode(retcode)
    return length.deref()
  }

  getNumber (index, fieldName) {
    if (!_isNumber(index)) {
      throw new TypeError('index must be an integer')
    } else if (index < 0) {
      throw new RangeError('index must be positive')
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
    if (!_isNumber(index)) {
      throw new TypeError('index must be an integer')
    } else if (index < 0) {
      throw new RangeError('index must positive')
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
        // Convert the returned int to a boolean
        return !!value.deref()
      }
    }
  }

  getString (index, fieldName) {
    if (!_isNumber(index)) {
      throw new TypeError('index must be an integer')
    } else if (index < 0) {
      throw new RangeError('index must positive')
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
    if (!_isNumber(index)) {
      throw new TypeError('index must be an integer')
    } else if (index < 0) {
      throw new RangeError('index must be positive')
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

  // Deprecated, use getJson
  getJSON (index, memberName) {
    return this.getJson(index, memberName)
  }

  getNative (index) {
    if (!_isNumber(index)) {
      throw new TypeError('index must be an integer')
    } else if (index < 0) {
      throw new RangeError('index must be positive')
    } else {
      // Increment index since Lua arrays are 1-indexed
      index += 1
      return connectorBinding.api.RTI_Connector_get_native_sample(
        this.input.connector.native,
        this.input.name,
        index)
    }
  }
}

class Infos {
  constructor (input) {
    this.input = input
  }

  get length () {
    const length = ref.alloc('double')
    const retcode = connectorBinding.api.RTI_Connector_get_sample_count(
      this.input.connector.native,
      this.input.name,
      length)
    _checkRetcode(retcode)
    return length.deref()
  }

  isValid (index) {
    if (!_isNumber(index)) {
      throw new TypeError('index must be an integer')
    } else if (index < 0) {
      throw new RangeError('index must be positive')
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

class SampleInfo {
  constructor (input, index) {
    this.input = input
    this.index = index
  }

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

class SampleIterator {
  constructor (input, index) {
    this.input = input
    if (index === undefined) {
      index = -1
    }
    this.index = index
    this.length = input.sampleCount
  }

  get validData () {
    return this.input.infos.isValid(this.index)
  }

  get info () {
    return new SampleInfo(this.input, this.index)
  }

  getJson (memberName) {
    return this.input.samples.getJson(this.index, memberName)
  }

  getNumber (fieldName) {
    return this.input.samples.getNumber(this.index, fieldName)
  }

  getBoolean (fieldName) {
    return this.input.samples.getBoolean(this.index, fieldName)
  }

  getString (fieldName) {
    return this.input.samples.getString(this.index, fieldName)
  }

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

  get native () {
    return this.input.samples.getNative(this.index)
  }

  [Symbol.iterator] () {
    return {
      next: () => {
        if ((this.index + 1) < this.length) {
          this.index += 1
          return { value: this, done: false }
        } else {
          return { value: null, done: true }
        }
      }
    }
  }
}

class ValidSampleIterator extends SampleIterator {
  [Symbol.iterator] () {
    return {
      next: () => {
        while (((this.index + 1) < this.length) && !(this.input.infos.isValid(this.index + 1))) {
          this.index += 1
        }
        if ((this.index + 1) < this.length) {
          this.index += 1
          return { value: this, done: false }
        } else {
          return { value: null, done: true }
        }
      }
    }
  }
}

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
    this.samples = new Samples(this)
    this.infos = new Infos(this)
    this.waitsetBusy = false
  }

  get dataIterator () {
    return new SampleIterator(this)
  }

  get validDataIterator () {
    return new ValidSampleIterator(this)
  }

  read () {
    _checkRetcode(connectorBinding.api.RTI_Connector_read(
      this.connector.native,
      this.name))
  }

  take () {
    _checkRetcode(connectorBinding.api.RTI_Connector_take(
      this.connector.native,
      this.name))
  }

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
              reject(err)
            }
            _checkRetcode(res)
            resolve()
          }
        )
      }
    })
  }

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
              reject(err)
            }
            _checkRetcode(res)
            resolve(currentChangeCount.deref())
          }
        )
      }
    })
  }

  get matchedPublications () {
    const cStr = ref.alloc('char *')
    const retcode = connectorBinding.api.RTI_Connector_get_matched_publications(
      this.native,
      cStr)
    _checkRetcode(retcode)
    return JSON.parse(_moveCString(cStr.deref()))
  }

  get sampleCount () {
    return this.samples.length
  }
}

class Instance {
  constructor (output) {
    this.output = output
  }

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

  setNumber (fieldName, value) {
    if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else if (!_isNumber(value)) {
      throw new TypeError('value must be a number')
    } else {
      const retcode = connectorBinding.api.RTI_Connector_set_number_into_samples(
        this.output.connector.native,
        this.output.name,
        fieldName,
        value)
      _checkRetcode(retcode)
    }
  }

  setBoolean (fieldName, value) {
    if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else if (typeof value !== 'boolean') {
      throw new TypeError('value must be a boolean')
    } else {
      const retcode = connectorBinding.api.RTI_Connector_set_boolean_into_samples(
        this.output.connector.native,
        this.output.name,
        fieldName,
        value)
      _checkRetcode(retcode)
    }
  }

  setString (fieldName, value) {
    if (!_isString(fieldName)) {
      throw new TypeError('fieldName must be a string')
    } else if (!_isString(value)) {
      throw new TypeError('value must be a string')
    } else {
      const retcode = connectorBinding.api.RTI_Connector_set_string_into_samples(
        this.output.connector.native,
        this.output.name,
        fieldName,
        value)
      _checkRetcode(retcode)
    }
  }

  setFromJson (jsonObj) {
    _checkRetcode(connectorBinding.api.RTI_Connector_set_json_instance(
      this.output.connector.native,
      this.output.name,
      JSON.stringify(jsonObj)))
  }

  // Deprecated, use setFromJson
  setFromJSON (jsonObj) {
    this.setFromJson(jsonObj)
  }
}

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

  clearMembers () {
    _checkRetcode(connectorBinding.api.RTI_Connector_clear(
      this.connector.native,
      this.name))
  }

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
              reject(err)
            }
            _checkRetcode(res)
            resolve(currentChangeCount.deref())
          }
        )
      }
    })
  }

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

  delete () {
    connectorBinding.api.RTI_Connector_delete(this.native)
  }

  getInput (inputName) {
    return new Input(this, inputName)
  }

  getOutput (outputName) {
    return new Output(this, outputName)
  }

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
  newListenerCallBack (eventName, functionListener) {
    if (eventName === 'on_data_available') {
      if (this.onDataAvailableRun === false) {
        this.onDataAvailableRun = true
        this.onDataAvailable()
      }
    }
  }

  removeListenerCallBack (eventName, functionListener) {
    if (this.listenerCount(eventName) === 0) {
      this.onDataAvailableRun = false
    }
  }

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
          }
          _checkRetcode(res)
          return resolve()
        })
    })
  }
}

module.exports.Connector = Connector

'use strict';

const { mock } = require('node:test');

function spy() {
  const fn = mock.fn();
  function wrapper(...args) {
    return fn(...args);
  }
  Object.defineProperties(wrapper, {
    calledOnce:  { get: () => fn.mock.callCount() === 1, enumerable: true },
    calledTwice: { get: () => fn.mock.callCount() === 2, enumerable: true },
    callCount:   { get: () => fn.mock.callCount(), enumerable: true },
    notCalled:   { get: () => fn.mock.callCount() === 0, enumerable: true },
    reset: { value: () => fn.mock.resetCalls(), enumerable: true },
  });
  return wrapper;
}

module.exports = { spy };

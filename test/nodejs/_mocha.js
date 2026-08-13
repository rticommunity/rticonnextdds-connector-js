/**
 * Test utilities for Connector for Javascript.
 * Wraps node:test to provide a Mocha-compatible API surface.
 */
const nodeTest = require('node:test');

// ---------------------------------------------------------------------------
// Timeout helpers
// ---------------------------------------------------------------------------

function parseMsTimeout(ms) {
    if (ms === 0) return Infinity;
    if (typeof ms === 'string' && ms.endsWith('s')) return parseInt(ms, 10) * 1000;
    return ms;
}

// Stack that tracks the current suite-level timeout as describe blocks nest.
// Entries are added when entering a describe and removed when exiting.
let _suiteTimeout = undefined;

// ---------------------------------------------------------------------------
// Wrap a user callback to provide Mocha-compatible `this` context and
// optional `done` callback support.
//
//   • `this.timeout(ms)` is forwarded to t.timeout() (Node ≥ 22)
//   • If the callback accepts one argument, it receives a `done` function
//     (Mocha done-callback style).
// ---------------------------------------------------------------------------
function wrapCallback(fn) {
    if (fn.length >= 1) {
        // done-callback style: wrap into a Promise
        return (t) => new Promise((resolve, reject) => {
            const ctx = { timeout: (ms) => { if (t && typeof t.timeout === 'function') t.timeout(parseMsTimeout(ms)); }, slow: () => { } };
            function done(err) {
                if (err) reject(err);
                else resolve();
            }
            fn.call(ctx, done);
        });
    }
    return async (t) => {
        const ctx = { timeout: (ms) => { if (t && typeof t.timeout === 'function') t.timeout(parseMsTimeout(ms)); }, slow: () => { } };
        return fn.call(ctx);
    };
}

// ---------------------------------------------------------------------------
// Exported Mocha-compatible test framework wrappers
// ---------------------------------------------------------------------------

function describe(name, fn) {
    const savedTimeout = _suiteTimeout;
    let suiteTimeout = savedTimeout;

    const ctx = {
        timeout: (ms) => {
            suiteTimeout = parseMsTimeout(ms);
            _suiteTimeout = suiteTimeout;
        },
        slow: () => { },
    };

    nodeTest.describe(name, function () {
        _suiteTimeout = suiteTimeout;
        fn.call(ctx);
        _suiteTimeout = savedTimeout;
    });
}

function it(name, fn) {
    if (!fn) { nodeTest.it(name); return; }
    nodeTest.it(name, wrapCallback(fn));
}

function before(fn) {
    nodeTest.before(wrapCallback(fn), { timeout: Infinity });
}

function after(fn) {
    nodeTest.after(wrapCallback(fn), { timeout: Infinity });
}

function beforeEach(fn) {
    nodeTest.beforeEach(wrapCallback(fn), { timeout: Infinity });
}

function afterEach(fn) {
    nodeTest.afterEach(wrapCallback(fn), { timeout: Infinity });
}

module.exports = { describe, it, before, after, beforeEach, afterEach };

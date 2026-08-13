'use strict';

const assert = require('node:assert/strict');

const CHAIN_WORDS = new Set([
    'to', 'be', 'been', 'is', 'that', 'which', 'and', 'has', 'have',
    'with', 'of', 'same', 'but', 'does', 'still', 'also',
]);

function parseMsTimeout(ms) {
    if (ms === 0) return Infinity;
    if (typeof ms === 'string' && ms.endsWith('s')) return parseInt(ms, 10) * 1000;
    return ms;
}

function makeAssertion(value, negated, deep) {
    const target = { _val: value, _neg: negated, _deep: deep };
    return new Proxy(target, handler);
}

// Returns a dual-natured value: callable (type check) AND chainable (proxy for further assertions).
function makeTypeChecker(target, allowedType) {
    const fn = function (type) {
        const t = allowedType !== undefined ? allowedType : type;
        const actual = Array.isArray(target._val) ? 'array' : typeof target._val;
        if (target._neg) {
            if (actual === t) throw new assert.AssertionError({ message: `Expected value not to be of type '${t}'` });
        } else {
            if (actual !== t) throw new assert.AssertionError({ message: `Expected ${JSON.stringify(target._val)} to be of type '${t}' but was '${actual}'` });
        }
        return makeAssertion(target._val, target._neg, target._deep);
    };
    return new Proxy(fn, {
        get(_, prop) { return handler.get(target, prop); },
    });
}

const handler = {
    get(target, prop) {
        if (prop === '_val' || prop === '_neg' || prop === '_deep' || prop === 'then') {
            return target[prop];
        }

        if (CHAIN_WORDS.has(prop)) return makeAssertion(target._val, target._neg, target._deep);

        if (prop === 'not') return makeAssertion(target._val, !target._neg, target._deep);
        if (prop === 'deep') return makeAssertion(target._val, target._neg, true);

        // 'a' and 'an' are callable type-checks AND chainable
        if (prop === 'a' || prop === 'an') return makeTypeChecker(target, undefined);
        // 'at' is chainable; chains to 'least' / 'most' / 'above' etc.
        if (prop === 'at') return makeAssertion(target._val, target._neg, target._deep);

        // Terminal getter assertions
        if (prop === 'true') {
            if (target._neg) assert.notStrictEqual(target._val, true, `Expected value not to be true`);
            else assert.strictEqual(target._val, true, `Expected value to be true`);
            return makeAssertion(target._val, target._neg, target._deep);
        }
        if (prop === 'false') {
            if (target._neg) assert.notStrictEqual(target._val, false, `Expected value not to be false`);
            else assert.strictEqual(target._val, false, `Expected value to be false`);
            return makeAssertion(target._val, target._neg, target._deep);
        }
        if (prop === 'null') {
            if (target._neg) assert.notStrictEqual(target._val, null, `Expected value not to be null`);
            else assert.strictEqual(target._val, null, `Expected value to be null`);
            return makeAssertion(target._val, target._neg, target._deep);
        }
        if (prop === 'undefined') {
            if (target._neg) assert.notStrictEqual(target._val, undefined);
            else assert.strictEqual(target._val, undefined);
            return makeAssertion(target._val, target._neg, target._deep);
        }
        if (prop === 'exist') {
            if (target._neg) {
                if (target._val != null) throw new assert.AssertionError({ message: `Expected ${target._val} not to exist` });
            } else {
                if (target._val == null) throw new assert.AssertionError({ message: `Expected value to exist but got ${target._val}` });
            }
            return makeAssertion(target._val, target._neg, target._deep);
        }

        // Method assertions
        if (prop === 'equal' || prop === 'equals') {
            return (expected) => {
                if (target._deep) {
                    if (target._neg) assert.notDeepStrictEqual(target._val, expected);
                    else assert.deepStrictEqual(target._val, expected);
                } else {
                    if (target._neg) assert.notStrictEqual(target._val, expected);
                    else assert.strictEqual(target._val, expected);
                }
                return makeAssertion(target._val, target._neg, target._deep);
            };
        }

        if (prop === 'instanceof' || prop === 'instanceOf') {
            return (Ctor) => {
                if (target._neg) {
                    if (target._val instanceof Ctor) {
                        throw new assert.AssertionError({ message: `Expected value not to be an instance of ${Ctor.name}` });
                    }
                } else {
                    if (!(target._val instanceof Ctor)) {
                        throw new assert.AssertionError({ message: `Expected ${target._val} to be an instance of ${Ctor.name}` });
                    }
                }
                return makeAssertion(target._val, target._neg, target._deep);
            };
        }

        if (prop === 'throw' || prop === 'throws') {
            return (ErrType) => {
                if (target._neg) {
                    try {
                        target._val();
                    } catch (e) {
                        if (!ErrType || e instanceof ErrType) {
                            throw new assert.AssertionError({ message: `Expected function not to throw ${ErrType ? ErrType.name : 'anything'} but it threw ${e}` });
                        }
                    }
                } else {
                    assert.throws(target._val, ErrType);
                }
                return makeAssertion(target._val, target._neg, target._deep);
            };
        }

        if (prop === 'rejectedWith') {
            return (ErrType) => {
                if (target._neg) {
                    return target._val.then(
                        () => makeAssertion(target._val, target._neg, target._deep),
                        (e) => {
                            if (!ErrType || e instanceof ErrType) {
                                throw new assert.AssertionError({ message: `Expected promise not to reject with ${ErrType ? ErrType.name : 'an error'}` });
                            }
                        }
                    );
                }
                return assert.rejects(target._val, ErrType).then(
                    () => makeAssertion(target._val, target._neg, target._deep)
                );
            };
        }

        if (prop === 'least') {
            return (n) => {
                if (target._neg) {
                    if (target._val >= n) throw new assert.AssertionError({ message: `Expected ${target._val} not to be at least ${n}` });
                } else {
                    if (target._val < n) throw new assert.AssertionError({ message: `Expected ${target._val} to be at least ${n}` });
                }
                return makeAssertion(target._val, target._neg, target._deep);
            };
        }

        if (prop === 'greaterThan' || prop === 'gt' || prop === 'above') {
            return (n) => {
                if (target._neg) {
                    if (target._val > n) throw new assert.AssertionError({ message: `Expected ${target._val} not to be greater than ${n}` });
                } else {
                    if (target._val <= n) throw new assert.AssertionError({ message: `Expected ${target._val} to be greater than ${n}` });
                }
                return makeAssertion(target._val, target._neg, target._deep);
            };
        }

        if (prop === 'lessThan' || prop === 'lt' || prop === 'below') {
            return (n) => {
                if (target._neg) {
                    if (target._val < n) throw new assert.AssertionError({ message: `Expected ${target._val} not to be less than ${n}` });
                } else {
                    if (target._val >= n) throw new assert.AssertionError({ message: `Expected ${target._val} to be less than ${n}` });
                }
                return makeAssertion(target._val, target._neg, target._deep);
            };
        }

        if (prop === 'include' || prop === 'contain') {
            const includeProxy = new Proxy({}, {
                get(_, subProp) {
                    if (subProp === 'members') {
                        return (expected) => {
                            if (!target._neg) {
                                for (const item of expected) {
                                    const found = target._val.some(
                                        (v) => { try { assert.deepStrictEqual(v, item); return true; } catch { return false; } }
                                    );
                                    if (!found) {
                                        throw new assert.AssertionError({ message: `Expected array to include member ${JSON.stringify(item)}` });
                                    }
                                }
                            } else {
                                for (const item of expected) {
                                    const found = target._val.some(
                                        (v) => { try { assert.deepStrictEqual(v, item); return true; } catch { return false; } }
                                    );
                                    if (found) {
                                        throw new assert.AssertionError({ message: `Expected array not to include member ${JSON.stringify(item)}` });
                                    }
                                }
                            }
                            return makeAssertion(target._val, target._neg, target._deep);
                        };
                    }
                    return handler.get(target, subProp);
                },
            });
            return includeProxy;
        }

        if (prop === 'satisfies' || prop === 'satisfy') {
            return (fn) => {
                const result = fn(target._val);
                if (target._neg) {
                    if (result) throw new assert.AssertionError({ message: `Expected value not to satisfy the provided function` });
                } else {
                    if (!result) throw new assert.AssertionError({ message: `Expected value to satisfy the provided function` });
                }
                return makeAssertion(target._val, target._neg, target._deep);
            };
        }

        // Unknown property — return chainable no-op proxy
        return makeAssertion(target._val, target._neg, target._deep);
    },
};

function expect(value) {
    return makeAssertion(value, false, false);
}

module.exports = { expect };
module.exports.expect = expect;

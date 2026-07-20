/**
 * Self-contained polyfill for URLSearchParams iterator methods.
 *
 * React Native's built-in URLSearchParams polyfill does not implement
 * Symbol.iterator / keys() / values() / entries() as proper iterables,
 * which causes expo-router's parseQueryParams to crash with:
 *   "Invalid attempt to iterate non-iterable instance"
 *
 * We patch the prototype directly using forEach (which always works).
 */
(function patchURLSearchParamsIterator() {
  if (typeof globalThis.URLSearchParams !== 'function') return;

  const proto = globalThis.URLSearchParams.prototype;

  // Helper: build a simple iterator from an array
  function arrayIterator(arr) {
    let i = 0;
    const iter = {
      next() {
        return i < arr.length
          ? { value: arr[i++], done: false }
          : { value: undefined, done: true };
      },
    };
    if (typeof Symbol !== 'undefined' && Symbol.iterator) {
      iter[Symbol.iterator] = function () { return iter; };
    }
    return iter;
  }

  // Test if keys() already returns a proper iterable
  function isIteratorWorking() {
    try {
      const p = new globalThis.URLSearchParams('a=1');
      const k = p.keys();
      if (!k || typeof k.next !== 'function') return false;
      const r = k.next();
      return r.value === 'a';
    } catch {
      return false;
    }
  }

  if (isIteratorWorking()) return;

  proto.entries = function entries() {
    const pairs = [];
    this.forEach(function (value, key) { pairs.push([key, value]); });
    return arrayIterator(pairs);
  };

  proto.keys = function keys() {
    const result = [];
    this.forEach(function (_v, key) { result.push(key); });
    return arrayIterator(result);
  };

  proto.values = function values() {
    const result = [];
    this.forEach(function (value) { result.push(value); });
    return arrayIterator(result);
  };

  if (typeof Symbol !== 'undefined' && Symbol.iterator) {
    proto[Symbol.iterator] = proto.entries;
  }
})();

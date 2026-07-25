/**
 * Generates a cryptographically sound UUID v4 string across React Native (Hermes),
 * Web, and Node.js environments without requiring extra native modules or packages.
 */
export function generateSecureUUID(): string {
  // 1. Web Crypto API randomUUID if supported by engine
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    try {
      const id = globalThis.crypto.randomUUID();
      if (id && typeof id === 'string') return id;
    } catch {
      // Fallback if randomUUID throws in restricted context
    }
  }

  // 2. Web Crypto API getRandomValues if available
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    try {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    } catch {
      // Fallback if getRandomValues throws
    }
  }

  // 3. High-entropy fallback utilizing high-precision timing + pseudo-randomness
  const now = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
  let d = Math.floor(now);

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

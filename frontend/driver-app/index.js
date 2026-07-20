if (globalThis.ErrorUtils?.setGlobalHandler) {
  const previousHandler = globalThis.ErrorUtils.getGlobalHandler?.();
  globalThis.ErrorUtils.setGlobalHandler((error, isFatal) => {
    const message = error?.message || String(error);
    const stack = error?.stack || '';
    // Keep this log intentionally simple so it appears in Metro/Expo logs.
    console.error('[JAHEEZ_DRIVER_FATAL]', { isFatal, message, stack });
    if (previousHandler) previousHandler(error, isFatal);
  });
}

import './polyfills/urlSearchParams';
import 'expo-router/entry';

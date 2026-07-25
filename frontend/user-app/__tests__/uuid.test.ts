process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://stub.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'stub-anon-key';

jest.mock('../lib/supabase', () => ({
  supabase: {},
  IS_STUB_MODE: false,
}));

jest.mock('../lib/backendApi', () => ({
  backendJson: jest.fn(),
  BackendApiError: class extends Error {},
}));

import { generateSecureUUID } from '../lib/uuid';
import { getCustomerAuthDeviceId } from '../features/auth/services/authApi';
import { secureStorage } from '../lib/secureStorage';

jest.mock('../lib/secureStorage', () => {
  let store: Record<string, string> = {};
  return {
    secureStorage: {
      getItem: jest.fn(async (key: string) => store[key] || null),
      setItem: jest.fn(async (key: string, val: string) => { store[key] = val; }),
      removeItem: jest.fn(async (key: string) => { delete store[key]; }),
    },
  };
});

describe('generateSecureUUID', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
  });

  it('generates a valid UUID string when crypto.randomUUID is available', () => {
    const uuid = generateSecureUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generates a valid UUID string in Hermes environment where crypto.randomUUID is undefined', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const uuid = generateSecureUUID();
    expect(typeof uuid).toBe('string');
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});

describe('getCustomerAuthDeviceId', () => {
  it('generates and persists a device ID in secure storage without throwing unavailable error', async () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const deviceId1 = await getCustomerAuthDeviceId();
    expect(typeof deviceId1).toBe('string');
    expect(deviceId1.length).toBeGreaterThanOrEqual(16);
    expect(secureStorage.setItem).toHaveBeenCalledWith('jaheez_customer_auth_device_id', deviceId1);

    const deviceId2 = await getCustomerAuthDeviceId();
    expect(deviceId2).toBe(deviceId1);
  });
});

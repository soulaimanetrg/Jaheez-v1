/**
 * Test setup file — runs before every test suite.
 * 
 * Mocks external dependencies (Supabase, payment gateways, push notifications)
 * so tests run fast, offline, and don't touch real services.
 */
import { vi } from 'vitest';

// ─── Mock Supabase ───────────────────────────────────────────────
// Creates a chainable query builder that returns empty results by default.
// Tests can override return values per-test using mockResolvedValueOnce.

function createMockQueryBuilder(defaultData: any = null) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: defaultData, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: defaultData, error: null }),
    then: vi.fn().mockResolvedValue({ data: defaultData ? [defaultData] : [], error: null }),
  };

  // Make it thenable — so `await supabase.from('x').select('y')` works
  builder[Symbol.for('nodejs.util.promisify.custom')] = undefined;
  builder.then = (resolve: any) => resolve({ data: defaultData ? [defaultData] : [], error: null });

  return builder;
}

const mockSupabase = {
  from: vi.fn(() => createMockQueryBuilder()),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    admin: {
      createUser: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } }, error: null }),
      getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      updateUserById: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test/file.jpg' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
    })),
  },
};

vi.mock('../../db/supabase', () => ({ supabase: mockSupabase }));
vi.mock('../db/supabase', () => ({ supabase: mockSupabase }));

// ─── Mock Push Notifications ─────────────────────────────────────
vi.mock('../../notifications/notifications', () => ({
  sendPushToUser: vi.fn(),
  sendPushToDriver: vi.fn(),
}));
vi.mock('../notifications/notifications', () => ({
  sendPushToUser: vi.fn(),
  sendPushToDriver: vi.fn(),
}));

// ─── Mock Logger (suppress output during tests) ─────────────────
vi.mock('../../config/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock('../config/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Mock Env ────────────────────────────────────────────────────
vi.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3002,
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    SUPABASE_ANON_KEY: 'test-anon-key',
    ADMIN_JWT_SECRET: 'test-jwt-secret-minimum-16-chars-long',
    REDIS_REQUIRED: false,
    ONLINE_PAYMENTS_ENABLED: 'false',
    PAYMENT_PROVIDER: 'disabled',
    INFOBIP_API_KEY: undefined,
    INFOBIP_BASE_URL: undefined,
  },
}));
vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3002,
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    SUPABASE_ANON_KEY: 'test-anon-key',
    ADMIN_JWT_SECRET: 'test-jwt-secret-minimum-16-chars-long',
    REDIS_REQUIRED: false,
    ONLINE_PAYMENTS_ENABLED: 'false',
    PAYMENT_PROVIDER: 'disabled',
    INFOBIP_API_KEY: undefined,
    INFOBIP_BASE_URL: undefined,
  },
}));

// ─── Mock Redis ──────────────────────────────────────────────────
vi.mock('../../redis/redis', () => ({ redis: null }));
vi.mock('../redis/redis', () => ({ redis: null }));

// ─── Mock Socket.IO ──────────────────────────────────────────────
vi.mock('../features/realtime/socket.server', () => ({
  getSocketIO: vi.fn(() => null),
  attachSocketServer: vi.fn(),
}));
vi.mock('../../features/realtime/socket.server', () => ({
  getSocketIO: vi.fn(() => null),
  attachSocketServer: vi.fn(),
}));

// ─── Export mock for test access ─────────────────────────────────
export { mockSupabase, createMockQueryBuilder };

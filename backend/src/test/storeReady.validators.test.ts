import { describe, expect, it } from 'vitest';
import { storeReadySchema } from '../features/store/storeReady.validators';

describe('storeReadySchema', () => {
  it('requires a stable idempotency request_id', () => {
    expect(() => storeReadySchema.parse({ request_id: 'short' })).toThrow();
    expect(storeReadySchema.parse({ request_id: 'ready-123456' })).toEqual({ request_id: 'ready-123456' });
  });

  it('rejects attempts to submit actor or store identity in the body', () => {
    expect(() => storeReadySchema.parse({
      request_id: 'ready-123456',
      store_id: 'attacker-store',
      actor_id: 'attacker',
    })).toThrow();
  });

  it('rejects backdated or client-chosen ready timestamps', () => {
    expect(() => storeReadySchema.parse({
      request_id: 'ready-123456',
      occurred_at: '2026-01-01T10:00:00.000Z',
    })).toThrow();
    expect(() => storeReadySchema.parse({
      request_id: 'ready-123456',
      client_event_at: '2026-01-01T10:00:00.000Z',
    })).toThrow();
  });
});

import { describe, expect, it } from 'vitest';
import { driverLocationSchema } from '../features/order/location.validators';

describe('driverLocationSchema anti-fraud telemetry', () => {
  it('accepts optional GPS evidence signals', () => {
    expect(driverLocationSchema.parse({
      latitude: 32.299,
      longitude: -9.237,
      accuracy: 18,
      client_recorded_at: '2026-07-01T12:00:00.000Z',
      is_mocked: false,
      continuity_valid: true,
    })).toMatchObject({
      latitude: 32.299,
      longitude: -9.237,
      client_recorded_at: '2026-07-01T12:00:00.000Z',
      is_mocked: false,
      continuity_valid: true,
    });
  });

  it('rejects mass-assignment attempts for delay or points fields', () => {
    expect(() => driverLocationSchema.parse({
      latitude: 32.299,
      longitude: -9.237,
      responsible_party: 'store',
      points_delta: 0,
    })).toThrow();
  });
});

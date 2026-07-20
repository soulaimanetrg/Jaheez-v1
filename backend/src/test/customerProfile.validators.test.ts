import { describe, expect, it } from 'vitest';
import {
  customerAnalyticsEventSchema,
  customerHomeFeedQuerySchema,
  updateProfileSchema,
} from '../features/customer/customer.validators';
import { sanitizeCustomerAnalyticsMetadata } from '../features/customer/customer.service';

describe('Customer Profile Validation', () => {
  it('should accept valid notification settings toggles', () => {
    const payload = {
      notification_enabled: true,
      notif_orders: false,
      notif_promos: true,
      location_share: false,
    };
    const parsed = updateProfileSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('should allow partial updates', () => {
    const payload = {
      notification_enabled: false,
    };
    const parsed = updateProfileSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.notification_enabled).toBe(false);
  });

  it('should reject contact ownership changes outside the WhatsApp challenge flow', () => {
    const payload = {
      phone: '0612345678',
      phone_otp_proof: 'x'.repeat(40),
      email: 'client@example.com',
      email_otp_proof: 'y'.repeat(40),
    };
    const parsed = updateProfileSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('should reject invalid types for notification settings', () => {
    const payload = {
      notification_enabled: 'yes',
    };
    const parsed = updateProfileSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('should reject unknown extra parameters due to strict schema', () => {
    const payload = {
      notification_enabled: true,
      extra_junk_field: 'junk',
    };
    const parsed = updateProfileSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });
});

describe('Customer Experience Validation', () => {
  it('should coerce safe home feed coordinates and reject unknown query fields', () => {
    const parsed = customerHomeFeedQuerySchema.safeParse({ lat: '32.299', lng: '-9.237' });
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({ lat: 32.299, lng: -9.237 });

    const massAssignment = customerHomeFeedQuerySchema.safeParse({ lat: '32.299', user_id: 'attacker' });
    expect(massAssignment.success).toBe(false);
  });

  it('should accept only safe analytics event contracts', () => {
    const parsed = customerAnalyticsEventSchema.safeParse({
      event_name: 'search_submitted',
      screen: 'home',
      entity_type: 'search',
      metadata: { query_length: 8, has_query: true },
    });
    expect(parsed.success).toBe(true);

    const forbidden = customerAnalyticsEventSchema.safeParse({
      event_name: 'search_submitted',
      screen: 'home',
      user_id: 'attacker-controlled',
    });
    expect(forbidden.success).toBe(false);
  });

  it('should redact sensitive analytics metadata before storage', () => {
    const clean = sanitizeCustomerAnalyticsMetadata({
      source: 'checkout',
      query_length: 12,
      phone: '+212600000000',
      raw_provider_payload: 'secret',
      precise_lat: 32.299,
      idempotency_key: 'abc',
      nested: { unsafe: true },
    });

    expect(clean).toEqual({
      source: 'checkout',
      query_length: 12,
    });
  });
});

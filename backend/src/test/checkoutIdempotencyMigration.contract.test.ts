import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const migration = fs.readFileSync(
  path.resolve(process.cwd(), '../supabase_migrations/059_checkout_request_bound_idempotency.sql'),
  'utf8',
);

describe('checkout request-bound idempotency migration', () => {
  it('serializes every use of one idempotency key before lookup', () => {
    const lock = migration.indexOf('pg_advisory_xact_lock');
    const lookup = migration.indexOf('FROM public.idempotency_keys');
    expect(lock).toBeGreaterThan(0);
    expect(lock).toBeLessThan(lookup);
  });

  it('binds replay to both owner and exact canonical request hash', () => {
    expect(migration).toContain('p_request_payload');
    expect(migration).toContain("digest(convert_to(p_request_payload::TEXT, 'UTF8'), 'sha256')");
    expect(migration).toContain('idempotency_key_owner_mismatch');
    expect(migration).toContain('idempotency_payload_mismatch');
    expect(migration).toContain("v_cached_resp->>'_request_hash'");
    expect(migration).toContain("v_cached_resp - '_request_hash'");
  });

  it('is service-role only and verifies an active customer owner', () => {
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.create_order_atomic_v2[\s\S]*FROM PUBLIC, anon, authenticated;/);
    expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION public\.create_order_atomic_v2[\s\S]*TO service_role;/);
    expect(migration).toContain("role = 'user'");
    expect(migration).toContain('blocked_at IS NULL');
    expect(migration).toContain('deleted_at IS NULL');
  });
});

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('safe authentication contract', () => {
  it('uses backend-owned OTP enrollment, password login, and authenticated bootstrap', () => {
    const service = read('backend/src/features/auth/customerAuth.service.ts');
    const routes = read('backend/src/features/auth/customerAuth.routes.ts');
    const repository = read('backend/src/features/auth/customerAuth.repository.ts');
    expect(service).toContain('createPasswordCustomer');
    expect(service).toContain('signInCustomer');
    expect(service).not.toContain('customer_otp_demo_mode');
    expect(service).toContain('consumeRegistrationChallenge');
    expect(service).toContain('crypto.randomInt');
    expect(service).toContain('crypto.timingSafeEqual');
    expect(repository).toContain('phone_confirm: true');
    expect(service).toContain('existing?.whatsapp_verified_at');
    expect(routes).toContain("'/auth/customer/bootstrap', verifySupabaseJwtForCustomerBootstrap");
    const middleware = read('backend/src/middleware/supabaseJwt.middleware.ts');
    expect(middleware).toContain('verifySupabaseJwtForCustomerBootstrap');
    expect(middleware).toContain('supabase.auth.getUser');
    expect(routes).not.toContain("'/v1/customer/auth/whatsapp/start'");
    expect(routes).not.toContain("'/v1/customer/auth/whatsapp/verify'");
    const app = read('backend/src/app.ts');
    const mobileAuth = read('frontend/user-app/features/auth/services/authApi.ts');
    expect(app).toContain("'/admin-api/auth/hooks/send-sms'");
    expect(routes).toContain("'/auth/continue'");
    expect(routes).toContain("'/auth/register/verify'");
    expect(routes).toContain("'/auth/register/resend'");
    expect(routes).not.toContain("'/auth/recovery/request'");
    expect(mobileAuth).toContain("'/admin-api/auth/continue'");
    expect(mobileAuth).toContain("'/admin-api/auth/register/verify'");
    expect(mobileAuth).toContain("'/admin-api/auth/register/resend'");
    expect(mobileAuth).not.toContain('signInWithPassword(');
    expect(routes).not.toContain("'/auth/register/start'");
    expect(mobileAuth).not.toContain("'/admin-api/auth/register/start'");
  });

  it('uses opaque device-bound continuations and a server-only existence lookup', () => {
    const service = read('backend/src/features/auth/customerAuth.service.ts');
    const repository = read('backend/src/features/auth/customerAuth.repository.ts');
    const validators = read('backend/src/features/auth/customerAuth.validators.ts');
    const migration = read('supabase_migrations/058_customer_auth_continuation.sql');
    expect(service).toContain("crypto.createCipheriv('aes-256-gcm'");
    expect(service).toContain("openAuthContinuation(payload.continuation_token, 'password_challenge')");
    expect(service).toContain('customerAuthIdentifierExists');
    expect(service).toContain("return this.startCustomerRegistration(identifier, payload.device_id, context)");
    expect(service).not.toContain("kind: 'customer_registration_otp'");
    expect(repository).toContain("supabase.rpc('customer_auth_identifier_exists'");
    expect(validators).toContain('continuation_token: z.string()');
    expect(validators).not.toContain('export const customerRegisterStartSchema');
    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain('FROM auth.users');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.customer_auth_identifier_exists');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.customer_auth_identifier_exists');
    expect(migration).toContain('identifier_hash TEXT NOT NULL');
    expect(migration).not.toContain('account_exists');
  });

  it('requires a separate driver OTP exchange and resend endpoint', () => {
    const routes = read('backend/src/features/auth/driverAuth.routes.ts');
    const service = read('backend/src/features/auth/driverAuth.service.ts');
    expect(routes).toContain("'/driver/login/verify-otp'");
    expect(routes).toContain("'/driver/login/resend-otp'");
    expect(service).toContain("kind: 'driver_otp_challenge'");
    expect(service).toContain("'/VerificationCheck'");
  });

  it('stores no new plaintext OTP and protects sensitive user columns', () => {
    const migration = read('supabase_migrations/049_safe_passwordless_auth_driver_otp.sql');
    expect(migration).toContain('code_hash');
    expect(migration).toContain('REVOKE UPDATE ON public.users FROM authenticated');
    expect(migration).toContain('GRANT UPDATE (full_name, city, language, avatar_url, notification_enabled)');
    expect(migration).not.toContain('driver_otp_code_hash');
  });

  it('stores customer registration OTP challenges as server-only hashes with atomic consumption', () => {
    const migration = read('supabase_migrations/057_secure_customer_registration_otp.sql');
    const service = read('backend/src/features/auth/customerAuth.service.ts');
    expect(migration).toContain('code_hash TEXT NOT NULL');
    expect(migration).toContain('proof_hash TEXT');
    expect(migration).toContain('REVOKE ALL ON public.customer_registration_challenges FROM anon, authenticated');
    expect(migration).toContain('consume_customer_registration_challenge');
    expect(service).toContain("secureHash(`otp:${id}:${code}`)");
    expect(service).not.toContain('customer_otp_demo_mode');
  });

  it('requires an authenticated phone profile before checkout and errand submission while OTP is paused', () => {
    const checkout = read('backend/src/features/order/checkout.service.ts');
    const errands = read('backend/src/features/errand/errand.service.ts');
    const trust = read('backend/src/features/auth/customerTrust.service.ts');
    expect(checkout).toContain('requireOrderReady(userId)');
    expect(errands).toContain('requireOrderReady(userId)');
    expect(trust).toContain('phone_contact_required');
    expect(trust).not.toContain('whatsapp_verification_required');
  });
});

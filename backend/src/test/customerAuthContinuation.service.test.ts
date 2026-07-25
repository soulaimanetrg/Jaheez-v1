import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../features/auth/customerRegistrationOtpSender', () => ({
  sendCustomerRegistrationOtp: vi.fn().mockResolvedValue(undefined),
}));

import { env } from '../config/env';
import { CustomerAuthService } from '../features/auth/customerAuth.service';
import { sendCustomerRegistrationOtp } from '../features/auth/customerRegistrationOtpSender';

type RepositoryStub = {
  cleanupAuthContinuationAttempts: ReturnType<typeof vi.fn>;
  countRecentAuthContinuationAttempts: ReturnType<typeof vi.fn>;
  recordAuthContinuationAttempt: ReturnType<typeof vi.fn>;
  customerAuthIdentifierExists: ReturnType<typeof vi.fn>;
  getSettings: ReturnType<typeof vi.fn>;
  cleanupRegistrationChallenges: ReturnType<typeof vi.fn>;
  countRecentRegistrationChallenges: ReturnType<typeof vi.fn>;
  createRegistrationChallenge: ReturnType<typeof vi.fn>;
  updateRegistrationChallenge: ReturnType<typeof vi.fn>;
  signInCustomer: ReturnType<typeof vi.fn>;
  signInEmailCustomer: ReturnType<typeof vi.fn>;
};

const originalDeliveryFrozen = env.OTP_DELIVERY_FROZEN;
const originalOutboundDisabled = env.OUTBOUND_INTEGRATIONS_DISABLED;

function repositoryStub(exists: boolean): RepositoryStub {
  return {
    cleanupAuthContinuationAttempts: vi.fn().mockResolvedValue(undefined),
    countRecentAuthContinuationAttempts: vi.fn().mockResolvedValue({ identifier: 0, device: 0, ip: 0 }),
    recordAuthContinuationAttempt: vi.fn().mockResolvedValue(undefined),
    customerAuthIdentifierExists: vi.fn().mockResolvedValue(exists),
    getSettings: vi.fn().mockResolvedValue({ feature_customer_whatsapp_otp_enabled: 'true' }),
    cleanupRegistrationChallenges: vi.fn().mockResolvedValue(undefined),
    countRecentRegistrationChallenges: vi.fn().mockResolvedValue({ identifier: 0, device: 0, ip: 0 }),
    createRegistrationChallenge: vi.fn().mockResolvedValue(undefined),
    updateRegistrationChallenge: vi.fn().mockResolvedValue(undefined),
    signInCustomer: vi.fn().mockResolvedValue({ session: { access_token: 'access', refresh_token: 'refresh', expires_at: 1 } }),
    signInEmailCustomer: vi.fn().mockResolvedValue({ session: { access_token: 'access', refresh_token: 'refresh', expires_at: 1 } }),
  };
}

function serviceWith(repo: RepositoryStub): CustomerAuthService {
  const service = new CustomerAuthService();
  (service as unknown as { repo: RepositoryStub }).repo = repo;
  return service;
}

describe('customer automatic authentication continuation', () => {
  beforeEach(() => {
    env.OTP_DELIVERY_FROZEN = false;
    env.OUTBOUND_INTEGRATIONS_DISABLED = false;
    vi.clearAllMocks();
  });

  afterEach(() => {
    env.OTP_DELIVERY_FROZEN = originalDeliveryFrozen;
    env.OUTBOUND_INTEGRATIONS_DISABLED = originalOutboundDisabled;
  });

  it('normalizes an existing identifier and returns an opaque password challenge without sending OTP', async () => {
    const repo = repositoryStub(true);
    const result = await serviceWith(repo).continueCustomerAuth(
      { email: ' Existing@Example.COM ', device_id: 'persistent-device-id-0001' },
      { ip: '192.0.2.10' },
    );

    expect(result.continuation).toBe('password_challenge');
    if (result.continuation !== 'password_challenge') throw new Error('Unexpected continuation');
    expect(result.continuation_token).not.toContain('existing@example.com');
    expect(repo.customerAuthIdentifierExists).toHaveBeenCalledWith('email', 'existing@example.com');
    expect(sendCustomerRegistrationOtp).not.toHaveBeenCalled();
  });

  it('derives login identity from the encrypted challenge and rejects another device', async () => {
    const repo = repositoryStub(true);
    const service = serviceWith(repo);
    const continuation = await service.continueCustomerAuth(
      { phone: '06 12 34 56 78', device_id: 'persistent-device-id-0001' },
      { ip: '192.0.2.11' },
    );
    if (continuation.continuation !== 'password_challenge') throw new Error('Unexpected continuation');

    await expect(service.customerLogin({
      continuation_token: continuation.continuation_token,
      device_id: 'persistent-device-id-0002',
      password: 'correct-password-1',
    })).rejects.toMatchObject({ errorCode: 'invalid_credentials' });
    expect(repo.signInCustomer).not.toHaveBeenCalled();

    await service.customerLogin({
      continuation_token: continuation.continuation_token,
      device_id: 'persistent-device-id-0001',
      password: 'correct-password-1',
    });
    expect(repo.signInCustomer).toHaveBeenCalledWith('+212612345678', 'correct-password-1');
  });

  it('creates and delivers an OTP only after the authoritative new-account branch', async () => {
    const repo = repositoryStub(false);
    const result = await serviceWith(repo).continueCustomerAuth(
      { phone: '07 12 34 56 78', device_id: 'persistent-device-id-0001' },
      { ip: '192.0.2.12' },
    );

    expect(result.continuation).toBe('registration_otp_challenge');
    expect(repo.createRegistrationChallenge).toHaveBeenCalledOnce();
    expect(sendCustomerRegistrationOtp).toHaveBeenCalledWith('phone', '+212712345678', expect.stringMatching(/^\d{6}$/));
  });

  it('rejects tampered and expired password continuations', async () => {
    const repo = repositoryStub(true);
    const service = serviceWith(repo);
    const continuation = await service.continueCustomerAuth(
      { email: 'existing@example.com', device_id: 'persistent-device-id-0001' },
      { ip: '192.0.2.14' },
    );
    if (continuation.continuation !== 'password_challenge') throw new Error('Unexpected continuation');

    const separator = continuation.continuation_token.lastIndexOf('.');
    const signatureIndex = separator + 1;
    const replacement = continuation.continuation_token[signatureIndex] === 'A' ? 'B' : 'A';
    const tampered = `${continuation.continuation_token.slice(0, signatureIndex)}${replacement}${continuation.continuation_token.slice(signatureIndex + 1)}`;
    await expect(service.customerLogin({
      continuation_token: tampered,
      device_id: 'persistent-device-id-0001',
      password: 'correct-password-1',
    })).rejects.toMatchObject({ errorCode: 'invalid_credentials' });

    const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 11 * 60_000);
    await expect(service.customerLogin({
      continuation_token: continuation.continuation_token,
      device_id: 'persistent-device-id-0001',
      password: 'correct-password-1',
    })).rejects.toMatchObject({ errorCode: 'invalid_credentials' });
    clock.mockRestore();
  });

  it('stops a rate-limited continuation before lookup or OTP delivery', async () => {
    const repo = repositoryStub(false);
    repo.countRecentAuthContinuationAttempts.mockResolvedValue({ identifier: 5, device: 0, ip: 0 });

    await expect(serviceWith(repo).continueCustomerAuth(
      { email: 'new@example.com', device_id: 'persistent-device-id-0001' },
      { ip: '192.0.2.13' },
    )).rejects.toMatchObject({ errorCode: 'auth_continuation_rate_limited' });
    expect(repo.customerAuthIdentifierExists).not.toHaveBeenCalled();
    expect(sendCustomerRegistrationOtp).not.toHaveBeenCalled();
  });
});

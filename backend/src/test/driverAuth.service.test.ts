import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';

const mocks = vi.hoisted(() => ({
  findDriverByCin: vi.fn(),
  findDriverById: vi.fn(),
  getSettings: vi.fn(),
  updateDriverAuthMetadata: vi.fn(),
  signDriverToken: vi.fn(() => 'driver-session-token'),
}));

vi.mock('../features/auth/driverAuth.repository', () => ({
  DriverAuthRepository: vi.fn().mockImplementation(function DriverAuthRepository() {
    return mocks;
  }),
}));

vi.mock('../utils/jwt', () => ({
  signDriverToken: mocks.signDriverToken,
}));

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn() },
}));

import { DriverAuthService } from '../features/auth/driverAuth.service';

const driver = {
  id: 'driver-1',
  user_id: 'user-1',
  full_name: 'Driver Test',
  phone: '+212600000000',
  cin: 'AB123456',
  password_hash: 'stored-password-hash',
  vehicle_type: 'motorcycle',
  vehicle_plate: 'TEST-1',
  is_online: false,
  is_verified: true,
  is_active: true,
  kyc_status: 'approved',
  city: 'Safi',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  password_changed_at: '2026-01-01T00:00:00.000Z',
  failed_login_attempts: 0,
  locked_until: null,
};

describe('DriverAuthService credential-only login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findDriverByCin.mockResolvedValue(driver);
    mocks.updateDriverAuthMetadata.mockResolvedValue(undefined);
  });

  it('issues a session after valid CIN and password without starting OTP', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const service = new DriverAuthService();

    const result = await service.driverLogin({ cin: ' ab123456 ', password: 'valid-password' });

    expect(result.token).toBe('driver-session-token');
    expect(result.driver.id).toBe(driver.id);
    expect(mocks.getSettings).not.toHaveBeenCalled();
    expect(mocks.updateDriverAuthMetadata).toHaveBeenCalledWith(driver.id, expect.objectContaining({
      failed_login_attempts: 0,
      locked_until: null,
      otp_challenge_nonce_hash: null,
      otp_challenge_expires_at: null,
      last_login_at: expect.any(String),
    }));
  });

  it('keeps failed-password lockout protection active', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const service = new DriverAuthService();

    await expect(service.driverLogin({ cin: driver.cin, password: 'wrong-password' }))
      .rejects.toThrow(/Identifiants invalides/);

    expect(mocks.updateDriverAuthMetadata).toHaveBeenCalledWith(driver.id, expect.objectContaining({
      failed_login_attempts: 1,
    }));
    expect(mocks.signDriverToken).not.toHaveBeenCalled();
  });
});

import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerService } from '../features/customer/customer.service';
import { mockSupabase } from './setup';

const SECRET = 'test-jwt-secret-minimum-16-chars-long';

function makeService(currentUser: Record<string, any>) {
  const service = new CustomerService();
  const repo = {
    getUser: vi.fn().mockResolvedValue(currentUser),
    updateUser: vi.fn(async (userId: string, updates: Record<string, unknown>) => ({
      ...currentUser,
      id: userId,
      ...updates,
    })),
  };
  (service as any).repo = repo;
  return { service, repo };
}

function otpProof(payload: Record<string, unknown>) {
  return jwt.sign({ kind: 'otp_proof', nonce: 'test-nonce', ...payload }, SECRET, { expiresIn: '5m' });
}

describe('CustomerService.updateProfile contact changes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.admin.updateUserById.mockResolvedValue({ data: null, error: null });
  });

  it('normalizes a changed Moroccan phone and requires matching OTP proof', async () => {
    const { service, repo } = makeService({
      id: 'user-1',
      phone: '+212600000000',
      email: 'old@example.com',
    });

    await service.updateProfile('user-1', {
      phone: '0612345678',
      phone_otp_proof: otpProof({ phone: '+212612345678' }),
    });

    expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith('user-1', {
      phone: '+212612345678',
    });
    expect(repo.updateUser).toHaveBeenCalledWith('user-1', {
      phone: '+212612345678',
    });
  });

  it('rejects changed phone without OTP proof', async () => {
    const { service, repo } = makeService({
      id: 'user-1',
      phone: '+212600000000',
      email: 'old@example.com',
    });

    await expect(service.updateProfile('user-1', { phone: '0612345678' })).rejects.toMatchObject({
      errorCode: 'contact_otp_required',
    });
    expect(repo.updateUser).not.toHaveBeenCalled();
    expect(mockSupabase.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it('normalizes changed email and does not persist OTP proof fields', async () => {
    const { service, repo } = makeService({
      id: 'user-1',
      phone: '+212600000000',
      email: 'old@example.com',
    });

    await service.updateProfile('user-1', {
      email: '  NEW@Example.COM ',
      email_otp_proof: otpProof({ email: 'new@example.com' }),
    });

    expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith('user-1', {
      email: 'new@example.com',
    });
    expect(repo.updateUser).toHaveBeenCalledWith('user-1', {
      email: 'new@example.com',
    });
  });

  it('rejects mismatched email OTP proof', async () => {
    const { service, repo } = makeService({
      id: 'user-1',
      phone: '+212600000000',
      email: 'old@example.com',
    });

    await expect(service.updateProfile('user-1', {
      email: 'new@example.com',
      email_otp_proof: otpProof({ email: 'other@example.com' }),
    })).rejects.toMatchObject({
      errorCode: 'contact_otp_mismatch',
    });
    expect(repo.updateUser).not.toHaveBeenCalled();
    expect(mockSupabase.auth.admin.updateUserById).not.toHaveBeenCalled();
  });
});

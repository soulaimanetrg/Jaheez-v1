import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminAuthService } from '../features/auth/adminAuth.service';

// Mock the repository
const mockRepo = {
  getRecentAttempts: vi.fn(),
  findAdminByEmail: vi.fn(),
  recordLoginAttempt: vi.fn(),
};

vi.mock('../features/auth/adminAuth.repository', () => {
  return {
    AdminAuthRepository: vi.fn().mockImplementation(function() {
      return mockRepo;
    }),
  };
});

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn() },
  compare: vi.fn(),
}));

// Mock JWT utils
vi.mock('../utils/jwt', () => ({
  signAdminAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  signAdminRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  verifyAdminToken: vi.fn(),
}));

import { AdminAuthRepository } from '../features/auth/adminAuth.repository';
import bcrypt from 'bcryptjs';

describe('AdminAuthService', () => {
  let service: AdminAuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminAuthService();
  });

  describe('getLockoutState', () => {
    it('should return unlocked when fewer than 3 attempts', async () => {
      mockRepo.getRecentAttempts.mockResolvedValue([
        { success: false, created_at: new Date().toISOString() },
      ]);

      const result = await service.getLockoutState('test@jaheez.ma');
      expect(result.locked).toBe(false);
      expect(result.retryAfterSec).toBe(0);
    });

    it('should return locked after 3 consecutive failures within window', async () => {
      const now = Date.now();
      mockRepo.getRecentAttempts.mockResolvedValue([
        { success: false, created_at: new Date(now).toISOString() },
        { success: false, created_at: new Date(now - 1000).toISOString() },
        { success: false, created_at: new Date(now - 2000).toISOString() },
      ]);

      const result = await service.getLockoutState('test@jaheez.ma');
      expect(result.locked).toBe(true);
      expect(result.retryAfterSec).toBeGreaterThan(0);
    });

    it('should return unlocked if one attempt was successful', async () => {
      const now = Date.now();
      mockRepo.getRecentAttempts.mockResolvedValue([
        { success: false, created_at: new Date(now).toISOString() },
        { success: true, created_at: new Date(now - 1000).toISOString() },
        { success: false, created_at: new Date(now - 2000).toISOString() },
      ]);

      const result = await service.getLockoutState('test@jaheez.ma');
      expect(result.locked).toBe(false);
    });

    it('should return unlocked if lockout window has expired', async () => {
      const old = Date.now() - 15 * 60 * 1000; // 15 minutes ago (beyond 10-min window)
      mockRepo.getRecentAttempts.mockResolvedValue([
        { success: false, created_at: new Date(old).toISOString() },
        { success: false, created_at: new Date(old - 1000).toISOString() },
        { success: false, created_at: new Date(old - 2000).toISOString() },
      ]);

      const result = await service.getLockoutState('test@jaheez.ma');
      expect(result.locked).toBe(false);
    });
  });

  describe('adminLogin', () => {
    const validPayload = {
      email: 'Admin@Jaheez.ma',
      password: 'SecurePass123!',
      remember_me: false,
    };

    const mockAdmin = {
      id: 'admin-uuid-1',
      email: 'admin@jaheez.ma',
      full_name: 'Test Admin',
      role: 'super_admin',
      is_active: true,
      password_hash: '$2a$10$hashedpassword',
    };

    it('should throw ForbiddenError when account is locked', async () => {
      // Simulate lockout
      const now = Date.now();
      mockRepo.getRecentAttempts.mockResolvedValue([
        { success: false, created_at: new Date(now).toISOString() },
        { success: false, created_at: new Date(now - 1000).toISOString() },
        { success: false, created_at: new Date(now - 2000).toISOString() },
      ]);

      await expect(service.adminLogin(validPayload, '127.0.0.1'))
        .rejects.toThrow(/verrouillé/i);
    });

    it('should throw UnauthorizedError for non-existent admin', async () => {
      mockRepo.getRecentAttempts.mockResolvedValue([]);
      mockRepo.findAdminByEmail.mockResolvedValue(null);

      await expect(service.adminLogin(validPayload, '127.0.0.1'))
        .rejects.toThrow(/Identifiants invalides/);

      expect(mockRepo.recordLoginAttempt).toHaveBeenCalledWith(
        'admin@jaheez.ma', '127.0.0.1', false
      );
    });

    it('should throw UnauthorizedError for inactive admin', async () => {
      mockRepo.getRecentAttempts.mockResolvedValue([]);
      mockRepo.findAdminByEmail.mockResolvedValue({ ...mockAdmin, is_active: false });

      await expect(service.adminLogin(validPayload, '127.0.0.1'))
        .rejects.toThrow(/Identifiants invalides/);
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      mockRepo.getRecentAttempts.mockResolvedValue([]);
      mockRepo.findAdminByEmail.mockResolvedValue(mockAdmin);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(service.adminLogin(validPayload, '127.0.0.1'))
        .rejects.toThrow(/Mot de passe incorrect/);

      expect(mockRepo.recordLoginAttempt).toHaveBeenCalledWith(
        'admin@jaheez.ma', '127.0.0.1', false
      );
    });

    it('should return token and admin data on successful login', async () => {
      mockRepo.getRecentAttempts.mockResolvedValue([]);
      mockRepo.findAdminByEmail.mockResolvedValue(mockAdmin);
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await service.adminLogin(validPayload, '127.0.0.1');

      expect(result.token).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.admin.email).toBe('admin@jaheez.ma');
      expect(result.admin.role).toBe('super_admin');
      expect(mockRepo.recordLoginAttempt).toHaveBeenCalledWith(
        'admin@jaheez.ma', '127.0.0.1', true
      );
    });

    it('should normalize email to lowercase and trim', async () => {
      mockRepo.getRecentAttempts.mockResolvedValue([]);
      mockRepo.findAdminByEmail.mockResolvedValue(mockAdmin);
      (bcrypt.compare as any).mockResolvedValue(true);

      await service.adminLogin({ ...validPayload, email: '  Admin@JAHEEZ.MA  ' }, null);

      expect(mockRepo.findAdminByEmail).toHaveBeenCalledWith('admin@jaheez.ma');
    });
  });
});

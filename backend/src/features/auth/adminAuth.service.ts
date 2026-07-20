import bcrypt from 'bcryptjs';
import { AdminAuthRepository } from './adminAuth.repository';
import { signAdminAccessToken, signAdminRefreshToken } from '../../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../../middleware/error.middleware';

const LOCKOUT_THRESHOLD = 3;
const LOCKOUT_WINDOW_MIN = 10;

export class AdminAuthService {
  private repo = new AdminAuthRepository();

  /**
   * Evaluate if admin account is currently locked out
   */
  async getLockoutState(email: string): Promise<{ locked: boolean; retryAfterSec: number }> {
    const attempts = await this.repo.getRecentAttempts(email, LOCKOUT_THRESHOLD);
    
    if (attempts.length < LOCKOUT_THRESHOLD) {
      return { locked: false, retryAfterSec: 0 };
    }

    const allFailures = attempts.every((r: { success: boolean }) => !r.success);
    if (!allFailures) {
      return { locked: false, retryAfterSec: 0 };
    }

    const newest = new Date(attempts[0].created_at).getTime();
    const oldest = new Date(attempts[attempts.length - 1].created_at).getTime();
    const windowMs = LOCKOUT_WINDOW_MIN * 60 * 1000;

    // The burst must have occurred within the configured window
    if (newest - oldest > windowMs) {
      return { locked: false, retryAfterSec: 0 };
    }

    const unlockAt = newest + windowMs;
    const retryAfterSec = Math.ceil((unlockAt - Date.now()) / 1000);

    if (retryAfterSec <= 0) {
      return { locked: false, retryAfterSec: 0 };
    }

    return { locked: true, retryAfterSec };
  }

  /**
   * Admin Login processing
   */
  async adminLogin(payload: any, ip: string | null) {
    const { email, password, remember_me } = payload;
    const lowerEmail = email.toLowerCase().trim();

    // 1. Check lockout status
    const lock = await this.getLockoutState(lowerEmail);
    if (lock.locked) {
      throw new ForbiddenError(
        `Compte verrouillé. Réessayez dans ${Math.ceil(lock.retryAfterSec / 60)} minute(s).`,
        'account_locked'
      );
    }

    // 2. Fetch admin row
    const admin = await this.repo.findAdminByEmail(lowerEmail);
    if (!admin || !admin.is_active) {
      await this.repo.recordLoginAttempt(lowerEmail, ip, false);
      throw new UnauthorizedError('Identifiants invalides (Compte introuvable)');
    }

    // 3. Verify password hash
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      await this.repo.recordLoginAttempt(lowerEmail, ip, false);
      throw new UnauthorizedError('Identifiants invalides (Mot de passe incorrect)');
    }

    // 4. Log success and create token session
    await this.repo.recordLoginAttempt(lowerEmail, ip, true);

    const token = signAdminAccessToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      remember_me: !!remember_me,
    });

    const refreshToken = signAdminRefreshToken(admin.id);

    return {
      token,
      refreshToken,
      admin: {
        id: admin.id,
        auth_id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
      },
    };
  }
}

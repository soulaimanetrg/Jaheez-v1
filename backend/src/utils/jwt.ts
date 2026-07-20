import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AdminTokenPayload, DriverTokenPayload } from '../features/auth/auth.types';

export type { AdminTokenPayload, DriverTokenPayload } from '../features/auth/auth.types';

// Driver tokens get their own secret so a leak of either secret only
// compromises one role. Falls back to ADMIN_JWT_SECRET until provisioned.
const DRIVER_JWT_SECRET = env.DRIVER_JWT_SECRET || env.ADMIN_JWT_SECRET;

/**
 * Sign custom JWT admin access token (15 mins expiration)
 */
export function signAdminAccessToken(
  payload: Omit<AdminTokenPayload, 'last_seen' | 'abs_exp' | 'kind'>,
  options?: { absExp?: number }
): string {
  const now = Math.floor(Date.now() / 1000);
  const lifespan = 15 * 60; // 15 mins
  const absExp = options?.absExp ?? now + (payload.remember_me ? 30 * 86400 : 24 * 3600); // Max absolute life (30 days or 24 hours)

  const tokenPayload: AdminTokenPayload = {
    ...payload,
    kind: 'admin',
    last_seen: now,
    abs_exp: absExp,
  };

  return jwt.sign(tokenPayload, env.ADMIN_JWT_SECRET, { expiresIn: lifespan });
}

/**
 * Sign custom JWT admin refresh token (30 days expiration)
 */
export function signAdminRefreshToken(adminId: string): string {
  return jwt.sign({ id: adminId, kind: 'admin_refresh' }, env.ADMIN_JWT_SECRET, {
    expiresIn: '30d',
  });
}

/**
 * Sign custom JWT driver token (30 days expiration)
 */
export function signDriverToken(payload: Omit<DriverTokenPayload, 'kind'>): string {
  const tokenPayload: DriverTokenPayload = {
    ...payload,
    kind: 'driver',
    sub: payload.driver_id,
    actor: 'driver',
  };
  return jwt.sign(tokenPayload, DRIVER_JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Verify custom Admin JWT token
 */
export function verifyAdminToken(token: string): AdminTokenPayload {
  const payload = jwt.verify(token, env.ADMIN_JWT_SECRET) as AdminTokenPayload;
  if (payload.kind !== 'admin' || !payload.id) {
    throw new Error('invalid_admin_token_kind');
  }
  return payload;
}

/**
 * Verify custom Driver JWT token
 */
export function verifyDriverToken(token: string): DriverTokenPayload {
  const payload = jwt.verify(token, DRIVER_JWT_SECRET) as DriverTokenPayload;
  if (payload.kind !== 'driver' || payload.actor !== 'driver' || !payload.driver_id) {
    throw new Error('invalid_driver_token_kind');
  }
  return payload;
}

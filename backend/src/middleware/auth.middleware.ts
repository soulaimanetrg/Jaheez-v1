import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken, signAdminAccessToken, AdminTokenPayload } from '../utils/jwt';
import { supabase } from '../db/supabase';
import { UnauthorizedError } from './error.middleware';

const IDLE_TIMEOUT_SEC = 4 * 3600; // 4 hours

export async function adminAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Accès non autorisé', 'no_token'));
  }

  const token = header.slice(7);
  let payload: AdminTokenPayload;

  try {
    payload = verifyAdminToken(token);
  } catch (e: any) {
    const code = e && e.name === 'TokenExpiredError' ? 'token_expired' : 'token_invalid';
    return next(new UnauthorizedError('Session expirée, veuillez vous reconnecter', code));
  }

  if (payload.kind !== 'admin') {
    return next(new UnauthorizedError('Token non admin refusé', 'wrong_kind'));
  }

  const now = Math.floor(Date.now() / 1000);

  // Check absolute expiration limit
  if (now > payload.abs_exp) {
    return next(new UnauthorizedError('Session expirée', 'token_expired'));
  }

  // Check sliding idle timeout limit
  if (now - payload.last_seen > IDLE_TIMEOUT_SEC) {
    return next(new UnauthorizedError('Session expirée pour inactivité', 'idle_expired'));
  }

  try {
    // Query the database to check if the admin account is still active and valid.
    const { data: dbAdmin, error } = await supabase
      .from('admins')
      .select('id, email, role, is_active')
      .eq('id', payload.id)
      .maybeSingle();

    if (error || !dbAdmin) {
      return next(new UnauthorizedError('Compte non trouvé ou inactif', 'account_disabled'));
    }

    if (dbAdmin.is_active === false) {
      return next(new UnauthorizedError('Compte désactivé', 'account_disabled'));
    }

    // Refresh sliding session window
    const newPayload: AdminTokenPayload = {
      id: dbAdmin.id,
      email: dbAdmin.email,
      role: dbAdmin.role,
      kind: 'admin',
      last_seen: now,
      abs_exp: payload.abs_exp,
      remember_me: payload.remember_me,
    };

    // Re-sign access token with the original absolute cap preserved.
    const newToken = signAdminAccessToken({
      id: dbAdmin.id,
      email: dbAdmin.email,
      role: dbAdmin.role,
      remember_me: payload.remember_me,
    }, { absExp: payload.abs_exp });

    res.setHeader('X-New-Token', newToken);
    res.setHeader('Access-Control-Expose-Headers', 'X-New-Token');

    req.admin = newPayload;
    next();
  } catch (e: any) {
    return next(new UnauthorizedError('Erreur de validation de session', 'auth_db_error'));
  }
}

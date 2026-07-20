import { Request, Response, NextFunction } from 'express';
import { verifyDriverToken } from '../utils/jwt';
import { isDriverActive } from '../utils/driverStatus';
import { UnauthorizedError, ForbiddenError } from './error.middleware';

/**
 * Middleware to authenticate driver application requests.
 */
export async function driverAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Accès non autorisé', 'no_token'));
  }

  const token = header.slice(7);
  try {
    const payload = verifyDriverToken(token);
    if (payload.kind !== 'driver' || !payload.driver_id || payload.actor !== 'driver') {
      return next(new UnauthorizedError('Token invalide', 'token_invalid'));
    }

    // Driver JWTs live 30 days; revocation happens here, not at token expiry.
    let active: boolean;
    try {
      active = await isDriverActive(payload.driver_id);
    } catch {
      return next(new UnauthorizedError('Vérification du compte impossible', 'auth_verification_failed'));
    }
    if (!active) {
      return next(new ForbiddenError('Compte livreur désactivé', 'account_disabled'));
    }

    req.driver = payload;
    next();
  } catch (e: any) {
    const code = e && e.name === 'TokenExpiredError' ? 'token_expired' : 'token_invalid';
    return next(new UnauthorizedError('Session expirée, veuillez vous reconnecter', code));
  }
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase';
import { UnauthorizedError, ForbiddenError, HttpError } from './error.middleware';

// Load Supabase JWT secret from process.env directly if not globally parsed
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

/**
 * Middleware to verify Supabase JWT tokens from mobile clients.
 * Enforces real-time ban checks against the public.users database table.
 */
export async function verifySupabaseJwt(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token manquant', 'no_token'));
  }

  const token = header.slice(7);
  let userId: string | null = null;
  let email: string | undefined = undefined;
  let role: string | undefined = undefined;

  // Option A: Local verification (fast, no network)
  if (SUPABASE_JWT_SECRET) {
    try {
      const payload = jwt.verify(token, SUPABASE_JWT_SECRET) as any;
      userId = payload.sub;
      email = payload.email;
      role = payload.role;
    } catch (e: any) {
      const code = e && e.name === 'TokenExpiredError' ? 'token_expired' : 'token_invalid';
      return next(new UnauthorizedError('Session expirée', code));
    }
  } else {
    // Option B: Network call to Supabase auth (fallback if secret not set)
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return next(new UnauthorizedError('Token invalide', 'token_invalid'));
      }
      userId = user.id;
      email = user.email;
      role = user.role;
    } catch (e: any) {
      return next(new UnauthorizedError('Erreur de vérification auth', 'auth_verification_failed'));
    }
  }

  if (!userId) {
    return next(new UnauthorizedError('Utilisateur non identifié', 'user_not_identified'));
  }

  req.supabaseUser = { id: userId, email, role };

  // Enforce ban and existence validation (fail closed: an unverifiable ban
  // status must never allow the request through).
  try {
    const { data: profileRow, error: profileErr } = await supabase
      .from('users')
      .select('is_banned')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) {
      console.error('[auth] Error checking ban status:', profileErr.message);
      return next(new UnauthorizedError('Vérification du compte impossible', 'auth_verification_failed'));
    }
    if (!profileRow) {
      // User was deleted from the database
      return next(new UnauthorizedError('Utilisateur introuvable ou supprimé', 'user_not_found'));
    }
    if (profileRow.is_banned) {
      return next(new ForbiddenError('Compte suspendu / Banni', 'account_disabled'));
    }
  } catch (err: any) {
    console.error('[auth] Ban lookup exception:', err.message);
    return next(new UnauthorizedError('Vérification du compte impossible', 'auth_verification_failed'));
  }

  next();
}

/**
 * Bootstrap is the only authenticated route allowed before public.users exists.
 * It validates the access token against Supabase so the service receives the
 * complete Auth user (phone, confirmation timestamp, and signup metadata).
 */
export async function verifySupabaseJwtForCustomerBootstrap(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next(new UnauthorizedError('Token manquant', 'no_token'));
  try {
    const { data: { user }, error } = await supabase.auth.getUser(header.slice(7));
    if (error || !user) return next(new UnauthorizedError('Session invalide', 'token_invalid'));
    const { data: profile, error: profileError } = await supabase.from('users')
      .select('is_banned,deleted_at,blocked_at,auth_risk_level')
      .eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (profile?.deleted_at) return next(new UnauthorizedError('Compte supprime', 'account_deleted'));
    if (profile?.is_banned || profile?.blocked_at || profile?.auth_risk_level === 'blocked') return next(new ForbiddenError('Compte suspendu', 'account_disabled'));
    req.supabaseUser = user;
    next();
  } catch (error: any) {
    if (error instanceof HttpError) return next(error);
    return next(new UnauthorizedError('Verification de session impossible', 'auth_verification_failed'));
  }
}

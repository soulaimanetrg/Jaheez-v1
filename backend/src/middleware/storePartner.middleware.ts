import { createHash, timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { UnauthorizedError, ForbiddenError } from './error.middleware';

const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();

export async function storePartnerAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const raw = String(req.headers['x-store-key'] || '');
    const separator = raw.indexOf('.');
    if (separator < 4) throw new UnauthorizedError('Identifiants partenaire requis', 'store_key_required');
    const prefix = raw.slice(0, separator);
    const secret = raw.slice(separator + 1);
    const { data, error } = await supabase.from('store_partner_credentials')
      .select('id,store_id,secret_hash,scopes,is_active,expires_at').eq('key_prefix', prefix).maybeSingle();
    if (error || !data || !data.is_active || (data.expires_at && new Date(data.expires_at) <= new Date())) {
      throw new UnauthorizedError('Identifiants partenaire invalides', 'store_key_invalid');
    }
    const supplied = digest(secret);
    const expected = Buffer.from(data.secret_hash, 'hex');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      throw new UnauthorizedError('Identifiants partenaire invalides', 'store_key_invalid');
    }
    if (!data.scopes?.includes('order:ready')) throw new ForbiddenError('Portee insuffisante', 'store_scope_denied');
    req.storePartner = { credentialId: data.id, storeId: data.store_id, scopes: data.scopes };
    void supabase.from('store_partner_credentials').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
    next();
  } catch (error) { next(error); }
}

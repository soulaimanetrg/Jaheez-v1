import { createHash, randomBytes } from 'crypto';
import { supabase } from '../../db/supabase';
import { BadRequestError } from '../../middleware/error.middleware';

export class StoreCredentialService {
  async create(storeId: string, name: string, adminId: string, expiresAt?: string | null) {
    if (!storeId || String(name || '').trim().length < 3) throw new BadRequestError('Magasin et nom requis');
    const prefix = randomBytes(6).toString('hex');
    const secret = randomBytes(32).toString('base64url');
    const secretHash = createHash('sha256').update(secret, 'utf8').digest('hex');
    const { data, error } = await supabase.from('store_partner_credentials').insert({ store_id: storeId,
      name: name.trim(), key_prefix: prefix, secret_hash: secretHash, scopes: ['order:ready'],
      expires_at: expiresAt || null, created_by: adminId }).select('id,store_id,name,key_prefix,scopes,expires_at,created_at').single();
    if (error) throw new Error(error.message);
    return { ...data, api_key: `${prefix}.${secret}` }; // Returned once; only the hash is stored.
  }
  async revoke(id: string, adminId: string) {
    const { data, error } = await supabase.from('store_partner_credentials').update({ is_active: false,
      revoked_by: adminId, revoked_at: new Date().toISOString() }).eq('id', id).select('id,store_id,is_active,revoked_at').single();
    if (error) throw new Error(error.message); return data;
  }
}

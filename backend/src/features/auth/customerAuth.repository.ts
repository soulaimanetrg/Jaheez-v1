import { supabase } from '../../db/supabase';
import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env';

const customerAuthClient = () => createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export class CustomerAuthRepository {
  async signUpCustomer(phone: string, password: string, metadata: Record<string, unknown>) {
    const { data, error } = await customerAuthClient().auth.signUp({
      phone, password, options: { channel: 'whatsapp', data: metadata },
    });
    if (error) throw error;
    return data;
  }

  async createPasswordCustomer(phone: string, password: string, metadata: Record<string, unknown>) {
    const { data, error } = await supabase.auth.admin.createUser({
      phone,
      password,
      phone_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    return data.user;
  }

  async createEmailPasswordCustomer(email: string, password: string, metadata: Record<string, unknown>) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    return data.user;
  }

  async signInCustomer(phone: string, password: string) {
    const { data, error } = await customerAuthClient().auth.signInWithPassword({ phone, password });
    if (error) throw error;
    return data;
  }

  async signInEmailCustomer(email: string, password: string) {
    const { data, error } = await customerAuthClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async verifyCustomerSignup(phone: string, code: string) {
    const { data, error } = await customerAuthClient().auth.verifyOtp({ phone, token: code, type: 'sms' });
    if (error) throw error;
    return data;
  }

  async resendCustomerSignup(phone: string) {
    const { error } = await customerAuthClient().auth.resend({ type: 'sms', phone });
    if (error) throw error;
  }

  async requestCustomerRecovery(phone: string) {
    const { error } = await customerAuthClient().auth.signInWithOtp({ phone, options: { shouldCreateUser: false, channel: 'whatsapp' } });
    if (error) throw error;
  }
  async createAuthUser(params: any): Promise<any> {
    const { data, error } = await supabase.auth.admin.createUser(params);
    if (error) throw new Error(error.message);
    return data.user;
  }

  async createUserProfile(profileData: any): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .insert(profileData)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async upsertUserProfile(profileData: any): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .upsert(profileData, { onConflict: 'id', ignoreDuplicates: false })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async findCustomerProfileById(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async findCompleteDefaultAddress(userId: string): Promise<any | null> {
    const { data, error } = await supabase.from('user_addresses')
      .select('id,label,address,lat,lng,is_default,building_info,nearby_landmark,delivery_instructions,location_source')
      .eq('user_id', userId).eq('is_default', true).not('lat', 'is', null).not('lng', 'is', null).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async findUserProfileByPhoneOrDigits(phone: string, digits: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, is_banned, deleted_at')
      .or(`phone.eq.${phone},phone.eq.${digits}`)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async getAuthUserById(userId: string): Promise<any | null> {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) throw new Error(error.message);
    return data?.user || null;
  }

  async findAuthUserByPhone(phone: string): Promise<any | null> {
    const target = phone.replace(/\D/g, '');
    for (let page = 1; page <= 20; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw new Error(error.message);
      const match = data.users.find(user => String(user.phone || '').replace(/\D/g, '') === target);
      if (match) return match;
      if (data.users.length < 100) break;
    }
    return null;
  }

  async confirmDemoPhoneUser(userId: string, password: string, metadata: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.auth.admin.updateUserById(userId, { password, phone_confirm: true, user_metadata: metadata });
    if (error) throw new Error(error.message);
  }

  async updateAuthUserEmail(userId: string, email: string): Promise<void> {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
  }

  async findUserById(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, phone, full_name, email, deleted_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async softDeleteUser(userId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
    if (error) throw new Error(error.message);
  }

  async disableAuthUser(userId: string, nowIso: string): Promise<void> {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email: null as any,
      phone: null as any,
      ban_duration: '876000h',
      user_metadata: { deleted_at: nowIso }
    });
    if (error) throw new Error(error.message);
  }

  async writeAuditLog(auditData: any): Promise<void> {
    const { error } = await supabase
      .from('audit_log')
      .insert(auditData);
    if (error) {
      console.error('[customer auth repo] Failed to write audit log:', error.message);
    }
  }

  async getSettings(keys: string[]): Promise<Record<string, string>> {
    const { data, error } = await supabase.from('app_settings').select('key,value').in('key', keys);
    if (error) throw new Error(error.message);
    return Object.fromEntries((data || []).map((row: any) => [row.key, String(row.value)]));
  }

  async cleanupPhoneChallenges(): Promise<void> {
    const { error } = await supabase.rpc('cleanup_customer_phone_challenges');
    if (error) throw new Error(error.message);
  }

  async findActiveUserByPhone(phone: string): Promise<any | null> {
    const { data, error } = await supabase.from('users').select('id,deleted_at').eq('phone_e164', phone).is('deleted_at', null).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async createPhoneChallenge(row: any): Promise<any> {
    const { data, error } = await supabase.from('customer_phone_verification_challenges').insert(row).select('*').single();
    if (error) throw new Error(error.message);
    return data;
  }

  async countRecentPhoneChallenges(phoneHash: string, since: string): Promise<number> {
    const { count, error } = await supabase.from('customer_phone_verification_challenges')
      .select('id', { count: 'exact', head: true }).eq('phone_hash', phoneHash).gte('created_at', since);
    if (error) throw new Error(error.message);
    return count || 0;
  }

  async findActivePhoneChallenge(phoneHash: string, userId: string): Promise<any | null> {
    const { data, error } = await supabase.from('customer_phone_verification_challenges').select('*')
      .eq('phone_hash', phoneHash).eq('user_id', userId).is('consumed_at', null).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async findPhoneChallenge(id: string, userId: string): Promise<any | null> {
    const { data, error } = await supabase.from('customer_phone_verification_challenges').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async updatePhoneChallenge(id: string, updates: any): Promise<void> {
    const { error } = await supabase.from('customer_phone_verification_challenges').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async attachVerifiedPhone(userId: string, phone: string, now: string): Promise<any> {
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, { phone, phone_confirm: true });
    if (authError) throw new Error(authError.message);
    const { data, error } = await supabase.from('users').update({
      phone, phone_e164: phone, phone_verified: true, whatsapp_verified: true,
      whatsapp_verified_at: now, updated_at: now,
    }).eq('id', userId).select('*').single();
    if (error) throw new Error(error.message);
    return data;
  }
}

import { supabase } from '../../db/supabase';

export interface AdminDbRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class AdminAuthRepository {
  /**
   * Find admin account by email
   */
  async findAdminByEmail(email: string): Promise<AdminDbRow | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      throw new Error(`Database error looking up admin: ${error.message}`);
    }
    return data;
  }

  /**
   * Record admin login attempt
   */
  async recordLoginAttempt(email: string, ip: string | null, success: boolean): Promise<void> {
    const { error } = await supabase
      .from('admin_login_attempts')
      .insert({
        email: email.toLowerCase().trim(),
        ip,
        success,
      });

    if (error) {
      console.error('[admin auth repo] Failed to insert login attempt log:', error.message);
    }
  }

  /**
   * Get recent failed login attempts for lockout evaluation
   */
  async getRecentAttempts(email: string, limit: number): Promise<Array<{ created_at: string; success: boolean }>> {
    const { data, error } = await supabase
      .from('admin_login_attempts')
      .select('created_at, success')
      .eq('email', email.toLowerCase().trim())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[admin auth repo] Failed to fetch login attempts:', error.message);
      return [];
    }
    return data || [];
  }
}

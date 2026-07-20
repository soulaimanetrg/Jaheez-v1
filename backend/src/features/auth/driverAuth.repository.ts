import { supabase } from '../../db/supabase';

export interface DriverDbRow {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  cin?: string | null;
  password_hash?: string | null;
  vehicle_type: string;
  vehicle_plate?: string | null;
  is_online: boolean;
  is_verified: boolean;
  kyc_status: string;
  city: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  password_changed_at?: string | null;
  last_login_at?: string | null;
  failed_login_attempts?: number;
  locked_until?: string | null;
  driver_otp_enabled?: boolean;
  trusted_device_id?: string | null;
  last_otp_verified_at?: string | null;
  otp_failed_attempts?: number;
  otp_locked_until?: string | null;
  otp_challenge_nonce_hash?: string | null;
  otp_challenge_expires_at?: string | null;
  otp_last_sent_at?: string | null;
}

export class DriverAuthRepository {
  /**
   * Find driver by CIN (case insensitive check for CIN, trimmed and uppercased)
   */
  async findDriverByCin(cin: string): Promise<DriverDbRow | null> {
    const cleanCin = cin.trim().toUpperCase();

    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('cin', cleanCin)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error looking up driver: ${error.message}`);
    }
    return data;
  }

  async findDriverById(driverId: string): Promise<DriverDbRow | null> {
    const { data, error } = await supabase.from('drivers').select('*').eq('id', driverId).maybeSingle();
    if (error) throw new Error(`Database error looking up driver: ${error.message}`);
    return data;
  }

  async getSettings(keys: string[]): Promise<Record<string, string>> {
    const { data, error } = await supabase.from('app_settings').select('key,value').in('key', keys);
    if (error) throw new Error(`Database error loading auth settings: ${error.message}`);
    return Object.fromEntries((data || []).map((row: any) => [row.key, String(row.value)]));
  }

  /**
   * Update driver auth metadata
   */
  async updateDriverAuthMetadata(driverId: string, updates: {
    failed_login_attempts?: number;
    locked_until?: string | null;
    last_login_at?: string;
    driver_otp_enabled?: boolean;
    trusted_device_id?: string | null;
    last_otp_verified_at?: string;
    otp_failed_attempts?: number;
    otp_locked_until?: string | null;
    otp_challenge_nonce_hash?: string | null;
    otp_challenge_expires_at?: string | null;
    otp_last_sent_at?: string | null;
  }): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId);

    if (error) {
      throw new Error(`Database error updating driver auth metadata: ${error.message}`);
    }
  }
}

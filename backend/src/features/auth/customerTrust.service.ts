import { supabase } from '../../db/supabase';
import { ForbiddenError } from '../../middleware/error.middleware';

export class CustomerTrustService {
  async requireOrderReady(userId: string): Promise<void> {
    const { data, error } = await supabase.from('users')
      .select('id,role,is_banned,deleted_at,blocked_at,auth_risk_level,profile_completed_at,phone_e164')
      .eq('id', userId).maybeSingle();
    if (error || !data) throw new ForbiddenError('Customer profile unavailable', 'profile_unavailable');
    if (data.role !== 'user' || data.is_banned || data.deleted_at || data.blocked_at || data.auth_risk_level === 'blocked') {
      throw new ForbiddenError('Customer account is not active', 'account_disabled');
    }
    if (!data.profile_completed_at) throw new ForbiddenError('Complete your profile before ordering', 'profile_incomplete');
    // WhatsApp verification is temporarily outside the active customer flow.
    // A normalized phone identity is still mandatory; do not mark it WhatsApp-verified here.
    if (!data.phone_e164) throw new ForbiddenError('Add a phone number before ordering', 'phone_contact_required');
    const { data: address, error: addressError } = await supabase.from('user_addresses').select('id')
      .eq('user_id', userId).eq('is_default', true).not('lat', 'is', null).not('lng', 'is', null).maybeSingle();
    if (addressError) throw new Error(addressError.message);
    if (!address) throw new ForbiddenError('Add a delivery location before ordering', 'default_address_required');
  }
}

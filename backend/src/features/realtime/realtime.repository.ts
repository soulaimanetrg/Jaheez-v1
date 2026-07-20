import { supabase } from '../../db/supabase';

export class RealtimeRepository {
  async getOrderAccess(orderId: string): Promise<{ user_id: string; driver_id: string | null } | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('user_id, driver_id')
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error checking realtime order access: ${error.message}`);
    }
    return data;
  }
}

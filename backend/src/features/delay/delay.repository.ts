import { supabase } from '../../db/supabase';
import { isMissingColumnError } from '../../utils/schemaCompatibility';

export class DelayRepository {
  async recordTimeline(row: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('order_timeline_events').insert(row);
    if (error && error.code !== '23505') throw new Error(error.message);
  }

  async getEvidence(orderId: string): Promise<any | null> {
    const { data, error } = await supabase.from('orders')
      .select('id,store_id,driver_id,promised_ready_at,store_ready_at,driver_pickup_eta_at,driver_delivery_eta_at,arrived_pickup_at,picked_up_at,arrived_customer_at,delivered_at')
      .eq('id', orderId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    let driverAccuracy: number | null = null;
    if (data.driver_id) {
      let result = await supabase.from('drivers')
        .select('current_location_accuracy_meters,current_location_recorded_at,current_location_is_mocked,current_location_continuity_valid')
        .eq('id', data.driver_id)
        .maybeSingle();
      if (result.error && isMissingColumnError(result.error)) {
        result = await supabase.from('drivers')
          .select('current_location_accuracy_meters')
          .eq('id', data.driver_id)
          .maybeSingle();
      }
      if (result.error) throw new Error(result.error.message);
      driverAccuracy = result.data?.current_location_accuracy_meters == null ? null : Number(result.data.current_location_accuracy_meters);
      return {
        ...data,
        driver_accuracy_meters: driverAccuracy,
        driver_location_recorded_at: result.data?.current_location_recorded_at || null,
        driver_location_is_mocked: result.data?.current_location_is_mocked ?? null,
        driver_location_continuity_valid: result.data?.current_location_continuity_valid ?? null,
      };
    }
    return { ...data, driver_accuracy_meters: driverAccuracy };
  }

  async ensureBaselines(orderId: string, pickupMinutes = 15, prepMinutes = 20): Promise<void> {
    const now = Date.now();
    const { error } = await supabase.from('orders').update({
      driver_pickup_eta_at: new Date(now + pickupMinutes * 60_000).toISOString(),
      promised_ready_at: new Date(now + prepMinutes * 60_000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', orderId).is('driver_pickup_eta_at', null);
    if (error) throw new Error(error.message);
  }

  async setDeliveryBaseline(orderId: string, deliveryMinutes: number): Promise<void> {
    const { error } = await supabase.from('orders').update({
      driver_delivery_eta_at: new Date(Date.now() + Math.max(1, deliveryMinutes) * 60_000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);
    if (error) throw new Error(error.message);
  }
}

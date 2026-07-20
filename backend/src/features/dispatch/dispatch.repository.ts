import { supabase } from '../../db/supabase';
import { isMissingColumnError } from '../../utils/schemaCompatibility';
import { logger } from '../../config/logger';

export interface PendingOrder {
  id: string;
  user_id: string;
  status: string;
  dispatch_mode?: string | null;
  offered_driver_id: string | null;
  offer_expires_at: string | null;
  rejected_driver_ids: string[] | null;
  created_at: string;
  stores: {
    id: string;
    lat: number | null;
    lng: number | null;
    zone_id: string | null;
    store_capacity_state?: string | null;
    dispatch_mode?: string | null;
  } | {
    id: string;
    lat: number | null;
    lng: number | null;
    zone_id: string | null;
    store_capacity_state?: string | null;
    dispatch_mode?: string | null;
  }[] | null;
}

export interface ActiveDriver {
  id: string;
  current_lat: number | null;
  current_lng: number | null;
  state: string;
  driver_acceptance_rate: number;
  driver_timeout_count: number;
}

export class DispatchRepository {
  /**
   * Fetch pending unassigned orders
   */
  async getPendingOrders(): Promise<PendingOrder[]> {
    const query = supabase
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        dispatch_mode,
        offered_driver_id,
        offer_expires_at,
        rejected_driver_ids,
        created_at,
        stores(id, lat, lng, zone_id, store_capacity_state, dispatch_mode)
      `)
      .is('driver_id', null)
      .in('status', ['confirmed', 'preparing']);

    const { data, error } = await query;

    if (error && isMissingColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          status,
          offered_driver_id,
          offer_expires_at,
          rejected_driver_ids,
          created_at,
          stores(id, lat, lng, zone_id)
        `)
        .is('driver_id', null)
        .in('status', ['confirmed', 'preparing']);

      if (fallbackError) {
        throw new Error(`Database error fetching pending orders: ${fallbackError.message}`);
      }

      return ((fallbackData || []) as any[]).map(order => ({
        ...order,
        dispatch_mode: 'AUTO_DISPATCH',
        stores: Array.isArray(order.stores)
          ? order.stores.map((store: any) => ({ ...store, store_capacity_state: 'OPEN', dispatch_mode: 'AUTO_DISPATCH' }))
          : order.stores ? { ...order.stores, store_capacity_state: 'OPEN', dispatch_mode: 'AUTO_DISPATCH' } : null,
      }));
    }

    if (error) {
      throw new Error(`Database error fetching pending orders: ${error.message}`);
    }
    return (data || []) as any[];
  }

  /**
   * Fetch online and available drivers who are not paused
   */
  async getOnlineDrivers(): Promise<ActiveDriver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('id, current_lat, current_lng, state, driver_acceptance_rate, driver_timeout_count, paused_until, suspension_until')
      .eq('is_online', true)
      .eq('state', 'AVAILABLE')
      .not('current_lat', 'is', null)
      .not('current_lng', 'is', null);

    if (error) {
      throw new Error(`Database error fetching online drivers: ${error.message}`);
    }
    return (data || []) as any[];
  }

  /**
   * Fetch active delivery load (count of uncompleted orders) for all drivers.
   * Returns a map of driver_id -> count of active orders.
   */
  async getActiveLoads(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('orders')
      .select('driver_id')
      .not('driver_id', 'is', null)
      .not('status', 'in', '(completed,cancelled,delivered)');

    if (error) {
      throw new Error(`Database error fetching active loads: ${error.message}`);
    }

    const loads: Record<string, number> = {};
    (data || []).forEach((order: any) => {
      const driverId = order.driver_id;
      if (driverId) {
        loads[driverId] = (loads[driverId] || 0) + 1;
      }
    });

    return loads;
  }

  async getDeliveryZones(): Promise<any[]> {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('id, name_ar, dispatch_mode, neighbor_zone_ids');

    if (error && isMissingColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('delivery_zones')
        .select('id, name_ar, dispatch_mode');

      if (fallbackError && isMissingColumnError(fallbackError)) {
        const legacy = await supabase.from('delivery_zones').select('id, name_ar');
        if (legacy.error) {
          throw new Error(`Database error fetching delivery zones: ${legacy.error.message}`);
        }
        return (legacy.data || []).map(zone => ({ ...zone, dispatch_mode: 'AUTO_DISPATCH', neighbor_zone_ids: [] }));
      }
      if (fallbackError) {
        throw new Error(`Database error fetching delivery zones: ${fallbackError.message}`);
      }

      return (fallbackData || []).map(zone => ({ ...zone, neighbor_zone_ids: [] }));
    }

    if (error) {
      throw new Error(`Database error fetching delivery zones: ${error.message}`);
    }

    return data || [];
  }

  async markDriverOffered(driverId: string): Promise<void> {
    const { data: drv, error: fetchError } = await supabase
      .from('drivers')
      .select('total_offers, accepted_offers')
      .eq('id', driverId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Database error fetching driver offer stats: ${fetchError.message}`);
    }

    if (!drv) {
      return;
    }

    const nextTotal = (drv.total_offers || 0) + 1;
    const accepted = drv.accepted_offers || 0;
    const rate = Number(((accepted * 100.0) / nextTotal).toFixed(2));

    const { error } = await supabase
      .from('drivers')
      .update({
        state: 'OFFERED',
        total_offers: nextTotal,
        driver_acceptance_rate: rate,
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId);

    if (error) {
      throw new Error(`Database error marking driver offered: ${error.message}`);
    }
  }

  async applyDriverCooldown(
    driverId: string,
    reason: 'DECLINED_OFFER' | 'TIMED_OUT' | 'BREAK_ABUSE' | 'ADMIN_ACTION',
    cooldownUntil: string | null,
    state?: string
  ): Promise<void> {
    const updates: Record<string, any> = {
      cooldown_until: cooldownUntil,
      cooldown_reason: cooldownUntil ? reason : null,
      updated_at: new Date().toISOString()
    };

    if (state) {
      updates.state = state;
    }

    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId);

    if (error) {
      throw new Error(`Database error applying driver cooldown: ${error.message}`);
    }
  }

  async recordOfferEvent(params: {
    orderId: string;
    driverId: string | null;
    eventType: 'offered' | 'accepted' | 'declined' | 'timed_out' | 'expired' | 'reassigned' | 'cancelled_after_accept' | 'emergency_reassignment_requested';
    reason?: string | null;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const { error } = await supabase.from('dispatch_offer_history').insert({
      order_id: params.orderId,
      driver_id: params.driverId,
      event_type: params.eventType,
      reason: params.reason || null,
      metadata: params.metadata || {}
    });

    if (error) {
      if (isMissingColumnError(error)) {
        logger.warn('[dispatch] Dispatch offer history table is unavailable; skipping offer event record.', {
          event_type: params.eventType,
          order_id: params.orderId,
          driver_id: params.driverId,
        });
        return;
      }
      throw new Error(`Database error recording dispatch offer event: ${error.message}`);
    }
  }

  async expireOffer(params: {
    orderId: string;
    driverId: string;
    rejectedDriverIds: string[];
    reassignmentCount: number;
  }): Promise<boolean> {
    const now = new Date().toISOString();
    const updates = {
      offered_driver_id: null,
      offer_expires_at: null,
      rejected_driver_ids: params.rejectedDriverIds,
      reassignment_count: params.reassignmentCount,
      driver_fault: true,
      updated_at: now,
    };

    const runUpdate = async (payload: Record<string, any>) => supabase
      .from('orders')
      .update(payload)
      .eq('id', params.orderId)
      .eq('offered_driver_id', params.driverId)
      .is('driver_id', null)
      .lte('offer_expires_at', now)
      .select('id')
      .maybeSingle();

    const { data, error } = await runUpdate(updates);

    if (error) {
      if (isMissingColumnError(error)) {
        const fallbackUpdates = { ...updates };
        delete (fallbackUpdates as Partial<typeof updates>).reassignment_count;
        delete (fallbackUpdates as Partial<typeof updates>).driver_fault;

        const { data: fallbackData, error: fallbackError } = await runUpdate(fallbackUpdates);
        if (fallbackError) {
          throw new Error(`Database error expiring offer: ${fallbackError.message}`);
        }
        return Boolean(fallbackData);
      }

      throw new Error(`Database error expiring offer: ${error.message}`);
    }

    return Boolean(data);
  }

  async getDriverTimeoutInputs(driverId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('full_name, phone, is_online, total_offers, accepted_offers, driver_timeout_count, consecutive_timeouts')
      .eq('id', driverId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching driver timeout inputs: ${error.message}`);
    }

    return data;
  }

  async updateDriverAfterTimeout(driverId: string, updates: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId);

    if (error) {
      if (isMissingColumnError(error)) {
        const fallbackUpdates = { ...updates };
        delete fallbackUpdates.cooldown_until;
        delete fallbackUpdates.cooldown_reason;

        const { error: fallbackError } = await supabase
          .from('drivers')
          .update(fallbackUpdates)
          .eq('id', driverId);

        if (fallbackError) {
          throw new Error(`Database error updating driver after timeout: ${fallbackError.message}`);
        }
        return;
      }

      throw new Error(`Database error updating driver after timeout: ${error.message}`);
    }
  }

  async recalculateDriverReliability(driverId: string): Promise<number | null> {
    const { data: drv, error } = await supabase
      .from('drivers')
      .select('total_offers, accepted_offers, driver_timeout_count, warning_count, driver_suspicious_count, driver_acceptance_rate')
      .eq('id', driverId)
      .maybeSingle();

    if (error) {
      if (isMissingColumnError(error)) {
        logger.warn('[dispatch] Driver reliability columns are unavailable; skipping reliability recalculation.', { driver_id: driverId });
        return null;
      }
      throw new Error(`Database error fetching driver reliability inputs: ${error.message}`);
    }

    if (!drv) {
      return null;
    }

    const totalOffers = Number(drv.total_offers || 0);
    const acceptedOffers = Number(drv.accepted_offers || 0);
    const timeouts = Number(drv.driver_timeout_count || 0);
    const warnings = Number(drv.warning_count || 0);
    const suspicious = Number(drv.driver_suspicious_count || 0);
    const acceptanceRate = totalOffers > 0 ? (acceptedOffers * 100) / totalOffers : 100;
    const timeoutRate = totalOffers > 0 ? (timeouts * 100) / totalOffers : 0;

    // Conservative phase-1 score: reliability is dispatch priority only, never salary/commission.
    const rawScore = acceptanceRate - (timeoutRate * 0.35) - (warnings * 4) - (suspicious * 6);
    const score = Number(Math.max(0, Math.min(100, rawScore)).toFixed(2));

    const { error: updateError } = await supabase
      .from('drivers')
      .update({
        driver_reliability_score: score,
        reliability_updated_at: new Date().toISOString()
      })
      .eq('id', driverId);

    if (updateError) {
      if (isMissingColumnError(updateError)) {
        logger.warn('[dispatch] Driver reliability score column is unavailable; skipping reliability score update.', { driver_id: driverId });
        return null;
      }
      throw new Error(`Database error updating driver reliability: ${updateError.message}`);
    }

    return score;
  }

  async createReliabilitySnapshot(driverId: string): Promise<void> {
    const { data: drv, error } = await supabase
      .from('drivers')
      .select('driver_reliability_score, driver_acceptance_rate, driver_timeout_count, total_offers')
      .eq('id', driverId)
      .maybeSingle();

    if (error) {
      if (isMissingColumnError(error)) {
        logger.warn('[dispatch] Driver reliability snapshot inputs are unavailable; skipping reliability snapshot.', { driver_id: driverId });
        return;
      }
      throw new Error(`Database error fetching reliability snapshot inputs: ${error.message}`);
    }

    if (!drv) {
      return;
    }

    const totalOffers = Number(drv.total_offers || 0);
    const timeoutRate = totalOffers > 0 ? Number(((Number(drv.driver_timeout_count || 0) * 100) / totalOffers).toFixed(2)) : 0;

    const { error: snapshotError } = await supabase
      .from('driver_reliability_snapshots')
      .upsert({
        driver_id: driverId,
        snapshot_date: new Date().toISOString().slice(0, 10),
        score: Number(drv.driver_reliability_score ?? 100),
        acceptance_rate: Number(drv.driver_acceptance_rate ?? 100),
        timeout_rate: timeoutRate,
        lateness_rate: 0
      }, { onConflict: 'driver_id,snapshot_date' });

    if (snapshotError) {
      if (isMissingColumnError(snapshotError)) {
        logger.warn('[dispatch] Driver reliability snapshots table is unavailable; skipping reliability snapshot.', { driver_id: driverId });
        return;
      }
      throw new Error(`Database error writing reliability snapshot: ${snapshotError.message}`);
    }
  }
}

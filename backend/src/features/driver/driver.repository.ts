import { supabase } from '../../db/supabase';
import { DRIVER_ORDER_SELECT } from '../order/checkout.repository';
import { isMissingColumnError } from '../../utils/schemaCompatibility';

export class DriverRepository {
  /**
   * Find driver by ID
   */
  async findDriverById(driverId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error looking up driver: ${error.message}`);
    }
    return data;
  }

  /**
   * Update driver record in Supabase
   */
  async updateDriver(driverId: string, updates: Record<string, any>): Promise<any | null> {
    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Database error updating driver: ${error.message}`);
    }
    return data;
  }

  async getActiveShift(driverId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('driver_shift_records')
      .select('*')
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Database error fetching active shift: ${error.message}`);
    return data;
  }

  async createShift(driverId: string): Promise<any> {
    const { data, error } = await supabase
      .from('driver_shift_records')
      .insert({
        driver_id: driverId,
        started_by: 'driver',
        status: 'active',
        payout_status: 'not_ready',
      })
      .select('*')
      .single();

    if (error) throw new Error(`Database error creating shift: ${error.message}`);
    return data;
  }

  async closeShift(shiftId: string, endedBy: string, reason: string): Promise<any> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('driver_shift_records')
      .update({
        ended_at: now,
        ended_by: endedBy,
        ended_reason: reason,
        status: 'closed',
        closed_by: endedBy,
        closed_at: now,
        updated_at: now,
      })
      .eq('id', shiftId)
      .eq('status', 'active')
      .select('*')
      .maybeSingle();

    if (error) throw new Error(`Database error closing shift: ${error.message}`);
    return data;
  }

  async closeShiftFinancial(driverId: string, shiftId: string, endedBy: string, reason: string): Promise<any> {
    const { data, error } = await supabase.rpc('close_driver_shift_financial', {
      p_driver_id: driverId, p_shift_id: shiftId, p_ended_by: endedBy, p_reason: reason,
    });
    if (error) throw new Error(`Database error finalizing shift: ${error.message}`);
    return data;
  }

  /**
   * Mark a driver offline after heartbeat expiry. Redis is only a temporary signal;
   * PostgreSQL/Supabase remains the source of truth for online state.
   */
  async markDriverOffline(driverId: string): Promise<any | null> {
    const { data: activeOrder } = await supabase
      .from('orders')
      .select('status')
      .eq('driver_id', driverId)
      .in('status', ['confirmed', 'preparing', 'picked_up'])
      .maybeSingle();

    const state = activeOrder
      ? activeOrder.status === 'picked_up' ? 'PICKUP' : 'ACCEPTED'
      : 'OFFLINE';

    const updates = {
      is_online: false,
      current_lat: null,
      current_lng: null,
      state,
      shift_active: false,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId)
      .select('*')
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      const legacyUpdates: Record<string, any> = { ...updates };
      delete legacyUpdates.shift_active;
      const retry = await supabase
        .from('drivers')
        .update(legacyUpdates)
        .eq('id', driverId)
        .select('*')
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      throw new Error(`Database error marking driver offline: ${error.message}`);
    }
    return data;
  }

  /**
   * Get orders filtered by scope (available, mine, history)
   */
  async getDriverOrders(driverId: string, scope: 'available' | 'mine' | 'history'): Promise<any[]> {
    let query = supabase.from('orders').select(DRIVER_ORDER_SELECT);

    if (scope === 'available') {
      // Unassigned orders in confirmed or preparing states offered to this driver and not expired
      query = query
        .is('driver_id', null)
        .in('status', ['confirmed', 'preparing'])
        .eq('offered_driver_id', driverId)
        .gt('offer_expires_at', new Date().toISOString());
    } else if (scope === 'history') {
      // Completed, delivered, or cancelled orders
      query = query.eq('driver_id', driverId).in('status', ['delivered', 'completed', 'cancelled']);
    } else {
      // Active orders assigned to driver
      query = query.eq('driver_id', driverId).in('status', ['confirmed', 'preparing', 'picked_up']);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
    if (error) {
      throw new Error(`Database error fetching driver orders: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Delete pending or rejected driver documents of a specific type
   */
  async deletePendingOrRejectedDoc(driverId: string, docType: string): Promise<void> {
    const { error } = await supabase
      .from('driver_documents')
      .delete()
      .eq('driver_id', driverId)
      .eq('doc_type', docType)
      .neq('status', 'approved');

    if (error) {
      throw new Error(`Database error deleting old document: ${error.message}`);
    }
  }

  /**
   * Insert a new driver document record
   */
  async insertDocument(driverId: string, docType: string, url: string): Promise<any> {
    const { data, error } = await supabase
      .from('driver_documents')
      .insert({
        driver_id: driverId,
        doc_type: docType,
        url,
        status: 'pending'
      })
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Database error inserting document: ${error.message}`);
    }
    return data;
  }

  /**
   * Fetch all documents for a driver
   */
  async getDriverDocuments(driverId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error fetching driver documents: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Fetch recent payout requests for a driver
   */
  async getPayouts(driverId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('driver_shift_records')
      .select('*')
      .eq('driver_id', driverId)
      .neq('payout_status', 'not_ready')
      .order('closed_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Database error fetching payouts: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Insert a support ticket (for reporting order issues)
   */
  async insertSupportRequest(request: any): Promise<any> {
    const { data, error } = await supabase
      .from('support_requests')
      .insert(request)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Database error inserting support ticket: ${error.message}`);
    }
    return data;
  }
}

import { supabase } from '../../db/supabase';
import { isMissingColumnError } from '../../utils/schemaCompatibility';

export class AdminRepository {
  private removeMissingManualAssignmentFields(updates: Record<string, any>): Record<string, any> {
    const fallback = { ...updates };
    delete fallback.heading_to_pickup_at;
    delete fallback.is_movement_warning;
    delete fallback.is_progress_flagged;
    delete fallback.is_arrived_warning;
    delete fallback.reassignment_count;
    delete fallback.driver_fault;
    delete fallback.is_refund_eligible;
    delete fallback.delivery_delay_minutes;
    return fallback;
  }

  async findDriverByCin(cin: string): Promise<any | null> {
    const cleanCin = cin.trim().toUpperCase();
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('cin', cleanCin)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error checking CIN: ${error.message}`);
    }
    return data;
  }

  async findDriverByPhone(phone: string): Promise<any | null> {
    const { data, error } = await supabase.from('drivers').select('id,phone').eq('phone', phone.trim()).maybeSingle();
    if (error) throw new Error(`Database error checking driver phone: ${error.message}`);
    return data;
  }

  async findDriverById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching driver: ${error.message}`);
    }
    return data;
  }

  async createDriver(driverData: any): Promise<any> {
    const { data, error } = await supabase
      .from('drivers')
      .insert(driverData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Database error creating driver: ${error.message}`);
    }
    return data;
  }

  async updateDriver(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Database error updating driver: ${error.message}`);
    }
    return data;
  }

  async updateDriverState(id: string, updates: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', id);

    if (error) {
      if (isMissingColumnError(error)) {
        const fallback = { ...updates };
        delete fallback.active_orders;
        delete fallback.last_moved_at;
        delete fallback.last_movement_lat;
        delete fallback.last_movement_lng;

        const { error: fallbackError } = await supabase
          .from('drivers')
          .update(fallback)
          .eq('id', id);

        if (fallbackError) {
          throw new Error(`Database error updating driver state: ${fallbackError.message}`);
        }
        return;
      }

      throw new Error(`Database error updating driver state: ${error.message}`);
    }
  }

  async manualAssignOrder(orderId: string, updates: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) {
      if (isMissingColumnError(error)) {
        const { error: fallbackError } = await supabase
          .from('orders')
          .update(this.removeMissingManualAssignmentFields(updates))
          .eq('id', orderId);

        if (fallbackError) {
          throw new Error(`Database error assigning order manually: ${fallbackError.message}`);
        }
        return;
      }

      throw new Error(`Database error assigning order manually: ${error.message}`);
    }
  }

  async insertOrderStatusHistory(historyData: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('order_status_history')
      .insert(historyData);

    if (error) {
      throw new Error(`Database error writing order status history: ${error.message}`);
    }
  }

  async findStoreById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching store: ${error.message}`);
    }
    return data;
  }

  async updateStore(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('stores')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Database error updating store: ${error.message}`);
    }
    return data;
  }

  async listDrivers(filter?: string, search?: string): Promise<any[]> {
    let q = supabase
      .from('drivers')
      .select('id, full_name, cin, phone, vehicle_type, vehicle_plate, is_active, is_online, is_verified, rating_avg, rating_count, city, created_at, state, paused_until, suspension_until, driver_acceptance_rate, driver_timeout_count, total_offers, accepted_offers')
      .order('created_at', { ascending: false });

    if (filter === 'active') q = q.eq('is_active', true);
    if (filter === 'suspended') q = q.eq('is_active', false);
    if (filter === 'online') q = q.eq('is_online', true);
    if (filter === 'unverified') q = q.eq('is_verified', false);
    if (search?.trim()) {
      const term = search.trim().replace(/[%_,]/g, '');
      q = q.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,cin.ilike.%${term}%`);
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getDriverDetails(id: string): Promise<any> {
    const [d, docs, payouts] = await Promise.all([
      supabase.from('drivers').select('*').eq('id', id).single(),
      supabase.from('driver_documents').select('*').eq('driver_id', id).order('created_at', { ascending: false }),
      supabase.from('payout_requests').select('*').eq('driver_id', id).order('created_at', { ascending: false }).limit(20),
    ]);

    if (d.error) throw new Error(d.error.message);
    return {
      driver: d.data,
      documents: docs.data || [],
      payouts: payouts.data || [],
    };
  }

  async updateDriverDocument(driverId: string, docId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('driver_documents')
      .update(updates)
      .eq('id', docId)
      .eq('driver_id', driverId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateDriverKyc(driverId: string, status: string, note: string | null): Promise<any> {
    const { data, error } = await supabase
      .from('drivers')
      .update({
        kyc_status: status,
        kyc_note: note,
        is_verified: status === 'verified',
      })
      .eq('id', driverId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async writeAuditLog(auditData: {
    admin_id: string | null;
    admin_email: string | null;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    summary: string;
    old_value?: any;
    new_value?: any;
    ip: string | null;
  }): Promise<void> {
    const { error } = await supabase
      .from('audit_log')
      .insert(auditData);

    if (error) {
      console.error('[admin repo] Failed to write audit log:', error.message);
    }
  }

  async listAdmins(): Promise<any[]> {
    const { data, error } = await supabase
      .from('admins')
      .select('id, email, full_name, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findAdminByEmail(email: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async findAdminById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async createAdmin(adminData: any): Promise<any> {
    const { data, error } = await supabase
      .from('admins')
      .insert(adminData)
      .select('id, email, full_name, role, is_active, created_at')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateAdmin(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('admins')
      .update(updates)
      .eq('id', id)
      .select('id, email, full_name, role, is_active, created_at')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async listUsers(role?: string, banned?: boolean): Promise<any[]> {
    let q = supabase
      .from('users')
      .select('id, full_name, phone, email, role, is_banned, city, is_plus_member, trust_score, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (role && role !== 'all') q = q.eq('role', role);
    if (banned) q = q.eq('is_banned', true);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async updateUser(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getAuditLogs(filters: any): Promise<any[]> {
    const { admin_id, action, entity_type, from, to, limit } = filters;
    let q = supabase.from('audit_log').select('*');

    if (admin_id) q = q.eq('admin_id', admin_id);
    if (action) q = q.eq('action', action);
    if (entity_type) q = q.eq('entity_type', entity_type);
    if (from) q = q.gte('created_at', from);
    if (to) q = q.lte('created_at', to);

    const lim = Math.min(parseInt(limit) || 200, 1000);
    const { data, error } = await q
      .order('created_at', { ascending: false })
      .limit(lim);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getAuditActions(): Promise<string[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('action');

    if (error) throw new Error(error.message);
    const actions = (data || []).map(r => r.action);
    return [...new Set(actions)].sort();
  }

  async getDashboardStats(todayIso: string, weekAgoIso: string): Promise<any> {
    const [
      { count: ordersToday },
      { data: revenueOrders },
      { count: totalUsers },
      { count: onlineDrivers },
      { count: pendingOrders },
      { count: openStores },
      { data: recentOrders },
      { data: weekOrders },
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
      supabase.from('orders').select('total_amount').gte('created_at', todayIso).in('status', ['delivered', 'completed']),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_online', true).eq('is_verified', true),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('stores').select('*', { count: 'exact', head: true }).eq('is_open', true),
      supabase.from('orders').select('id, status, total_amount, delivery_address, payment_method, created_at').order('created_at', { ascending: false }).limit(8),
      supabase.from('orders').select('created_at').gte('created_at', weekAgoIso),
    ]);

    const revenueToday = (revenueOrders || []).reduce((s, o) => s + parseFloat(o.total_amount || '0'), 0);

    return {
      stats: {
        ordersToday: ordersToday || 0,
        revenueToday,
        totalUsers: totalUsers || 0,
        onlineDrivers: onlineDrivers || 0,
        pendingOrders: pendingOrders || 0,
        openStores: openStores || 0,
      },
      recentOrders: recentOrders || [],
      weekOrders: weekOrders || [],
    };
  }

  async getAnalyticsOrders(sinceIso: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total_amount, payment_method, store_id, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getExportRows(type: string): Promise<any[]> {
    if (type === 'orders') {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, total_amount, payment_method, user_id, store_id, driver_id, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw new Error(error.message);
      return data || [];
    }

    if (type === 'users') {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, phone, email, role, city, is_banned, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw new Error(error.message);
      return data || [];
    }

    const { data, error } = await supabase
      .from('drivers')
      .select('id, full_name, cin, phone, vehicle_type, is_active, is_online, city, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getAnalyticsStores(storeIds: string[]): Promise<any[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name_ar')
      .in('id', storeIds);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getNotifications(): Promise<any[]> {
    const { data, error } = await supabase
      .from('notifications_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async createNotificationLog(logData: any): Promise<any> {
    const { data, error } = await supabase
      .from('notifications_log')
      .insert(logData)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getNotificationFeed(): Promise<any[]> {
    const { data, error } = await supabase
      .from('notifications_log')
      .select('id, title, body, target, created_at')
      .eq('target', 'all')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getPushTokens(target: string): Promise<string[]> {
    let q = supabase.from('users').select('push_token').not('push_token', 'is', null);

    if (target !== 'all') {
      const digits = target.replace(/\D/g, '');
      const e164 = digits.startsWith('212') ? `+${digits}` : `+212${digits.replace(/^0/, '')}`;
      q = q.or(`phone.eq.${target},phone.eq.${digits},phone.eq.${e164}`);
    }

    const { data, error } = await q.limit(200);
    if (error) throw new Error(error.message);
    return (data || []).map((u: any) => u.push_token).filter((t: string) => t?.startsWith('ExponentPushToken'));
  }

  async getGlobalOperationalMetrics(sinceIso: string): Promise<any> {
    const [
      { data: driversData, error: drvErr },
      { data: ordersData, error: ordErr }
    ] = await Promise.all([
      supabase.from('drivers').select('id, driver_acceptance_rate, driver_timeout_count, warning_count, driver_suspicious_count, suspension_until'),
      supabase.from('orders').select('arrived_pickup_at, picked_up_at, delivered_at, reassignment_count').gte('created_at', sinceIso)
    ]);

    if (drvErr) throw new Error(`Failed to fetch drivers for operational metrics: ${drvErr.message}`);
    if (ordErr) throw new Error(`Failed to fetch orders for operational metrics: ${ordErr.message}`);

    let avgAcceptanceRate = 0;
    let totalIgnoredOffers = 0;
    let suspiciousDriversCount = 0;

    if (driversData) {
      let sumRate = 0;
      let countRate = 0;
      const now = new Date();
      driversData.forEach(d => {
        if (d.driver_acceptance_rate !== null) {
          sumRate += Number(d.driver_acceptance_rate);
          countRate++;
        }
        totalIgnoredOffers += (d.driver_timeout_count || 0);

        const isSuspended = d.suspension_until && new Date(d.suspension_until) > now;
        if ((d.warning_count && d.warning_count > 0) || (d.driver_suspicious_count && d.driver_suspicious_count > 0) || isSuspended) {
          suspiciousDriversCount++;
        }
      });
      avgAcceptanceRate = countRate > 0 ? Number((sumRate / countRate).toFixed(2)) : 0;
    }

    let totalPickupDelayMs = 0;
    let pickupDelayCount = 0;
    let totalDeliveryDurationMs = 0;
    let deliveryDurationCount = 0;
    let totalReassignments = 0;

    if (ordersData) {
      ordersData.forEach(o => {
        totalReassignments += (o.reassignment_count || 0);

        if (o.arrived_pickup_at && o.picked_up_at) {
          const diff = new Date(o.picked_up_at).getTime() - new Date(o.arrived_pickup_at).getTime();
          if (diff > 0) {
            totalPickupDelayMs += diff;
            pickupDelayCount++;
          }
        }

        if (o.picked_up_at && o.delivered_at) {
          const diff = new Date(o.delivered_at).getTime() - new Date(o.picked_up_at).getTime();
          if (diff > 0) {
            totalDeliveryDurationMs += diff;
            deliveryDurationCount++;
          }
        }
      });
    }

    const avgPickupDelayMin = pickupDelayCount > 0 ? Number((totalPickupDelayMs / (60000 * pickupDelayCount)).toFixed(2)) : 0;
    const avgDeliveryDurationMin = deliveryDurationCount > 0 ? Number((totalDeliveryDurationMs / (60000 * deliveryDurationCount)).toFixed(2)) : 0;
    const reassignmentFrequency = ordersData && ordersData.length > 0 ? Number((totalReassignments / ordersData.length).toFixed(2)) : 0;

    return {
      acceptance_rate: avgAcceptanceRate,
      ignored_offers: totalIgnoredOffers,
      average_pickup_delay_minutes: avgPickupDelayMin,
      average_delivery_duration_minutes: avgDeliveryDurationMin,
      suspicious_drivers: suspiciousDriversCount,
      reassignment_frequency: reassignmentFrequency
    };
  }
}

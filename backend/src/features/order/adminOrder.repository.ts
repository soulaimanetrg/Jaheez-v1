import { supabase } from '../../db/supabase';
import { isMissingColumnError } from '../../utils/schemaCompatibility';

export class AdminOrderRepository {
  async listOrders(status?: string): Promise<any[]> {
    let q = supabase
      .from('orders')
      .select('id, status, order_type, request_category, pickup_address, moderation_status, dispatch_mode, total_amount, subtotal, delivery_fee, discount, payment_method, delivery_address, notes, created_at, updated_at, user_id, store_id, driver_id, promised_ready_at, store_ready_at, offered_driver_id, offer_expires_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (status && status !== 'all') {
      q = q.eq('status', status);
    }

    let { data, error }: { data: any[] | null; error: any } = await q;

    if (error && isMissingColumnError(error)) {
      let fallback = supabase
        .from('orders')
        .select('id, status, total_amount, subtotal, delivery_fee, discount, payment_method, delivery_address, notes, created_at, updated_at, user_id, store_id, driver_id')
        .order('created_at', { ascending: false })
        .limit(200);

      if (status && status !== 'all') {
        fallback = fallback.eq('status', status);
      }

      const fallbackResult = await fallback;
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw new Error(error.message);
    const orders = data || [];
    const userIds = [...new Set(orders.map((order: any) => order.user_id).filter(Boolean))];
    const storeIds = [...new Set(orders.map((order: any) => order.store_id).filter(Boolean))];
    const driverIds = [...new Set(orders.map((order: any) => order.driver_id).filter(Boolean))];

    const [usersResult, storesResult, driversResult] = await Promise.all([
      userIds.length
        ? supabase.from('users').select('id, full_name, phone').in('id', userIds)
        : Promise.resolve({ data: [], error: null } as any),
      storeIds.length
        ? supabase.from('stores').select('id, name, name_ar, phone, address, address_ar').in('id', storeIds)
        : Promise.resolve({ data: [], error: null } as any),
      driverIds.length
        ? supabase.from('drivers').select('id, full_name, phone, vehicle_type').in('id', driverIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (usersResult.error && !this.isIgnorableCleanupError(usersResult.error)) throw new Error(usersResult.error.message);
    if (storesResult.error && !this.isIgnorableCleanupError(storesResult.error)) throw new Error(storesResult.error.message);
    if (driversResult.error && !this.isIgnorableCleanupError(driversResult.error)) throw new Error(driversResult.error.message);

    const usersById = new Map((usersResult.data || []).map((row: any) => [row.id, row]));
    const storesById = new Map((storesResult.data || []).map((row: any) => [row.id, row]));
    const driversById = new Map((driversResult.data || []).map((row: any) => [row.id, row]));

    return orders.map((order: any) => {
      const user = usersById.get(order.user_id) as any;
      const store = storesById.get(order.store_id) as any;
      const driver = driversById.get(order.driver_id) as any;

      return {
        ...order,
        users: user || null,
        stores: store || null,
        drivers: driver || null,
        user_name: user?.full_name || null,
        user_phone: user?.phone || null,
        customer_name: user?.full_name || null,
        customer_phone: user?.phone || null,
        store_name: store?.name || store?.name_ar || null,
        store_name_ar: store?.name_ar || null,
        store_phone: store?.phone || null,
        store_address: store?.address || store?.address_ar || null,
        driver_name: driver?.full_name || null,
        driver_phone: driver?.phone || null,
        driver_vehicle_type: driver?.vehicle_type || null,
      };
    });
  }

  async getOrderItems(orderId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('id, quantity, unit_price, total_price, notes, options, menu_items(name, name_ar)')
      .eq('order_id', orderId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getOrderById(orderId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, order_type, moderation_status, dispatch_mode, driver_id, user_id, payment_status, notes')
      .eq('id', orderId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateOrderDirect(orderId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw new Error(error.message);
  }

  async insertOrderStatusHistory(historyData: any): Promise<void> {
    const { error } = await supabase
      .from('order_status_history')
      .insert(historyData);

    if (error) throw new Error(error.message);
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
      console.error('[admin order repo] Failed to write audit log:', error.message);
    }
  }

  private isIgnorableCleanupError(error: any): boolean {
    const code = String(error?.code || '');
    const message = String(error?.message || '').toLowerCase();
    return (
      code === 'PGRST205' ||
      code === '42P01' ||
      message.includes('could not find the table') ||
      message.includes('does not exist') ||
      isMissingColumnError(error)
    );
  }

  private async deleteFromTable(table: string, ids: string[]): Promise<number> {
    if (!ids.length) return 0;

    const { data, error } = await supabase
      .from(table)
      .delete()
      .in('order_id', ids)
      .select('id');

    if (error) {
      if (this.isIgnorableCleanupError(error)) return 0;
      throw new Error(error.message);
    }

    return Array.isArray(data) ? data.length : 0;
  }

  async cleanupDevelopmentDispatch(): Promise<{ orders_deleted: number; related_deleted: Record<string, number>; drivers_reset: boolean }> {
    const { data: orders, error: selectError } = await supabase
      .from('orders')
      .select('id')
      .limit(5000);

    if (selectError) throw new Error(selectError.message);

    const orderIds = (orders || []).map((row: any) => row.id).filter(Boolean);
    const relatedDeleted: Record<string, number> = {};

    for (const table of [
      'dispatch_offer_history',
      'order_timeline_events',
      'order_delay_assessments',
      'order_status_history',
      'order_items',
    ]) {
      relatedDeleted[table] = await this.deleteFromTable(table, orderIds);
    }

    let ordersDeleted = 0;
    if (orderIds.length) {
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds)
        .select('id');

      if (error) throw new Error(error.message);
      ordersDeleted = Array.isArray(data) ? data.length : orderIds.length;
    }

    const resetPayload = {
      active_orders: 0,
      updated_at: new Date().toISOString(),
    } as any;

    const { error: onlineError } = await supabase
      .from('drivers')
      .update({ ...resetPayload, state: 'AVAILABLE' })
      .eq('is_online', true);

    if (onlineError && !this.isIgnorableCleanupError(onlineError)) {
      throw new Error(onlineError.message);
    }

    const { error: offlineError } = await supabase
      .from('drivers')
      .update({ ...resetPayload, state: 'OFFLINE' })
      .eq('is_online', false);

    if (offlineError && !this.isIgnorableCleanupError(offlineError)) {
      throw new Error(offlineError.message);
    }

    return { orders_deleted: ordersDeleted, related_deleted: relatedDeleted, drivers_reset: true };
  }
}

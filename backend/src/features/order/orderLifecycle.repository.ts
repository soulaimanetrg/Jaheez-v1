import { supabase } from '../../db/supabase';

export interface OrderRow {
  id: string;
  user_id: string;
  store_id: string;
  driver_id: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total_amount: number;
  rider_tip: number;
  heading_to_pickup_at: string | null;
  arrived_pickup_at: string | null;
  picked_up_at: string | null;
  arrived_customer_at: string | null;
  delivered_at: string | null;
  eta?: string | null;
  promised_ready_at?: string | null;
  store_ready_at?: string | null;
  driver_pickup_eta_at?: string | null;
  driver_delivery_eta_at?: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

export class OrderLifecycleRepository {
  /**
   * Fetch order details by ID
   */
  async getOrderById(orderId: string): Promise<OrderRow | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching order: ${error.message}`);
    }
    return data;
  }

  /**
   * Execute atomic transaction-safe order lifecycle transition/assignment/stage update
   */
  async updateOrderLifecycleRpc(params: {
    orderId: string;
    actorType: 'customer' | 'driver' | 'admin' | 'system';
    actorId: string | null;
    action: 'transition' | 'claim' | 'stage_update';
    toStatus?: string | null;
    reason?: string | null;
    metadata?: Record<string, any> | null;
  }): Promise<OrderRow> {
    const { data, error } = await supabase.rpc('update_order_lifecycle', {
      p_order_id: params.orderId,
      p_actor_type: params.actorType,
      p_actor_id: params.actorId,
      p_action: params.action,
      p_to_status: params.toStatus || null,
      p_reason: params.reason || null,
      p_metadata: params.metadata || {}
    });

    if (error) {
      throw new Error(`Database transaction error: ${error.message}`);
    }
    return data as OrderRow;
  }
}

import { supabase } from '../../db/supabase';
import { DatabaseError } from '../../middleware/error.middleware';

const PROMO_OPTIONS_KEY = '__jaheez_product_promo';

export interface StoreDbRow {
  id: string;
  is_open: boolean;
  delivery_fee: number;
  opening_hours: any;
  store_capacity_state: string;
}

export interface MenuItemDbRow {
  id: string;
  price: number;
  is_available: boolean;
  name_ar: string;
  options: any;
  promo_price: number | null;
  promo_until: string | null;
}

export interface PromoDbRow {
  id: string;
  store_id: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_centimes: number;
  is_active: boolean;
  end_at: string | null;
  uses_count: number;
  max_uses: number | null;
  max_uses_per_user: number | null;
}

export const DRIVER_ORDER_SELECT = `
  id, status, order_type, payment_method, payment_status, delivery_address, delivery_lat, delivery_lng, notes,
  subtotal, delivery_fee, discount, total_amount, eta, picked_up_at, delivered_at, cancelled_reason,
  created_at, updated_at, heading_to_pickup_at, arrived_pickup_at, arrived_customer_at, rider_tip,
  offer_expires_at,
  user_id, driver_id,
  users(full_name, phone),
  store_id,
  stores(name, name_ar, category, phone, address, address_ar, lat, lng),
  errand_details(service_type, errand_stage, pickup_address, pickup_lat, pickup_lng, item_category, item_size, weight_band, declared_value_centimes, courier_earning_centimes, recipient_name),
  order_items(id, quantity, unit_price, total_price, notes, options, menu_items(name, name_ar))
`;

export class CheckoutRepository {
  // ── In-memory cache for rarely-changing settings ───────────────────────────
  // The service fee is set by admins and changes at most a few times per year.
  // Caching it for 10 minutes eliminates one DB round-trip from every
  // previewCheckout call (the biggest inner-loop hot path).
  private serviceFeeDhCache: { value: number; expiresAt: number } | null = null;
  private static readonly SERVICE_FEE_TTL_MS = 10 * 60 * 1_000; // 10 minutes
  // ─────────────────────────────────────────────────────────────────────
  async getOrderForCustomerCancellation(orderId:string) {
    const {data,error}=await supabase.from('orders').select('id,user_id,order_type,driver_id,status').eq('id',orderId).maybeSingle();
    if(error) throw new Error(error.message);
    return data;
  }
  private isMissingPromoColumnError(error: { message?: string } | null) {
    const message = error?.message || '';
    return /promo_price|promo_until|schema cache/i.test(message);
  }

  private unpackMenuItem(row: any): MenuItemDbRow {
    if (!row) return row;

    let rawOptions = row.options;
    let optionsObject: any = null;

    if (rawOptions) {
      if (typeof rawOptions === 'string') {
        try {
          optionsObject = JSON.parse(rawOptions);
        } catch (e) {
          optionsObject = null;
        }
      } else if (typeof rawOptions === 'object' && !Array.isArray(rawOptions)) {
        optionsObject = rawOptions;
      }
    }

    const promo = optionsObject?.[PROMO_OPTIONS_KEY] || null;
    const groups = optionsObject ? optionsObject.groups || [] : (Array.isArray(rawOptions) ? rawOptions : []);

    return {
      ...row,
      options: groups,
      promo_price: row.promo_price ?? promo?.promo_price ?? null,
      promo_until: row.promo_until ?? promo?.promo_until ?? null,
    };
  }

  /**
   * Get cached idempotency response
   */
  async getCachedResponse(userId: string, idempotencyKey: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('idempotency_keys')
      .select('response')
      .eq('key', idempotencyKey)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return null;
    }
    return data ? data.response : null;
  }

  /**
   * Save idempotency response
   */
  async saveIdempotency(userId: string, idempotencyKey: string, response: any): Promise<void> {
    const { error } = await supabase
      .from('idempotency_keys')
      .insert({
        key: idempotencyKey,
        user_id: userId,
        response,
      });

    if (error) {
      console.warn('[checkout repo] Failed to save idempotency key:', error.message);
    }
  }

  /**
   * Get store by ID
   */
  async getStoreById(storeId: string): Promise<StoreDbRow | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('id, is_open, delivery_fee, opening_hours')
      .eq('id', storeId)
      .maybeSingle();

    if (error) {
      throw new DatabaseError('Store data is unavailable.', 'store_data_unavailable');
    }
    return data ? {
      ...data,
      store_capacity_state: 'OPEN',
    } : null;
  }

  /**
   * Get menu items by IDs and store
   */
  async getMenuItemsByIds(menuItemIds: string[], storeId: string): Promise<MenuItemDbRow[]> {
    const initialResult = await supabase
      .from('menu_items')
      .select('id, price, is_available, name_ar, options, promo_price, promo_until')
      .in('id', menuItemIds)
      .eq('store_id', storeId);
    let data: any[] | null = initialResult.data;
    let error = initialResult.error;

    if (error && this.isMissingPromoColumnError(error)) {
      const retry = await supabase
        .from('menu_items')
        .select('id, price, is_available, name_ar, options')
        .in('id', menuItemIds)
        .eq('store_id', storeId);
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      throw new DatabaseError('Menu data is unavailable.', 'menu_data_unavailable');
    }
    return (data || []).map((row: any) => this.unpackMenuItem(row));
  }

  async getPromoByCode(code: string): Promise<PromoDbRow | null> {
    let res = await supabase
      .from('promotions')
      .select('id, store_id, discount_type, discount_value, min_order_centimes, is_active, end_at, uses_count, max_uses, max_uses_per_user')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (res.error && res.error.message.includes('max_uses_per_user')) {
      res = await supabase
        .from('promotions')
        .select('id, store_id, discount_type, discount_value, min_order_centimes, is_active, end_at, uses_count, max_uses')
        .eq('code', code.toUpperCase())
        .maybeSingle();
    }

    if (res.error) {
      console.warn('[checkout repo] Promo code lookup failed');
      return null;
    }
    return res.data;
  }

  /**
   * Increment uses_count on the promotions table
   */
  async incrementPromoUsesCount(promoId: string): Promise<void> {
    const { data: current } = await supabase
      .from('promotions')
      .select('uses_count')
      .eq('id', promoId)
      .single();
    const count = current?.uses_count || 0;
    await supabase
      .from('promotions')
      .update({ uses_count: count + 1 })
      .eq('id', promoId);
  }

  /**
   * Get how many times a user has used a promo code
   */
  async getUserPromoUsesCount(userId: string, promoId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_promo_usages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('promo_id', promoId);

    if (error) {
      console.warn('[checkout repo] Failed to count user promo usages');
      return 0;
    }
    return count || 0;
  }

  /**
   * Record promo usage for a specific user and order
   */
  async recordPromoUserUsage(userId: string, promoId: string, orderId: string): Promise<void> {
    const { error } = await supabase
      .from('user_promo_usages')
      .insert({
        user_id: userId,
        promo_id: promoId,
        order_id: orderId,
      });

    if (error) {
      console.warn('[checkout repo] Failed to record user promo usage');
    }
  }

  /**
   * Execute atomic order creation RPC transaction
   */
  async createAtomicOrder(params: {
    userId: string;
    storeId: string;
    deliveryAddress: string;
    deliveryLat: number | null;
    deliveryLng: number | null;
    notes: string | null;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    riderTip: number;
    totalAmount: number;
    paymentMethod: string;
    items: any[];
    idempotencyKey: string | null;
    requestPayload: Record<string, unknown>;
    promoId?: string | null;
  }): Promise<{ order_id: string; created_at: string; is_replay: boolean; cached_response?: any; promo_atomic: boolean }> {
    const { data, error } = await supabase.rpc('create_order_atomic_v2', {
      p_user_id: params.userId,
      p_store_id: params.storeId,
      p_delivery_address: params.deliveryAddress,
      p_delivery_lat: params.deliveryLat,
      p_delivery_lng: params.deliveryLng,
      p_notes: params.notes,
      p_subtotal: params.subtotal,
      p_delivery_fee: params.deliveryFee,
      p_discount: params.discount,
      p_rider_tip: params.riderTip,
      p_total_amount: params.totalAmount,
      p_payment_method: params.paymentMethod,
      p_items: params.items,
      p_idempotency_key: params.idempotencyKey,
      p_request_payload: params.requestPayload,
      p_promo_id: params.promoId ?? null,
    });

    if (error) {
      const marker = [
        'idempotency_key_owner_mismatch',
        'idempotency_payload_mismatch',
        'promo_exhausted',
        'promo_user_exhausted',
        'promo_invalid',
      ].find((candidate) => error.message.includes(candidate));
      if (marker) throw new Error(marker);
      throw new DatabaseError('Checkout transaction failed.', 'checkout_transaction_failed');
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.order_id) {
      throw new DatabaseError('Checkout transaction failed.', 'checkout_transaction_failed');
    }

    return {
      order_id: row.order_id,
      created_at: row.created_at,
      is_replay: !!row.is_replay,
      cached_response: row.cached_response,
      promo_atomic: true,
    };
  }

  /**
   * Pre-055 RPC signature. Promo accounting is NOT part of the transaction
   * here; the caller must do it post-commit (promo_atomic: false).
   */
  private async createAtomicOrderLegacy(params: {
    userId: string;
    storeId: string;
    deliveryAddress: string;
    deliveryLat: number | null;
    deliveryLng: number | null;
    notes: string | null;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    riderTip: number;
    totalAmount: number;
    paymentMethod: string;
    items: any[];
    idempotencyKey: string | null;
  }): Promise<{ order_id: string; created_at: string; is_replay: boolean; cached_response?: any; promo_atomic: boolean }> {
    const { data, error } = await supabase.rpc('create_order_atomic', {
      p_user_id: params.userId,
      p_store_id: params.storeId,
      p_delivery_address: params.deliveryAddress,
      p_delivery_lat: params.deliveryLat,
      p_delivery_lng: params.deliveryLng,
      p_notes: params.notes,
      p_subtotal: params.subtotal,
      p_delivery_fee: params.deliveryFee,
      p_discount: params.discount,
      p_rider_tip: params.riderTip,
      p_total_amount: params.totalAmount,
      p_payment_method: params.paymentMethod,
      p_items: params.items,
      p_idempotency_key: params.idempotencyKey,
    });

    if (error) {
      throw new Error(`Database transaction failed to create order: ${error.message}`);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.order_id) {
      throw new DatabaseError('Checkout transaction failed.', 'checkout_transaction_failed');
    }

    return {
      order_id: row.order_id,
      created_at: row.created_at,
      is_replay: !!row.is_replay,
      cached_response: row.cached_response,
      promo_atomic: false,
    };
  }

  /**
   * Get complete driver-facing order details
   */
  async getDriverOrderDetails(orderId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(DRIVER_ORDER_SELECT)
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching driver order: ${error.message}`);
    }
    return data;
  }

  /**
   * Update order status and details (Atomic checks applied via query constraints)
   */
  async updateOrder(
    orderId: string,
    updates: Record<string, any>,
    constraints?: Record<string, any>
  ): Promise<any | null> {
    let builder = supabase.from('orders').update(updates).eq('id', orderId);

    if (constraints) {
      for (const [key, val] of Object.entries(constraints)) {
        if (val === null) {
          builder = builder.is(key, null);
        } else if (Array.isArray(val)) {
          builder = builder.in(key, val);
        } else {
          builder = builder.eq(key, val);
        }
      }
    }

    const { data, error } = await builder.select(DRIVER_ORDER_SELECT).maybeSingle();
    if (error) {
      throw new Error(`Database error updating order: ${error.message}`);
    }
    return data;
  }

  /**
   * Update operational driver stats. Earnings are recorded only in the
   * immutable commission ledger and settled through closed shifts.
   */
  async updateDriverStats(
    driverId: string,
    jobsCompleted: number,
    codDelta: number
  ): Promise<void> {
    const { data: drv } = await supabase
      .from('drivers')
      .select('jobs_completed, cod_balance_centimes')
      .eq('id', driverId)
      .single();

    await supabase
      .from('drivers')
      .update({
        jobs_completed: (drv?.jobs_completed || 0) + jobsCompleted,
        cod_balance_centimes: (drv?.cod_balance_centimes || 0) + codDelta,
      })
      .eq('id', driverId);
  }

  /**
   * Get count of non-cancelled orders for free delivery check
   */
  async getNonCancelledOrdersCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('status', 'eq', 'cancelled');

    if (error) {
      console.error('[checkout repo] Failed to count non-cancelled orders:', error.message);
      return 0;
    }
    return count || 0;
  }

  /**
   * Operator-configurable checkout service fee (migration 056). Falls back
   * to the historical 2 DH when unset or unreadable — never fails checkout
   * over a missing setting, and clamps to a sane non-negative bound.
   * Result is cached in-process for 10 minutes to avoid a DB round-trip on
   * every previewCheckout call.
   */
  async getServiceFeeDh(): Promise<number> {
    const FALLBACK_DH = 2;
    const MAX_DH = 50;

    // Return cached value if still fresh
    const now = Date.now();
    if (this.serviceFeeDhCache && this.serviceFeeDhCache.expiresAt > now) {
      return this.serviceFeeDhCache.value;
    }

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'checkout_service_fee_centimes')
        .maybeSingle();
      if (error || !data) {
        this.serviceFeeDhCache = { value: FALLBACK_DH, expiresAt: now + CheckoutRepository.SERVICE_FEE_TTL_MS };
        return FALLBACK_DH;
      }
      const centimes = Number(data.value);
      const result = (!Number.isFinite(centimes) || centimes < 0)
        ? FALLBACK_DH
        : Math.min(centimes / 100, MAX_DH);
      this.serviceFeeDhCache = { value: result, expiresAt: now + CheckoutRepository.SERVICE_FEE_TTL_MS };
      return result;
    } catch {
      this.serviceFeeDhCache = { value: FALLBACK_DH, expiresAt: now + CheckoutRepository.SERVICE_FEE_TTL_MS };
      return FALLBACK_DH;
    }
  }

  /**
   * Count cancellations inside a rolling window. Customer cancellations are
   * only possible pre-pickup (pending/confirmed), so a lifetime count would
   * punish legitimate long-term customers.
   */
  async getRecentCancelledOrdersCount(userId: string, windowDays: number): Promise<number> {
    const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'cancelled')
      .gte('updated_at', since);

    if (error) {
      console.error('[checkout repo] Failed to count cancelled orders:', error.message);
      return 0;
    }
    return count || 0;
  }

  /**
   * Flag a user for manual review instead of hard-banning. 'blocked' (and
   * is_banned) remain admin-only decisions.
   */
  async flagUserForCancellationReview(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ auth_risk_level: 'high', updated_at: new Date().toISOString() })
      .eq('id', userId)
      .neq('auth_risk_level', 'blocked');
    if (error) {
      throw new Error(`Database error flagging user: ${error.message}`);
    }
  }
}

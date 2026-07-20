import { supabase } from '../../db/supabase';

const CUSTOMER_TERMINAL_ORDER_STATUSES = ['completed', 'cancelled', 'moderation_rejected'] as const;

export class CustomerRepository {
  async getWallet(userId: string) {
    const { data, error } = await supabase.from('wallets').select('id,user_id,balance_centimes,created_at,updated_at')
      .eq('user_id', userId).maybeSingle();
    if (error) throw new Error(`Database error fetching wallet: ${error.message}`);
    return data;
  }

  async getWalletTransactions(userId: string, type?: string) {
    let query = supabase.from('wallet_transactions')
      .select('id,wallet_id,user_id,type,direction,amount_centimes,label,sublabel,ref_id,created_at')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    if (type) query = query.eq('type', type);
    const { data, error } = await query;
    if (error) throw new Error(`Database error fetching wallet transactions: ${error.message}`);
    return data || [];
  }
  async upsertUser(userId: string, input: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        role: 'user',
        trust_score: 50,
        is_banned: false,
        language: 'ar',
        is_plus_member: false,
        notification_enabled: true,
        ...input,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw new Error(`Database error upserting user: ${error.message}`);
    return data;
  }

  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(`Database error fetching user: ${error.message}`);
    return data || null;
  }

  async updateUser(userId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new Error(`Database error updating user: ${error.message}`);
    return data;
  }

  async listAddresses(userId: string) {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Database error listing addresses: ${error.message}`);
    return data || [];
  }

  async createAddress(userId: string, input: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('user_addresses')
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(`Database error creating address: ${error.message}`);
    return data;
  }

  async updateAddress(userId: string, addressId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('user_addresses')
      .update(updates)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    if (error) throw new Error(`Database error updating address: ${error.message}`);
    return data;
  }

  async clearDefaultAddresses(userId: string) {
    const { error } = await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', userId);
    if (error) throw new Error(`Database error clearing default addresses: ${error.message}`);
  }

  async deleteAddress(userId: string, addressId: string) {
    const { data, error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();
    if (error) throw new Error(`Database error deleting address: ${error.message}`);
    return data;
  }

  async listSupportTickets(userId: string) {
    const { data, error } = await supabase
      .from('support_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw new Error(`Database error listing support tickets: ${error.message}`);
    return data || [];
  }

  async getActiveOrder(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .not('status', 'in', `(${CUSTOMER_TERMINAL_ORDER_STATUSES.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Database error fetching active order: ${error.message}`);
    return data || null;
  }

  async getOrderById(userId: string, orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        store:stores(id, name, name_ar, logo_url, category, phone),
        items:order_items(
          id, quantity, unit_price, total_price, options,
          menu_item:menu_items(id, name, name_ar, image_url)
        ),
        driver:drivers!driver_id(id, full_name, phone, avatar_url, vehicle_type, rating_avg),
        errand_details(service_type,errand_stage,pickup_address,pickup_lat,pickup_lng,item_category,item_size,weight_band,declared_value_centimes,existing_order_code,existing_order_paid,instructions,scheduled_for)
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(`Database error fetching order: ${error.message}`);
    return data || null;
  }

  async listOrders(userId: string, page: number, pageSize: number) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        store:stores(id, name, name_ar, logo_url, category),
        items:order_items(
          id, quantity, unit_price, total_price, options,
          menu_item:menu_items(id, name, name_ar)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(start, end);
    if (error) throw new Error(`Database error listing orders: ${error.message}`);
    return data || [];
  }

  async listChatMessages(orderId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`Database error listing chat messages: ${error.message}`);
    return data || [];
  }

  async findFavorite(userId: string, storeId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .maybeSingle();
    if (error) throw new Error(`Database error finding favorite: ${error.message}`);
    return data;
  }

  async addFavorite(userId: string, storeId: string) {
    const { error } = await supabase.from('favorites').insert({ user_id: userId, store_id: storeId });
    if (error) throw new Error(`Database error adding favorite: ${error.message}`);
  }

  async removeFavorite(userId: string, storeId: string) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('store_id', storeId);
    if (error) throw new Error(`Database error removing favorite: ${error.message}`);
  }

  async listFavoriteStores(userId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .select('store_id, stores(*)')
      .eq('user_id', userId);
    if (error) throw new Error(`Database error listing favorite stores: ${error.message}`);
    return data || [];
  }

  async findFavoriteProduct(userId: string, menuItemId: string) {
    const { data, error } = await supabase
      .from('favorite_products')
      .select('id')
      .eq('user_id', userId)
      .eq('menu_item_id', menuItemId)
      .maybeSingle();
    if (error) throw new Error(`Database error finding favorite product: ${error.message}`);
    return data;
  }

  async addFavoriteProduct(userId: string, menuItemId: string) {
    const { error } = await supabase
      .from('favorite_products')
      .insert({ user_id: userId, menu_item_id: menuItemId });
    if (error) throw new Error(`Database error adding favorite product: ${error.message}`);
  }

  async removeFavoriteProduct(userId: string, menuItemId: string) {
    const { error } = await supabase
      .from('favorite_products')
      .delete()
      .eq('user_id', userId)
      .eq('menu_item_id', menuItemId);
    if (error) throw new Error(`Database error removing favorite product: ${error.message}`);
  }

  async listFavoriteProducts(userId: string) {
    const { data, error } = await supabase
      .from('favorite_products')
      .select('menu_item_id, menu_items(*)')
      .eq('user_id', userId);
    if (error) throw new Error(`Database error listing favorite products: ${error.message}`);
    return data || [];
  }

  async createSupportTicket(input: Record<string, unknown>) {
    const { data, error } = await supabase.from('support_requests').insert(input).select().single();
    if (error) throw new Error(`Database error creating support ticket: ${error.message}`);
    return data;
  }

  async getOrderOwner(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('id, user_id, driver_id, store_id, status, order_type')
      .eq('id', orderId)
      .maybeSingle();
    if (error) throw new Error(`Database error fetching order owner: ${error.message}`);
    return data;
  }

  async insertChatMessage(input: Record<string, unknown>) {
    const { data, error } = await supabase.from('chat_messages').insert(input).select().single();
    if (error) throw new Error(`Database error inserting chat message: ${error.message}`);
    return data;
  }

  async updateOwnedOrder(orderId: string, userId: string, updates: Record<string, unknown>, status: string | string[]) {
    let query = supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .eq('user_id', userId);

    query = Array.isArray(status) ? query.in('status', status) : query.eq('status', status);

    const { data, error } = await query.select('*').maybeSingle();
    if (error) throw new Error(`Database error updating owned order: ${error.message}`);
    return data;
  }

  async createReview(input: Record<string, unknown>) {
    const { data, error } = await supabase.from('store_reviews').insert(input).select().single();
    if (error) throw new Error(`Database error creating review: ${error.message}`);
    return data;
  }

  async checkStoreReviewExistsForOrder(orderId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('store_reviews')
      .select('id')
      .eq('order_id', orderId)
      .limit(1);
    if (error) throw new Error(`Database error checking store review: ${error.message}`);
    return (data || []).length > 0;
  }

  async getRatingsForStore(storeId: string): Promise<number[]> {
    const { data, error } = await supabase
      .from('store_reviews')
      .select('rating')
      .eq('store_id', storeId)
      .eq('is_visible', true);
    if (error) throw new Error(`Database error fetching store ratings: ${error.message}`);
    return (data || []).map((row: any) => Number(row.rating)).filter((rating: number) => Number.isFinite(rating));
  }

  async updateStoreRating(storeId: string, avg: number, count: number): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .update({ rating_avg: avg, rating_count: count })
      .eq('id', storeId);
    if (error) throw new Error(`Database error updating store rating: ${error.message}`);
  }

  async upsertDefaultAddressAtomic(userId: string, input: Record<string, any>) {
    const { data, error } = await supabase.rpc('upsert_customer_default_address', {
      p_user_id: userId,
      p_address_id: input.address_id || null,
      p_label: input.label || 'Home',
      p_city: input.city,
      p_address: input.address,
      p_lat: input.lat,
      p_lng: input.lng,
      p_building_info: input.building_info || '',
      p_nearby_landmark: input.nearby_landmark || '',
      p_delivery_instructions: input.delivery_instructions || '',
      p_location_source: input.location_source,
    });
    if (error) throw new Error(`Database error saving default address: ${error.message}`);
    return data;
  }

  async insertAnalyticsEvent(input: {
    user_id: string;
    event_name: string;
    screen: string | null;
    entity_type: string | null;
    entity_id: string | null;
    metadata: Record<string, unknown>;
    app_version: string | null;
    platform: string;
    ip_address: string | null;
    user_agent: string | null;
  }): Promise<void> {
    const { error } = await supabase
      .from('customer_analytics_events')
      .insert(input);

    if (error) throw new Error(`Database error inserting customer analytics event: ${error.message}`);
  }
}

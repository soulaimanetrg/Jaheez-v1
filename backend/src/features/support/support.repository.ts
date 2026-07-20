import { supabase } from '../../db/supabase';

export class SupportRepository {
  async getJsonSetting<T>(key: string, fallback: T): Promise<T> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data?.value) return fallback;
    try {
      return JSON.parse(data.value) as T;
    } catch {
      return fallback;
    }
  }

  async setJsonSetting(key: string, value: unknown): Promise<void> {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() });

    if (error) throw new Error(error.message);
  }

  // --- SUPPORT TICKETS ---
  async getSupportTickets(): Promise<any[]> {
    const { data, error } = await supabase
      .from('support_requests')
      .select('*, users(full_name, phone)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findSupportTicketById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('support_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateSupportTicket(id: string, updates: { status: string; admin_note?: string }): Promise<void> {
    const { error } = await supabase
      .from('support_requests')
      .update(updates)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // --- STORE REVIEWS ---
  async getStoreReviews(): Promise<any[]> {
    const { data, error } = await supabase
      .from('store_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getStoreNames(storeIds: string[]): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name_ar')
      .in('id', storeIds);

    if (error) return {};
    const result: Record<string, string> = {};
    (data || []).forEach(s => {
      result[s.id] = s.name_ar;
    });
    return result;
  }

  async findReviewById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('store_reviews')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateReviewVisibility(id: string, isVisible: boolean): Promise<void> {
    const { error } = await supabase
      .from('store_reviews')
      .update({ is_visible: isVisible })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async getRatingsForStore(storeId: string): Promise<number[]> {
    const { data, error } = await supabase
      .from('store_reviews')
      .select('rating')
      .eq('store_id', storeId)
      .eq('is_visible', true);

    if (error) throw new Error(error.message);
    return (data || []).map(r => r.rating);
  }

  async updateStoreRating(storeId: string, avg: number, count: number): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .update({ rating_avg: avg, rating_count: count })
      .eq('id', storeId);

    if (error) throw new Error(error.message);
  }
}

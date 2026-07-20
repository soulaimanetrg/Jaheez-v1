import { supabase } from '../../db/supabase';

export class SettingsRepository {
  // --- APP SETTINGS ---
  async getSettings(): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .order('key');

    if (error) throw new Error(error.message);
    const result: Record<string, string> = {};
    (data || []).forEach(r => {
      result[r.key] = r.value;
    });
    return result;
  }

  async updateSetting(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) throw new Error(error.message);
  }

  async deleteSetting(key: string): Promise<void> {
    const { error } = await supabase
      .from('app_settings')
      .delete()
      .eq('key', key);

    if (error) throw new Error(error.message);
  }

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
    await this.updateSetting(key, JSON.stringify(value));
  }

  async getPublicSettings(publicKeys: string[]): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', publicKeys);

    if (error) throw new Error(error.message);
    const result: Record<string, string> = {};
    (data || []).forEach(r => {
      result[r.key] = r.value;
    });
    return result;
  }

  async getPublicNotificationFeed(): Promise<any[]> {
    const { data, error } = await supabase
      .from('notifications_log')
      .select('id, title, body, target, created_at')
      .eq('target', 'all')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw new Error(error.message);
    return data || [];
  }

  // --- CITIES ---
  async getCities(): Promise<any[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name_fr', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getPublicCities(): Promise<any[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name_ar, name_fr')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name_fr', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findCityById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async createCity(cityData: any): Promise<any> {
    const { data, error } = await supabase
      .from('cities')
      .insert(cityData)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateCity(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('cities')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteCity(id: string): Promise<void> {
    const { error } = await supabase
      .from('cities')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // --- SERVICE CATEGORIES ---
  async getCategories(type?: string): Promise<any[]> {
    let q = supabase.from('service_categories').select('*');
    if (type) {
      q = q.eq('type', type);
    }
    const { data, error } = await q
      .order('type', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('name_fr', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getPublicCategories(type?: string): Promise<any[]> {
    let q = supabase
      .from('service_categories')
      .select('id, name_ar, name_fr, type, icon_emoji, color_hex, sort_order, parent_id')
      .eq('is_active', true);
      
    if (type) {
      q = q.eq('type', type);
    }

    const { data, error } = await q
      .order('type', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findCategoryById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async createCategory(catData: any): Promise<any> {
    const { data, error } = await supabase
      .from('service_categories')
      .insert(catData)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateCategory(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('service_categories')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // --- DELIVERY ZONES ---
  async getZones(): Promise<any[]> {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async createZone(zoneData: any): Promise<any> {
    const { data, error } = await supabase
      .from('delivery_zones')
      .insert(zoneData)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateZone(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('delivery_zones')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteZone(id: string): Promise<void> {
    const { error } = await supabase
      .from('delivery_zones')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // --- PROMOTIONS ---
  async getPromotions(): Promise<any[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async createPromotion(promoData: any): Promise<any> {
    const { data, error } = await supabase
      .from('promotions')
      .insert(promoData)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updatePromotion(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deletePromotion(id: string): Promise<void> {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async getActivePromotions(): Promise<any[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('promotions')
      .select('id, title_ar, code, discount_type, discount_value, min_order_centimes, end_at, store_id, max_uses, uses_count')
      .eq('is_active', true)
      .or(`end_at.gt.${now},end_at.is.null`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw new Error(error.message);
    return (data || []).filter(r => r.max_uses === null || r.uses_count < r.max_uses);
  }

  async validatePromo(code: string, storeId?: string): Promise<any | null> {
    const now = new Date().toISOString();
    let q = supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .or(`end_at.gt.${now},end_at.is.null`);

    // Match code case-insensitively using raw query or ilike logic
    // Since we're using supabase-js, we can do ilike for code
    q = q.ilike('code', code.trim());

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const promos = (data || []).filter(promo => {
      const isStoreValid = !promo.store_id || (storeId && String(promo.store_id) === String(storeId));
      const isUsesValid = !promo.max_uses || promo.uses_count < promo.max_uses;
      return isStoreValid && isUsesValid;
    });

    return promos[0] || null;
  }

  // --- BANNERS ---
  async getBanners(): Promise<any[]> {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async createBanner(bannerData: any): Promise<any> {
    const { data, error } = await supabase
      .from('banners')
      .insert(bannerData)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateBanner(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteBanner(id: string): Promise<void> {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async getPublicBanners(): Promise<any[]> {
    const { data, error } = await supabase
      .from('banners')
      .select('id, title_ar, subtitle_ar, image_url, bg_color, gradient_to, link_type, link_value, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw new Error(error.message);
    return data || [];
  }

  // --- HELPER FOR STORE NAMES FOR ENRICHMENT ---
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

  // --- AUDIT LOG LOGIC ---
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
      console.error('[settings repo] Failed to write audit log:', error.message);
    }
  }
}

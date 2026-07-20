import { supabase } from '../../db/supabase';

const PROMO_OPTIONS_KEY = '__jaheez_product_promo';

export class AdminStoreRepository {
  private isMissingPromoColumnError(error: { message?: string } | null) {
    const message = error?.message || 'Database error';
    return /promo_price|promo_until|schema cache/i.test(message);
  }

  private unpackProduct(row: any): any {
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

  private packProductForMissingPromoColumns(productData: any, existingOptions?: any): any {
    const { promo_price, promo_until, options, ...rest } = productData;

    let parsedExisting = existingOptions;
    if (typeof parsedExisting === 'string') {
      try { parsedExisting = JSON.parse(parsedExisting); } catch { parsedExisting = null; }
    }

    let groups = Array.isArray(options)
      ? options
      : Array.isArray(options?.groups)
        ? options.groups
        : null;

    if (!groups) {
      groups = parsedExisting && Array.isArray(parsedExisting.groups)
        ? parsedExisting.groups
        : Array.isArray(parsedExisting)
          ? parsedExisting
          : [];
    }

    const otherKeys = typeof parsedExisting === 'object' && parsedExisting !== null
      ? parsedExisting
      : {};

    const { groups: _g, [PROMO_OPTIONS_KEY]: _p, ...cleanOtherKeys } = otherKeys as any;

    const updatedPromoPrice = 'promo_price' in productData
      ? promo_price
      : (otherKeys as any)?.[PROMO_OPTIONS_KEY]?.promo_price ?? null;

    const updatedPromoUntil = 'promo_until' in productData
      ? promo_until
      : (otherKeys as any)?.[PROMO_OPTIONS_KEY]?.promo_until ?? null;

    return {
      ...rest,
      options: {
        ...cleanOtherKeys,
        groups,
        [PROMO_OPTIONS_KEY]: {
          promo_price: updatedPromoPrice,
          promo_until: updatedPromoUntil,
        },
      },
    };
  }

  async getStores(): Promise<any[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async createStore(storeData: any): Promise<any> {
    const { data, error } = await supabase
      .from('stores')
      .insert(storeData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateStore(id: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async getMenuCategories(storeId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('id, name, name_ar, sort_order, is_active')
      .eq('store_id', storeId)
      .order('sort_order');

    if (error) throw new Error(error.message);
    return data || [];
  }

  async createMenuCategory(catData: any): Promise<any> {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert(catData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateMenuCategory(id: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('menu_categories')
      .update(updates)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async deleteMenuCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async getProducts(storeId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('store_id', storeId)
      .order('sort_order')
      .order('created_at');

    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => this.unpackProduct(row));
  }

  async getAllProducts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*');

    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => this.unpackProduct(row));
  }

  async createProduct(productData: any): Promise<any> {
    let { data, error } = await supabase
      .from('menu_items')
      .insert(productData)
      .select()
      .single();

    if (error && this.isMissingPromoColumnError(error)) {
      const retry = await supabase
        .from('menu_items')
        .insert(this.packProductForMissingPromoColumns(productData))
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw new Error(error.message);
    return this.unpackProduct(data);
  }

  async updateProduct(id: string, updates: any): Promise<void> {
    let { error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id);

    if (error && this.isMissingPromoColumnError(error)) {
      let existingOptions: any = null;
      try {
        const { data } = await supabase
          .from('menu_items')
          .select('options')
          .eq('id', id)
          .single();
        if (data) existingOptions = data.options;
      } catch {}

      const retry = await supabase
        .from('menu_items')
        .update(this.packProductForMissingPromoColumns(updates, existingOptions))
        .eq('id', id);
      error = retry.error;
    }

    if (error) throw new Error(error.message);
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async checkReviewExistsForOrder(orderId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('store_reviews')
      .select('id')
      .eq('order_id', orderId)
      .limit(1);

    if (error) return false;
    return (data || []).length > 0;
  }

  async createReview(reviewData: any): Promise<any> {
    const { data, error } = await supabase
      .from('store_reviews')
      .insert(reviewData)
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return data;
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

  async getStore(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getProduct(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return this.unpackProduct(data);
  }

}

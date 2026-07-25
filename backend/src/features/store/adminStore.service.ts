import { supabase } from '../../db/supabase';
import { AdminStoreRepository } from './adminStore.repository';
import { BadRequestError, ConflictError } from '../../middleware/error.middleware';
import { StoreRepository } from './store.repository';
import { normalizeOptionGroups, OptionConfigurationError } from '../order/optionGroups';

export class AdminStoreService {
  private repo = new AdminStoreRepository();
  private publicRepo = new StoreRepository();

  private normalizeProductPayload(payload: any, partial = false) {
    const allowed = [
      'store_id',
      'name',
      'name_ar',
      'description',
      'description_ar',
      'price',
      'promo_price',
      'promo_until',
      'category_id',
      'is_available',
      'is_popular',
      'is_featured',
      'sort_order',
      'options',
      'image_url',
    ];
    const clean: any = {};

    for (const key of allowed) {
      if (payload[key] !== undefined) clean[key] = payload[key];
    }

    if (!partial && !clean.store_id) throw new BadRequestError('Store ID requis');
    if (!partial && !clean.name) throw new BadRequestError('Nom du produit requis');

    if (clean.price !== undefined) {
      const price = Number(clean.price);
      if (!Number.isFinite(price) || price <= 0) throw new BadRequestError('Prix de base invalide');
      clean.price = price;
    }

    if (clean.promo_price === '') {
      clean.promo_price = null;
    } else if (clean.promo_price !== undefined && clean.promo_price !== null) {
      const promoPrice = Number(clean.promo_price);
      if (!Number.isFinite(promoPrice) || promoPrice < 0) throw new BadRequestError('Prix promotionnel invalide');
      clean.promo_price = promoPrice;
    }

    if (clean.promo_until === '') {
      clean.promo_until = null;
    } else if (clean.promo_until) {
      const promoUntil = new Date(clean.promo_until);
      if (Number.isNaN(promoUntil.getTime())) throw new BadRequestError('Date de fin de promotion invalide');
      clean.promo_until = promoUntil.toISOString();
    }

    if (clean.category_id === '') clean.category_id = null;
    if (clean.image_url === '') clean.image_url = null;
    if (clean.options !== undefined) {
      try {
        clean.options = normalizeOptionGroups(clean.options);
      } catch (error) {
        const code = error instanceof OptionConfigurationError ? error.errorCode : 'option_configuration_invalid';
        throw new BadRequestError('Configuration des suppléments invalide.', code);
      }
    }

    return clean;
  }

  async getStores() {
    const data = await this.repo.getStores();
    
    // Fetch all menu items using the repository to dynamically resolve promo_price / unpackProduct fallbacks
    const allItems = await this.repo.getAllProducts().catch(() => []);
    
    const itemsByStore: Record<string, any[]> = {};
    allItems.forEach(item => {
      if (item.store_id) {
        if (!itemsByStore[item.store_id]) {
          itemsByStore[item.store_id] = [];
        }
        itemsByStore[item.store_id].push(item);
      }
    });

    return data.map(s => {
      const storeItems = (itemsByStore[s.id] || []).filter(
        item => item.is_available !== false && Number(item.price) > 0
      );
      const totalItems = storeItems.length;
      
      const activePromoItems = storeItems.filter(item => {
        const promoPrice = item.promo_price;
        const promoUntil = item.promo_until;
        if (promoPrice === null || Number(promoPrice) <= 0) return false;
        if (promoUntil && new Date(promoUntil) <= new Date()) return false;
        return true;
      });

      let promoType: 'store_percentage' | 'store_fixed' | 'articles' | 'none' = 'none';
      let reductionPct = 0;

      if (activePromoItems.length > 0) {
        if (activePromoItems.length === totalItems) {
          // Check if they have the same discount percentage
          const percentages = activePromoItems.map(item => {
            const price = Number(item.price) || 1;
            const promoPrice = Number(item.promo_price);
            return Math.round((1 - promoPrice / price) * 100);
          });
          const firstPct = percentages[0] || 0;
          const allSamePct = percentages.every(p => Math.abs(p - firstPct) <= 2);

          // Check if they have the same fixed discount amount
          const fixedAmounts = activePromoItems.map(item => {
            const price = Number(item.price) || 0;
            const promoPrice = Number(item.promo_price);
            return Math.round((price - promoPrice) * 100) / 100;
          });
          const firstFixed = fixedAmounts[0] || 0;
          const allSameFixed = fixedAmounts.every(f => Math.abs(f - firstFixed) <= 0.1);

          if (allSamePct && firstPct > 0) {
            promoType = 'store_percentage';
            reductionPct = firstPct;
          } else if (allSameFixed && firstFixed > 0) {
            promoType = 'store_fixed';
            reductionPct = firstFixed;
          } else {
            promoType = 'articles';
            const percentages = activePromoItems.map(item => {
              const price = Number(item.price) || 1;
              const promoPrice = Number(item.promo_price);
              return Math.round((1 - promoPrice / price) * 100);
            });
            reductionPct = percentages.length > 0 ? Math.max(0, ...percentages) : 0;
          }
        } else {
          promoType = 'articles';
          const percentages = activePromoItems.map(item => {
            const price = Number(item.price) || 1;
            const promoPrice = Number(item.promo_price);
            return Math.round((1 - promoPrice / price) * 100);
          });
          reductionPct = percentages.length > 0 ? Math.max(0, ...percentages) : 0;
        }
      }

      return {
        ...s,
        min_order_amount: s.min_order,
        has_reduction: activePromoItems.length > 0,
        reduction_percentage: reductionPct,
        promo_type: promoType,
      };
    });
  }

  async createStore(payload: any) {
    return this.repo.createStore({
      name: payload.name,
      name_ar: payload.name_ar || payload.name,
      category: payload.category,
      city: payload.city || 'آسفي',
      phone: payload.phone || null,
      address: payload.address || null,
      address_ar: payload.address_ar || payload.address || null,
      whatsapp: payload.whatsapp || null,
      delivery_fee: payload.delivery_fee ?? 15,
      delivery_time: payload.delivery_time ?? 30,
      min_order: payload.min_order ?? 0,
      zone_id: payload.zone_id || null,
      is_open: true,
      is_featured: false,
      is_verified: false,
      opening_hours: payload.opening_hours || {},
      logo_url: payload.logo_url || null,
      cover_url: payload.cover_url || null,
      cuisine_tags: payload.cuisine_tags || payload.tags || [],
    });
  }

  async updateStore(id: string, payload: any) {
    if (payload.tags !== undefined) {
      payload.cuisine_tags = payload.tags;
    }
    const allowed = ['name', 'name_ar', 'description', 'description_ar', 'category', 'city', 'phone', 'address', 'address_ar', 'whatsapp', 'delivery_fee', 'delivery_time', 'min_order', 'is_open', 'is_featured', 'is_verified', 'zone_id', 'opening_hours', 'logo_url', 'cover_url', 'cuisine_tags'];
    const updates: any = {};
    for (const key of allowed) {
      if (payload[key] !== undefined) updates[key] = payload[key];
    }
    if (Object.keys(updates).length === 0) {
      throw new BadRequestError('لا توجد حقول للتحديث');
    }
    await this.repo.updateStore(id, updates);
    return { ok: true };
  }

  async getMenuCategories(storeId: string) {
    if (!storeId) throw new BadRequestError('store_id مطلوب');
    return this.repo.getMenuCategories(storeId);
  }

  async getProducts(storeId: string) {
    if (!storeId) throw new BadRequestError('store_id مطلوب');
    return this.repo.getProducts(storeId);
  }

  async createProduct(payload: any) {
    const clean = this.normalizeProductPayload(payload);
    return this.repo.createProduct({
      store_id: clean.store_id,
      category_id: clean.category_id || null,
      name: clean.name,
      name_ar: clean.name_ar,
      description: clean.description || null,
      description_ar: clean.description_ar || null,
      price: clean.price,
      promo_price: clean.promo_price ?? null,
      promo_until: clean.promo_until || null,
      options: clean.options || [],
      is_available: clean.is_available !== false,
      is_popular: !!clean.is_popular,
      is_featured: !!clean.is_featured,
      image_url: clean.image_url || null,
    });
  }

  async updateProduct(id: string, payload: any) {
    const updates = this.normalizeProductPayload(payload, true);
    delete updates.store_id;
    if (Object.keys(updates).length === 0) {
      throw new BadRequestError('لا توجد حقول للتحديث');
    }

    const original = await this.repo.getProduct(id).catch(() => null);

    await this.repo.updateProduct(id, updates);

    if (original) {
      const oldPrice = original.price;
      const newPrice = updates.price !== undefined ? updates.price : oldPrice;
      const newPromoPrice = updates.promo_price !== undefined ? updates.promo_price : original.promo_price;

      const oldActivePrice = original.promo_price || original.price;
      const newActivePrice = newPromoPrice || newPrice;

      if (newActivePrice < oldActivePrice * 0.85) {
        const dropPercent = Math.round((1 - newActivePrice / oldActivePrice) * 100);
        const store = await this.repo.getStore(original.store_id).catch(() => null);
        const storeName = store ? store.name : 'un magasin';

        await supabase.from('notifications_log').insert({
          title: '🔥 Grosse réduction chez ' + storeName + ' !',
          body: 'Le produit "' + original.name + '" est à seulement ' + newActivePrice + ' DH au lieu de ' + oldActivePrice + ' DH (-' + dropPercent + '%) ! [store_id: ' + original.store_id + ']',
          target: 'all',
          sent_by: 'system_admin_edit',
        });
      }
    }
    return { ok: true };
  }

  async deleteProduct(id: string) {
    await this.repo.deleteProduct(id);
    return { ok: true };
  }

  async createMenuCategory(payload: any) {
    if (!payload.store_id || !payload.name) {
      throw new BadRequestError('store_id and name required');
    }
    return this.repo.createMenuCategory({
      store_id: payload.store_id,
      name: payload.name,
      name_ar: payload.name_ar || payload.name,
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active !== false,
    });
  }

  async updateMenuCategory(id: string, payload: any) {
    const allowed = ['name', 'name_ar', 'sort_order', 'is_active'];
    const updates: any = {};
    for (const key of allowed) {
      if (payload[key] !== undefined) updates[key] = payload[key];
    }
    if (Object.keys(updates).length === 0) {
      throw new BadRequestError('No modifications received');
    }
    await this.repo.updateMenuCategory(id, updates);
    return { ok: true };
  }

  async deleteMenuCategory(id: string) {
    await this.repo.deleteMenuCategory(id);
    return { ok: true };
  }

  async submitReview(payload: any) {
    const { store_id, order_id, user_id, user_name, rating, comment } = payload;
    if (!store_id || !rating || rating < 1 || rating > 5) {
      throw new BadRequestError('store_id والتقييم (1-5) مطلوبان');
    }

    if (order_id) {
      const exists = await this.repo.checkReviewExistsForOrder(order_id);
      if (exists) {
        throw new ConflictError('تم تقييم هذا الطلب مسبقاً');
      }
    }

    const review = await this.repo.createReview({
      store_id,
      order_id: order_id || null,
      user_id: user_id || null,
      user_name: user_name || null,
      rating,
      comment: comment || null,
      is_visible: true,
    });

    await this.recalcStoreRating(store_id);

    return { ok: true, id: review.id };
  }

  async applyReduction(storeId: string, payload: any) {
    let type = 'percentage';
    let value = 0;

    if (payload && typeof payload === 'object') {
      type = payload.type || 'percentage';
      value = payload.value !== undefined ? Number(payload.value) : (payload.percentage !== undefined ? Number(payload.percentage) : 0);
    } else if (payload !== undefined && payload !== null) {
      value = Number(payload);
    }

    if (Number.isNaN(value) || value < 0) {
      throw new BadRequestError('Value must be a positive number');
    }

    if (type === 'percentage' && value > 100) {
      throw new BadRequestError('Percentage cannot exceed 100%');
    }

    const store = await this.repo.getStore(storeId);
    if (!store) {
      throw new BadRequestError('Magasin introuvable');
    }

    const products = await this.repo.getProducts(storeId);

    for (const product of products) {
      if (value === 0) {
        // Clear reduction (meaning remove promo price/until)
        await this.repo.updateProduct(product.id, {
          promo_price: null,
          promo_until: null,
        });
      } else {
        let promoPrice = 0;
        if (type === 'percentage') {
          promoPrice = Math.round((product.price * (1 - value / 100)) * 100) / 100;
        } else {
          promoPrice = Math.max(1, Math.round((product.price - value) * 100) / 100);
        }
        await this.repo.updateProduct(product.id, {
          promo_price: promoPrice,
          promo_until: null, // no expiration by default for this shop-wide promo
        });
      }
    }

    if (value > 0) {
      const label = type === 'percentage' ? `${value}%` : `${value} DH`;
      await supabase.from('notifications_log').insert({
        title: '🔥 Grosse réduction chez ' + store.name + ' !',
        body: 'Bénéficiez de -' + label + ' sur tous nos produits ! Profitez-en vite ! [store_id: ' + storeId + ']',
        target: 'all',
        sent_by: 'system_admin_edit',
      });
    }

    try {
      await this.repo.updateStore(storeId, {
        reduction_percentage: value,
      });
    } catch (err: any) {
      console.warn('[AdminStoreService] Failed to update reduction_percentage column on stores table:', err.message);
    }

    return { ok: true };
  }

  private async recalcStoreRating(storeId: string) {
    if (!storeId) return;
    try {
      const ratings = await this.repo.getRatingsForStore(storeId);
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, r) => acc + r, 0);
        const avg = Math.round((sum / ratings.length) * 10) / 10;
        await this.repo.updateStoreRating(storeId, avg, ratings.length);
      } else {
        await this.repo.updateStoreRating(storeId, 0, 0);
      }
    } catch (err: any) {
      console.error('[AdminStoreService] recalcStoreRating failed:', err.message);
    }
  }
}

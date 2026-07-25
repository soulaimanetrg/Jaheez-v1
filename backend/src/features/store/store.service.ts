import { StoreRepository, StoreRow, SUB_CAT_TRANSLATIONS } from './store.repository';
import { NotFoundError } from '../../middleware/error.middleware';
import { supabase } from '../../db/supabase';
import { getStoreClosesAt, isStoreCurrentlyOpen } from './storeStatus';
import { normalizeOptionGroups, type CanonicalOptionGroup } from '../order/optionGroups';

type StoreWithDistance = StoreRow & { distance: number | null };

const ALL_SUBCATEGORY_VALUES = new Set(['الكل', 'all', 'tout', 'tous']);

export class StoreService {
  private repo = new StoreRepository();

  async getStores(params: {
    category?: string;
    query?: string;
    sub_category?: string;
    sort?: string;
    lat?: number;
    lng?: number;
    is_featured?: boolean;
  }): Promise<Array<StoreRow & { distance: number | null }>> {
    const stores = await this.repo.getAllStores();
    const { lat, lng } = params;

    let results: StoreWithDistance[] = stores.map((store: StoreRow) => {
      let distance: number | null = null;
      if (
        lat !== undefined &&
        lng !== undefined &&
        store.lat !== null &&
        store.lng !== null
      ) {
        distance = this.calculateDistance(lat, lng, Number(store.lat), Number(store.lng));
      }
      return { ...store, distance };
    });

    // 1. Category Filtering
    if (params.category) {
      let categoryFilter = params.category;
      if (categoryFilter.length === 36) { // It's a UUID!
        try {
          const { data: cat } = await supabase
            .from('service_categories')
            .select('name_fr, name_ar')
            .eq('id', categoryFilter)
            .single();
          if (cat) {
            const name = (cat.name_fr || '').toLowerCase();
            if (name.includes('food') || name.includes('rest') || cat.name_ar === 'طعام') {
              categoryFilter = 'food';
            } else if (name.includes('groc') || name.includes('epic') || cat.name_ar === 'بقالة') {
              categoryFilter = 'grocery';
            } else if (name.includes('pharm') || cat.name_ar === 'صيدلية') {
              categoryFilter = 'pharmacy';
            } else if (name.includes('colis') || name.includes('parcel') || cat.name_ar === 'طرود' || cat.name_ar === 'توصيل طرود') {
              categoryFilter = 'parcel';
            } else if (name.includes('errand') || name.includes('special') || cat.name_ar === 'مهمة خاصة') {
              categoryFilter = 'errand';
            }
          }
        } catch (err: any) {
          console.warn('[StoreService] Failed to resolve category UUID:', err.message);
        }
      }
      results = results.filter((s: StoreWithDistance) => s.category === categoryFilter);
    }

    // 2. Query Filtering
    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter(
        (s: StoreWithDistance) =>
          s.name.toLowerCase().includes(q) ||
          (s.name_ar && s.name_ar.toLowerCase().includes(q)) ||
          s.category.toLowerCase().includes(q)
      );
    }

    // 3. Sub-category Filtering (Cuisine / Specialties / Menu items match)
    const subCategory = params.sub_category?.trim().toLowerCase();
    if (subCategory && !ALL_SUBCATEGORY_VALUES.has(subCategory)) {
      const tag = subCategory;
      const searchTerms = SUB_CAT_TRANSLATIONS[tag] || [tag];
      const matchingStoreIds = await this.repo.getMenuQueryMatches(tag);

      results = results.filter((s: StoreWithDistance) => {
        // A. Cuisine tag match
        const hasCuisineTag = (s.cuisine_tags || []).some(ct =>
          searchTerms.some(st => ct.toLowerCase().includes(st))
        );

        // B. Store name/category match
        const hasNameMatch = searchTerms.some(st =>
          s.name.toLowerCase().includes(st) ||
          (s.name_ar && s.name_ar.toLowerCase().includes(st)) ||
          s.category.toLowerCase().includes(st)
        );

        // C. Menu item match
        const hasMenuItemMatch = matchingStoreIds.has(s.id);

        return hasCuisineTag || hasNameMatch || hasMenuItemMatch;
      });
    }

    // 4. Promotions Filtering (Filter list to show only stores with active promos)
    const promoStoreIds = await this.repo.getStoresWithActivePromotions();
    if (params.sort === 'promotions') {
      results = results.filter((s: StoreWithDistance) => promoStoreIds.has(s.id));
    }

    // 5. Featured Filtering
    if (params.is_featured !== undefined) {
      results = results.filter((s: StoreWithDistance) => s.is_featured === params.is_featured);
    }

    // 6. Sorting logic
    results.sort((a: StoreWithDistance, b: StoreWithDistance) => {
      // Sort by rating if sort === 'rating'
      if (params.sort === 'rating') {
        if (b.rating_avg !== a.rating_avg) {
          return b.rating_avg - a.rating_avg;
        }
      }

      // Sort by delivery fee if sort === 'fee'
      if (params.sort === 'fee') {
        if (a.delivery_fee !== b.delivery_fee) {
          return a.delivery_fee - b.delivery_fee;
        }
      }

      // Sort nearest first (if distance is calculated)
      if (a.distance !== null && b.distance !== null) {
        if (Math.abs(a.distance - b.distance) > 0.05) {
          // Beyond a 50 meter difference, sort by distance
          return a.distance - b.distance;
        }
      } else if (a.distance !== null) {
        return -1;
      } else if (b.distance !== null) {
        return 1;
      }

      // Fallback sort by rating avg
      if (b.rating_avg !== a.rating_avg) {
        return b.rating_avg - a.rating_avg;
      }

      // Finally sort by name
      return a.name.localeCompare(b.name);
    });

    return this.enrichStoresWithPromo(results);
  }

  async getStoreById(storeId: string): Promise<StoreRow> {
    const store = await this.repo.getStoreById(storeId);
    if (!store) throw new NotFoundError('Magasin introuvable', 'store_not_found');
    const enriched = await this.enrichStoresWithPromo([store]);
    const result = enriched[0];
    const status = isStoreCurrentlyOpen(result);
    return {
      ...result,
      store_status: {
        is_open: status.isOpen,
        label_fr: status.labelFr,
        label_ar: status.labelAr,
        closes_at: status.isOpen ? getStoreClosesAt(result) : null,
      },
    } as StoreRow;
  }

  async enrichStoresWithPromo(stores: any[]) {
    const { data: allItems, error } = await supabase
      .from('menu_items')
      .select('id, store_id, price, options, is_available');

    const itemsByStore: Record<string, any[]> = {};
    if (!error && allItems) {
      allItems.forEach(row => {
        if (row.store_id) {
          if (!itemsByStore[row.store_id]) {
            itemsByStore[row.store_id] = [];
          }
          let rawOptions = row.options;
          let optionsObject: any = null;
          if (rawOptions) {
            if (typeof rawOptions === 'string') {
              try { optionsObject = JSON.parse(rawOptions); } catch {}
            } else if (typeof rawOptions === 'object' && !Array.isArray(rawOptions)) {
              optionsObject = rawOptions;
            }
          }
          const promo = optionsObject?.['__jaheez_product_promo'] || null;
          const unpacked = {
            ...row,
            promo_price: (row as any).promo_price ?? promo?.promo_price ?? null,
            promo_until: (row as any).promo_until ?? promo?.promo_until ?? null,
          };
          itemsByStore[row.store_id].push(unpacked);
        }
      });
    }

    const now = new Date().toISOString();
    const { data: couponPromos } = await supabase
      .from('promotions')
      .select('store_id')
      .eq('is_active', true)
      .or(`end_at.gt.${now},end_at.is.null`);
    const couponStoreIds = new Set((couponPromos || []).map(p => p.store_id).filter(Boolean));

    return stores.map(s => {
      // Filter out unavailable items and items with price <= 0 to prevent classification errors
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

      const hasReduction = activePromoItems.length > 0 || couponStoreIds.has(s.id);

      if (activePromoItems.length > 0) {
        if (activePromoItems.length === totalItems) {
          const percentages = activePromoItems.map(item => {
            const price = Number(item.price) || 1;
            const promoPrice = Number(item.promo_price);
            return Math.round((1 - promoPrice / price) * 100);
          });
          const firstPct = percentages[0] || 0;
          const allSamePct = percentages.every(p => Math.abs(p - firstPct) <= 2);

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
      } else if (couponStoreIds.has(s.id)) {
        promoType = 'articles';
      }

      return {
        ...s,
        has_reduction: hasReduction,
        reduction_percentage: reductionPct,
        promo_type: promoType,
      };
    });
  }

  async getStoreMenu(storeId: string) {
    const store = await this.getStoreById(storeId);
    const categories = await this.repo.getStoreMenu(storeId);
    return categories.map((category: any) => ({
      ...category,
      items: (category.items || [])
        .filter((item: any) => item.is_available !== false)
        .map((item: any) => {
          const optionsObject = item.options && !Array.isArray(item.options) && typeof item.options === 'object'
            ? item.options
            : null;
          const storedPromotion = optionsObject?.['__jaheez_product_promo'] || null;
          const rawOptionGroups = optionsObject?.groups || (Array.isArray(item.options) ? item.options : item.option_groups) || [];
          let optionGroups: CanonicalOptionGroup[] = [];
          let optionConfigurationValid = true;
          try {
            optionGroups = normalizeOptionGroups(rawOptionGroups);
          } catch {
            optionConfigurationValid = false;
          }
          const originalPriceDh = Number(item.price || 0);
          const candidatePromoPriceDh = Number(item.promo_price ?? storedPromotion?.promo_price ?? 0);
          const promoUntil = item.promo_until ?? storedPromotion?.promo_until ?? null;
          const hasActivePromotion = candidatePromoPriceDh > 0
            && candidatePromoPriceDh < originalPriceDh
            && (!promoUntil || new Date(promoUntil) > new Date());
          const displayPriceDh = hasActivePromotion ? candidatePromoPriceDh : originalPriceDh;

          let promotionLabel: string | null = null;
          if (hasActivePromotion) {
            const configuredReduction = Number((store as any).reduction_percentage || 0);
            if ((store as any).promo_type === 'store_percentage' && configuredReduction > 0) {
              promotionLabel = `-${configuredReduction}%`;
            } else if ((store as any).promo_type === 'store_fixed' && configuredReduction > 0) {
              promotionLabel = `-${configuredReduction} DH`;
            } else {
              const itemReduction = Math.round((1 - displayPriceDh / originalPriceDh) * 100);
              promotionLabel = itemReduction > 0 ? `-${itemReduction}%` : null;
            }
          }

          return {
            ...item,
            options: optionGroups,
            option_groups: optionGroups,
            display_price_dh: displayPriceDh,
            original_price_dh: originalPriceDh,
            has_active_promotion: hasActivePromotion,
            promotion_label: promotionLabel,
            ordering_available: optionConfigurationValid,
            option_configuration_valid: optionConfigurationValid,
          };
        }),
    }));
  }

  async getStoreReviews(storeId: string, page = 1, pageSize = 10) {
    await this.getStoreById(storeId);
    return this.repo.getStoreReviews(storeId, Math.max(1, page), Math.min(Math.max(1, pageSize), 50));
  }

  /**
   * Helper Haversine formula to compute distance in km between two points
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

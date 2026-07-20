import { supabase } from '../../db/supabase';

export interface StoreRow {
  id: string;
  name: string;
  name_ar: string | null;
  logo_url: string | null;
  category: string;
  cuisine_tags: string[] | null;
  rating_avg: number;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
  lat: number | null;
  lng: number | null;
  is_featured: boolean;
  is_open: boolean;
  address: string | null;
  address_ar: string | null;
  store_capacity_state: string;
}

export const SUB_CAT_TRANSLATIONS: Record<string, string[]> = {
  // Food / Restaurants
  'بيتزا': ['pizza', 'بيتزا'],
  'pizza': ['pizza', 'بيتزا'],
  'سريع': ['fast', 'burger', 'سريع', 'سناك', 'snack'],
  'fast': ['fast', 'burger', 'سريع', 'سناك', 'snack'],
  'rapide': ['fast', 'burger', 'سريع', 'سناك', 'snack'],
  'مغربي': ['moroccan', 'mghribi', 'tajine', 'مغربي', 'طاجين'],
  'moroccan': ['moroccan', 'mghribi', 'tajine', 'مغربي', 'طاجين'],
  'marocain': ['moroccan', 'mghribi', 'tajine', 'مغربي', 'طاجين'],
  'صحي': ['healthy', 'salad', 'صحي', 'سلطة'],
  'healthy': ['healthy', 'salad', 'صحي', 'سلطة'],
  'sain': ['healthy', 'salad', 'صحي', 'سلطة'],
  'شاورما': ['shawarma', 'chawarma', 'شاورما'],
  'shawarma': ['shawarma', 'chawarma', 'شاورما'],
  'برجر': ['burger', 'hambourger', 'برجر'],
  'burger': ['burger', 'hambourger', 'برجر'],
  'تاكو': ['tacos', 'taco', 'تاكو'],
  'tacos': ['tacos', 'taco', 'تاكو'],
  'إيطالي': ['italian', 'pasta', 'spaghetti', 'إيطالي', 'معكرونة'],
  'italian': ['italian', 'pasta', 'spaghetti', 'إيطالي', 'معكرونة'],
  'آسيوي': ['asian', 'sushi', 'chinese', 'noodles', 'آسيوي', 'سوشي'],
  'asian': ['asian', 'sushi', 'chinese', 'noodles', 'آسيوي', 'سوشي'],
  'كريب ووافل': ['crepe', 'gaufre', 'waffle', 'كريب', 'وافل'],
  'crêpes & gaufres': ['crepe', 'gaufre', 'waffle', 'كريب', 'وافل'],
  'حلويات ومثلجات': ['dessert', 'glace', 'ice cream', 'حلويات', 'مثلجات', 'حلوى'],
  'desserts': ['dessert', 'glace', 'ice cream', 'حلويات', 'مثلجات', 'حلوى'],
  'دجاج محمر': ['poulet', 'chicken', 'دجاج', 'محمر'],
  'poulet rôti': ['poulet', 'chicken', 'دجاج', 'محمر'],
  'سمك ومأكولات بحرية': ['fish', 'poisson', 'seafood', 'سمك', 'بحرية', 'حوت'],
  'poisson': ['fish', 'poisson', 'seafood', 'سمك', 'بحرية', 'حوت'],
  'سندويشات': ['sandwich', 'panini', 'سندويش', 'بانيني'],
  'sandwiches': ['sandwich', 'panini', 'سندويش', 'بانيني'],
  'مقهى وفطور': ['cafe', 'breakfast', 'petit dejeuner', 'قهوة', 'فطور'],
  'café & petit déjeuner': ['cafe', 'breakfast', 'petit dejeuner', 'قهوة', 'فطور'],
  'عصائر': ['juice', 'jus', 'smoothie', 'عصير', 'عصائر'],
  'jus': ['juice', 'jus', 'smoothie', 'عصير', 'عصائر'],

  // Groceries
  'خضروات وفواكه': ['veg', 'vegetable', 'fruit', 'خضار', 'خضروات', 'فواكه', 'تفاح', 'طماطم'],
  'fruits & légumes': ['veg', 'vegetable', 'fruit', 'خضار', 'خضروات', 'فواكه', 'تفاح', 'طماطم'],
  'ألبان وبيض': ['milk', 'dairy', 'lait', 'cheese', 'egg', 'oeuf', 'حليب', 'بيض', 'جبن'],
  'produits laitiers': ['milk', 'dairy', 'lait', 'cheese', 'egg', 'oeuf', 'حليب', 'بيض', 'جبن'],
  'مخبزة وخبز': ['bread', 'pain', 'bakery', 'croissant', 'خبز', 'مخبزة', 'كرواصة'],
  'boulangerie': ['bread', 'pain', 'bakery', 'croissant', 'خبز', 'مخبزة', 'كرواصة'],
  'مقبلات وحلويات': ['snack', 'sweet', 'candy', 'chips', 'biscuits', 'حلويات', 'بسكويت'],
  'snacks & confiserie': ['snack', 'sweet', 'candy', 'chips', 'biscuits', 'حلويات', 'بسكويت'],
  'مشروبات': ['drink', 'beverage', 'water', 'soda', 'cola', 'coca', 'مشروبات', 'ماء', 'عصير', 'كوكا'],
  'boissons': ['drink', 'beverage', 'water', 'soda', 'cola', 'coca', 'مشروبات', 'ماء', 'عصير', 'كوكا'],
  'منظفات': ['soap', 'detergent', 'clean', 'منظف', 'منظفات', 'صابون', 'أوميل'],
  'nettoyage': ['soap', 'detergent', 'clean', 'منظف', 'منظفات', 'صابون', 'أوميل'],
  'معلبات': ['canned', 'conserves', 'tuna', 'معلبات', 'تونة', 'طماطم مصبرة'],
  'conserves': ['canned', 'conserves', 'tuna', 'معلبات', 'تونة', 'طماطم مصبرة'],
  'لحوم ودواجن': ['meat', 'viande', 'poulet', 'beef', 'لحم', 'لحوم', 'دجاج', 'كفتة'],
  'boucherie': ['meat', 'viande', 'poulet', 'beef', 'لحم', 'لحوم', 'دجاج', 'كفتة'],

  // Pharmacy
  'أدوية': ['medicine', 'drug', 'pill', 'médicament', 'أدوية', 'دواء', 'أسبيرين', 'دولبران'],
  'médicaments': ['medicine', 'drug', 'pill', 'médicament', 'أدوية', 'دواء', 'أسبيرين', 'دولبران'],
  'عناية بالطفل': ['baby', 'bebe', 'couches', 'طفل', 'حليب أطفال', 'حفاظات'],
  'soins bébé': ['baby', 'bebe', 'couches', 'طفل', 'حليب أطفال', 'حفاظات'],
  'عناية بالبشرة / تجميل': ['skin', 'beauty', 'makeup', 'cream', 'cosmetique', 'تجميل', 'كريم', 'شامبو'],
  'beauté & cosmétiques': ['skin', 'beauty', 'makeup', 'cream', 'cosmetique', 'تجميل', 'كريم', 'شامبو'],
  'مكملات غذائية وفيتامينات': ['vitamin', 'supplement', 'bien-etre', 'فيتامين', 'مكملات'],
  'vitamines & bien-être': ['vitamin', 'supplement', 'bien-etre', 'فيتامين', 'مكملات'],
  'نظافة وإسعافات أولية': ['hygiene', 'first aid', 'soins', 'pansement', 'نظافة', 'معقم', 'ضمادات'],
  'hygiène & soins': ['hygiene', 'first aid', 'soins', 'pansement', 'نظافة', 'معقم', 'ضمادات'],
};

export class StoreRepository {
  async getAllStores(): Promise<StoreRow[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*');

    if (error) {
      throw new Error(`Database error fetching stores: ${error.message}`);
    }
    return data || [];
  }

  async getStoreById(storeId: string): Promise<StoreRow | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching store: ${error.message}`);
    }
    return data || null;
  }

  async getStoreMenu(storeId: string) {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*, items:menu_items(*)')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Database error fetching store menu: ${error.message}`);
    }
    return data || [];
  }

  async getStoreReviews(storeId: string, page: number, pageSize: number) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    const { data, error, count } = await supabase
      .from('store_reviews')
      .select('*, user:users(full_name, avatar_url)', { count: 'exact' })
      .eq('store_id', storeId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      throw new Error(`Database error fetching store reviews: ${error.message}`);
    }
    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > end + 1,
    };
  }

  async getMenuQueryMatches(subCategory: string): Promise<Set<string>> {
    const tag = subCategory.toLowerCase();
    const searchTerms = SUB_CAT_TRANSLATIONS[tag] || [tag];
    const orConditions = searchTerms.map(term => {
      const esc = `%${term}%`;
      return `name.ilike.${esc},name_ar.ilike.${esc}`;
    }).join(',');

    const { data, error } = await supabase
      .from('menu_items')
      .select('store_id')
      .eq('is_available', true)
      .or(orConditions);

    if (error) {
      return new Set();
    }
    return new Set(
      (data || [])
        .map(item => item.store_id)
        .filter((id): id is string => typeof id === 'string')
    );
  }

  async getStoresWithActivePromotions(): Promise<Set<string>> {
    const now = new Date().toISOString();
    const PROMO_OPTIONS_KEY = '__jaheez_product_promo';
    
    // A. Coupon promo stores
    const { data: couponPromos, error: couponError } = await supabase
      .from('promotions')
      .select('store_id')
      .eq('is_active', true)
      .or(`end_at.gt.${now},end_at.is.null`);

    // B. Menu item promo stores (check both column and options JSON key)
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('store_id, options');

    const storeIds = new Set<string>();

    if (!couponError && couponPromos) {
      couponPromos.forEach(p => {
        if (p.store_id) storeIds.add(p.store_id);
      });
    }

    if (!menuError && menuItems) {
      menuItems.forEach((item: any) => {
        let rawOptions = item.options;
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

        // Check if either column or options JSON contains active promo
        const promoPrice = item.promo_price ?? promo?.promo_price ?? null;
        const promoUntil = item.promo_until ?? promo?.promo_until ?? null;

        if (promoPrice !== null && Number(promoPrice) > 0) {
          if (!promoUntil || new Date(promoUntil) > new Date()) {
            if (item.store_id) storeIds.add(item.store_id);
          }
        }
      });
    }

    return storeIds;
  }
}

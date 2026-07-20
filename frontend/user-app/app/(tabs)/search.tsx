import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppSearchBar } from '../../components/ui/AppSearchBar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, FONTS } from '../../constants/brand';
import { dirRow, dirText } from '../../lib/direction';
import { resolveStoreImageUrl } from '../../lib/adminApi';
import { getAllStores, getStoreMenu, searchStores } from '../../lib/storeApi';
import { useLangStore } from '../../store/languageStore';
import { ASSETS } from '../../constants/assets';

type AppLang = 'ar' | 'fr' | 'en';
type ServiceKey = 'all' | 'food' | 'grocery' | 'pharmacy' | 'parcel' | 'errand';

type StoreLike = {
  id: string;
  name?: string | null;
  name_ar?: string | null;
  category?: string | null;
  cuisine_tags?: string[] | null;
  logo_url?: string | null;
  cover_url?: string | null;
  rating_avg?: number | null;
  delivery_time_min?: number | null;
  delivery_time_max?: number | null;
  delivery_fee?: number | null;
  is_open?: boolean | null;
};

type ProductResult = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  image: string;
  store: StoreLike;
};

type CategoryResult = {
  key: string;
  label: string;
  count: number;
};

const FALLBACK_STORE = Image.resolveAssetSource(ASSETS.illustrations.jaheez_food_bag_large).uri;
const FALLBACK_PRODUCT = Image.resolveAssetSource(ASSETS.illustrations.jaheez_food).uri;

const UI = {
  fr: {
    placeholder: 'Rechercher un plat, produit, magasin...',
    hintTitle: 'Que cherchez-vous ?',
    hintSub: 'Choisissez un type de service puis lancez la recherche.',
    all: 'Tout',
    food: 'Restaurants',
    grocery: 'Épicerie',
    pharmacy: 'Pharmacie',
    parcel: 'Colis',
    errand: 'Courses',
    restaurants: 'Restaurants',
    products: 'Produits',
    categories: 'Catégories',
    open: 'Ouvert',
    closed: 'Fermé',
    noResults: 'Aucun résultat',
    noResultsSub: 'Essayez un autre mot-clé ou un autre type.',
    more: 'Voir plus',
    loading: 'Recherche...',
  },
  en: {
    placeholder: 'Search for a dish, product, store...',
    hintTitle: 'What are you looking for?',
    hintSub: 'Choose a service type, then search.',
    all: 'All',
    food: 'Restaurants',
    grocery: 'Grocery',
    pharmacy: 'Pharmacy',
    parcel: 'Parcels',
    errand: 'Errands',
    restaurants: 'Restaurants',
    products: 'Products',
    categories: 'Categories',
    open: 'Open',
    closed: 'Closed',
    noResults: 'No results',
    noResultsSub: 'Try another keyword or service type.',
    more: 'See more',
    loading: 'Searching...',
  },
  ar: {
    placeholder: 'ابحث عن طبق، منتج، متجر...',
    hintTitle: 'عن ماذا تبحث؟',
    hintSub: 'اختر نوع الخدمة ثم ابدأ البحث.',
    all: 'الكل',
    food: 'مطاعم',
    grocery: 'بقالة',
    pharmacy: 'صيدلية',
    parcel: 'طرود',
    errand: 'مهام',
    restaurants: 'مطاعم',
    products: 'منتجات',
    categories: 'تصنيفات',
    open: 'مفتوح',
    closed: 'مغلق',
    noResults: 'لا توجد نتائج',
    noResultsSub: 'جرّب كلمة أخرى أو نوع خدمة آخر.',
    more: 'عرض المزيد',
    loading: 'جاري البحث...',
  },
} as const;

const SERVICES: Array<{ key: ServiceKey; icon: string }> = [
  { key: 'all', icon: 'apps-outline' },
  { key: 'food', icon: 'restaurant-outline' },
  { key: 'grocery', icon: 'basket-outline' },
  { key: 'pharmacy', icon: 'medkit-outline' },
  { key: 'parcel', icon: 'cube-outline' },
  { key: 'errand', icon: 'clipboard-outline' },
];

function norm(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function includesQuery(value: unknown, q: string) {
  return norm(value).includes(q);
}

function uniqueStores(stores: StoreLike[]) {
  const seen = new Set<string>();
  return stores.filter((store) => {
    if (!store?.id || seen.has(store.id)) return false;
    seen.add(store.id);
    return true;
  });
}

function displayStoreName(store: StoreLike, lang: AppLang) {
  if (lang === 'ar') return store.name_ar || store.name || '';
  return store.name || store.name_ar || '';
}

function formatDh(value: number | null | undefined) {
  const n = Number(value || 0);
  return `${n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
}

function isPromoActive(item: any) {
  return (
    item?.promo_price != null &&
    Number(item.promo_price) > 0 &&
    (!item.promo_until || new Date(item.promo_until) > new Date())
  );
}

function makeCategoryLabel(value: string) {
  const clean = value.replace(/[_-]+/g, ' ').trim();
  if (!clean) return '';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function serviceMatches(store: StoreLike, service: ServiceKey) {
  if (service === 'all') return true;
  const raw = norm(store.category);

  if (service === 'food') {
    return ['food', 'restaurant', 'restaurants', 'restauration', 'cafe', 'bakery'].some((key) => raw.includes(key));
  }
  if (service === 'grocery') {
    return ['grocery', 'store', 'shop', 'magasin', 'epicerie', 'épicerie', 'supermarket'].some((key) => raw.includes(key));
  }
  if (service === 'pharmacy') {
    return ['pharmacy', 'pharmacie', 'health', 'sante', 'santé'].some((key) => raw.includes(key));
  }
  if (service === 'parcel') {
    return ['parcel', 'colis', 'package', 'delivery'].some((key) => raw.includes(key));
  }
  if (service === 'errand') {
    return ['errand', 'course', 'courses', 'mission', 'special'].some((key) => raw.includes(key));
  }

  return false;
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const { lang, isRTL } = useLangStore();
  const text = UI[lang] || UI.fr;

  const [input, setInput] = useState(String(params.q || ''));
  const [searched, setSearched] = useState(String(params.q || '').trim());
  const [activeService, setActiveService] = useState<ServiceKey>('all');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [allStores, setAllStores] = useState<StoreLike[]>([]);
  const [restaurants, setRestaurants] = useState<StoreLike[]>([]);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [categories, setCategories] = useState<CategoryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const runId = useRef(0);

  const hasSearch = searched.trim().length > 0;

  const animateResults = useCallback(() => {
    resultAnim.setValue(0);
    Animated.timing(resultAnim, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [resultAnim]);

  useEffect(() => {
    let alive = true;
    getAllStores(1, 100).then((res) => {
      if (alive && res.data?.data) setAllStores(res.data.data as StoreLike[]);
    });
    return () => { alive = false; };
  }, []);

  const availableServices = useMemo(() => {
    const hasLoadedStores = allStores.length > 0;
    const filtered = SERVICES.filter((service) => (
      service.key === 'all' ||
      !hasLoadedStores ||
      allStores.some((store) => serviceMatches(store, service.key))
    ));
    return filtered.length > 1 ? filtered : SERVICES.slice(0, 5);
  }, [allStores]);

  const serviceCounts = useMemo(() => {
    const counts: Record<ServiceKey, number> = {
      all: allStores.length,
      food: 0,
      grocery: 0,
      pharmacy: 0,
      parcel: 0,
      errand: 0,
    };
    allStores.forEach((store) => {
      (['food', 'grocery', 'pharmacy', 'parcel', 'errand'] as ServiceKey[]).forEach((key) => {
        if (serviceMatches(store, key)) counts[key] += 1;
      });
    });
    return counts;
  }, [allStores]);

  const buildProductsAndCategories = useCallback(async (term: string, sourceStores: StoreLike[]) => {
    const productRows: ProductResult[] = [];
    const categoryMap = new Map<string, CategoryResult>();

    sourceStores.forEach((store) => {
      const values = [store.category, ...(store.cuisine_tags || [])].filter(Boolean) as string[];
      values.forEach((raw) => {
        const key = norm(raw);
        if (!key) return;
        if (!includesQuery(raw, term) && !includesQuery(displayStoreName(store, lang), term)) return;
        const existing = categoryMap.get(key);
        categoryMap.set(key, {
          key,
          label: makeCategoryLabel(raw),
          count: (existing?.count || 0) + 1,
        });
      });
    });

    const storesToScan = sourceStores.slice(0, 14);
    const menus = await Promise.all(
      storesToScan.map(async (store) => {
        const res = await getStoreMenu(store.id);
        return { store, categories: res.data || [] };
      })
    );

    menus.forEach(({ store, categories: menuCategories }) => {
      menuCategories.forEach((cat: any) => {
        const catName = cat?.name || cat?.name_ar || '';
        (cat?.items || []).forEach((item: any) => {
          const itemName = lang === 'ar' ? item?.name_ar || item?.name : item?.name || item?.name_ar;
          const haystack = [item?.name, item?.name_ar, item?.description, item?.description_ar, catName].join(' ');
          if (!includesQuery(haystack, term)) return;

          const price = isPromoActive(item) ? Number(item.promo_price) : Number(item.price || 0);
          productRows.push({
            id: String(item.id),
            name: itemName || '',
            subtitle: displayStoreName(store, lang),
            price,
            image: resolveStoreImageUrl(item?.image_url || item?.photo_url || store.cover_url || store.logo_url, FALLBACK_PRODUCT),
            store,
          });

          const key = norm(catName || store.category);
          if (key && !categoryMap.has(key)) {
            categoryMap.set(key, { key, label: makeCategoryLabel(catName || store.category || ''), count: 1 });
          }
        });
      });
    });

    return {
      products: productRows.slice(0, 18),
      categories: [...categoryMap.values()]
        .filter((cat) => cat.label)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }, [lang]);

  const runSearch = useCallback(async (raw: string, service: ServiceKey = activeService) => {
    const term = raw.trim();
    setInput(term);
    setSearched(term);
    setShowAllProducts(false);
    setError(null);

    if (!term) {
      setRestaurants([]);
      setProducts([]);
      setCategories([]);
      return;
    }

    const myRun = ++runId.current;
    setLoading(true);
    inputRef.current?.blur();

    try {
      const remote = await searchStores(term);
      const localMatches = allStores.filter((store) => {
        const values = [
          store.name,
          store.name_ar,
          store.category,
          ...(store.cuisine_tags || []),
        ];
        return values.some((value) => includesQuery(value, norm(term)));
      });

      const matchedStores = uniqueStores([...(remote.data || []), ...localMatches])
        .filter((store) => serviceMatches(store, service));
      const scanSource = uniqueStores([...matchedStores, ...allStores])
        .filter((store) => serviceMatches(store, service))
        .slice(0, 80);
      const extra = await buildProductsAndCategories(norm(term), scanSource);

      if (myRun !== runId.current) return;
      setRestaurants(matchedStores.slice(0, 20));
      setProducts(extra.products);
      setCategories(extra.categories);
      animateResults();
    } catch (err: any) {
      if (myRun !== runId.current) return;
      setRestaurants([]);
      setProducts([]);
      setCategories([]);
      setError(err?.message || 'Search failed');
      animateResults();
    } finally {
      if (myRun === runId.current) setLoading(false);
    }
  }, [activeService, allStores, animateResults, buildProductsAndCategories]);

  const handleServicePress = useCallback((service: ServiceKey) => {
    setActiveService(service);
    if (hasSearch) runSearch(searched, service);
  }, [hasSearch, runSearch, searched]);

  useEffect(() => {
    const initial = String(params.q || '').trim();
    if (initial) runSearch(initial, activeService);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalResults = restaurants.length + products.length + categories.length;
  const isEmpty = hasSearch && !loading && totalResults === 0;
  const resultProducts = showAllProducts ? products : products.slice(0, 6);

  const animatedStyle = {
    opacity: resultAnim,
    transform: [{
      translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }),
    }],
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={[styles.searchHeaderRow, { flexDirection: dirRow(isRTL) }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel={lang === 'ar' ? '\u0631\u062c\u0648\u0639' : 'Retour'}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={BRAND.TEXT}
              style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
            />
          </Pressable>
          <AppSearchBar
            inputRef={inputRef}
            value={input}
            onChangeText={setInput}
            onSubmit={() => runSearch(input)}
            onClear={() => { setInput(''); setSearched(''); }}
            showClear
            placeholder={text.placeholder}
            accessibilityLabel={text.placeholder}
            isRTL={isRTL}
            style={styles.searchBarFlex}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.serviceFilters, { flexDirection: dirRow(isRTL) }]}
        >
          {availableServices.map((service) => {
            const selected = activeService === service.key;
            const count = serviceCounts[service.key] || 0;
            return (
              <Pressable
                key={service.key}
                onPress={() => handleServicePress(service.key)}
                style={[styles.serviceChip, selected && styles.serviceChipActive]}
              >
                <Ionicons
                  name={service.icon as any}
                  size={15}
                  color={selected ? BRAND.SURFACE : BRAND.TEXT2}
                />
                <Text style={[styles.serviceText, selected && styles.serviceTextActive]}>
                  {text[service.key]}{count > 0 && service.key !== 'all' ? ` ${count}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {!hasSearch ? (
        <View style={styles.initialState}>
          <View style={styles.initialIcon}>
            <Ionicons name="search" size={28} color={BRAND.RED} />
          </View>
          <Text style={styles.initialTitle}>{text.hintTitle}</Text>
          <Text style={styles.initialSub}>{text.hintSub}</Text>
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.results, { paddingBottom: 120 + insets.bottom }]}
        >
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={BRAND.RED} />
              <Text style={styles.loadingText}>{text.loading}</Text>
            </View>
          )}

          {!loading && (
            <Animated.View style={animatedStyle}>
              {!!error && <Text style={styles.errorText}>{error}</Text>}

              {restaurants.length > 0 && (
                <Section title={text.restaurants} isRTL={isRTL}>
                  {restaurants.map((store, index) => (
                    <StoreRow
                      key={store.id}
                      store={store}
                      lang={lang}
                      isRTL={isRTL}
                      openText={text.open}
                      closedText={text.closed}
                      delay={index * 35}
                      onPress={() => router.push(`/(flows)/store/${store.id}` as any)}
                    />
                  ))}
                </Section>
              )}

              {products.length > 0 && (
                <Section title={text.products} isRTL={isRTL}>
                  {resultProducts.map((product, index) => (
                    <ProductRow
                      key={`${product.store.id}-${product.id}`}
                      product={product}
                      isRTL={isRTL}
                      delay={index * 35}
                      onPress={() => router.push(`/(flows)/store/${product.store.id}` as any)}
                    />
                  ))}
                  {!showAllProducts && products.length > 6 && (
                    <Pressable style={styles.moreButton} onPress={() => setShowAllProducts(true)}>
                      <Text style={styles.moreText}>{text.more}</Text>
                      <Ionicons name="chevron-down" size={14} color={BRAND.RED} />
                    </Pressable>
                  )}
                </Section>
              )}

              {categories.length > 0 && (
                <Section title={text.categories} isRTL={isRTL}>
                  <View style={styles.categoryGrid}>
                    {categories.map((category, index) => (
                      <AnimatedCategory
                        key={category.key}
                        category={category}
                        delay={index * 35}
                        onPress={() => runSearch(category.label, activeService)}
                      />
                    ))}
                  </View>
                </Section>
              )}

              {isEmpty && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={34} color={BRAND.TEXT3} />
                  <Text style={styles.emptyTitle}>{text.noResults}</Text>
                  <Text style={styles.emptySub}>{text.noResultsSub}</Text>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

function Section({ title, isRTL, children }: { title: string; isRTL: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { flexDirection: dirRow(isRTL) }]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons name="chevron-up" size={16} color={BRAND.TEXT} />
      </View>
      {children}
    </View>
  );
}

function StoreRow({
  store,
  lang,
  isRTL,
  openText,
  closedText,
  delay,
  onPress,
}: {
  store: StoreLike;
  lang: AppLang;
  isRTL: boolean;
  openText: string;
  closedText: string;
  delay: number;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 280,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const image = resolveStoreImageUrl(store.logo_url || store.cover_url || undefined, FALLBACK_STORE);
  const open = store.is_open !== false;
  const min = Number(store.delivery_time_min || 20);
  const max = Number(store.delivery_time_max || 35);
  const fee = Number(store.delivery_fee || 0);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }}
    >
      <Pressable style={[styles.storeRow, { flexDirection: dirRow(isRTL) }]} onPress={onPress}>
        <Image source={{ uri: image }} style={styles.rowImage} />
        <View style={[styles.rowBody, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.rowTitle, { textAlign: dirText(isRTL) }]} numberOfLines={1}>
            {displayStoreName(store, lang)}
          </Text>
          <View style={[styles.metaRow, { flexDirection: dirRow(isRTL) }]}>
            <Ionicons name="star" size={13} color={BRAND.YELLOW} />
            <Text style={styles.metaText}>{Number(store.rating_avg || 4.5).toFixed(1)}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{min}–{max} min</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{fee === 0 ? '0 DH' : `${fee} DH`}</Text>
          </View>
          <Text style={[styles.openText, !open && styles.closedText]}>
            {open ? openText : closedText}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ProductRow({
  product,
  isRTL,
  delay,
  onPress,
}: {
  product: ProductResult;
  isRTL: boolean;
  delay: number;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 280,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }}
    >
      <Pressable style={[styles.productRow, { flexDirection: dirRow(isRTL) }]} onPress={onPress}>
        <Image source={{ uri: product.image }} style={styles.rowImage} />
        <View style={[styles.rowBody, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.rowTitle, { textAlign: dirText(isRTL) }]} numberOfLines={1}>{product.name}</Text>
          <Text style={[styles.productSub, { textAlign: dirText(isRTL) }]} numberOfLines={1}>{product.subtitle}</Text>
          <Text style={styles.productPrice}>{formatDh(product.price)}</Text>
        </View>
        <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={BRAND.TEXT2} />
      </Pressable>
    </Animated.View>
  );
}

function AnimatedCategory({ category, delay, onPress }: { category: CategoryResult; delay: number; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
      }}
    >
      <Pressable style={styles.categoryChip} onPress={onPress}>
        <Text style={styles.categoryLabel}>{category.label}</Text>
        <Text style={styles.categoryCount}>{category.count}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.SURFACE,
  },
  header: {
    backgroundColor: BRAND.SURFACE,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  searchHeaderRow: {
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.SURFACE,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarFlex: {
    flex: 1,
    minHeight: 44,
    height: 44,
    borderRadius: 22,
  },
  serviceFilters: {
    gap: 9,
    paddingTop: 12,
    paddingBottom: 2,
  },
  serviceChip: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: BRAND.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  serviceChipActive: {
    backgroundColor: BRAND.RED,
  },
  serviceText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 12,
    color: BRAND.TEXT2,
  },
  serviceTextActive: {
    color: BRAND.SURFACE,
  },
  initialState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  initialIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BRAND.RED_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  initialTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 19,
    color: BRAND.TEXT,
    marginBottom: 6,
    textAlign: 'center',
  },
  initialSub: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT3,
    textAlign: 'center',
    lineHeight: 20,
  },
  results: {
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT3,
  },
  section: {
    marginTop: 18,
  },
  sectionHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 15,
    color: BRAND.TEXT,
  },
  storeRow: {
    alignItems: 'center',
    paddingVertical: 9,
    gap: 12,
  },
  productRow: {
    alignItems: 'center',
    paddingVertical: 9,
    gap: 12,
  },
  rowImage: {
    width: 74,
    height: 74,
    borderRadius: 14,
    backgroundColor: '#F4F4F4',
  },
  rowBody: {
    flex: 1,
    minHeight: 70,
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 14,
    color: BRAND.TEXT,
    marginBottom: 6,
  },
  metaRow: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  metaText: {
    fontFamily: FONTS.BODY,
    fontSize: 12,
    color: BRAND.TEXT2,
  },
  metaDot: {
    fontFamily: FONTS.BODY,
    fontSize: 12,
    color: BRAND.TEXT3,
  },
  openText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 12,
    color: BRAND.GREEN,
  },
  closedText: {
    color: BRAND.ERROR,
  },
  productSub: {
    fontFamily: FONTS.BODY,
    fontSize: 12,
    color: BRAND.TEXT3,
    marginBottom: 7,
  },
  productPrice: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 13,
    color: BRAND.TEXT,
  },
  moreButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  moreText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 12,
    color: BRAND.RED,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    minHeight: 40,
    borderRadius: 13,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  categoryLabel: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 12,
    color: BRAND.TEXT,
  },
  categoryCount: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: BRAND.TEXT3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
  },
  emptyTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 17,
    color: BRAND.TEXT,
    marginTop: 12,
  },
  emptySub: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT3,
    marginTop: 6,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.ERROR,
    paddingVertical: 12,
    textAlign: 'center',
  },
});

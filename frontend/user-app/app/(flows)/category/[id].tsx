import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Modal,
  Animated as RNAnimated,
  ImageSourcePropType
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  interpolateColor,
  Extrapolation,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { AppIcon } from '@/components/ui/AppIcon';
import { useLangStore } from '../../../store/languageStore';
import { dirRow, dirText, dirItems } from '../../../lib/direction';
import { BRAND, FONTS } from '../../../constants/brand';
import { useStoresByCategory, usePublicServiceCategories } from '../../../hooks/queries/useStores';
import { isStoreCurrentlyOpen } from '../../../lib/storeStatus';
import { resolveStoreImageUrl } from '../../../lib/adminApi';
import { StoreListCard } from '../../../components/ui';
import { AppSearchBar } from '../../../components/ui/AppSearchBar';
import { useAuthStore } from '../../../features/auth/store/authStore';
import { toggleFavorite } from '../../../features/stores/services/storeApi';
import { backendJson } from '../../../lib/backendApi';

const { width } = Dimensions.get('window');
const SIDE = 20;

type ServiceKey = 'food' | 'grocery' | 'pharmacy' | 'parcel' | 'errand';
type SortOption = 'recommended' | 'rating' | 'fee' | 'promotions';
type PromoType = 'store_percentage' | 'store_fixed' | 'articles' | 'none';

type PublicServiceCategory = {
  id: string;
  parent_id?: string | null;
  name_ar?: string | null;
  name_fr?: string | null;
  tint_color?: string | null;
  color_hex?: string | null;
};

type CustomerStore = {
  id: string | number;
  name?: string | null;
  name_ar?: string | null;
  category?: string | null;
  category_name?: string | null;
  sub_category?: string | null;
  service_category?: string | null;
  cuisine_tags?: string[] | null;
  delivery_fee?: number | null;
  delivery_time_min?: number | null;
  delivery_time_max?: number | null;
  cover_url?: string | null;
  logo_url?: string | null;
  is_featured?: boolean | null;
  is_jaheez_plus?: boolean | null;
  is_new?: boolean | null;
  isNew?: boolean | null;
  promo_type?: PromoType | null;
  reduction_percentage?: number | null;
  is_open?: boolean | null;
  opening_hours?: unknown;
};

type FavoriteStoreRef = {
  id?: string | number | null;
  store_id?: string | number | null;
};

type StoreCardModel = {
  id: string;
  name: string;
  categoryLabel: string;
  deliveryFee: number | null;
  feeLabel: string | null;
  etaMin: number | null;
  etaMax: number | null;
  imageUrl: string | null;
  isFeatured: boolean;
  isPlus: boolean;
  raw: CustomerStore;
};

const SERVICE_DEFAULTS: Record<ServiceKey, { fr: string; ar: string; icon: ImageSourcePropType }> = {
  food: {
    fr: 'Restaurants',
    ar: '\u0645\u0637\u0627\u0639\u0645',
    icon: require('../../../assets/illustrations/new_categories/food.png'),
  },
  grocery: {
    fr: 'Epicerie',
    ar: '\u0628\u0642\u0627\u0644\u0629',
    icon: require('../../../assets/illustrations/new_categories/grocery.png'),
  },
  pharmacy: {
    fr: 'Pharmacie',
    ar: '\u0635\u064a\u062f\u0644\u064a\u0629',
    icon: require('../../../assets/illustrations/new_categories/pharmacy.png'),
  },
  parcel: {
    fr: 'Colis',
    ar: '\u0637\u0631\u0648\u062f',
    icon: require('../../../assets/illustrations/new_categories/parcel.png'),
  },
  errand: {
    fr: 'Services',
    ar: '\u062e\u062f\u0645\u0627\u062a',
    icon: require('../../../assets/illustrations/new_categories/errand.png'),
  },
};

function normalizeServiceKey(id?: string, title?: string): ServiceKey {
  const isStaticServiceId = id && id.length < 5;
  const rawId = (id || '').toLowerCase();
  const rawTitle = (title || '').toLowerCase();

  if ((isStaticServiceId && rawId === '2') || rawTitle.includes('grocery') || rawTitle.includes('epicer') || rawId.includes('grocery')) return 'grocery';
  if ((isStaticServiceId && rawId === '3') || rawTitle.includes('pharm') || rawId.includes('pharm')) return 'pharmacy';
  if ((isStaticServiceId && rawId === '4') || rawTitle.includes('parcel') || rawTitle.includes('colis') || rawId.includes('parcel')) return 'parcel';
  if ((isStaticServiceId && rawId === '5') || rawTitle.includes('errand') || rawTitle.includes('service') || rawId.includes('errand')) return 'errand';
  return 'food';
}

function moneyDh(value: unknown): string {
  const amount = Number(value || 0);
  return amount <= 0 ? '0 DH' : `${amount.toFixed(amount % 1 === 0 ? 0 : 2)} DH`;
}

// Old RestaurantCard replaced with StoreListCard component

interface IconProps {
  name: string;
  size?: number;
}

const SVG_REPO_FOOD_ICONS = {
  all: 'https://www.svgrepo.com/show/356598/ramen-bowl.svg',
  burger: 'https://www.svgrepo.com/show/356623/sandwich-burger.svg',
  pizza: 'https://www.svgrepo.com/show/356619/pizza-02.svg',
  pizzaSlice: 'https://www.svgrepo.com/show/356620/pizza-slice-02.svg',
  taco: 'https://www.svgrepo.com/show/356609/taco-02.svg',
  ramen: 'https://www.svgrepo.com/show/356598/ramen-bowl.svg',
  dessert: 'https://www.svgrepo.com/show/356602/ice-cream-bar-02.svg',
  drink: 'https://www.svgrepo.com/show/356612/soda-glass.svg',
  shake: 'https://www.svgrepo.com/show/356608/shake.svg',
  salad: 'https://www.svgrepo.com/show/356599/salad.svg',
  fast: 'https://www.svgrepo.com/show/356610/hot-dog-02.svg',
  chicken: 'https://www.svgrepo.com/show/356611/chicken.svg',
  sandwich: 'https://www.svgrepo.com/show/356600/sandwich-sub.svg',
  sushi: 'https://www.svgrepo.com/show/356577/sushi-03-nigiri-tai.svg',
  pasta: 'https://www.svgrepo.com/show/356617/noodle-fusili.svg',
  egg: 'https://www.svgrepo.com/show/356592/egg-fried-02.svg',
} as const;

function getSvgRepoFoodIconUri(name: string): string {
  const t = name.toLowerCase();

  if (t.includes('tous') || t.includes('all') || t.includes('\u0627\u0644\u0643\u0644')) return SVG_REPO_FOOD_ICONS.all;
  if (t.includes('pizza')) return SVG_REPO_FOOD_ICONS.pizza;
  if (t.includes('burger')) return SVG_REPO_FOOD_ICONS.burger;
  if (t.includes('taco')) return SVG_REPO_FOOD_ICONS.taco;
  if (t.includes('ramen') || t.includes('noodle') || t.includes('soupe') || t.includes('soup') || t.includes('maroc') || t.includes('tajine')) return SVG_REPO_FOOD_ICONS.ramen;
  if (t.includes('dessert') || t.includes('ice') || t.includes('cream') || t.includes('sweet') || t.includes('crepe') || t.includes('gaufre')) return SVG_REPO_FOOD_ICONS.dessert;
  if (t.includes('shake') || t.includes('smoothie')) return SVG_REPO_FOOD_ICONS.shake;
  if (t.includes('drink') || t.includes('boisson') || t.includes('jus') || t.includes('juice') || t.includes('water') || t.includes('soda')) return SVG_REPO_FOOD_ICONS.drink;
  if (t.includes('salad') || t.includes('salade') || t.includes('healthy') || t.includes('sain')) return SVG_REPO_FOOD_ICONS.salad;
  if (t.includes('fast') || t.includes('rapide') || t.includes('hot dog') || t.includes('frite')) return SVG_REPO_FOOD_ICONS.fast;
  if (t.includes('chicken') || t.includes('poulet')) return SVG_REPO_FOOD_ICONS.chicken;
  if (t.includes('sandwich')) return SVG_REPO_FOOD_ICONS.sandwich;
  if (t.includes('sushi') || t.includes('asiatique')) return SVG_REPO_FOOD_ICONS.sushi;
  if (t.includes('pasta') || t.includes('spaghetti') || t.includes('ital')) return SVG_REPO_FOOD_ICONS.pasta;
  if (t.includes('egg') || t.includes('breakfast') || t.includes('cafe')) return SVG_REPO_FOOD_ICONS.egg;

  return SVG_REPO_FOOD_ICONS.pizzaSlice;
}

function SvgRepoFoodIcon({ name }: IconProps) {
  return (
    <Image
      source={{ uri: getSvgRepoFoodIconUri(name) }}
      style={styles.categorySvgIcon}
      contentFit="contain"
      accessibilityLabel={`${name} icon`}
    />
  );
}

function CategoryChip({
  tag,
  active,
  onPress,
}: {
  tag: { name: string };
  active: boolean;
  onPress: () => void;
}) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const selected = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    selected.value = withTiming(active ? 1 : 0, { duration: 120 });
    if (active) {
      rotation.value = withTiming(10, { duration: 120 });
      scale.value = withTiming(1.04, { duration: 120 });
    } else {
      rotation.value = withTiming(0, { duration: 110 });
      scale.value = withTiming(1.0, { duration: 110 });
    }
  }, [active]);

  const handlePressIn = useCallback(() => {
    const nextSelected = active ? 0 : 1;
    selected.value = withTiming(nextSelected, { duration: 80 });
    rotation.value = withTiming(active ? 0 : 10, { duration: 80 });
    scale.value = withTiming(active ? 0.98 : 1.04, { duration: 80 });
  }, [active, rotation, scale, selected]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
      opacity: 0.65 + selected.value * 0.35,
    };
  });

  const selectedBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selected.value,
      [0, 1],
      ['rgba(245, 206, 46, 0)', BRAND.YELLOW_LIGHT]
    ),
    borderColor: interpolateColor(
      selected.value,
      [0, 1],
      ['rgba(232, 230, 223, 0)', BRAND.YELLOW]
    ),
  }));

  return (
    <Pressable
      style={[styles.categoryCard, active && styles.categoryCardActive]}
      onPressIn={handlePressIn}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tag.name}
    >
      <Animated.View style={[styles.categoryIconBubble, selectedBgStyle]}>
        <Animated.View style={animatedIconStyle}>
          <SvgRepoFoodIcon name={tag.name} />
        </Animated.View>
      </Animated.View>
      <Text
        style={[
          styles.categoryLabel,
          active && styles.categoryLabelActive,
        ]}
        numberOfLines={1}
      >
        {tag.name}
      </Text>
    </Pressable>
  );
}

function SortFilterChip({
  active,
  label,
  icon,
  count,
  isRTL,
  lang,
  onPress,
  onClear,
}: {
  active: boolean;
  label: string;
  icon: React.ComponentProps<typeof AppIcon>['name'];
  count?: number;
  isRTL: boolean;
  lang: string;
  onPress: () => void;
  onClear: () => void;
}) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 90 });
  }, [active, progress]);

  const clearStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, 18], Extrapolation.CLAMP),
    opacity: progress.value,
    overflow: 'hidden',
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.sortBtn, active && styles.sortBtnActive, { flexDirection: dirRow(isRTL) }]}
      onPress={onPress}
    >
      <AppIcon name={icon} size={14} color={active ? BRAND.SURFACE : BRAND.TEXT3} active={active} />
      <Text style={[styles.sortBtnTxt, active && styles.sortBtnTxtActive]}>
        {label}
      </Text>
      {typeof count === 'number' && count > 1 ? (
        <View style={styles.sortCountBadge}>
          <Text style={styles.sortCountText}>{count}</Text>
        </View>
      ) : null}
      <Animated.View style={clearStyle}>
        <Pressable
          style={styles.sortClearBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={lang === 'ar' ? '\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0641\u0644\u062a\u0631' : 'Clear filter'}
          onPress={(event) => {
            event.stopPropagation();
            onClear();
          }}
        >
          <AppIcon name="close" size={12} color={BRAND.RED} />
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

export default function CategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, title } = useLocalSearchParams<{ id?: string; title?: string }>();
  const { isRTL, lang } = useLangStore();
  const scrollY = useSharedValue(0);

  // Favorites management
  const user = useAuthStore(s => s.user);
  const userId = user?.id;
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    if (userId) {
      backendJson<FavoriteStoreRef[]>('/admin-api/v1/customer/favorites/stores')
        .then(res => {
          if (Array.isArray(res)) {
            setFavoriteIds(res.map(item => String(item.id || item.store_id)));
          }
        })
        .catch(() => {});
    }
  }, [userId]);

  const handleToggleFavorite = useCallback(async (storeId: string) => {
    if (!userId) {
      alert(lang === 'ar' ? '\u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648\u0644\u0627' : "Veuillez vous connecter d'abord");
      return;
    }
    const isFav = favoriteIds.includes(storeId);
    setFavoriteIds(prev =>
      isFav ? prev.filter(fid => fid !== storeId) : [...prev, storeId]
    );
    try {
      await toggleFavorite(userId, storeId);
    } catch (err) {
      setFavoriteIds(prev =>
        isFav ? [...prev, storeId] : prev.filter(fid => fid !== storeId)
      );
    }
  }, [userId, favoriteIds, lang]);

  const serviceKey = useMemo(() => normalizeServiceKey(id, title), [id, title]);
  const allLabel = lang === 'ar' ? '\u0627\u0644\u0643\u0644' : 'Tous';
  const [activeTags, setActiveTags] = useState<string[]>([allLabel]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recommended');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [filterFreeDelivery, setFilterFreeDelivery] = useState(false);
  const [filterPromotions, setFilterPromotions] = useState(false);
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterUnder30, setFilterUnder30] = useState(false);

  const { data: allCategories = [] } = usePublicServiceCategories();
  const serviceCategories = allCategories as PublicServiceCategory[];
  const serviceConfig = useMemo(
    () => serviceCategories.find((c) => c.id === serviceKey || c.id === id),
    [id, serviceCategories, serviceKey]
  );

  const dynamicSubCats = useMemo(
    () => serviceCategories.filter((c) => c.parent_id && c.parent_id === serviceConfig?.id),
    [serviceCategories, serviceConfig?.id]
  );

  const pageTitle = lang === 'ar'
    ? String(serviceConfig?.name_ar || SERVICE_DEFAULTS[serviceKey].ar)
    : String(serviceConfig?.name_fr || SERVICE_DEFAULTS[serviceKey].fr);
  const serviceIcon = SERVICE_DEFAULTS[serviceKey].icon;
  const categoryQuery = serviceKey === 'parcel' || serviceKey === 'errand' ? 'food' : serviceKey;
  const searchQuery = search.trim().length >= 2 ? search.trim() : undefined;

  const selectedCategoryTags = useMemo(
    () => activeTags.filter(tag => tag !== allLabel),
    [activeTags, allLabel]
  );
  const deferredSelectedCategoryTags = useDeferredValue(selectedCategoryTags);
  const deferredBackendSubCategory = deferredSelectedCategoryTags.length === 1 ? deferredSelectedCategoryTags[0] : allLabel;

  const { data, isLoading } = useStoresByCategory(categoryQuery, deferredBackendSubCategory, sort, 1, searchQuery);
  const rawStores = (data?.data ?? []) as CustomerStore[];

  const catKey = categoryQuery;

  const backendTags = useMemo(() => {
    const seen = new Set<string>();
    const tags: { label: string; value: string }[] = [];

    for (const store of rawStores) {
      for (const rawTag of store.cuisine_tags || []) {
        const tag = String(rawTag || '').trim();
        const key = tag.toLowerCase();
        if (!tag || seen.has(key)) continue;
        seen.add(key);
        tags.push({ label: tag, value: tag });
        if (tags.length >= 10) break;
      }
      if (tags.length >= 10) break;
    }

    if (tags.length === 0) {
      for (const cat of dynamicSubCats) {
        const labelVal = lang === 'ar' ? cat.name_ar || cat.name_fr : cat.name_fr || cat.name_ar;
        const key = String(labelVal || '').toLowerCase();
        if (!labelVal || seen.has(key)) continue;
        seen.add(key);
        tags.push({ label: labelVal, value: labelVal });
      }
    }

    return [{ label: allLabel, value: allLabel }, ...tags];
  }, [allLabel, dynamicSubCats, lang, rawStores]);

  useEffect(() => {
    const validTags = new Set(backendTags.map(tag => tag.value));
    const nextTags = activeTags.filter(tag => validTags.has(tag));
    if (nextTags.length === 0) {
      setActiveTags([allLabel]);
    } else if (nextTags.length !== activeTags.length) {
      setActiveTags(nextTags);
    }
  }, [activeTags, allLabel, backendTags]);

  useEffect(() => {
    setActiveTags([allLabel]);
  }, [allLabel, serviceKey]);

  const stores = useMemo<StoreCardModel[]>(() => {
    return rawStores.map((store) => {
      const rawImageUrl = store.cover_url || store.logo_url || undefined;
      const imageUrl = rawImageUrl
        ? resolveStoreImageUrl(rawImageUrl, '')
        : null;
      const name = lang === 'ar' ? store.name_ar || store.name : store.name || store.name_ar;
      const categoryLabel = (store.cuisine_tags || []).filter(Boolean).slice(0, 3).join(' . ');
      const hasDeliveryFee = store.delivery_fee !== undefined && store.delivery_fee !== null;
      const deliveryFee = hasDeliveryFee ? Number(store.delivery_fee) : null;
      const etaMin = store.delivery_time_min !== undefined && store.delivery_time_min !== null
        ? Number(store.delivery_time_min)
        : null;
      const etaMax = store.delivery_time_max !== undefined && store.delivery_time_max !== null
        ? Number(store.delivery_time_max)
        : null;
      return {
        id: String(store.id),
        name: name || '',
        categoryLabel,
        deliveryFee,
        feeLabel: deliveryFee === null
          ? null
          : deliveryFee <= 0
          ? (lang === 'ar' ? '\u062a\u0648\u0635\u064a\u0644 \u0645\u062c\u0627\u0646\u064a' : 'Livraison gratuite')
          : moneyDh(deliveryFee),
        etaMin,
        etaMax,
        imageUrl: imageUrl || null,
        isFeatured: Boolean(store.is_featured),
        isPlus: Boolean(store.is_jaheez_plus),
        raw: store,
      };
    });
  }, [lang, rawStores]);

  const visibleStores = useMemo(() => {
    return stores.filter(store => {
      const hasCategoryFilter = deferredSelectedCategoryTags.length > 0;
      if (hasCategoryFilter) {
        const storeTags = [
          ...(store.raw.cuisine_tags || []),
          store.raw.category,
          store.raw.category_name,
          store.raw.sub_category,
          store.raw.service_category,
        ]
          .map(tag => String(tag || '').trim().toLowerCase())
          .filter(Boolean);
        if (storeTags.length > 0) {
        const matchesSelectedTag = deferredSelectedCategoryTags.some(tag => {
          const selectedTag = tag.toLowerCase();
          return storeTags.some(storeTag => storeTag.includes(selectedTag) || selectedTag.includes(storeTag));
        });
        if (!matchesSelectedTag) return false;
        }
      }
      const status = isStoreCurrentlyOpen(store.raw);
      if (filterOpenNow && !status.isOpen) return false;
      if (filterPromotions && (!store.raw.promo_type || store.raw.promo_type === 'none')) return false;
      const etaMax = store.etaMax;
      if (filterUnder30 && (!etaMax || etaMax > 30)) return false;
      return true;
    });
  }, [deferredSelectedCategoryTags, filterOpenNow, filterPromotions, filterUnder30, stores]);

  const filterTags = useMemo(() => {
    return backendTags
      .filter(tag => tag.value !== allLabel)
      .map(tag => ({
        name: tag.label,
      }));
  }, [allLabel, backendTags]);

  const toggleCategoryTag = useCallback((tagName: string) => {
    setActiveTags((prev) => {
      if (tagName === allLabel) return [allLabel];
      const withoutAll = prev.filter(tag => tag !== allLabel);
      const exists = withoutAll.includes(tagName);
      const next = exists ? withoutAll.filter(tag => tag !== tagName) : [...withoutAll, tagName];
      return next.length > 0 ? next : [allLabel];
    });
  }, [allLabel]);

  const isTopFilterActive = useCallback((key: SortOption) => {
    if (key === 'rating') return sort === 'rating';
    if (key === 'fee') return sort === 'fee';
    if (key === 'promotions') return filterPromotions;
    return false;
  }, [filterPromotions, sort]);

  const toggleTopFilter = useCallback((key: SortOption) => {
    if (key === 'rating') {
      setSort(prev => prev === 'rating' ? 'recommended' : 'rating');
      return;
    }
    if (key === 'fee') {
      setSort(prev => prev === 'fee' ? 'recommended' : 'fee');
      return;
    }
    if (key === 'promotions') {
      setFilterPromotions(prev => !prev);
    }
  }, []);

  const clearTopFilter = useCallback((key: SortOption) => {
    if (key === 'rating') setSort('recommended');
    if (key === 'fee') setSort('recommended');
    if (key === 'promotions') setFilterPromotions(false);
  }, []);

  const resetFilters = useCallback(() => {
    setActiveTags([allLabel]);
    setSort('recommended');
    setFilterPromotions(false);
    setFilterOpenNow(false);
    setFilterFreeDelivery(false);
    setFilterUnder30(false);
    setSearch('');
  }, [allLabel]);

  const featuredStores = useMemo(() => visibleStores.filter(store => store.isFeatured), [visibleStores]);
  const fastStores = useMemo(
    () => visibleStores.filter(store => {
      return Boolean(store.etaMax && store.etaMax <= 30 && !store.isFeatured);
    }),
    [visibleStores]
  );
  const remainingStores = useMemo(() => {
    if (selectedCategoryTags.length > 0 || searchQuery) return visibleStores;
    return visibleStores.filter(store => {
      return !store.isFeatured && !(store.etaMax && store.etaMax <= 30);
    });
  }, [searchQuery, selectedCategoryTags.length, visibleStores]);

  const scrollRef = useRef<ScrollView>(null);
  const categoryScrollRef = useRef<ScrollView>(null);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const accentColor = serviceConfig?.color_hex || serviceConfig?.tint_color || BRAND.RED;
  const label = pageTitle;

  const HEADER_ROW_TOP = insets.top + 10;
  const HEADER_ROW_HEIGHT = 52;
  const SEARCH_HEIGHT = 56;
  const SEARCH_EXPANDED_TOP = HEADER_ROW_TOP + HEADER_ROW_HEIGHT + 14;
  const HEADER_EXPANDED_HEIGHT = SEARCH_EXPANDED_TOP + SEARCH_HEIGHT + 12;
  const HEADER_COLLAPSED_HEIGHT = insets.top + 72;

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 118],
      [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
      Extrapolation.CLAMP
    );
    return {
      height,
    };
  });

  const backButtonStyle = useAnimatedStyle(() => ({}));

  const topRowOpacityStyle = useAnimatedStyle(() => {
    const progress = interpolate(scrollY.value, [0, 72], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: interpolate(progress, [0, 1], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(progress, [0, 1], [0, -8], Extrapolation.CLAMP) },
      ],
    };
  });

  const heroTitleAnimatedStyle = useAnimatedStyle(() => ({}));

  const searchBarAnimatedStyle = useAnimatedStyle(() => {
    const expandedWidth = width - SIDE * 2;
    const progress = interpolate(scrollY.value, [0, 118], [0, 1], Extrapolation.CLAMP);
    const collapsedLeft = SIDE + 54;
    const collapsedTop = HEADER_ROW_TOP - 3;
    const collapsedWidth = width - collapsedLeft - SIDE;

    return {
      position: 'absolute',
      top: interpolate(progress, [0, 1], [SEARCH_EXPANDED_TOP, collapsedTop], Extrapolation.CLAMP),
      left: interpolate(progress, [0, 1], [SIDE, collapsedLeft], Extrapolation.CLAMP),
      width: interpolate(progress, [0, 1], [expandedWidth, collapsedWidth], Extrapolation.CLAMP),
      height: interpolate(progress, [0, 1], [SEARCH_HEIGHT, 48], Extrapolation.CLAMP),
    };
  });

  const categoryBarStyle = useAnimatedStyle(() => {
    const top = interpolate(
      scrollY.value,
      [0, 118],
      [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
      Extrapolation.CLAMP
    );
    return {
      top,
    };
  });

  const subtitle = lang === 'ar'
    ? `${visibleStores.length} \u0645\u062a\u062c\u0631 \u0645\u062a\u0627\u062d`
    : lang === 'en'
      ? `${visibleStores.length} stores available`
      : `${visibleStores.length} commerce${visibleStores.length === 1 ? '' : 's'} disponible${visibleStores.length === 1 ? '' : 's'}`;

  const searchPlaceholder = useMemo(() => {
    if (catKey === 'pharmacy') return lang === 'fr' ? 'Rechercher des produits sante...' : 'Search health items...';
    if (catKey === 'grocery') return lang === 'fr' ? 'Rechercher lait, pain, eau...' : 'Search milk, bread, water...';
    return lang === 'fr' ? 'Rechercher des restaurants...' : 'Search restaurants...';
  }, [catKey, lang]);

  const resultCountLabel = useMemo(() => {
    if (lang === 'ar') return `${visibleStores.length} \u0646\u062a\u064a\u062c\u0629`;
    if (lang === 'en') return `${visibleStores.length} result${visibleStores.length === 1 ? '' : 's'}`;
    return `${visibleStores.length} resultat${visibleStores.length === 1 ? '' : 's'}`;
  }, [lang, visibleStores.length]);

  const renderSection = useCallback(
    (sectionTitle: string, sectionStores: StoreCardModel[]) => {
      if (sectionStores.length === 0) return null;
      return (
        <View style={styles.section}>
          <View style={[styles.sectionHeaderRow, { flexDirection: dirRow(isRTL) }]}>
            <Text style={[styles.sectionTitle, { textAlign: dirText(isRTL) }]}>{sectionTitle}</Text>
          </View>
          <View style={styles.cardList}>
            {sectionStores.map((store, index) => {
              const schedule = isStoreCurrentlyOpen(store.raw);
              return (
                <StoreListCard
                  key={store.id}
                  id={store.id}
                  name={store.name}
                  imageUrl={store.imageUrl}
                  deliveryFee={store.deliveryFee}
                  feeLabel={store.feeLabel}
                  etaMin={store.etaMin}
                  etaMax={store.etaMax}
                  isOpen={schedule.isOpen}
                  isNew={Boolean(store.raw.is_new || store.raw.isNew)}
                  isFavorite={favoriteIds.includes(store.id)}
                  lang={lang}
                  isRTL={isRTL}
                  index={index}
                  placeholder={serviceIcon}
                  promoType={store.raw.promo_type ?? undefined}
                  reductionPercentage={store.raw.reduction_percentage ?? undefined}
                  onPress={() => router.push({ pathname: '/(flows)/store/[id]', params: { id: store.id } })}
                  onToggleFavorite={() => handleToggleFavorite(store.id)}
                />
              );
            })}
          </View>
        </View>
      );
    },
    [isRTL, lang, router, serviceIcon, favoriteIds, handleToggleFavorite]
  );

  const SORT_OPTIONS = useMemo(
    () => [
      { key: 'rating' as SortOption, label: lang === 'ar' ? '\u0627\u0644\u0623\u0639\u0644\u0649 \u062a\u0642\u064a\u064a\u0645\u0627' : 'Mieux notes', icon: 'star-outline' },
      { key: 'fee' as SortOption, label: lang === 'ar' ? '\u0631\u0633\u0648\u0645 \u0623\u0642\u0644' : 'Frais bas', icon: 'bicycle-outline' },
      { key: 'promotions' as SortOption, label: lang === 'ar' ? '\u0639\u0631\u0648\u0636' : 'Promos', icon: 'pricetag-outline' },
    ],
    [lang]
  );
  const selectedCategoryFilter = useMemo(() => {
    if (selectedCategoryTags.length === 0) return null;
    if (selectedCategoryTags.length === 1) {
      return selectedCategoryTags[0];
    }
    return lang === 'ar' ? '\u0646\u0648\u0639 \u0627\u0644\u0637\u0628\u0642' : 'Type de plat';
  }, [lang, selectedCategoryTags]);

  return (
    <View style={styles.root}>
      {/* Collapsing Header */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.animatedHeader,
          headerStyle,
        ]}
      >
        {/* Header Layout Content */}
        <View style={[styles.headerTopContent, { top: HEADER_ROW_TOP, flexDirection: dirRow(isRTL) }]}>
          <Animated.View style={backButtonStyle}>
            <Pressable
              style={styles.backBtn}
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
              accessibilityRole="button"
              accessibilityLabel={lang === 'ar' ? '\u0631\u062c\u0648\u0639' : 'Retour'}
            >
              <AppIcon name="arrow-back" size={22} color={BRAND.TEXT} style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
            </Pressable>
          </Animated.View>
          
          <Animated.View style={[styles.heroTextCol, topRowOpacityStyle, { alignItems: dirItems(isRTL) }]}>
            <Animated.Text style={[styles.heroTitle, heroTitleAnimatedStyle]} numberOfLines={1}>
              {label}
            </Animated.Text>
            <Animated.Text style={styles.heroSubtitle}>
              {subtitle}
            </Animated.Text>
          </Animated.View>
        </View>

        {/* Search Bar Container */}
        <Animated.View
          style={[
            styles.searchBarContainer,
            searchBarAnimatedStyle,
          ]}
        >
          <AppSearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={searchPlaceholder}
            accessibilityLabel={lang === 'ar' ? `\u0627\u0644\u0628\u062d\u062b \u0641\u064a ${label}` : `Rechercher dans ${label}`}
            isRTL={isRTL}
            showClear
            onClear={() => setSearch('')}
            showSubmit={false}
            style={styles.categorySearchBar}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.filterStickyBar, { top: HEADER_EXPANDED_HEIGHT }, categoryBarStyle]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.sortRow, { flexDirection: dirRow(isRTL) }]}
        >
          {selectedCategoryFilter ? (
            <SortFilterChip
              active
              label={selectedCategoryFilter}
              icon="restaurant-outline"
              count={selectedCategoryTags.length}
              isRTL={isRTL}
              lang={lang}
              onPress={() => setFilterSheetVisible(true)}
              onClear={() => setActiveTags([allLabel])}
            />
          ) : null}
          {SORT_OPTIONS.map((opt) => {
            const active = isTopFilterActive(opt.key);
            return (
              <SortFilterChip
                key={opt.key}
                active={active}
                label={opt.label}
                icon={opt.icon}
                isRTL={isRTL}
                lang={lang}
                onPress={() => toggleTopFilter(opt.key)}
                onClear={() => clearTopFilter(opt.key)}
              />
            );
          })}
        </ScrollView>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingTop: HEADER_EXPANDED_HEIGHT + 60, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
      >
        <ScrollView
          ref={categoryScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsScroll}
        >
          {filterTags.map((tag) => {
            const active = activeTags.includes(tag.name);
            return (
              <CategoryChip
                key={tag.name}
                tag={tag}
                active={active}
                onPress={() => toggleCategoryTag(tag.name)}
              />
            );
          })}
        </ScrollView>

        <View style={[styles.resultsToolbar, { flexDirection: dirRow(isRTL) }]}>
          <Text style={[styles.resultsToolbarTitle, { textAlign: dirText(isRTL) }]}>
            {resultCountLabel}
          </Text>
          <Pressable
            style={[styles.resetInlineBtn, { flexDirection: dirRow(isRTL) }]}
            onPress={resetFilters}
            accessibilityRole="button"
            accessibilityLabel={lang === 'ar' ? '\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0627\u0644\u0641\u0644\u0627\u062a\u0631' : 'Reinitialiser les filtres'}
          >
            <AppIcon name="refresh" size={14} color={BRAND.TEXT3} />
            <Text style={styles.resetInlineText}>
              {lang === 'ar' ? '\u0625\u0639\u0627\u062f\u0629' : 'Reinitialiser'}
            </Text>
          </Pressable>
        </View>

        {/* Store sections */}
        {isLoading ? (
          <View style={{ marginTop: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        ) : visibleStores.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>
              {lang === 'ar' ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c' : 'Aucun resultat'}
            </Text>
            <Text style={styles.stateText}>
              {lang === 'ar' ? '\u0644\u0645 \u0646\u062c\u062f \u0623\u064a \u0645\u062a\u062c\u0631 \u064a\u0637\u0627\u0628\u0642 \u062e\u064a\u0627\u0631\u0627\u062a\u0643 \u062d\u0627\u0644\u064a\u0627.' : "Nous n'avons trouve aucun commerce correspondant."}
            </Text>
          </View>
        ) : (
          <>
            {activeTags.includes(allLabel) && !searchQuery ? (
              <>
                {renderSection(lang === 'ar' ? '\u0645\u0645\u064a\u0632' : lang === 'en' ? 'Featured' : 'Mis en avant', featuredStores)}
                {renderSection(lang === 'ar' ? '\u062a\u0648\u0635\u064a\u0644 \u0633\u0631\u064a\u0639 (\u0623\u0642\u0644 \u0645\u0646 30 \u062f\u0642\u064a\u0642\u0629)' : 'Livraison rapide (< 30 min)', fastStores)}
                {renderSection(lang === 'ar' ? '\u0643\u0644 \u0627\u0644\u0645\u062a\u0627\u062c\u0631' : 'Tous les commerces', remainingStores)}
              </>
            ) : (
              renderSection(lang === 'ar' ? '\u0646\u062a\u0627\u0626\u062c \u0627\u0644\u0628\u062d\u062b' : 'Resultats', visibleStores)
            )}
          </>
        )}
      </Animated.ScrollView>

      {/* Floating Filter Button removed */}

      {/* Filter sheet modal */}
      <Modal
        visible={filterSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterSheetVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterSheetVisible(false)}>
          <Pressable style={styles.filterSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { textAlign: dirText(isRTL) }]}>
              {lang === 'ar' ? '\u0627\u0644\u0641\u0644\u0627\u062a\u0631' : 'Filtres'}
            </Text>

            <View style={[styles.sheetChipRow, { flexDirection: dirRow(isRTL) }]}>
              <Pressable
                style={[styles.sheetChip, filterOpenNow && styles.sheetChipActive]}
                onPress={() => setFilterOpenNow(!filterOpenNow)}
              >
                <Text style={[styles.sheetChipText, filterOpenNow && styles.sheetChipTextActive]}>
                  {lang === 'ar' ? '\u0645\u0641\u062a\u0648\u062d \u0627\u0644\u0622\u0646' : 'Ouvert maintenant'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.sheetChip, filterFreeDelivery && styles.sheetChipActive]}
                onPress={() => setFilterFreeDelivery(!filterFreeDelivery)}
              >
                <Text style={[styles.sheetChipText, filterFreeDelivery && styles.sheetChipTextActive]}>
                  {lang === 'ar' ? '\u062a\u0648\u0635\u064a\u0644 \u0645\u062c\u0627\u0646\u064a' : 'Livraison gratuite'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.sheetChip, filterUnder30 && styles.sheetChipActive]}
                onPress={() => setFilterUnder30(!filterUnder30)}
              >
                <Text style={[styles.sheetChipText, filterUnder30 && styles.sheetChipTextActive]}>
                  {lang === 'ar' ? '\u0623\u0642\u0644 \u0645\u0646 30 \u062f\u0642\u064a\u0642\u0629' : 'Moins de 30 min'}
                </Text>
              </Pressable>
            </View>

            <View style={[styles.sheetActions, { flexDirection: dirRow(isRTL) }]}>
              <Pressable
                style={styles.clearButton}
                onPress={() => {
                  setFilterOpenNow(false);
                  setFilterFreeDelivery(false);
                  setFilterPromotions(false);
                  setFilterUnder30(false);
                  setFilterSheetVisible(false);
                }}
              >
                <Text style={styles.clearText}>
                  {lang === 'ar' ? '\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646' : 'Reinitialiser'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.applyButton}
                onPress={() => setFilterSheetVisible(false)}
              >
                <Text style={styles.applyText}>
                  {lang === 'ar' ? '\u062a\u0637\u0628\u064a\u0642' : 'Appliquer'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.WARM_WHITE,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: BRAND.SURFACE,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.BORDER,
    overflow: 'hidden',
  },
  headerTopContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 52,
    paddingHorizontal: SIDE,
    gap: 12,
    alignItems: 'center',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BRAND.SURFACE,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextCol: {
    flex: 1,
    gap: 1,
  },
  heroTitle: {
    color: BRAND.TEXT,
    fontSize: 23,
    fontFamily: FONTS.DISPLAY,
    fontWeight: '800',
    letterSpacing: 0,
  },
  heroSubtitle: {
    color: BRAND.TEXT2,
    fontSize: 13,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
  },
  searchBarContainer: {
    height: 56,
    justifyContent: 'center',
    zIndex: 2,
  },
  categorySearchBar: {
    height: '100%',
    minHeight: 0,
  },
  filterStickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    minHeight: 58,
    backgroundColor: BRAND.SURFACE,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.BORDER,
    zIndex: 99,
    justifyContent: 'center',
  },
  categoryTabsScroll: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 2,
    alignItems: 'center',
    gap: 14,
  },
  categoryCard: {
    width: 82,
    height: 80,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    gap: 8,
    backgroundColor: 'transparent',
  },
  categoryCardActive: {
    transform: [{ translateY: -1 }],
  },
  categoryIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySvgIcon: {
    width: 47,
    height: 47,
  },
  categoryLabel: {
    fontSize: 11.5,
    fontFamily: FONTS.MEDIUM,
    color: BRAND.TEXT2,
    textAlign: 'center',
    maxWidth: 82,
  },
  categoryLabelActive: {
    fontFamily: FONTS.SEMIBOLD,
    fontWeight: '600',
    color: BRAND.TEXT,
  },
  storeCard: {
    backgroundColor: BRAND.SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    overflow: 'hidden',
    marginBottom: 16,
  },
  storeImageWrap: {
    width: '100%',
    height: 156,
    position: 'relative',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND.GLASS,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND.HOME_DIM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedText: {
    color: BRAND.SURFACE,
    fontFamily: FONTS.DISPLAY,
    fontWeight: '800',
    fontSize: 16,
  },
  imageTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BRAND.RED,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featureBadgeText: {
    color: BRAND.SURFACE,
    fontSize: 11,
    fontFamily: FONTS.SEMIBOLD,
  },
  plusBadge: {
    backgroundColor: BRAND.YELLOW,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  plusBadgeText: {
    color: BRAND.TEXT,
    fontSize: 11,
    fontFamily: FONTS.DISPLAY,
    fontWeight: '800',
  },
  timeBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BRAND.SURFACE,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: BRAND.LIGHT,
  },
  timeBadgeText: {
    color: BRAND.TEXT,
    fontSize: 11,
    fontFamily: FONTS.SEMIBOLD,
  },
  storeInfo: {
    padding: 14,
  },
  storeTitleRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    flex: 1,
    fontFamily: FONTS.DISPLAY,
    fontSize: 16,
    fontWeight: '800',
    color: BRAND.TEXT2,
  },
  ratingPill: {
    gap: 4,
    backgroundColor: BRAND.YELLOW_LIGHT,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    color: BRAND.TEXT,
  },
  storeCategory: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT3,
    marginTop: 4,
  },
  metaRow: {
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  metaItem: {
    gap: 5,
    alignItems: 'center',
  },
  metaText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    color: BRAND.TEXT2,
  },
  metaDot: {
    color: BRAND.INPUT_BORDER,
    fontSize: 14,
  },
  section: {
    paddingHorizontal: SIDE,
    marginTop: 28,
  },
  resultsToolbar: {
    paddingHorizontal: SIDE,
    marginTop: 22,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  resultsToolbarTitle: {
    flex: 1,
    fontFamily: FONTS.DISPLAY,
    fontSize: 16,
    fontWeight: '800',
    color: BRAND.TEXT,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: FONTS.DISPLAY,
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.TEXT,
  },
  resetInlineBtn: {
    minHeight: 32,
    paddingHorizontal: 11,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: BRAND.LIGHT,
  },
  resetInlineText: {
    color: BRAND.TEXT2,
    fontSize: 12,
    fontFamily: FONTS.SEMIBOLD,
  },
  cardList: {
    gap: 12,
  },
  stateBox: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 12,
  },
  stateImage: {
    width: 116,
    height: 116,
  },
  stateTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.TEXT,
    textAlign: 'center',
  },
  stateText: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT3,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    backgroundColor: BRAND.RED,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.SURFACE,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: BRAND.HOME_DIM,
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: BRAND.SURFACE,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: BRAND.LIGHT,
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 21,
    fontWeight: '800',
    color: BRAND.TEXT,
    marginBottom: 16,
  },
  sheetChipRow: {
    flexWrap: 'wrap',
    gap: 10,
  },
  sheetChip: {
    borderRadius: 999,
    backgroundColor: BRAND.LIGHT,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sheetChipActive: {
    backgroundColor: BRAND.TEXT,
  },
  sheetChipText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12.5,
    color: BRAND.TEXT2,
  },
  sheetChipTextActive: {
    color: BRAND.SURFACE,
  },
  sheetActions: {
    marginTop: 24,
    gap: 12,
    paddingBottom: 30,
  },
  clearButton: {
    flex: 1,
    height: 50,
    borderRadius: 18,
    backgroundColor: BRAND.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: {
    flex: 1.5,
    height: 50,
    borderRadius: 18,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontFamily: FONTS.SEMIBOLD,
    color: BRAND.TEXT2,
  },
  applyText: {
    fontFamily: FONTS.SEMIBOLD,
    color: BRAND.SURFACE,
  },
  sortRow: {
    paddingHorizontal: SIDE,
    marginTop: 0,
    gap: 8,
    alignItems: 'center',
  },
  sortBtn: {
    alignItems: 'center',
    minHeight: 38,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BRAND.LIGHT,
    gap: 6,
  },
  sortBtnActive: {
    backgroundColor: BRAND.RED,
  },
  sortClearBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortCountBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: BRAND.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortCountText: {
    color: BRAND.RED,
    fontSize: 11,
    fontFamily: FONTS.DISPLAY,
    fontWeight: '800',
  },
  sortBtnTxt: {
    fontSize: 12.5,
    fontFamily: FONTS.SEMIBOLD,
    color: BRAND.TEXT2,
  },
  sortBtnTxtActive: {
    color: BRAND.SURFACE,
  },
});

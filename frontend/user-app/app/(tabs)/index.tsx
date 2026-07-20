import React from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { BRAND, FONTS, LAYOUT } from '../../constants/brand';
import { ASSETS } from '../../constants/assets';
import { formatDh } from '../../lib/money';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useLangStore } from '../../store/languageStore';
import { useFeaturedStores, usePublicServiceCategories, usePromoStores } from '../../hooks/queries/useStores';
import { useCustomerHomeFeed } from '../../hooks/queries/useCustomerExperience';
import { useNotifications } from '../../hooks/queries/useNotifications';
import { isStoreCurrentlyOpen } from '../../lib/storeStatus';
import { dirItems, dirRow, dirText } from '../../lib/direction';
import { useTheme } from '../../lib/ThemeProvider';
import { resolveStoreImageUrl } from '../../lib/adminApi';
import { backendJson } from '../../lib/backendApi';
import { useJaheezTransition } from '../../hooks/useJaheezTransition';
import { trackCustomerEvent } from '../../lib/customerExperienceApi';
import { toggleFavorite } from '../../features/stores/services/storeApi';
import { HomeScreenSkeleton, StoreCardShimmer } from '../../components/ui/Shimmer';
import { HapticTab } from '../../components/ui/HapticTab';
import { AppSearchBar } from '../../components/ui/AppSearchBar';
import type { CustomerHomeBanner, CustomerHomeStoreCard } from '@shared/types';

const { width } = Dimensions.get('window');

const L = {
  ar: {
    continueOrder: '\u0645\u062a\u0627\u0628\u0639\u0629 \u0637\u0644\u0628\u0643',
    continueBtn: '\u0645\u062a\u0627\u0628\u0639\u0629',
    orderAgain: '\u0627\u0637\u0644\u0628 \u0645\u062c\u062f\u062f\u0627',
    storesNearYou: '\u0645\u0648\u0635\u0649 \u0628\u0647 \u0644\u0643',
    viewAll: '\u0639\u0631\u0636 \u0627\u0644\u0643\u0644',
    orderNow: '\u0627\u0637\u0644\u0628 \u0627\u0644\u0622\u0646',
    articles: '\u0645\u0646\u062a\u062c\u0627\u062a',
    offers: '\u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062d\u0627\u0644\u064a\u0629',
  },
  fr: {
    continueOrder: 'Continuer votre commande',
    continueBtn: 'Continuer',
    orderAgain: 'Recommandez encore ?',
    storesNearYou: 'Recommande pour vous',
    viewAll: 'Voir tout',
    orderNow: 'Commander',
    articles: 'articles',
    offers: 'Offres du moment',
  },
  en: {
    continueOrder: 'Continue your order',
    continueBtn: 'Continue',
    orderAgain: 'Order again?',
    storesNearYou: 'Recommended for you',
    viewAll: 'See all',
    orderNow: 'Order',
    articles: 'items',
    offers: 'Current offers',
  }
};

const PROMO_SLIDES = [
  {
    id: 'fast',
    eyebrow: 'Livraison',
    pill: 'rapide',
    title: 'Plus d\'avantages !',
    subtitle: 'Commandez maintenant\net profitez d\'offres\nexclusives chaque jour',
    button: 'Decouvrir',
    image: ASSETS.illustrations.jaheez_food_bag_large,
    route: '/(tabs)/search',
  },
  {
    id: 'nearby',
    eyebrow: 'Restaurants',
    pill: 'proches',
    title: 'Vos favoris arrivent vite',
    subtitle: 'Decouvrez les restaurants\net les magasins proches\nde chez vous',
    button: 'Explorer',
    image: ASSETS.illustrations.jaheez_food,
    route: '/(tabs)/search?q=restaurant',
  }
];

function resolveOptionalStoreImage(url?: string | null): string | null {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (!trimmed) return null;
  const resolved = resolveStoreImageUrl(trimmed, '');
  return resolved || null;
}

function homeFeedStoreToViewStore(store: CustomerHomeStoreCard) {
  return {
    ...store,
    delivery_fee: store.delivery_fee_dh,
    min_order_amount: store.min_order_amount_dh,
    distance: store.distance_km,
  };
}

type FavoriteStoreRef = {
  id?: string | number | null;
  store_id?: string | number | null;
};

type CustomerAddressRef = {
  id?: string | number | null;
  label?: string | null;
  address?: string | null;
  is_default?: boolean | null;
};

function getHomeStoreOpenState(store: any) {
  const closedValues = new Set<unknown>([false, 'false', 'closed', 'inactive', 'paused', 'offline', 'temporarily_closed', 'temporarily closed', '0', 0]);
  const explicitClosed = [
    store?.is_open,
    store?.isOpen,
    store?.open,
    store?.is_available,
    store?.isAvailable,
    store?.accepting_orders,
    store?.acceptingOrders,
  ].some(value => closedValues.has(typeof value === 'string' ? value.toLowerCase().trim() : value));

  const status = String(store?.status || store?.store_status || store?.availability || '').toLowerCase();
  const statusClosed = ['closed', 'inactive', 'paused', 'offline', 'temporarily_closed'].some(value => status.includes(value));

  if (explicitClosed || statusClosed) {
    return { isOpen: false };
  }

  return isStoreCurrentlyOpen(store);
}

function getPromoDisplay(store: any, lang: string) {
  const amount = Number(store?.reduction_percentage || 0);
  const amountLabel = store?.promo_type === 'store_fixed'
    ? `${amount} DH`
    : amount > 0
    ? `${amount}%`
    : (lang === 'en' ? 'Offer' : 'Promo');

  if (store?.promo_type === 'store_percentage' || store?.promo_type === 'store_fixed') {
    return {
      amountLabel,
      scopeLabel: lang === 'en' ? 'on the whole store' : 'sur toute la boutique',
    };
  }

  return {
    amountLabel,
    scopeLabel: lang === 'en' ? 'on selected products' : 'sur certains produits',
  };
}

function useAutoRotate(count: number, interval = 5000) {
  const [active, setActive] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (count <= 1) return;
    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % count);
    }, interval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [count, interval]);

  const reset = React.useCallback((index: number) => {
    setActive(index);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % count);
    }, interval);
  }, [count, interval]);

  return { active, reset };
}


export default function HomeScreen() {
  const router = useRouter();
  const { startTransition, isTransitioning } = useJaheezTransition();
  const insets = useSafeAreaInsets();
  const { COLORS } = useTheme();
  const { t, lang, isRTL } = useLangStore();
  const user = useAuthStore(s => s.user);
  const cartCount = useCartStore(s => s.getItemCount());

  // Real active carts
  const activeCarts = useCartStore(s => s.getActiveCarts());
  const realCart = activeCarts[0];

  const { data: notifs = [] } = useNotifications();
  const unreadNotifCount = notifs.filter(n => !n.read).length;

  const { data: stores = [], isLoading, isFetching, refetch } = useFeaturedStores();
  const { data: promoStores = [] } = usePromoStores();
  const { data: dynamicCategories = [] } = usePublicServiceCategories();
  const {
    data: homeFeed,
    isLoading: isHomeFeedLoading,
    isFetching: isHomeFeedFetching,
    refetch: refetchHomeFeed,
  } = useCustomerHomeFeed();

  const [homeQuery, setHomeQuery] = React.useState('');
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);
  const [selectedAddressLabel, setSelectedAddressLabel] = React.useState<string | null>(null);

  const feedStores = React.useMemo(
    () => homeFeed?.stores.featured?.length
      ? homeFeed.stores.featured.map(homeFeedStoreToViewStore)
      : stores,
    [homeFeed?.stores.featured, stores]
  );

  const feedPromoStores = React.useMemo(
    () => homeFeed?.stores.promos?.length
      ? homeFeed.stores.promos.map(homeFeedStoreToViewStore)
      : promoStores,
    [homeFeed?.stores.promos, promoStores]
  );

  const feedCategories = homeFeed?.service_categories?.length
    ? homeFeed.service_categories
    : dynamicCategories;
  const homeBanners = React.useMemo(
    () => (homeFeed?.banners || [])
      .map((banner) => ({
        ...banner,
        image_url: resolveOptionalStoreImage(banner.image_url),
      }))
      .filter((banner): banner is CustomerHomeBanner & { image_url: string } => Boolean(banner.image_url)),
    [homeFeed?.banners]
  );

  const maintenanceMessage = homeFeed?.app_config.maintenance.enabled
    ? (lang === 'ar'
        ? homeFeed.app_config.maintenance.message_ar
        : homeFeed.app_config.maintenance.message_fr)
    : null;
  const chooseAddressLabel = lang === 'ar' ? '\u0627\u062e\u062a\u0631 \u0639\u0646\u0648\u0627\u0646\u0627' : lang === 'en' ? 'Choose address' : 'Choisir une adresse';
  const headerAddressLabel = selectedAddressLabel ?? chooseAddressLabel;

  const refreshHome = React.useCallback(() => {
    void refetchHomeFeed();
    void refetch();
  }, [refetch, refetchHomeFeed]);

  React.useEffect(() => {
    void trackCustomerEvent({ event_name: 'home_view', screen: 'home' });
  }, []);

  React.useEffect(() => {
    if (!user?.id) {
      setFavoriteIds([]);
      return;
    }

    backendJson<FavoriteStoreRef[]>('/admin-api/v1/customer/favorites/stores')
      .then(res => {
        if (Array.isArray(res)) {
          setFavoriteIds(res.map(item => String(item.store_id || item.id)).filter(Boolean));
        }
      })
      .catch(() => {});
  }, [user?.id]);

  React.useEffect(() => {
    if (!user?.id) {
      setSelectedAddressLabel(null);
      return;
    }

    backendJson<CustomerAddressRef[]>('/admin-api/v1/customer/addresses')
      .then(addresses => {
        if (!Array.isArray(addresses)) {
          setSelectedAddressLabel(null);
          return;
        }

        const selectedAddress = addresses.find(item => item.is_default) ?? addresses[0];
        const label = selectedAddress?.label?.trim() || selectedAddress?.address?.trim() || null;
        setSelectedAddressLabel(label);
      })
      .catch(() => {
        setSelectedAddressLabel(null);
      });
  }, [user?.id]);

  const handleToggleFavorite = React.useCallback(async (storeId: string) => {
    if (!user?.id) {
      alert(lang === 'ar' ? 'Veuillez vous connecter' : 'Veuillez vous connecter');
      return;
    }

    const isFav = favoriteIds.includes(storeId);
    setFavoriteIds(prev => (isFav ? prev.filter(id => id !== storeId) : [...prev, storeId]));

    try {
      await toggleFavorite(user.id, storeId);
    } catch {
      setFavoriteIds(prev => (isFav ? [...prev, storeId] : prev.filter(id => id !== storeId)));
    }
  }, [favoriteIds, lang, user?.id]);
  const scrollY = useSharedValue(0);
  const homeScrollRef = React.useRef<Reanimated.ScrollView>(null);
  
  // Snap to continue order section when scrolling near it
  const handleMomentumScrollEnd = React.useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const continueOrderY = 540; // Position of continue order section
    const snapRange = 120; // Snap if within this range

    if (offsetY > continueOrderY - snapRange && offsetY < continueOrderY + snapRange) {
      homeScrollRef.current?.scrollTo({ y: continueOrderY, animated: true });
    }
  }, []);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 1], Extrapolate.CLAMP),
    height: interpolate(
      scrollY.value,
      [0, 80],
      [LAYOUT.HEADER_EXPANDED + insets.top, LAYOUT.HEADER_COLLAPSED + insets.top],
      Extrapolate.CLAMP
    ),
  }));

  const locationStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 50], [1, 0], Extrapolate.CLAMP);
    const translateY = interpolate(scrollY.value, [0, 50], [0, -8], Extrapolate.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  const searchBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.7], Extrapolate.CLAMP);
    const scale = interpolate(scrollY.value, [0, 100], [1, 0.95], Extrapolate.CLAMP);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const categoriesStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [40, 140], [1, 0], Extrapolate.CLAMP);
    const translateY = interpolate(scrollY.value, [40, 140], [0, -30], Extrapolate.CLAMP);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });
  const submitHomeSearch = React.useCallback(() => {
    const q = homeQuery.trim();
    void trackCustomerEvent({
      event_name: 'search_submitted',
      screen: 'home',
      entity_type: 'search',
      metadata: { has_query: q.length > 0, query_length: q.length },
    });
    if (!q) { router.push('/(tabs)/search'); return; }
    router.push({ pathname: '/(tabs)/search' as any, params: { q } });
  }, [homeQuery, router]);

  const localT = L[lang] || L.fr;
  const categoriesList = React.useMemo(() => {
    const baseCats = feedCategories.length > 0
      ? feedCategories.filter((c: any) => !c.parent_id).slice(0, 5).map((c: any) => {
          const nameFr = (c.name_fr || '').toLowerCase();
          const nameEn = (c.name || '').toLowerCase();
          const nameAr = (c.name_ar || '').toLowerCase();
          const qParams = `id=${c.id}&title=${encodeURIComponent(c.name_ar || '')}&icon=${encodeURIComponent(c.icon_emoji || '')}&color=${encodeURIComponent(c.color_hex || BRAND.RED)}`;
          let route = `/(flows)/category/food?${qParams}`;
          let img = ASSETS.illustrations.jaheez_food;

          if (nameFr.includes('food') || nameFr.includes('rest') || nameEn.includes('food') || nameEn.includes('rest') || nameAr.includes('\u0645\u0637\u0639\u0645')) {
            route = `/(flows)/category/food?${qParams}`;
            img = ASSETS.illustrations.jaheez_food;
          } else if (nameFr.includes('groc') || nameFr.includes('epic') || nameEn.includes('groc') || nameAr.includes('\u0628\u0642\u0627\u0644')) {
            route = `/(flows)/category/grocery?${qParams}`;
            img = ASSETS.illustrations.jaheez_grocery;
          } else if (nameFr.includes('pharm') || nameEn.includes('pharm') || nameAr.includes('\u0635\u064a\u062f\u0644')) {
            route = `/(flows)/category/pharmacy?${qParams}`;
            img = ASSETS.illustrations.jaheez_pharmacy;
          } else if (nameFr.includes('errand') || nameFr.includes('cours') || nameFr.includes('mission') || nameEn.includes('errand') || nameAr.includes('\u0645\u0647\u0645\u0629')) {
            route = '/(flows)/custom-request';
            img = ASSETS.illustrations.jaheez_delivery;
          } else if (nameFr.includes('parcel') || nameFr.includes('colis') || nameEn.includes('parcel') || nameAr.includes('\u0637\u0631\u062f')) {
            route = 'COMING_SOON';
            img = ASSETS.illustrations.jaheez_parcel;
          }
          return {
            id: c.id,
            label: lang === 'ar' ? (c.name_ar || c.name_fr || '') : (c.name_fr || c.name || c.name_ar || ''),
            img,
            route,
          };
        })
      : [];
    return baseCats.slice(0, 5);
  }, [feedCategories, lang]);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const { active: activeSlide, reset: resetSlide } = useAutoRotate(PROMO_SLIDES.length);
  const { active: activeBannerSlide, reset: resetBannerSlide } = useAutoRotate(homeBanners.length, 6500);
  const promoScrollRef = React.useRef<ScrollView>(null);
  const bannerScrollRef = React.useRef<ScrollView>(null);
  const PROMO_WIDTH = width - 40;
  const BANNER_WIDTH = width - 16;

  React.useEffect(() => {
    promoScrollRef.current?.scrollTo({ x: activeSlide * PROMO_WIDTH, animated: true });
  }, [activeSlide, PROMO_WIDTH]);
  React.useEffect(() => {
    if (homeBanners.length <= 1) return;
    bannerScrollRef.current?.scrollTo({ x: activeBannerSlide * BANNER_WIDTH, animated: true });
  }, [activeBannerSlide, BANNER_WIDTH, homeBanners.length]);
  const isInitialLoading = (isHomeFeedLoading && !homeFeed && isLoading);

  const handleBannerPress = React.useCallback((banner: CustomerHomeBanner) => {
    const linkValue = String(banner.link_value || '').trim();
    if (!linkValue || banner.link_type === 'none') return;

    if (banner.link_type === 'store') {
      router.push(`/(flows)/store/${linkValue}` as any);
      return;
    }
    if (banner.link_type === 'category') {
      router.push({ pathname: '/(flows)/category/[id]', params: { id: linkValue } } as any);
      return;
    }
    if (banner.link_type === 'search') {
      router.push({ pathname: '/(tabs)/search', params: { q: linkValue } } as any);
    }
  }, [router]);

  return (
    <View style={styles.root}>
            <Reanimated.View style={[styles.fixedHeaderBg, headerBgStyle]}>
        <LinearGradient
          colors={[BRAND.SURFACE, BRAND.SURFACE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Reanimated.View>

            <View style={[styles.fixedHeaderContent, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={[styles.headerTopRow, { flexDirection: dirRow(isRTL) }]}>
          <View style={styles.logoContainer}>
            <Image
              source={ASSETS.branding.logo_custom}
              style={[styles.logoImage, { tintColor: BRAND.RED }]}
              contentFit="contain"
              accessibilityLabel="Jaheez"
            />
          </View>

          <Reanimated.View style={[styles.locationContainer, locationStyle]}>
            <HapticTab
              scaleDown={0.95}
              style={[styles.locationPill, { flexDirection: dirRow(isRTL) }]}
              onPress={() => router.push('/(flows)/addresses' as any)}
              accessibilityLabel={headerAddressLabel}
            >
              <Ionicons name="location" size={14} color={BRAND.RED} />
              <Text style={styles.locationText} numberOfLines={1}>
                {headerAddressLabel}
              </Text>
              <Ionicons name="chevron-down" size={13} color={BRAND.TEXT2} />
            </HapticTab>
          </Reanimated.View>

          <View style={[styles.headerActions, { flexDirection: dirRow(isRTL) }]}>
            <HapticTab
              scaleDown={0.93}
              style={styles.headerActionBtn}
              onPress={() => router.push('/(flows)/notifications')}
              accessibilityLabel={t.notifications}
            >
              <Ionicons name="notifications-outline" size={22} color={BRAND.RED} />
              {unreadNotifCount > 0 && (
                <View style={styles.headerNotifBadge}>
                  <Text style={styles.headerNotifBadgeTxt}>{unreadNotifCount}</Text>
                </View>
              )}
            </HapticTab>
          </View>
        </View>
      </View>

            <Reanimated.ScrollView
        ref={homeScrollRef}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        contentContainerStyle={{ paddingTop: LAYOUT.HEADER_EXPANDED + insets.top + 2, paddingBottom: 104 }}
        refreshControl={
          <RefreshControl
            refreshing={(!isLoading && isFetching) || (!isHomeFeedLoading && isHomeFeedFetching)}
            onRefresh={refreshHome}
            colors={[BRAND.RED]}
            tintColor={BRAND.RED}
          />
        }
      >
                <Reanimated.View style={searchBarStyle}>
          <AppSearchBar
            value={homeQuery}
            onChangeText={setHomeQuery}
            onSubmit={submitHomeSearch}
            placeholder={lang === 'fr' ? 'Rechercher un plat, produit, magasin...' : t.searchPlaceholder}
            accessibilityLabel={t.search}
            isRTL={isRTL}
            style={styles.homeSearchBar}
          />
        </Reanimated.View>

                {maintenanceMessage ? (
          <View style={[styles.systemBanner, { flexDirection: dirRow(isRTL) }]}>
            <Ionicons name="alert-circle-outline" size={18} color={BRAND.WARN} />
            <Text style={[styles.systemBannerText, { textAlign: dirText(isRTL) }]} numberOfLines={2}>
              {maintenanceMessage}
            </Text>
          </View>
        ) : null}

        {isInitialLoading ? (
          <HomeScreenSkeleton />
        ) : (
          <>
                        <Reanimated.View style={categoriesStyle}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.categoriesScroll, { flexDirection: dirRow(isRTL) }]}
            >
              {categoriesList.map((cat, index) => (
                <HapticTab
                  key={cat.id}
                  scaleDown={0.92}
                  style={styles.categoryBubble}
                  onPress={(e) => {
                    if (isTransitioning) return;
                    void trackCustomerEvent({
                      event_name: 'category_opened',
                      screen: 'home',
                      entity_type: 'category',
                      entity_id: String(cat.id),
                    });
                    if (cat.route === 'COMING_SOON') {
                      alert(lang === 'ar' ? '\u062e\u062f\u0645\u0629 \u0627\u0644\u0637\u0631\u0648\u062f \u0633\u062a\u062a\u0648\u0641\u0631 \u0642\u0631\u064a\u0628\u0627!' : 'La livraison de colis sera bientot disponible !');
                      return;
                    }
                    const originX = e.nativeEvent.pageX;
                    const originY = e.nativeEvent.pageY;
                    startTransition({ route: cat.route, originX, originY, serviceName: cat.label });
                  }}
                  accessibilityLabel={cat.label}
                >
                  <View style={styles.categoryCircle}>
                    <Image source={cat.img} style={styles.categoryImage} contentFit="contain" accessibilityLabel={cat.label} />
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={1}>
                    {cat.label}
                  </Text>
                </HapticTab>
              ))}
            </ScrollView>
            </Reanimated.View>

                        <View style={styles.promoSection}>
              <ScrollView
                ref={promoScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={PROMO_WIDTH + 12}
                snapToAlignment="center"
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / (PROMO_WIDTH + 12));
                  resetSlide(idx);
                }}
                scrollEventThrottle={16}
                contentContainerStyle={styles.promoScrollContent}
              >
                {PROMO_SLIDES.map(slide => (
                  <Pressable
                    key={slide.id}
                    style={[styles.promoCard, { width: PROMO_WIDTH }]}
                    onPress={() => router.push(slide.route as any)}
                    accessibilityLabel={slide.title}
                  >
                    <LinearGradient
                      colors={[BRAND.YELLOW_LIGHT, BRAND.YELLOW]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.promoContent}>
                      <View style={[styles.promoEyebrow, { flexDirection: dirRow(isRTL) }]}>
                        <Text style={styles.promoEyebrowText}>{slide.eyebrow}</Text>
                        <View style={styles.promoPill}>
                          <Text style={styles.promoPillText}>{slide.pill}</Text>
                        </View>
                      </View>
                      <Text style={styles.promoTitle}>{slide.title}</Text>
                      <Text style={styles.promoSubtitle}>{slide.subtitle}</Text>
                      <View style={styles.promoButton}>
                        <Text style={styles.promoButtonText}>{slide.button}</Text>
                      </View>
                    </View>
                    <Image source={slide.image} style={styles.promoImage} contentFit="contain" accessibilityLabel={slide.title} />
                  </Pressable>
                ))}
              </ScrollView>

            </View>

                        {realCart && realCart.items.length > 0 && (() => {
              const itemsCount = realCart.items.reduce((sum, i) => sum + i.quantity, 0);
              return (
                <View style={styles.continueSection}>
                  <Pressable
                    style={({ pressed }) => [styles.continueCard, pressed && { transform: [{ scale: 0.98 }] }]}
                    onPress={() => router.push(`/(flows)/store/${realCart.storeId}` as any)}
                    accessibilityLabel={localT.continueOrder}
                  >
                    <View style={styles.continueHeader}>
                      <Text style={styles.continueTitle}>{localT.continueOrder}</Text>
                    </View>
                    <View style={[styles.continueInner, { flexDirection: dirRow(isRTL) }]}>
                      {resolveOptionalStoreImage(realCart.storeLogo) ? (
                        <Image
                          source={{ uri: resolveOptionalStoreImage(realCart.storeLogo) || '' }}
                          style={styles.continueStoreImg}
                          contentFit="cover"
                          accessibilityLabel={realCart.storeName}
                        />
                      ) : (
                        <View style={[styles.continueStoreImg, styles.imagePlaceholder]}>
                          <Ionicons name="storefront-outline" size={22} color={BRAND.TEXT3} />
                        </View>
                      )}
                      <View style={[styles.continueDetails, { alignItems: dirItems(isRTL) }]}>
                        <Text style={styles.continueStoreName} numberOfLines={1}>{realCart.storeName}</Text>
                        <Text style={styles.continueItemsCount}>{`${itemsCount} ${localT.articles}`}</Text>
                      </View>
                      <View style={styles.continueBtnWrapper}>
                        <Text style={styles.continueBtnTxt}>{localT.continueBtn}</Text>
                      </View>
                    </View>
                  </Pressable>
                </View>
              );
            })()}

                        {homeBanners.length > 0 ? (
              <View style={styles.bannerCarouselSection}>
                <ScrollView
                  ref={bannerScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={BANNER_WIDTH}
                  decelerationRate="fast"
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
                    resetBannerSlide(idx);
                  }}
                  scrollEventThrottle={16}
                >
                  {homeBanners.map((banner) => (
                    <Pressable
                      key={banner.id}
                      style={[styles.bannerSlide, { width: BANNER_WIDTH }]}
                      onPress={() => handleBannerPress(banner)}
                      accessibilityRole="button"
                      accessibilityLabel={banner.title_ar || localT.offers}
                    >
                      <Image
                        source={{ uri: banner.image_url }}
                        style={styles.bannerImage}
                        contentFit="cover"
                        accessibilityLabel={banner.title_ar || localT.offers}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
                {homeBanners.length > 1 ? (
                  <View style={[styles.bannerDots, { flexDirection: dirRow(isRTL) }]}>
                    {homeBanners.map((banner, index) => (
                      <View
                        key={banner.id}
                        style={[
                          styles.bannerDot,
                          index === activeBannerSlide && styles.bannerDotActive,
                        ]}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

                        <View style={styles.section}>
              <View style={[styles.sectionHeader, { flexDirection: dirRow(isRTL) }]}>
                <Text style={styles.sectionTitle}>{localT.storesNearYou}</Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/search')}
                  style={styles.seeAllLink}
                  accessibilityLabel={localT.viewAll}
                >
                  <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color={BRAND.TEXT} />
                </Pressable>
              </View>

              {feedStores.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.storeFeed}
                >
                  {feedStores.slice(0, 5).map((store: any) => {
                    const deliveryMin = Number(store.delivery_time_min ?? 0);
                    const deliveryMax = Number(store.delivery_time_max ?? 0);
                    const deliveryTime = deliveryMin > 0 && deliveryMax > 0 ? `${deliveryMin}-${deliveryMax} min` : null;
                    const storeCover = resolveOptionalStoreImage(store.cover_url || store.logo_url);
                    const ratingValue = Number(store.rating_avg ?? 0);
                    const rating = Number.isFinite(ratingValue) && ratingValue > 0 ? ratingValue.toFixed(1) : null;
                    const hasDeliveryFee = store.delivery_fee !== undefined && store.delivery_fee !== null;
                    const deliveryFee = Number(store.delivery_fee);
                    const storeName = lang === 'ar' ? (store.name_ar || store.name) : (store.name || store.name_ar);
                    const schedule = getHomeStoreOpenState(store);
                    const statusText = lang === 'ar' ? '\u0645\u063a\u0644\u0642' : lang === 'en' ? 'Closed' : 'Ferm\u00e9';
                    const deliveryFeeLabel = hasDeliveryFee && Number.isFinite(deliveryFee)
                      ? deliveryFee <= 0
                        ? (lang === 'en' ? 'Free delivery' : 'Livraison gratuite')
                        : (lang === 'en' ? `Delivery ${formatDh(deliveryFee)}` : `Livraison ${formatDh(deliveryFee)}`)
                      : null;
                    const storeId = String(store.id);
                    const isFavorite = favoriteIds.includes(storeId);
                    return (
                      <Pressable
                        key={storeId}
                        style={({ pressed }) => [styles.storeCard, pressed && { opacity: 0.9 }]}
                        onPress={() => {
                          void trackCustomerEvent({
                            event_name: 'store_opened',
                            screen: 'home',
                            entity_type: 'store',
                            entity_id: storeId,
                            metadata: { source: 'featured' },
                          });
                          router.push(`/(flows)/store/${storeId}` as any);
                        }}
                        accessibilityLabel={storeName}
                      >
                                                <View style={styles.storeCoverWrap}>
                          {storeCover ? (
                            <Image source={{ uri: storeCover }} style={styles.storeCoverImg} contentFit="cover" accessibilityLabel={storeName} />
                          ) : (
                            <View style={[styles.storeCoverImg, styles.imagePlaceholder]}>
                              <Ionicons name="storefront-outline" size={28} color={BRAND.TEXT3} />
                            </View>
                          )}

                          {!schedule.isOpen ? <View pointerEvents="none" style={styles.storeClosedVeil} /> : null}
                          <Pressable
                            style={styles.favoriteBtn}
                            onPress={(event) => {
                              event.stopPropagation();
                              void handleToggleFavorite(storeId);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={21} color={isFavorite ? BRAND.RED : BRAND.TEXT3} />
                          </Pressable>

                                                    {!schedule.isOpen ? (
                            <View style={[styles.timePill, { flexDirection: dirRow(isRTL) }]}>
                              <Ionicons name="moon" size={12} color={BRAND.SURFACE} />
                              <Text style={styles.timePillText}>{statusText}</Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.storeDetails}>
                          <Text style={styles.storeName} numberOfLines={1}>
                            {storeName}
                          </Text>
                          {deliveryFeeLabel ? (
                            <Text style={styles.storeSubText} numberOfLines={1}>
                              {deliveryFeeLabel}
                            </Text>
                          ) : null}
                          <View style={[styles.storeMeta, { flexDirection: dirRow(isRTL) }]}>
                            {deliveryTime ? <Text style={styles.metaText}>{deliveryTime}</Text> : null}
                            {deliveryTime && rating ? <Text style={styles.metaDot}>.</Text> : null}
                            {rating ? (
                              <View style={[styles.metaItem, { flexDirection: dirRow(isRTL) }]}>
                                <Ionicons name="star" size={12} color={BRAND.YELLOW_DARK} />
                                <Text style={styles.metaText}>{rating}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>{t.noStores}</Text>
                </View>
              )}
            </View>

                        <View style={styles.section}>
              <View style={[styles.sectionHeader, { flexDirection: dirRow(isRTL) }]}>
                <Text style={styles.sectionTitle}>{localT.offers}</Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/search')}
                  style={styles.seeAllLink}
                  accessibilityLabel={localT.viewAll}
                >
                  <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color={BRAND.TEXT} />
                </Pressable>
              </View>

              {feedPromoStores.length > 0 ? (
                <View style={styles.promoStoreList}>
                  {feedPromoStores.slice(0, 4).map((store: any) => {
                    const storeTitle = lang === 'ar' ? (store.name_ar || store.name) : (store.name || store.name_ar);
                    const storeCover = resolveOptionalStoreImage(store.cover_url || store.logo_url);
                    const promo = getPromoDisplay(store, lang);
                    const deliveryMin = Number(store.delivery_time_min ?? 0);
                    const deliveryMax = Number(store.delivery_time_max ?? 0);
                    const deliveryTime = deliveryMin > 0 && deliveryMax > 0 ? `${deliveryMin}-${deliveryMax} min` : null;
                    const ratingValue = Number(store.rating_avg ?? 0);
                    const rating = Number.isFinite(ratingValue) && ratingValue > 0 ? ratingValue.toFixed(1) : null;
                    const hasDeliveryFee = store.delivery_fee !== undefined && store.delivery_fee !== null;
                    const deliveryFee = Number(store.delivery_fee);
                    const schedule = getHomeStoreOpenState(store);
                    const statusText = lang === 'ar' ? '\u0645\u063a\u0644\u0642' : lang === 'en' ? 'Closed' : 'Ferm\u00e9';
                    const deliveryFeeLabel = hasDeliveryFee && Number.isFinite(deliveryFee)
                      ? deliveryFee <= 0
                        ? (lang === 'en' ? 'Free delivery' : 'Livraison gratuite')
                        : (lang === 'en' ? `Delivery ${formatDh(deliveryFee)}` : `Livraison ${formatDh(deliveryFee)}`)
                      : null;
                    const storeId = String(store.id);
                    const isFavorite = favoriteIds.includes(storeId);

                    return (
                      <Pressable
                        key={storeId}
                        style={({ pressed }) => [styles.promoStoreCard, pressed && { opacity: 0.92 }]}
                        onPress={() => {
                          void trackCustomerEvent({
                            event_name: 'store_opened',
                            screen: 'home',
                            entity_type: 'store',
                            entity_id: storeId,
                            metadata: { source: 'promo_vertical' },
                          });
                          router.push(`/(flows)/store/${storeId}` as any);
                        }}
                        accessibilityLabel={storeTitle}
                      >
                        <View style={styles.promoStoreImageWrap}>
                          {storeCover ? (
                            <Image
                              source={{ uri: storeCover }}
                              style={styles.promoStoreImage}
                              contentFit="cover"
                              accessibilityLabel={storeTitle}
                            />
                          ) : (
                            <View style={[styles.promoStoreImage, styles.imagePlaceholder]}>
                              <Ionicons name="storefront-outline" size={30} color={BRAND.TEXT3} />
                            </View>
                          )}

                          {!schedule.isOpen ? <View pointerEvents="none" style={styles.storeClosedVeil} /> : null}
                          <Pressable
                            style={styles.favoriteBtn}
                            onPress={(event) => {
                              event.stopPropagation();
                              void handleToggleFavorite(storeId);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={21} color={isFavorite ? BRAND.RED : BRAND.TEXT3} />
                          </Pressable>

                          {!schedule.isOpen ? (
                            <View style={[styles.promoClosedPill, { flexDirection: dirRow(isRTL) }]}>
                              <Ionicons name="moon" size={12} color={BRAND.SURFACE} />
                              <Text style={styles.timePillText}>{statusText}</Text>
                            </View>
                          ) : null}

                          <View style={styles.promoStoreBadge}>
                            <Text style={styles.promoStoreBadgeAmount}>{promo.amountLabel}</Text>
                            <Text style={styles.promoStoreBadgeScope}>{promo.scopeLabel}</Text>
                          </View>
                        </View>

                        <View style={styles.promoStoreDetails}>
                          <Text style={styles.promoStoreName} numberOfLines={1}>{storeTitle}</Text>
                          {deliveryFeeLabel ? (
                            <Text style={styles.storeSubText} numberOfLines={1}>
                              {deliveryFeeLabel}
                            </Text>
                          ) : null}
                          <View style={[styles.storeMeta, { flexDirection: dirRow(isRTL) }]}>
                            {deliveryTime ? <Text style={styles.metaText}>{deliveryTime}</Text> : null}
                            {deliveryTime && rating ? <Text style={styles.metaDot}>.</Text> : null}
                            {rating ? (
                              <View style={[styles.metaItem, { flexDirection: dirRow(isRTL) }]}>
                                <Ionicons name="star" size={12} color={BRAND.YELLOW_DARK} />
                                <Text style={styles.metaText}>{rating}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    {lang === 'en' ? 'No offers available' : 'Aucune offre disponible'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </Reanimated.ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.BG },

    fixedHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.BORDER,
  },
  fixedHeaderContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 11,
    paddingHorizontal: LAYOUT.SCREEN_PAD,
  },
  headerTopRow: {
    alignItems: 'center',
    height: 56,
    gap: 10,
  },
  logoContainer: {
    width: 88,
    height: 42,
  },
  logoImage: {
    width: 88,
    height: 42,
  },
  headerActions: {
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerNotifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BRAND.SURFACE,
    paddingHorizontal: 4,
  },
  headerNotifBadgeTxt: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 9,
    color: BRAND.SURFACE,
  },
  locationContainer: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  locationPill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    alignSelf: 'stretch',
    backgroundColor: BRAND.LIGHT,
    borderRadius: 999,
    paddingHorizontal: 10,
    minHeight: 38,
  },
  locationText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    color: BRAND.TEXT,
    flexShrink: 1,
    maxWidth: '76%',
  },

    homeSearchBar: {
    marginHorizontal: 22,
    minHeight: 46,
    height: 46,
    borderRadius: 23,
  },
  systemBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: BRAND.CREAM,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 8,
  },
  systemBannerText: {
    flex: 1,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    lineHeight: 17,
    color: BRAND.TEXT,
  },

    categoriesScroll: {
    paddingHorizontal: 14,
    marginTop: 10,
    paddingBottom: 2,
    gap: 8,
  },
  categoryBubble: {
    alignItems: 'center',
    width: 82,
  },
  categoryCircle: {
    width: 80,
    height: 66,
    borderRadius: 16,
    backgroundColor: BRAND.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImage: {
    width: 64,
    height: 64,
  },
  categoryLabel: {
    marginTop: 5,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 11.5,
    color: BRAND.TEXT,
    textAlign: 'center',
    maxWidth: 82,
  },

    promoSection: {
    display: 'none',
    marginTop: 22,
    alignItems: 'center',
  },
  promoScrollContent: {
    paddingHorizontal: 16,
  },
  promoCard: {
    height: 142,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
    marginRight: 12,
    position: 'relative',
  },
  promoContent: {
    justifyContent: 'center',
    flex: 1,
    zIndex: 1,
  },
  promoEyebrow: {
    alignItems: 'center',
    gap: 8,
  },
  promoEyebrowText: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 12,
    color: BRAND.TEXT,
  },
  promoPill: {
    backgroundColor: BRAND.RED,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  promoPillText: {
    fontFamily: FONTS.SEMIBOLD,
    color: BRAND.SURFACE,
    fontSize: 10,
  },
  promoTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 19,
    lineHeight: 24,
    color: BRAND.TEXT,
    marginTop: 6,
    maxWidth: 160,
    fontWeight: '700',
  },
  promoSubtitle: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    lineHeight: 15,
    color: BRAND.TEXT2,
    marginTop: 4,
  },
  promoButton: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND.RED,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 10,
  },
  promoButtonText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    color: BRAND.SURFACE,
  },
  promoImage: {
    width: 130,
    height: '100%',
    borderRadius: 14,
  },
  promoDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND.BORDER,
  },
  dotActive: {
    backgroundColor: BRAND.RED,
    width: 20,
    borderRadius: 4,
  },

    continueSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  continueCard: {
    backgroundColor: BRAND.YELLOW,
    borderRadius: 18,
    padding: 14,
  },
  continueHeader: {
    marginBottom: 10,
  },
  continueTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 15,
    color: BRAND.TEXT,
    fontWeight: '600',
  },
  continueInner: {
    alignItems: 'center',
    gap: 12,
  },
  continueStoreImg: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: BRAND.SURFACE,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.LIGHT,
  },
  continueDetails: {
    flex: 1,
    gap: 2,
  },
  continueStoreName: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 14,
    color: BRAND.TEXT,
    fontWeight: '600',
  },
  continueItemsCount: {
    fontFamily: FONTS.BODY,
    fontSize: 12,
    color: BRAND.TEXT2,
  },
  continueBtnWrapper: {
    backgroundColor: BRAND.RED,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  continueBtnTxt: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.SURFACE,
  },

    section: {
    marginTop: 24,
  },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.SCREEN_PAD,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 18,
    color: BRAND.TEXT,
    fontWeight: '700',
  },
  seeAllLink: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BRAND.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalScroll: {
    paddingHorizontal: LAYOUT.SCREEN_PAD,
    gap: LAYOUT.CARD_GAP,
    paddingBottom: 4,
  },
  storeFeed: {
    paddingHorizontal: 16,
    gap: 14,
  },
  bannerCarouselSection: {
    marginTop: 18,
    marginBottom: 0,
    paddingHorizontal: 8,
  },
  bannerSlide: {
    height: 250,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: BRAND.LIGHT,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerDots: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: BRAND.SURFACE,
  },
  bannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BRAND.BORDER,
  },
  bannerDotActive: {
    width: 20,
    backgroundColor: BRAND.RED,
  },

    reorderCard: {
    width: 150,
    backgroundColor: BRAND.SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    overflow: 'hidden',
  },
  reorderImageWrap: {
    height: 100,
    overflow: 'hidden',
  },
  reorderImg: {
    width: '100%',
    height: '100%',
  },
  reorderDetails: {
    padding: 10,
    gap: 3,
  },
  reorderName: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.TEXT,
  },
  reorderMeta: {
    alignItems: 'center',
    gap: 4,
  },
  reorderMetaText: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: BRAND.TEXT2,
  },

    storeCard: {
    backgroundColor: BRAND.SURFACE,
    borderRadius: 18,
    overflow: 'hidden',
    width: Math.min(width - 86, 288),
    borderWidth: 0,
  },
  storeCoverWrap: {
    height: 144,
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
  },
  storeCoverImg: {
    width: '100%',
    height: '100%',
  },
  storeClosedVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND.TEXT,
    opacity: 0.42,
    zIndex: 2,
  },
  favoriteBtn: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  promoBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: BRAND.PROMO_BG,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 3,
  },
  promoBadgeText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 10,
    fontWeight: '700',
    color: BRAND.SURFACE,
  },
  timePill: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: BRAND.TEXT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    gap: 4,
    zIndex: 3,
  },
  timePillText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 11,
    color: BRAND.SURFACE,
  },
  storeDetails: {
    paddingTop: 8,
    paddingBottom: 4,
    gap: 2,
  },
  storeName: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 16,
    color: BRAND.TEXT,
    fontWeight: '700',
  },
  storeSubText: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT2,
  },
  storeMeta: {
    alignItems: 'center',
    gap: 4,
  },
  metaItem: {
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT2,
  },
  metaDot: {
    fontSize: 12,
    color: BRAND.TEXT3,
  },

  promoStoreList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  promoStoreCard: {
    width: '100%',
    backgroundColor: BRAND.SURFACE,
    borderRadius: 22,
    overflow: 'hidden',
  },
  promoStoreImageWrap: {
    height: 180,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  promoStoreImage: {
    width: '100%',
    height: '100%',
  },
  promoStoreBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    maxWidth: '74%',
    backgroundColor: BRAND.YELLOW,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 3,
  },
  promoClosedPill: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: BRAND.TEXT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    gap: 4,
    zIndex: 3,
  },
  promoStoreBadgeAmount: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.TEXT,
  },
  promoStoreBadgeScope: {
    marginTop: 1,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 11,
    color: BRAND.TEXT,
  },
  promoStoreDetails: {
    paddingTop: 9,
    paddingBottom: 7,
    gap: 4,
  },
  promoStoreName: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.TEXT,
  },

    offerCard: {
    width: 130,
    height: 112,
    borderRadius: 16,
    backgroundColor: BRAND.YELLOW_LIGHT,
    overflow: 'hidden',
    padding: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: BRAND.BORDER,
  },
  offerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND.RED,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  offerBadgeText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 10,
    color: BRAND.SURFACE,
  },
  offerTitle: {
    marginTop: 6,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    lineHeight: 15,
    color: BRAND.TEXT,
    maxWidth: 72,
  },
  offerImage: {
    position: 'absolute',
    right: -8,
    bottom: -6,
    width: 78,
    height: 78,
    borderRadius: 39,
  },

    emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontFamily: FONTS.BODY,
    color: BRAND.TEXT3,
    fontSize: 13,
  },
});

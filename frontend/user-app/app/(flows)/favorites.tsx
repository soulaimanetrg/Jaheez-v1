import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import AnimatedPressable from '@/components/ui/AnimatedPressable';
import { TText } from '@/components/ui/TText';
import { BRAND, FONTS, RADIUS, SPACE } from '../../constants/brand';
import { useAuthStore } from '../../store/authStore';
import { useLangStore } from '../../store/languageStore';
import { backendJson } from '../../lib/backendApi';
import { toggleFavoriteProduct } from '../../lib/storeApi';
import { resolveStoreImageUrl } from '../../lib/adminApi';
import { backArrow, dirItems, dirRow } from '../../lib/direction';

type FavoriteStore = {
  id: string;
  name: string;
  rating?: string | null;
  time?: string | null;
  fee?: string | null;
  img?: string | null;
  promo_type?: 'store_percentage' | 'store_fixed' | 'articles' | 'none';
  reduction_percentage?: number;
};

type FavoriteProduct = {
  menu_item_id: string;
  menu_items: {
    id: string;
    store_id: string;
    name: string;
    name_ar?: string | null;
    price?: number | null;
    description?: string | null;
    description_ar?: string | null;
    image_url?: string | null;
  };
};

type MainTab = 'stores' | 'products';

const SIZE_TOUCH = 44;

function resolveOptionalStoreImage(url?: string | null): string | null {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (!trimmed) return null;
  const resolved = resolveStoreImageUrl(trimmed, '');
  return resolved || null;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const { lang, isRTL, t } = useLangStore();

  const [activeMainTab, setActiveMainTab] = useState<MainTab>('stores');
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const [storeFavs, setStoreFavs] = useState<FavoriteStore[]>([]);
  const [productFavs, setProductFavs] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [storesRes, productsRes] = await Promise.all([
        backendJson<any[]>('/admin-api/v1/customer/favorites/stores').catch(() => []),
        backendJson<any[]>('/admin-api/v1/customer/favorites/products').catch(() => []),
      ]);

      setStoreFavs((storesRes || []).map((row: any) => {
        const s = row.stores || {};
        const fee = Number(s.delivery_fee ?? 0);
        const ratingValue = Number(s.rating_avg ?? 0);
        const deliveryMin = Number(s.delivery_time_min ?? 0);
        const deliveryMax = Number(s.delivery_time_max ?? 0);
        return {
          id: s.id || row.store_id,
          name: s.name_ar || s.name || 'متجر',
          rating: Number.isFinite(ratingValue) && ratingValue > 0 ? ratingValue.toFixed(1) : null,
          time: deliveryMin > 0 && deliveryMax > 0 ? `${deliveryMin}-${deliveryMax}` : null,
          fee: s.delivery_fee !== undefined && s.delivery_fee !== null ? (fee === 0 ? t.freeDelivery : `${fee} DH`) : null,
          img: resolveOptionalStoreImage(s.cover_url || s.logo_url),
          promo_type: s.promo_type,
          reduction_percentage: s.reduction_percentage,
        };
      }));

      setProductFavs(productsRes || []);
    } catch {
      setStoreFavs([]);
      setProductFavs([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const removeStoreFav = useCallback(async (storeId: string) => {
    setStoreFavs(prev => prev.filter(f => f.id !== storeId));
    if (!user?.id) return;
    try {
      await backendJson('/admin-api/v1/customer/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({ store_id: storeId }),
      });
    } catch {
      fetchFavorites();
    }
  }, [fetchFavorites, user?.id]);

  const removeProductFav = useCallback(async (menuItemId: string) => {
    setProductFavs(prev => prev.filter(f => f.menu_item_id !== menuItemId));
    try {
      const { error } = await toggleFavoriteProduct(menuItemId);
      if (error) fetchFavorites();
    } catch {
      fetchFavorites();
    }
  }, [fetchFavorites]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  }, [router]);

  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [10, 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const headerTitleTranslateY = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [15, 0],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={BRAND.RED} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View
        style={[
          styles.fixedHeader,
          {
            height: insets.top + 60,
            paddingTop: insets.top,
            flexDirection: dirRow(isRTL),
          },
        ]}
      >
        <Pressable
          style={styles.fixedHeaderBtn}
          onPress={handleBack}
          accessibilityLabel={t.back}
          accessibilityRole="button"
        >
          <Ionicons name={backArrow(isRTL)} size={22} color={BRAND.TEXT} />
        </Pressable>

        <View style={styles.fixedHeaderCenter}>
          <Text style={styles.fixedHeaderTitle} numberOfLines={1}>
            {t.favorites}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* ── Tabs ── */}
      <View
        style={[styles.tabBar, { flexDirection: dirRow(isRTL) }]}
        onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
      >
        <TabButton
          active={activeMainTab === 'stores'}
          label={t.stores}
          onPress={() => setActiveMainTab('stores')}
        />
        <TabButton
          active={activeMainTab === 'products'}
          label={t.products}
          onPress={() => setActiveMainTab('products')}
        />
        {tabBarWidth > 0 && (
          <MotiView
            style={[styles.tabIndicator, { width: tabBarWidth / 2 }]}
            animate={{
              translateX: isRTL
                ? (activeMainTab === 'stores' ? tabBarWidth / 2 : 0)
                : (activeMainTab === 'stores' ? 0 : tabBarWidth / 2),
            }}
          />
        )}
      </View>

      <RNAnimated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: insets.bottom + SPACE.XL,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <MotiView
          key={activeMainTab}
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing' as any, duration: 150 }}
          style={styles.tabContent}
        >
          {activeMainTab === 'stores' ? (
            storeFavs.length === 0 ? (
              <EmptyState icon="heart-outline" title={t.noFavoriteStores} />
            ) : (
              <View style={styles.list}>
                {storeFavs.map((fav, index) => (
                  <MotiView
                    key={fav.id}
                    from={{ opacity: 0, translateY: 12 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing' as any, duration: 200, delay: index * 40 }}
                    style={styles.rowWrap}
                  >
                    <FavoriteStoreRow
                      fav={fav}
                      isRTL={isRTL}
                      removeLabel={t.removeFromFavorites}
                      minutesLabel={t.minutes}
                      onPress={() => router.push(`/(flows)/store/${fav.id}` as any)}
                      onRemove={() => removeStoreFav(fav.id)}
                    />
                  </MotiView>
                ))}
              </View>
            )
          ) : productFavs.length === 0 ? (
            <EmptyState icon="fast-food-outline" title={t.noFavoriteProducts} />
          ) : (
            <View style={styles.list}>
              {productFavs.map((fav, index) => (
                <MotiView
                  key={fav.menu_item_id}
                  from={{ opacity: 0, translateY: 12 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing' as any, duration: 200, delay: index * 40 }}
                  style={styles.rowWrap}
                >
                  <FavoriteProductRow
                    fav={fav}
                    isRTL={isRTL}
                    removeLabel={t.removeFromFavorites}
                    onPress={() => router.push(`/(flows)/store/${fav.menu_items.store_id}` as any)}
                    onRemove={() => removeProductFav(fav.menu_item_id)}
                  />
                </MotiView>
              ))}
            </View>
          )}
        </MotiView>
      </RNAnimated.ScrollView>
    </View>
  );
}

function TabButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ icon, title }: { icon: string; title: string }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing' as any, duration: 350 }}
      style={styles.emptyState}
    >
      <Ionicons name={icon as any} size={64} color={BRAND.TEXT3} />
      <Text style={styles.emptyTitle}>{title}</Text>
    </MotiView>
  );
}

function FavoriteStoreRow({
  fav,
  isRTL,
  removeLabel,
  minutesLabel,
  onPress,
  onRemove,
}: {
  fav: FavoriteStore;
  isRTL: boolean;
  removeLabel: string;
  minutesLabel: string;
  onPress: () => void;
  onRemove: () => void;
}) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleRemove = () => {
    scale.value = withTiming(0.95, { duration: 180 });
    opacity.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onRemove)();
    });
  };

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <AnimatedPressable
        style={[styles.cardMain, { flexDirection: dirRow(isRTL) }]}
        onPress={onPress}
        accessibilityLabel={fav.name}
      >
        <View style={styles.imageWrap}>
          {fav.img ? (
            <Image
              source={{ uri: fav.img }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              accessibilityLabel={fav.name}
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="storefront-outline" size={24} color={BRAND.TEXT3} />
            </View>
          )}
          {/* Promo Floating Badge */}
          {fav.promo_type && fav.promo_type !== 'none' && (
            <View style={[
              styles.promoBadgeFloatingFav,
              isRTL ? { right: 4 } : { left: 4 },
            ]}>
              <Ionicons name="pricetag" size={8} color="#FFFFFF" style={isRTL ? { marginLeft: 2 } : { marginRight: 2 }} />
              <Text style={styles.promoBadgeTextFav}>
                {fav.promo_type === 'store_percentage'
                  ? `-${fav.reduction_percentage}%`
                  : fav.promo_type === 'store_fixed'
                  ? `-${fav.reduction_percentage}DH`
                  : `%`}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.info, { alignItems: dirItems(isRTL) }]}>
          <TText ar={fav.name} style={[styles.name, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1} />
          <View style={[styles.metaRow, { flexDirection: dirRow(isRTL) }]}>
            {fav.rating ? (
              <>
                <Ionicons name="star" size={14} color={BRAND.YELLOW_DARK} />
                <Text style={styles.metaText}>{fav.rating}</Text>
              </>
            ) : null}
            {fav.rating && fav.time ? <View style={styles.dot} /> : null}
            {fav.time ? (
              <>
                <Ionicons name="time-outline" size={14} color={BRAND.TEXT3} />
                <Text style={styles.metaText}>{fav.time} {minutesLabel}</Text>
              </>
            ) : null}
            {(fav.rating || fav.time) && fav.fee ? <View style={styles.dot} /> : null}
            {fav.fee ? (
              <>
                <Ionicons name="bicycle-outline" size={14} color={BRAND.TEXT3} />
                <Text style={styles.metaText}>{fav.fee}</Text>
              </>
            ) : null}
          </View>
        </View>
      </AnimatedPressable>
      <AnimatedPressable
        style={styles.heartBtn}
        onPress={handleRemove}
        accessibilityLabel={removeLabel}
      >
        <Ionicons name="heart" size={26} color={BRAND.RED} />
      </AnimatedPressable>
    </Animated.View>
  );
}

function FavoriteProductRow({
  fav,
  isRTL,
  removeLabel,
  onPress,
  onRemove,
}: {
  fav: FavoriteProduct;
  isRTL: boolean;
  removeLabel: string;
  onPress: () => void;
  onRemove: () => void;
}) {
  const item = fav.menu_items || {};
  const name = item.name_ar || item.name || '';
  const desc = item.description_ar || item.description || '';
  const img = resolveOptionalStoreImage(item.image_url);
  const price = Number(item.price);
  const hasPrice = Number.isFinite(price);

  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleRemove = () => {
    scale.value = withTiming(0.95, { duration: 180 });
    opacity.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onRemove)();
    });
  };

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <AnimatedPressable
        style={[styles.cardMain, { flexDirection: dirRow(isRTL) }]}
        onPress={onPress}
        accessibilityLabel={name}
      >
        <View style={styles.imageWrap}>
          {img ? (
            <Image
              source={{ uri: img }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              accessibilityLabel={name}
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="image" size={24} color={BRAND.TEXT3} />
            </View>
          )}
        </View>
        <View style={[styles.info, { alignItems: dirItems(isRTL) }]}>
          <Text style={[styles.name, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{name}</Text>
          {desc ? (
            <Text style={[styles.description, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{desc}</Text>
          ) : null}
          {hasPrice ? (
            <Text style={[styles.productPrice, { textAlign: isRTL ? 'right' : 'left' }]}>
              {price.toFixed(2)} DH
            </Text>
          ) : null}
        </View>
      </AnimatedPressable>
      <AnimatedPressable
        style={styles.heartBtn}
        onPress={handleRemove}
        accessibilityLabel={removeLabel}
      >
        <Ionicons name="heart" size={26} color={BRAND.RED} />
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.SURFACE,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedHeader: {
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fixedHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedHeaderTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 0,
    marginBottom: 0,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BRAND.BORDER,
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE.MD,
  },
  tabText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.TEXT3,
  },
  tabTextActive: {
    color: BRAND.RED,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: BRAND.RED,
  },
  scroll: {
    paddingHorizontal: 0,
    paddingTop: SPACE.XS,
  },
  tabContent: {
    minHeight: 200,
  },
  list: {
    width: '100%',
    gap: 0,
  },
  rowWrap: {
    width: '100%',
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.SURFACE,
    paddingHorizontal: SPACE.MD,
    paddingVertical: SPACE.MD,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BRAND.BORDER,
  },
  cardMain: {
    flex: 1,
    alignItems: 'center',
    gap: SPACE.MD,
  },
  imageWrap: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.LG,
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.LIGHT,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  name: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 17,
    color: BRAND.TEXT,
  },
  description: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT3,
  },
  productPrice: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.YELLOW_DARK,
    marginTop: 4,
  },
  metaRow: {
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  promoBadgeFloatingFav: {
    position: 'absolute',
    top: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.PROMO_BG,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  promoBadgeTextFav: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metaText: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: BRAND.TEXT3,
  },
  heartBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE.XL * 2,
    gap: SPACE.SM,
  },
  emptyTitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 16,
    color: BRAND.TEXT2,
    textAlign: 'center',
  },
});

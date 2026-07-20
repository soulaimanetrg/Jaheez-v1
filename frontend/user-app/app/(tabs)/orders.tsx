import { MotiView } from 'moti';
import React, { useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Animated,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { HapticTab } from '../../components/ui/HapticTab';
import SkeletonBox from '../../components/ui/SkeletonBox';
import { BRAND, FONTS } from '../../constants/brand';
import { ASSETS } from '../../constants/assets';
import { formatDh } from '../../lib/money';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useLangStore } from '../../store/languageStore';
import { useOrders } from '../../hooks/queries/useOrders';
import { resolveStoreImageUrl } from '../../lib/adminApi';
import { dirItems, dirRow, dirText } from '../../lib/direction';

type Filter = 'all' | 'active' | 'completed' | 'cancelled';

type ReorderItem = {
  id?: string | null;
  menu_item_id?: string | null;
  name?: string | null;
  name_ar?: string | null;
  unit_price?: number | null;
  quantity?: number | null;
  image_url?: string | null;
  selected_options?: [];
  menu_item?: {
    name?: string | null;
    name_ar?: string | null;
    image_url?: string | null;
  } | null;
};

type ReorderOrder = {
  store_id?: string | null;
  delivery_fee?: number | null;
  items?: ReorderItem[] | null;
  store?: {
    name?: string | null;
    delivery_fee?: number | null;
    logo_url?: string | null;
  } | null;
};

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'picked_up', 'on_the_way'];

const COPY = {
  fr: {
    title: 'Mes commandes',
    subtitle: 'Suivez vos commandes et recommandez vos favoris.',
    active: 'En cours',
    completed: 'Terminées',
    cancelled: 'Annulées',
    all: 'Toutes',
    activeFilter: 'En cours',
    completedFilter: 'Terminées',
    cancelledFilter: 'Annulées',
    pending: 'En attente',
    confirmed: 'Confirmée',
    preparing: 'Préparation',
    onway: 'En route',
    delivered: 'Livrée',
    cancelledStatus: 'Annulée',
    track: 'Suivre',
    details: 'Détails',
    reorder: 'Recommander',
    items: 'articles',
    total: 'Total',
    today: 'Aujourd’hui',
    loading: 'Chargement des commandes…',
    emptyTitle: 'Aucune commande pour le moment',
    emptySub: 'Passez une première commande et elle apparaîtra ici.',
    startOrder: 'Commander maintenant',
    storeFallback: 'Magasin',
  },
  ar: {
    title: 'طلباتي',
    subtitle: 'تابع طلباتك وأعد طلب مفضلاتك بسهولة.',
    active: 'جارية',
    completed: 'مكتملة',
    cancelled: 'ملغاة',
    all: 'الكل',
    activeFilter: 'قيد التنفيذ',
    completedFilter: 'مكتملة',
    cancelledFilter: 'ملغاة',
    pending: 'بانتظار التأكيد',
    confirmed: 'تم التأكيد',
    preparing: 'قيد التحضير',
    onway: 'في الطريق',
    delivered: 'تم التسليم',
    cancelledStatus: 'ملغاة',
    track: 'تتبع',
    details: 'التفاصيل',
    reorder: 'إعادة الطلب',
    items: 'منتجات',
    total: 'المجموع',
    today: 'اليوم',
    loading: 'جاري تحميل الطلبات…',
    emptyTitle: 'لا توجد طلبات بعد',
    emptySub: 'ابدأ أول طلب وسيظهر هنا مباشرة.',
    startOrder: 'اطلب الآن',
    storeFallback: 'متجر',
  },
  en: {
    title: 'My orders',
    subtitle: 'Track your orders and reorder your favorites.',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    all: 'All',
    activeFilter: 'Active',
    completedFilter: 'Completed',
    cancelledFilter: 'Cancelled',
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    onway: 'On the way',
    delivered: 'Delivered',
    cancelledStatus: 'Cancelled',
    track: 'Track',
    details: 'Details',
    reorder: 'Reorder',
    items: 'items',
    total: 'Total',
    today: 'Today',
    loading: 'Loading orders…',
    emptyTitle: 'No orders yet',
    emptySub: 'Place your first order and it will appear here.',
    startOrder: 'Order now',
    storeFallback: 'Store',
  },
} as const;

function parseBilingual(text: string | null | undefined, lang: string, fallback: string = ''): string {
  if (!text) return fallback;
  const parts = text.split('|');
  if (parts.length > 1) {
    if (lang === 'ar') {
      return (parts[0] || '').trim();
    } else {
      return (parts[1] || parts[0] || '').trim();
    }
  }
  return text.trim();
}

function getStoreName(store: any, lang: string, fallback: string = ''): string {
  if (!store) return fallback;
  const nameAr = store.name_ar;
  const nameEn = store.name;
  if (lang === 'ar') {
    if (nameAr) return parseBilingual(nameAr, 'ar');
    return parseBilingual(nameEn, 'ar', fallback);
  } else {
    if (nameEn) return parseBilingual(nameEn, 'fr', fallback);
    return parseBilingual(nameAr, 'fr', fallback);
  }
}

function resolveOptionalStoreImage(url?: string | null): string | null {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (!trimmed) return null;
  const resolved = resolveStoreImageUrl(trimmed, '');
  return resolved || null;
}

function orderGroup(status: string): Exclude<Filter, 'all'> {
  if (ACTIVE_STATUSES.includes(status)) return 'active';
  if (status === 'delivered' || status === 'completed') return 'completed';
  return 'cancelled';
}

function localeFor(lang: string) {
  return lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR';
}

function formatOrderDate(value: string | undefined, lang: string, todayFallback: string) {
  if (!value) return todayFallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return todayFallback;
  return date.toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusConfig(status: string, t: any) {
  if (status === 'cancelled') return { label: t.cancelledStatus, color: BRAND.RED, bg: BRAND.RED_LIGHT, icon: 'close-circle' as const };
  if (status === 'delivered' || status === 'completed') return { label: t.delivered, color: BRAND.GREEN, bg: BRAND.GROCERY_SOFT, icon: 'checkmark-circle' as const };
  if (status === 'picked_up' || status === 'on_the_way') return { label: t.onway, color: BRAND.RED, bg: BRAND.RED_LIGHT, icon: 'bicycle' as const };
  if (status === 'preparing') return { label: t.preparing, color: BRAND.WARN, bg: BRAND.YELLOW_SOFT, icon: 'restaurant-outline' as const };
  if (status === 'confirmed') return { label: t.confirmed, color: BRAND.BLUE, bg: BRAND.PARCEL_SOFT, icon: 'checkmark-circle-outline' as const };
  return { label: t.pending, color: BRAND.WARN, bg: BRAND.YELLOW_SOFT, icon: 'time-outline' as const };
}

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const { lang, isRTL } = useLangStore();
  const t = COPY[lang as keyof typeof COPY] ?? COPY.fr;
  const [filter, setFilter] = useState<Filter>('all');
  const { data: orders = [], isLoading, isFetching, refetch } = useOrders(user?.id);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Unified header scroll animations
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

  const filtered = useMemo(
    () => orders.filter((order: any) => filter === 'all' || orderGroup(order.status) === filter),
    [orders, filter],
  );

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t.all },
    { key: 'active', label: t.activeFilter },
    { key: 'completed', label: t.completedFilter },
    { key: 'cancelled', label: t.cancelledFilter },
  ];

  const handleReorderFromList = (order: ReorderOrder) => {
    const cart = useCartStore.getState();
    if (!order.store_id || !order.items || order.items.length === 0) return;
    const storeId = order.store_id;
    cart.clearCart();
    cart.setStore(
      storeId,
      order.store?.name || t.storeFallback,
      order.store?.logo_url || null
    );
    let addedItems = 0;
    order.items.forEach((item) => {
      const menuItemId = item.menu_item_id || item.id;
      const unitPrice = Number(item.unit_price);
      const quantity = Number(item.quantity ?? 1);
      if (!menuItemId || !Number.isFinite(unitPrice) || !Number.isFinite(quantity) || quantity <= 0) {
        return;
      }
      cart.addItem({
        id: menuItemId,
        store_id: storeId,
        menu_item_id: menuItemId,
        name: item.menu_item?.name || item.name || '',
        name_ar: item.menu_item?.name_ar || item.name_ar || '',
        unit_price: unitPrice,
        quantity,
        image_url: item.menu_item?.image_url || item.image_url || undefined,
        selected_options: item.selected_options || [],
      });
      addedItems += 1;
    });
    if (addedItems > 0) {
      router.push('/(flows)/checkout');
    }
  };

  const renderHeader = () => (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.fixedHeader,
        {
          height: insets.top + 60,
          paddingTop: insets.top,
          flexDirection: dirRow(isRTL),
        },
      ]}
    >
      <Animated.View style={[styles.fixedHeaderBg, { opacity: headerBgOpacity }]} />

      <HapticTab
        style={styles.fixedHeaderBtn}
        scaleDown={0.88}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        accessibilityLabel={t.title}
      >
        <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color={BRAND.TEXT} />
      </HapticTab>

      <View style={styles.fixedHeaderCenter}>
        <Text
          style={styles.fixedHeaderTitle}
          numberOfLines={1}
        >
          {t.title}
        </Text>
      </View>

      <View style={{ width: 40 }} />
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      {renderHeader()}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{ paddingTop: insets.top + 72, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={!isLoading && isFetching} onRefresh={refetch} colors={[BRAND.RED]} tintColor={BRAND.RED} />}
      >

        {/* ── Filters ── */}
        <View style={[styles.filterBar, { flexDirection: dirRow(isRTL) }]}>
          {filters.map(f => (
            <HapticTab
              key={f.key}
              scaleDown={0.93}
              style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
              onPress={() => setFilter(f.key)}
              accessibilityLabel={f.label}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            </HapticTab>
          ))}
        </View>

        {isLoading ? (
          <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 12 }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.simpleOrderRow, { borderBottomWidth: 0.5, borderBottomColor: BRAND.BORDER }]}>
                <View style={[styles.simpleOrderTop, { flexDirection: dirRow(isRTL), borderBottomWidth: 0.5, borderBottomColor: BRAND.BORDER, paddingBottom: 10, alignItems: 'center', gap: 10 }]}>
                  <SkeletonBox width={64} height={64} borderRadius={16} />
                  <View style={{ flex: 1, gap: 8, alignItems: isRTL ? 'flex-end' : 'flex-start', marginHorizontal: 12 }}>
                    <SkeletonBox width="60%" height={16} borderRadius={6} />
                    <SkeletonBox width="40%" height={12} borderRadius={4} />
                  </View>
                  <SkeletonBox width={80} height={26} borderRadius={8} />
                </View>
                <View style={[styles.simpleOrderBottom, { flexDirection: dirRow(isRTL), justifyContent: 'flex-end', paddingTop: 10 }]}>
                  <SkeletonBox width="35%" height={14} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        ) : filtered.length > 0 ? (
          <View style={styles.listContainer}>
            {filtered.map((order: any, index: number) => {
              const o0 = order as any;
              const storeName = getStoreName(o0.store, lang, t.storeFallback);
              const logo = resolveOptionalStoreImage(o0.store?.logo_url || o0.store?.cover_url);
              const status = statusConfig(order.status, t);
              const itemsCount = o0.items?.length || 0;
              const total = Number(o0.total_amount ?? 0);
              const isActiveOrder = ACTIVE_STATUSES.includes(order.status);

              return (
                <MotiView
                  key={order.id}
                  from={{ opacity: 0, translateY: 12 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing' as any, duration: 250, delay: index * 40 }}
                >
                  <HapticTab
                    style={styles.simpleOrderRow}
                    scaleDown={0.99}
                    onPress={() => router.push({ pathname: '/(flows)/order/[id]' as any, params: { id: order.id } })}
                    accessibilityLabel={`${t.details}: ${storeName}`}
                  >
                    <View style={[styles.simpleOrderTop, { flexDirection: dirRow(isRTL) }]}>
                      {logo ? (
                        <Image source={{ uri: logo }} style={styles.simpleStoreLogo} contentFit="cover" />
                      ) : (
                        <View style={[styles.simpleStoreLogo, styles.imagePlaceholder]}>
                          <Ionicons name="storefront-outline" size={28} color={BRAND.TEXT3} />
                        </View>
                      )}
                      <View style={[styles.simpleOrderInfo, { alignItems: dirItems(isRTL) }]}>
                        <Text style={styles.simpleStoreName}>{storeName}</Text>
                        <Text style={styles.simpleOrderMeta}>
                          {formatOrderDate(order.created_at, lang, t.today)}
                        </Text>
                      </View>
                      <View style={[styles.simpleStatusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.simpleStatusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>

                    <View style={[styles.simpleOrderBottom, { flexDirection: dirRow(isRTL), justifyContent: 'flex-end', gap: 12 }]}>
                      <Text style={styles.simpleOrderTotal}>
                        {itemsCount} {t.items} · <Text style={styles.simplePriceText}>{formatDh(total)}</Text>
                      </Text>
                      {isActiveOrder && (
                        <HapticTab
                          scaleDown={0.93}
                          style={styles.simpleTrackBtn}
                          onPress={() => router.push({ pathname: '/(flows)/tracking/[id]' as any, params: { id: order.id } })}
                          accessibilityLabel={t.track}
                        >
                          <Text style={styles.simpleTrackBtnText}>{t.track}</Text>
                        </HapticTab>
                      )}
                    </View>
                  </HapticTab>
                </MotiView>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Image source={ASSETS.illustrations.jaheez_delivery} style={styles.emptyIllustration} contentFit="contain" />
            <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
            <Text style={styles.emptySub}>{t.emptySub}</Text>
            <HapticTab scaleDown={0.96} style={styles.homeBtn} onPress={() => router.replace('/(tabs)')} accessibilityLabel={t.startOrder}>
              <Text style={styles.homeBtnText}>{t.startOrder}</Text>
            </HapticTab>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.SURFACE },

  fixedHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  fixedHeaderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND.SURFACE,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.BORDER,
  },
  fixedHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  fixedHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  fixedHeaderTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 22,
    fontWeight: 'bold',
    color: BRAND.TEXT,
  },
  bigPageTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 28,
    color: BRAND.TEXT,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.TEXT3,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterBar: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  filterPill: { paddingHorizontal: 16, height: 36, borderRadius: 18, backgroundColor: BRAND.LIGHT, alignItems: 'center', justifyContent: 'center' },
  filterPillActive: { backgroundColor: BRAND.RED },
  filterText: { fontFamily: FONTS.MEDIUM, fontSize: 13, color: BRAND.TEXT2 },
  filterTextActive: { color: BRAND.SURFACE, fontFamily: FONTS.SEMIBOLD },

  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  listContainer: { paddingHorizontal: 16, gap: 0 },
  simpleOrderRow: { backgroundColor: BRAND.SURFACE, borderBottomWidth: 0.5, borderBottomColor: BRAND.BORDER, paddingVertical: 14 },
  simpleOrderTop: { alignItems: 'center', gap: 10, borderBottomWidth: 0.5, borderBottomColor: BRAND.BORDER, paddingBottom: 10 },
  simpleOrderBottom: { justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  simpleStoreLogo: { width: 108, height: 108, borderRadius: 24, backgroundColor: BRAND.LIGHT },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  simpleOrderInfo: { flex: 1 },
  simpleStoreName: { fontFamily: FONTS.SEMIBOLD, fontSize: 17, color: BRAND.TEXT },
  simpleOrderMeta: { fontFamily: FONTS.BODY, fontSize: 13.5, color: BRAND.TEXT3, marginTop: 2 },
  simpleStatusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  simpleStatusText: { fontFamily: FONTS.SEMIBOLD, fontSize: 12 },
  simpleOrderTotal: { fontFamily: FONTS.BODY, fontSize: 14.5, color: BRAND.TEXT2 },
  simplePriceText: { fontFamily: FONTS.SEMIBOLD, fontSize: 15.5, color: BRAND.TEXT },
  simpleTrackBtn: { backgroundColor: BRAND.RED, paddingHorizontal: 16, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  simpleTrackBtnText: { fontFamily: FONTS.SEMIBOLD, color: BRAND.SURFACE, fontSize: 13 },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIllustration: { width: 420, height: 360, marginBottom: 16 },
  emptyTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 18, color: BRAND.TEXT, marginBottom: 6 },
  emptySub: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT3, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  homeBtn: { backgroundColor: BRAND.RED, height: 44, borderRadius: 22, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  homeBtnText: { fontFamily: FONTS.SEMIBOLD, color: BRAND.SURFACE, fontSize: 13 },
});

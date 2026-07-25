import React, { useRef } from 'react';
import {
  Pressable,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  InteractionManager,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { AppIcon } from '@/components/ui/AppIcon';
import { ASSETS } from '../../constants/assets';
import { BRAND, FONTS } from '../../constants/brand';
import { getStoreById } from '../../lib/storeApi';
import { useCheckoutQuote } from '../../hooks/queries/useCheckoutQuote';
import { useCartStore } from '../../store/cartStore';
import { type CartLine } from './store/cartStore';
import { CartItemRow } from './components/CartItemRow';
import { CartItemDetailsModal } from './components/CartItemDetailsModal';
import { formatCartMoney, parseCartBilingual } from './cartFormatters';
import { useLangStore } from '../../store/languageStore';
import type { Store } from '@shared/types';
import { cartCopy, formatArticlesCount } from './cartCopy';

type CartStoreDisplay = Store;

/* ── Skeleton Loading Component ──────────────────────────── */
function CartSkeleton({ isRTL }: { isRTL: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={skStyles.container}>
      {/* Store Header Card Skeleton */}
      <View style={skStyles.storeCard}>
        <Animated.View style={[skStyles.circle, { opacity }]} />
        <View style={skStyles.storeTextCol}>
          <Animated.View style={[skStyles.barShort, { opacity }]} />
          <Animated.View style={[skStyles.barLong, { opacity }]} />
        </View>
        <Animated.View style={[skStyles.btnPill, { opacity }]} />
      </View>

      {/* Article Count Skeleton */}
      <Animated.View style={[skStyles.countBar, { opacity }]} />

      {/* Cart Items Skeletons */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={skStyles.itemCard}>
          <View style={[skStyles.itemTop, isRTL && skStyles.rowReverse]}>
            <Animated.View style={[skStyles.imgSquare, { opacity }]} />
            <View style={skStyles.itemTextCol}>
              <Animated.View style={[skStyles.barLong, { opacity }]} />
              <Animated.View style={[skStyles.barShort, { opacity }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const skStyles = StyleSheet.create({
  container: { marginTop: 8 },
  rowReverse: { flexDirection: 'row-reverse' },
  storeCard: {
    backgroundColor: BRAND.SURFACE,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: BRAND.BORDER },
  storeTextCol: { flex: 1, marginHorizontal: 12, gap: 6 },
  barShort: { height: 12, width: '40%', borderRadius: 6, backgroundColor: BRAND.BORDER },
  barLong: { height: 14, width: '70%', borderRadius: 7, backgroundColor: BRAND.BORDER },
  btnPill: { width: 90, height: 34, borderRadius: 17, backgroundColor: BRAND.BORDER },
  countBar: { height: 14, width: 80, marginHorizontal: 16, marginBottom: 12, borderRadius: 7, backgroundColor: BRAND.BORDER },
  itemCard: { backgroundColor: BRAND.SURFACE, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 14 },
  itemTop: { flexDirection: 'row', alignItems: 'center' },
  imgSquare: { width: 72, height: 72, borderRadius: 12, backgroundColor: BRAND.BORDER },
  itemTextCol: { flex: 1, marginHorizontal: 12, gap: 8 },
});

/* ── Store Header Card ───────────────────────────────────── */
function StoreHeaderCard({
  store,
  storeName,
  lang,
  isRTL,
  onGoToStore,
}: {
  store: CartStoreDisplay | null;
  storeName: string;
  lang: 'ar' | 'fr' | 'en';
  isRTL: boolean;
  onGoToStore: () => void;
}) {
  const copy = cartCopy(lang);
  const displayName = parseCartBilingual(storeName, lang, copy.unknownStore);

  return (
    <View style={shcStyles.card}>
      <View style={[shcStyles.contentRow, isRTL && shcStyles.rowReverse]}>
        {/* Store Logo / Icon (overflow hidden circle) */}
        <View style={shcStyles.logoContainer}>
          {store?.logo_url ? (
            <Image
              source={{ uri: store.logo_url }}
              style={shcStyles.logoImage}
              contentFit="cover"
            />
          ) : (
            <AppIcon name="storefront-outline" size={22} color={BRAND.TEXT2} />
          )}
        </View>

        {/* Store Information */}
        <View style={[shcStyles.textCol, isRTL && shcStyles.alignEnd]}>
          <Text style={[shcStyles.orderedFrom, isRTL && shcStyles.textRight]}>
            {copy.orderedFrom}
          </Text>
          <Text style={[shcStyles.storeName, isRTL && shcStyles.textRight]} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        {/* Go to Store Button (Min 44px height tap area) */}
        <Pressable
          style={({ pressed }) => [shcStyles.goToStoreBtn, pressed && shcStyles.pressed]}
          onPress={onGoToStore}
          accessibilityRole="button"
          accessibilityLabel={`${copy.goToStore} ${displayName}`}
        >
          <Text style={shcStyles.goToStoreText} numberOfLines={1}>
            {copy.goToStore}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const shcStyles = StyleSheet.create({
  card: {
    backgroundColor: BRAND.SURFACE,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowReverse: { flexDirection: 'row-reverse' },
  alignEnd: { alignItems: 'flex-end' },
  textRight: { textAlign: 'right' },
  pressed: { opacity: 0.8 },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textCol: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  orderedFrom: {
    fontFamily: FONTS.BODY,
    fontSize: 11.5,
    color: BRAND.TEXT3,
  },
  storeName: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.TEXT,
    marginTop: 1,
  },
  goToStoreBtn: {
    maxWidth: '38%',
    minHeight: 44,
    backgroundColor: BRAND.LIGHT,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goToStoreText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    color: BRAND.TEXT2,
  },
});

/* ── Sticky Bottom Bar ───────────────────────────────────── */
function CartBottomBar({
  totalItems,
  totalDh,
  isUpdating,
  canConfirm,
  storeClosed,
  lang,
  bottomInset,
  onConfirm,
}: {
  totalItems: number;
  totalDh?: number;
  isUpdating: boolean;
  canConfirm: boolean;
  storeClosed: boolean;
  lang: 'ar' | 'fr' | 'en';
  bottomInset: number;
  onConfirm: () => void;
}) {
  const copy = cartCopy(lang);

  // Red progress bar animation when updating
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isUpdating) {
      anim.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      anim.stopAnimation();
      anim.setValue(0);
    }
  }, [isUpdating, anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 520],
  });

  const formattedArticles = formatArticlesCount(totalItems, lang);
  const formattedSummary = totalDh !== undefined
    ? `${formattedArticles} · ${formatCartMoney(totalDh)}`
    : formattedArticles;

  return (
    <View style={[bbStyles.container, { paddingBottom: Math.max(bottomInset, 16) }]}>
      {/* Sliding Progress Bar at top of bottom bar */}
      <View style={bbStyles.track} pointerEvents="none">
        <Animated.View
          style={[
            bbStyles.bar,
            { transform: [{ translateX }], opacity: isUpdating ? 0.85 : 0 },
          ]}
        />
      </View>

      {/* Item count & calculated total summary */}
      <View style={bbStyles.summaryRow}>
        <Text style={bbStyles.summaryText}>
          {formattedSummary}
        </Text>
      </View>

      {/* Primary Action Button (Min 52px height) */}
      <Pressable
        style={({ pressed }) => [
          bbStyles.confirmBtn,
          (!canConfirm || storeClosed) && bbStyles.confirmBtnDisabled,
          pressed && canConfirm && !storeClosed && bbStyles.pressed,
        ]}
        onPress={canConfirm && !storeClosed ? onConfirm : undefined}
        disabled={!canConfirm || storeClosed}
        accessibilityRole="button"
        accessibilityLabel={`${copy.confirm} - ${formattedSummary}`}
      >
        <Text style={bbStyles.confirmText}>
          {storeClosed ? copy.storeClosed : `${copy.confirm} →`}
        </Text>
      </Pressable>
    </View>
  );
}

const bbStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BRAND.SURFACE,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND.BORDER,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  track: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 130,
    height: 3,
    backgroundColor: BRAND.RED,
    borderRadius: 99,
  },
  summaryRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 13.5,
    color: BRAND.TEXT2,
  },
  confirmBtn: {
    height: 52,
    borderRadius: 99,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: BRAND.TEXT3,
  },
  confirmText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 16,
    color: BRAND.SURFACE,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});

/* ── Main CartScreen Component ────────────────────────────── */
export function CartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ origin?: string; storeId?: string }>();
  const insets = useSafeAreaInsets();
  const { lang, isRTL } = useLangStore();

  const {
    items,
    removeItem,
    updateQuantity,
    storeName,
    getActiveCarts,
    activeStoreId,
    setActiveStoreId,
    promoCode,
    clearCart,
  } = useCartStore(useShallow((state) => ({
    items: state.items,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
    storeName: state.storeName,
    getActiveCarts: state.getActiveCarts,
    activeStoreId: state.activeStoreId,
    setActiveStoreId: state.setActiveStoreId,
    promoCode: state.promoCode,
    clearCart: state.clearCart,
  })));

  const activeCarts = getActiveCarts();
  const hasActiveItems = items.some((item) => item.quantity > 0);
  const checkoutQuote = useCheckoutQuote({
    storeId: activeStoreId,
    items,
    promoCode,
  });
  const serverQuote = checkoutQuote.data;

  const quotedItemsBySignature = React.useMemo(() => {
    const serverItems = serverQuote?.items || [];
    const index = new Map<string, typeof serverItems[number]>();
    for (const quotedItem of serverItems) {
      index.set(`${quotedItem.menu_item_id}|${quotedItem.options
        .map((option) => `${option.option_id}:${option.choice_id}`)
        .sort()
        .join('|')}`, quotedItem);
    }
    return index;
  }, [serverQuote?.items]);

  const quoteForItem = React.useCallback((item: typeof items[number]) => {
    const key = `${item.menu_item_id}|${(item.selected_options || [])
      .map((option) => `${option.option_id}:${option.choice_id}`)
      .sort()
      .join('|')}`;
    return quotedItemsBySignature.get(key);
  }, [quotedItemsBySignature]);

  const L = cartCopy(lang);

  const [activeStore, setActiveStore] = React.useState<CartStoreDisplay | null>(null);
  const [storeLoading, setStoreLoading] = React.useState(false);
  const storeClosed = Boolean(serverQuote && !serverQuote.can_checkout);
  const storeClosedLabel = lang === 'ar'
    ? serverQuote?.store_status?.label_ar || ''
    : serverQuote?.store_status?.label_fr || '';
  const canConfirm = checkoutQuote.isQuoteCurrent && Boolean(serverQuote?.can_checkout);

  const [localActiveStoreId, setLocalActiveStoreId] = React.useState(activeStoreId);
  React.useEffect(() => {
    setLocalActiveStoreId(activeStoreId);
  }, [activeStoreId]);

  React.useEffect(() => {
    if (hasActiveItems || activeCarts.length === 0) return;
    const nextCart = activeCarts[0];
    setLocalActiveStoreId(nextCart.storeId);
    setActiveStoreId(nextCart.storeId);
  }, [activeCarts, hasActiveItems, setActiveStoreId]);

  const [activeItemDetails, setActiveItemDetails] = React.useState<CartLine | null>(null);
  const activeItemQuote = activeItemDetails ? quoteForItem(activeItemDetails) : undefined;
  const closeDetails = React.useCallback(() => setActiveItemDetails(null), []);

  const scrollY = useRef(new Animated.Value(0)).current;
  const returnStoreId = params.origin === 'store' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.storeId || '')
    ? params.storeId
    : null;

  const navigateBack = React.useCallback(() => {
    if (returnStoreId) {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace({ pathname: '/(flows)/store/[id]', params: { id: returnStoreId } });
      return;
    }
    router.replace('/(tabs)');
  }, [returnStoreId, router]);

  const goToStore = React.useCallback(() => {
    if (activeStoreId) {
      router.push({ pathname: '/(flows)/store/[id]', params: { id: activeStoreId } });
    }
  }, [activeStoreId, router]);

  const editItem = React.useCallback((item: CartLine) => {
    router.push({
      pathname: '/(flows)/store/[id]',
      params: { id: activeStoreId || '', editMenuItemId: item.menu_item_id, editCartItemId: item.cart_line_id },
    });
  }, [activeStoreId, router]);

  React.useEffect(() => {
    if (!activeStoreId) return;
    let active = true;
    setStoreLoading(true);
    const task = InteractionManager.runAfterInteractions(() => {
      getStoreById(activeStoreId).then(({ data }) => {
        if (active && data) setActiveStore(data);
      }).catch(() => undefined).finally(() => {
        if (active) setStoreLoading(false);
      });
    });
    return () => { active = false; task.cancel(); };
  }, [activeStoreId]);

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const fixedHeaderStyle = React.useMemo(() => [
    styles.fixedHeader,
    { height: insets.top + 56, paddingTop: insets.top },
    isRTL && styles.rowReverse,
  ], [insets.top, isRTL]);

  const fixedHeaderBackgroundStyle = React.useMemo(() => [
    styles.fixedHeaderBg,
    { opacity: headerBgOpacity },
  ], [headerBgOpacity]);

  const emptyBoxStyle = React.useMemo(() => [
    styles.emptyBox,
    { paddingTop: insets.top + 56 },
  ], [insets.top]);

  const scrollContentStyle = React.useMemo(() => ({
    paddingTop: insets.top + 64,
    paddingBottom: insets.bottom + 110,
  }), [insets.bottom, insets.top]);

  const totalItemsCount = React.useMemo(() => (
    items.reduce((sum, item) => sum + item.quantity, 0)
  ), [items]);

  // Confirmation dialog before clearing cart
  const handleClearCart = React.useCallback(() => {
    if (!activeStoreId) return;
    Alert.alert(
      L.clearCartTitle,
      L.clearCartConfirmMessage,
      [
        { text: L.clearCartCancelLabel, style: 'cancel' },
        {
          text: L.clearCartConfirmLabel,
          style: 'destructive',
          onPress: () => {
            clearCart(activeStoreId);
          },
        },
      ]
    );
  }, [L.clearCartCancelLabel, L.clearCartConfirmLabel, L.clearCartConfirmMessage, L.clearCartTitle, activeStoreId, clearCart]);

  const renderHeader = () => (
    <Animated.View pointerEvents="box-none" style={fixedHeaderStyle}>
      <Animated.View style={fixedHeaderBackgroundStyle} />

      {/* Back button (Min 44x44) */}
      <Pressable
        style={styles.fixedHeaderBtn}
        onPress={navigateBack}
        accessibilityRole="button"
        accessibilityLabel={lang === 'ar' ? 'رجوع' : 'Back'}
      >
        <AppIcon name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color={BRAND.TEXT} />
      </Pressable>

      <View style={styles.fixedHeaderCenter}>
        <Text style={styles.fixedHeaderTitle} numberOfLines={1}>
          {L.title}
        </Text>
      </View>

      {/* Clear Cart Trash Icon (Min 44x44) */}
      {hasActiveItems && activeStoreId ? (
        <Pressable
          style={styles.clearCartHeaderBtn}
          onPress={handleClearCart}
          accessibilityRole="button"
          accessibilityLabel={L.clearCartTitle}
        >
          <AppIcon name="trash-outline" size={20} color={BRAND.TEXT2} />
        </Pressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </Animated.View>
  );

  if (!hasActiveItems) {
    return (
      <View style={styles.root}>
        {renderHeader()}
        <View style={emptyBoxStyle}>
          <Image
            source={ASSETS.illustrations.jaheez_grocery_large}
            style={styles.emptyIllustration}
            contentFit="contain"
            accessibilityLabel={L.emptyTitle}
          />
          <View style={styles.emptyAnimatedContent}>
            <Text style={styles.emptyTitle}>{L.emptyTitle}</Text>
            <Text style={styles.emptySub}>{L.emptySub}</Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.replace('/(tabs)')}
              accessibilityRole="button"
              accessibilityLabel={L.startShopping}
            >
              <Text style={styles.emptyBtnText}>{L.startShopping}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const isInitialLoading = storeLoading && !activeStore;

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
        contentContainerStyle={scrollContentStyle}
      >
        {isInitialLoading ? (
          <CartSkeleton isRTL={isRTL} />
        ) : (
          <>
            {/* Step 3: Multi-cart selector tabs (only when > 1 active cart) */}
            {activeCarts.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cartSelector}>
                {activeCarts.map((cart, index) => {
                  const isActive = cart.storeId === localActiveStoreId;
                  return (
                    <View
                      key={`${cart.storeId || 'cart'}-${index}`}
                      style={[styles.selectorPill, isActive && styles.selectorPillActive]}
                    >
                      <Pressable
                        style={styles.selectorPillPressable}
                        onPress={() => {
                          setLocalActiveStoreId(cart.storeId);
                          setActiveStoreId(cart.storeId);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={parseCartBilingual(cart.storeName, lang, L.unknownStore)}
                        accessibilityState={{ selected: isActive }}
                      >
                        <Text style={[styles.selectorText, isActive && styles.selectorTextActive]} numberOfLines={1}>
                          {parseCartBilingual(cart.storeName, lang, L.unknownStore)}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* Step 4: Store Header Card */}
            {storeName ? (
              <StoreHeaderCard
                store={activeStore}
                storeName={storeName}
                lang={lang}
                isRTL={isRTL}
                onGoToStore={goToStore}
              />
            ) : null}

            {/* Step 5: Article Count Label (Section 7) */}
            <View style={styles.articleCountRow}>
              <Text style={[styles.articleCountText, isRTL && styles.textRight]}>
                {formatArticlesCount(totalItemsCount, lang)}
              </Text>
            </View>

            {/* Step 6: Cart Item Cards List */}
            <View key={activeStoreId}>
              {items.map((item) => (
                <CartItemRow
                  key={item.cart_line_id}
                  item={item}
                  unitPrice={quoteForItem(item)?.unit_price_dh}
                  lang={lang}
                  isRTL={isRTL}
                  onDetails={setActiveItemDetails}
                  onEdit={editItem}
                  onRemove={removeItem}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </View>

            {/* Warning banner if store closed */}
            {storeClosed ? (
              <View style={[styles.warning, isRTL && styles.rowReverse]}>
                <AppIcon name="warning-outline" size={18} color={BRAND.WARN} />
                <Text style={[styles.warningText, isRTL && styles.textRight]}>
                  {L.closedNow} {storeClosedLabel}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </Animated.ScrollView>

      {/* Step 8: Sticky Bottom Navigation Bar */}
      <CartBottomBar
        totalItems={totalItemsCount}
        totalDh={serverQuote?.total_dh}
        isUpdating={checkoutQuote.isUpdating}
        canConfirm={canConfirm}
        storeClosed={storeClosed}
        lang={lang}
        bottomInset={insets.bottom}
        onConfirm={() => router.push('/(flows)/checkout')}
      />

      {/* Supplement Details Modal */}
      <CartItemDetailsModal
        item={activeItemDetails}
        quote={activeItemQuote}
        quoteLoading={checkoutQuote.isFetching && !serverQuote}
        lang={lang}
        isRTL={isRTL}
        bottomInset={insets.bottom}
        onClose={closeDetails}
      />
    </View>
  );
}

export default CartScreen;

const styles = StyleSheet.create({
  headerSpacer: { width: 44 },
  emptyAnimatedContent: { alignItems: 'center', width: '100%' },
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  root: {
    flex: 1,
    backgroundColor: BRAND.BG,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fixedHeaderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.BORDER,
  },
  fixedHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  clearCartHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 18,
    color: BRAND.TEXT,
  },
  cartSelector: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 12,
  },
  selectorPill: {
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: BRAND.LIGHT,
  },
  selectorPillActive: {
    backgroundColor: BRAND.RED,
  },
  selectorPillPressable: {
    paddingHorizontal: 16,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 13,
    color: BRAND.TEXT2,
  },
  selectorTextActive: {
    color: BRAND.SURFACE,
  },
  articleCountRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  articleCountText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.TEXT2,
  },
  warning: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: BRAND.YELLOW_LIGHT,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    flexDirection: 'row',
  },
  warningText: {
    flex: 1,
    fontFamily: FONTS.BODY,
    fontSize: 12,
    color: BRAND.WARN,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: BRAND.SURFACE,
  },
  emptyIllustration: {
    width: 190,
    height: 170,
  },
  emptyTitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 18,
    color: BRAND.TEXT,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT2,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 99,
    paddingHorizontal: 24,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14,
    color: BRAND.SURFACE,
  },
});

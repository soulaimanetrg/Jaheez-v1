import React, { useRef } from 'react';
import { MotiView } from 'moti';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Alert,
  Modal,
  UIManager,
  InteractionManager,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { ASSETS } from '../../constants/assets';
import { BRAND, FONTS, SHADOW_SM } from '../../constants/brand';
import { backArrow, dirItems, dirRow, dirText } from '../../lib/direction';
import { getStoreById } from '../../lib/storeApi';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useLangStore } from '../../store/languageStore';
import { useCheckoutQuote } from '../../hooks/queries/useCheckoutQuote';

const SIDE = 10;
const PRODUCT_SIDE = 4;

function money(value: unknown) {
  const amount = Number(value || 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${safe.toFixed(2).replace('.', ',')} DH`;
}

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

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lang, isRTL } = useLangStore();
  const user = useAuthStore(s => s.user);
  
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    storeName,
    getActiveCarts,
    activeStoreId,
    setActiveStoreId,
    promoCode,
    setPromo,
    clearPromo,
    clearCart,
  } = useCartStore();

  const activeCarts = getActiveCarts();
  const quoteQuery = useCheckoutQuote({
    storeId: activeStoreId,
    items,
    promoCode,
    riderTip: 0,
  });
  const quote = quoteQuery.data;
  const quoteError = quoteQuery.error instanceof Error ? quoteQuery.error.message : '';
  const storeClosed = quote ? !quote.can_checkout : false;
  const storeClosedLabel = quote ? (lang === 'ar' ? quote.store_status.label_ar : quote.store_status.label_fr) : '';
  const checkoutBlocked = quoteQuery.isLoading || Boolean(quoteError) || storeClosed;

  const L = {
    title: lang === 'ar' ? 'السلة' : lang === 'en' ? 'Cart' : 'Panier',
    emptyTitle: lang === 'ar' ? 'السلة فارغة' : lang === 'en' ? 'Your cart is empty' : 'Votre panier est vide',
    emptySub: lang === 'ar' ? 'اختر منتجاتك من متجر قريب وستظهر هنا.' : lang === 'en' ? 'Choose items from a nearby store and they will appear here.' : 'Choisissez des articles dans un magasin proche.',
    startShopping: lang === 'ar' ? 'ابدأ التسوق' : lang === 'en' ? 'Start shopping' : 'Commencer',
    unknownStore: lang === 'ar' ? 'المتجر' : lang === 'en' ? 'Store' : 'Magasin',
    minutes: lang === 'ar' ? 'دقيقة' : 'min',
    promo: lang === 'ar' ? 'كود الخصم' : lang === 'en' ? 'Promo code' : 'Code promo',
    add: lang === 'ar' ? 'إضافة' : lang === 'en' ? 'Add' : 'Ajouter',
    cancel: lang === 'ar' ? 'إلغاء' : lang === 'en' ? 'Cancel' : 'Annuler',
    instructions: lang === 'ar' ? 'تعليمات للمندوب' : lang === 'en' ? 'Instructions for the courier' : 'Instructions pour le livreur',
    instructionsPlaceholder: lang === 'ar' ? 'ملاحظة للمندوب...' : lang === 'en' ? 'Note for the courier...' : 'Remarque pour le livreur...',
    products: lang === 'ar' ? 'المجموع الفرعي' : lang === 'en' ? 'Sub-total' : 'Sous-total',
    deliveryFee: lang === 'ar' ? 'رسوم التوصيل' : lang === 'en' ? 'Delivery fee' : 'Frais de livraison',
    serviceFee: lang === 'ar' ? 'رسوم الخدمة' : lang === 'en' ? 'Service fee' : 'Frais de service',
    discount: lang === 'ar' ? 'الخصم' : lang === 'en' ? 'Discount' : 'Réduction',
    total: lang === 'ar' ? 'المجموع' : 'Total',
    confirm: lang === 'ar' ? 'تأكيد السلة' : lang === 'en' ? 'Validate my cart' : 'Valider mon panier',
    storeClosed: lang === 'ar' ? 'المتجر مغلق' : lang === 'en' ? 'Store closed' : 'Magasin fermé',
    closedNow: lang === 'ar' ? 'لا يمكن إتمام الطلب حاليا.' : lang === 'en' ? 'The order cannot be completed right now.' : 'La commande ne peut pas être finalisée maintenant.',
  };

  const [promoCodeInput, setPromoCodeInput] = React.useState('');
  const [showPromoInput, setShowPromoInput] = React.useState(false);
  const [promoError, setPromoError] = React.useState('');
  const [validatingPromo, setValidatingPromo] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [activeStore, setActiveStore] = React.useState<any>(null);

  const [localActiveStoreId, setLocalActiveStoreId] = React.useState(activeStoreId);
  React.useEffect(() => {
    setLocalActiveStoreId(activeStoreId);
  }, [activeStoreId]);

  const [activeItemDetails, setActiveItemDetails] = React.useState<any | null>(null);
  const sheetAnim = React.useRef(new Animated.Value(0)).current;
  const deliveryWindow = activeStore?.delivery_time_min && activeStore?.delivery_time_max
    ? ` · ${activeStore.delivery_time_min}-${activeStore.delivery_time_max} ${L.minutes}`
    : '';

  React.useEffect(() => {
    if (activeItemDetails) {
      Animated.spring(sheetAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      sheetAnim.setValue(0);
    }
  }, [activeItemDetails]);

  const closeDetails = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActiveItemDetails(null);
    });
  };

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

  const handleApplyPromo = async () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
      setPromoError(lang === 'ar' ? 'أدخل كود الخصم' : 'Entrez le code promo');
      return;
    }
    setValidatingPromo(true);
    setPromoError('');
    try {
      setPromo(code, 0);
      setPromoCodeInput('');
      setShowPromoInput(false);
    } catch {
      setPromoError(lang === 'ar' ? 'تعذر التحقق من الكود' : 'Impossible de valider le code');
    } finally {
      setValidatingPromo(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!activeStoreId) return;
      const task = InteractionManager.runAfterInteractions(() => {
        getStoreById(activeStoreId).then(({ data }) => {
          if (data) setActiveStore(data);
        }).catch(() => {});
      });
      return () => task.cancel();
    }, [activeStoreId, lang])
  );

  const renderHeader = () => (
    <Animated.View
      pointerEvents="box-none"
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

      <Pressable
        style={styles.fixedHeaderBtn}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
      >
        <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color="#111827" />
      </Pressable>

      <View style={styles.fixedHeaderCenter}>
        <Text
          style={styles.fixedHeaderTitle}
          numberOfLines={1}
        >
          {L.title}
        </Text>
      </View>

      <View style={{ width: 40 }} />
    </Animated.View>
  );

  if (activeCarts.length === 0) {
    return (
      <View style={styles.root}>
        {renderHeader()}
        <View style={[styles.emptyBox, { paddingTop: insets.top + 60 }]}>
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing' as any, duration: 250 }}
          >
            <Image source={ASSETS.illustrations.jaheez_grocery_large} style={styles.emptyIllustration} contentFit="contain" />
          </MotiView>
          
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing' as any, duration: 250, delay: 100 }}
            style={{ alignItems: 'center', width: '100%' }}
          >
            <Text style={styles.emptyTitle}>{L.emptyTitle}</Text>
            <Text style={styles.emptySub}>{L.emptySub}</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.emptyBtnText}>{L.startShopping}</Text>
            </Pressable>
          </MotiView>
        </View>
      </View>
    );
  }

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
        contentContainerStyle={{ paddingTop: insets.top + 84, paddingBottom: insets.bottom + 120 }}
      >
        {storeName ? (
          <>
            <View style={[styles.storeSubtitleRow, { flexDirection: dirRow(isRTL) }]}>
              <Text style={[styles.pageSubtitle, { textAlign: dirText(isRTL), flex: 1 }]}>
                {parseBilingual(storeName, lang, L.unknownStore)}{deliveryWindow}
              </Text>
              {activeStoreId ? (
                <Pressable
                  style={styles.clearStoreBtn}
                  onPress={() => {
                    Alert.alert(
                      lang === 'ar' ? 'مسح السلة' : lang === 'en' ? 'Clear Cart' : 'Vider le panier',
                      lang === 'ar' ? 'هل تريد بالتأكيد إزالة جميع العناصر من السلة؟' : lang === 'en' ? 'Are you sure you want to remove all items from your cart?' : 'Voulez-vous vraiment vider votre panier ?',
                      [
                        { text: lang === 'ar' ? 'إلغاء' : 'Annuler', style: 'cancel' },
                        {
                          text: lang === 'ar' ? 'مسح' : 'Vider',
                          style: 'destructive',
                          onPress: () => {
                            if (activeStoreId) clearCart(activeStoreId);
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#000000" />
                </Pressable>
              ) : null}
            </View>

            {activeStore && activeStore.promo_type && activeStore.promo_type !== 'none' && (
              <View style={[
                styles.cartPromoBanner,
                { flexDirection: dirRow(isRTL) }
              ]}>
                <Ionicons name="pricetag" size={14} color="#FFFFFF" style={isRTL ? { marginLeft: 6 } : { marginRight: 6 }} />
                <Text style={styles.cartPromoText}>
                  {activeStore.promo_type === 'store_percentage'
                    ? (lang === 'ar' ? `تخفيض -${activeStore.reduction_percentage}% على كل المحل` : (lang === 'fr' ? `-${activeStore.reduction_percentage}% SUR TOUT LE MAGASIN` : `-${activeStore.reduction_percentage}% WHOLE STORE`))
                    : activeStore.promo_type === 'store_fixed'
                    ? (lang === 'ar' ? `تخفيض -${activeStore.reduction_percentage} DH على كل المحل` : (lang === 'fr' ? `-${activeStore.reduction_percentage} DH TOUT LE MAGASIN` : `-${activeStore.reduction_percentage} DH WHOLE STORE`))
                    : (lang === 'ar' ? 'تخفيضات على بعض المواد' : (lang === 'fr' ? 'CERTAINS ARTICLES EN PROMO' : 'SOME ITEMS ON PROMO'))}
                </Text>
              </View>
            )}
          </>
        ) : null}

        {activeCarts.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cartSelector}>
            {activeCarts.map((cart, index) => {
              const isActive = cart.storeId === localActiveStoreId;
              return (
                <MotiView
                  key={`${cart.storeId || 'cart'}-${index}`}
                  animate={{
                    backgroundColor: isActive ? BRAND.RED : '#F3F4F6',
                    scale: isActive ? 1.05 : 1,
                  }}
                  transition={{ type: 'timing' as any, duration: 180 }}
                  style={styles.selectorPill}
                >
                  <Pressable
                    style={styles.selectorPillPressable}
                    onPress={() => {
                      setLocalActiveStoreId(cart.storeId);
                      setTimeout(() => {
                        setActiveStoreId(cart.storeId);
                      }, 50);
                    }}
                  >
                    <Text style={[styles.selectorText, isActive && styles.selectorTextActive]} numberOfLines={1}>
                      {parseBilingual(cart.storeName, lang, L.unknownStore)}
                    </Text>
                  </Pressable>
                </MotiView>
              );
            })}
          </ScrollView>
        ) : null}

        <MotiView
          key={activeStoreId}
          from={{ opacity: 0, translateY: 6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing' as any, duration: 180 }}
          style={styles.itemsBlock}
        >
          {items.map((item, index) => (
            <View
              key={`${item.id || item.menu_item_id || 'item'}`}
              style={[styles.itemCard, index > 0 && styles.itemCardGap, { flexDirection: dirRow(isRTL) }]}
            >
              <Pressable
                style={[styles.itemCardContent, { flex: 1, flexDirection: dirRow(isRTL) }]}
                onPress={() => setActiveItemDetails(item)}
              >
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} contentFit="cover" />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Ionicons name="image" size={24} color={BRAND.TEXT3} />
                  </View>
                )}
                <View style={[styles.itemInfo, { alignItems: dirItems(isRTL) }]}>
                  <Text style={[styles.itemName, { textAlign: dirText(isRTL) }]} numberOfLines={2}>
                    {lang === 'ar'
                      ? parseBilingual(item.name_ar || item.name, 'ar')
                      : parseBilingual(item.name || item.name_ar, lang)}
                  </Text>
                  {item.selected_options && item.selected_options.length > 0 && (
                    <Text style={[styles.itemOptionsSummary, { textAlign: dirText(isRTL) }]} numberOfLines={1}>
                      {item.selected_options.map((o: any) => o.choice_name || o.name || '').filter(Boolean).join(', ')}
                    </Text>
                  )}
                  <Text style={[styles.itemPrice, { marginTop: 4 }]}>{money(item.unit_price)}</Text>
                </View>
              </Pressable>


              </Pressable>

              {/* Actions Column on the right */}
              <View style={styles.actionsContainerRight}>
                {/* Stepper */}
                <View style={[styles.qtyBox, { flexDirection: dirRow(isRTL) }]}>
                  <Pressable 
                    style={styles.qtyBtn} 
                    onPress={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : null}
                  >
                    <Ionicons name="remove" size={20} color={item.quantity > 1 ? BRAND.TEXT : BRAND.TEXT3} />
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Ionicons name="add" size={20} color={BRAND.RED} />
                  </Pressable>
                </View>
                
                {/* Action Buttons: Edit (Pencil) and Delete (Trash) */}
                <View style={[styles.actionButtonsRow, { flexDirection: dirRow(isRTL) }]}>
                  <Pressable
                    style={styles.actionBtnEdit}
                    onPress={() => router.push({
                      pathname: '/(flows)/store/[id]',
                      params: { id: activeStoreId || '', editMenuItemId: item.menu_item_id || '', editCartItemId: item.id || '' }
                    })}
                  >
                    <Ionicons name="create-outline" size={17} color={BRAND.YELLOW_DARK} />
                  </Pressable>
                  
                  <Pressable
                    style={styles.actionBtnDelete}
                    onPress={() => removeItem(item.id)}
                  >
                    <Ionicons name="trash-outline" size={17} color={BRAND.RED} />
                  </Pressable>
                </View>
              </View>
            </View>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing' as any, duration: 250, delay: 100 }}
          style={styles.softCard}
          {promoCode ? (
            <View style={[styles.lineRow, { flexDirection: dirRow(isRTL) }]}>
              <View style={{ flex: 1, alignItems: dirItems(isRTL) }}>
                <Text style={styles.lineLabel}>{L.promo}</Text>
                <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.GREEN, marginTop: 2 }}>{promoCode} (-{money(quote?.discount_dh)})</Text>
              </View>
              <Pressable onPress={() => { clearPromo(); setPromoCodeInput(''); setPromoError(''); }}>
                <Text style={styles.addText}>{L.cancel}</Text>
              </Pressable>
            </View>
          ) : showPromoInput ? (
            <View style={styles.promoInputBlock}>
              <View style={[styles.lineRow, { flexDirection: dirRow(isRTL) }]}>
                <TextInput
                  value={promoCodeInput}
                  onChangeText={(value) => { setPromoCodeInput(value.toUpperCase()); setPromoError(''); }}
                  placeholder={L.promo}
                  placeholderTextColor="#A1A1AA"
                  autoCapitalize="characters"
                  style={[styles.promoInput, { textAlign: dirText(isRTL) }]}
                />
                <Pressable style={styles.applyBtn} onPress={handleApplyPromo} disabled={validatingPromo}>
                  {validatingPromo ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.applyBtnText}>{L.add}</Text>}
                </Pressable>
              </View>
              {promoError ? <Text style={[styles.errorText, { textAlign: dirText(isRTL) }]}>{promoError}</Text> : null}
            </View>
          ) : (
            <View style={[styles.lineRow, { flexDirection: dirRow(isRTL) }]}>
              <Text style={styles.lineLabel}>{L.promo}</Text>
              <Pressable onPress={() => setShowPromoInput(true)}>
                <Text style={styles.addText}>{L.add}</Text>
              </Pressable>
            </View>
          )}
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing' as any, duration: 250, delay: 100 }}
          style={styles.softCard}
        >
          <Text style={[styles.sectionTitle, { textAlign: dirText(isRTL) }]}>{L.instructions}</Text>
          <View style={[styles.inputShell, { flexDirection: dirRow(isRTL) }]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={L.instructionsPlaceholder}
              placeholderTextColor="#A1A1AA"
              style={[styles.noteInput, { textAlign: dirText(isRTL) }]}
            />
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color="#9CA3AF" />
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing' as any, duration: 250, delay: 100 }}
          style={styles.totalCard}
        >
          <TotalRow label={L.products} value={money(quote?.subtotal_dh)} isRTL={isRTL} />
          <TotalRow label={L.deliveryFee} value={money(quote?.delivery_fee_dh)} isRTL={isRTL} />
          <TotalRow label={L.serviceFee} value={money(quote?.service_fee_dh)} isRTL={isRTL} />
          {(quote?.discount_dh || 0) > 0 ? (
            <TotalRow label={L.discount} value={`-${money(quote?.discount_dh)}`} isRTL={isRTL} valueStyle={{ color: BRAND.GREEN }} />
          ) : null}
          <View style={styles.totalGap} />
          <TotalRow label={L.total} value={money(quote?.total_dh)} isRTL={isRTL} total />
        </MotiView>

        {storeClosed ? (
          <View style={[styles.warning, { flexDirection: dirRow(isRTL) }]}>
            <Ionicons name="warning-outline" size={18} color="#B45309" />
            <Text style={[styles.warningText, { textAlign: dirText(isRTL) }]}>{L.closedNow} {storeClosedLabel}</Text>
          </View>
        ) : null}

          <View style={[styles.warning, { flexDirection: dirRow(isRTL) }]}>
            <Ionicons name="warning-outline" size={18} color="#B45309" />
            <Text style={[styles.warningText, { textAlign: dirText(isRTL) }]}>{L.closedNow} {storeClosedLabel}</Text>
          </View>
        ) : null}

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing' as any, duration: 250, delay: 100 }}
        >
          <Pressable
            style={({ pressed }) => [styles.confirmBtn, checkoutBlocked && styles.confirmBtnDisabled, pressed && !checkoutBlocked && styles.pressed]}
            onPress={checkoutBlocked ? undefined : () => router.push({ pathname: '/(flows)/checkout', params: { notes } })}
            disabled={checkoutBlocked}
          >
            <Text style={styles.confirmText}>{storeClosed ? L.storeClosed : L.confirm}</Text>
          </Pressable>
        </MotiView>
      </Animated.ScrollView>

      <Modal
        visible={activeItemDetails !== null}
          
          <Animated.View
            style={[
              styles.sheetDetailsCard,
              {
                paddingBottom: insets.bottom + 20,
                transform: [
                  {
                    translateY: sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.sheetHandle} />
            
            <View style={[styles.sheetDetailHeader, { flexDirection: dirRow(isRTL) }]}>
              <Text style={styles.sheetDetailTitle}>
                {lang === 'ar' ? 'تفاصيل المنتج' : lang === 'en' ? 'Product Details' : 'Détails du produit'}
              </Text>
              <Pressable style={styles.sheetDetailClose} onPress={closeDetails}>
                <Ionicons name="close" size={22} color="#4B5563" />
              </Pressable>
            </View>

            {activeItemDetails && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
                <View style={[styles.sheetRowMain, { flexDirection: dirRow(isRTL) }]}>
                  {activeItemDetails.image_url ? (
                    <Image source={{ uri: activeItemDetails.image_url }} style={styles.sheetDetailImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.sheetDetailImage, styles.sheetDetailImagePlaceholder]}>
                      <Ionicons name="image" size={28} color={BRAND.TEXT3} />
                    </View>
                  )}
                  <View style={[styles.sheetDetailMeta, { alignItems: dirItems(isRTL) }]}>
                    <Text style={[styles.sheetDetailName, { textAlign: dirText(isRTL) }]}>
                      {lang === 'ar'
                        ? parseBilingual(activeItemDetails.name_ar || activeItemDetails.name, 'ar')
                        : parseBilingual(activeItemDetails.name || activeItemDetails.name_ar, lang)}
                    </Text>
                    <Text style={styles.sheetDetailPrice}>{money(activeItemDetails.unit_price)}</Text>
                  </View>
                </View>

                {activeItemDetails.selected_options && activeItemDetails.selected_options.length > 0 ? (
                  <View style={styles.supplementsBlock}>
                    <Text style={[styles.supplementsTitle, { textAlign: dirText(isRTL) }]}>
                      {lang === 'ar' ? 'الإضافات والمكونات' : lang === 'en' ? 'Supplements & Options' : 'Suppléments & Options'}
                    </Text>
// MISSING_LINE_601
// MISSING_LINE_602
// MISSING_LINE_603
// MISSING_LINE_604
// MISSING_LINE_605
// MISSING_LINE_606
// MISSING_LINE_607
// MISSING_LINE_608
// MISSING_LINE_609
// MISSING_LINE_610
// MISSING_LINE_611
// MISSING_LINE_612
// MISSING_LINE_613
// MISSING_LINE_614
// MISSING_LINE_615
// MISSING_LINE_616
// MISSING_LINE_617
// MISSING_LINE_618
// MISSING_LINE_619
// MISSING_LINE_620
// MISSING_LINE_621
// MISSING_LINE_622
// MISSING_LINE_623
// MISSING_LINE_624
// MISSING_LINE_625
// MISSING_LINE_626
// MISSING_LINE_627
// MISSING_LINE_628
// MISSING_LINE_629
// MISSING_LINE_630
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  fixedHeaderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fixedHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
  },
  bigPageTitle: {
// MISSING_LINE_671
// MISSING_LINE_672
// MISSING_LINE_673
// MISSING_LINE_674
// MISSING_LINE_675
// MISSING_LINE_676
// MISSING_LINE_677
// MISSING_LINE_678
// MISSING_LINE_679
// MISSING_LINE_680
// MISSING_LINE_681
// MISSING_LINE_682
// MISSING_LINE_683
// MISSING_LINE_684
// MISSING_LINE_685
// MISSING_LINE_686
// MISSING_LINE_687
// MISSING_LINE_688
// MISSING_LINE_689
// MISSING_LINE_690
// MISSING_LINE_691
// MISSING_LINE_692
// MISSING_LINE_693
// MISSING_LINE_694
// MISSING_LINE_695
// MISSING_LINE_696
// MISSING_LINE_697
// MISSING_LINE_698
// MISSING_LINE_699
// MISSING_LINE_700
// MISSING_LINE_701
// MISSING_LINE_702
// MISSING_LINE_703
// MISSING_LINE_704
// MISSING_LINE_705
// MISSING_LINE_706
// MISSING_LINE_707
// MISSING_LINE_708
// MISSING_LINE_709
// MISSING_LINE_710
// MISSING_LINE_711
// MISSING_LINE_712
// MISSING_LINE_713
// MISSING_LINE_714
  selectorText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 13,
    color: '#6B7280',
  },
  selectorTextActive: {
    color: '#FFFFFF',
  },
  itemsBlock: {
    marginHorizontal: PRODUCT_SIDE,
    fontFamily: FONTS.MEDIUM,
    fontSize: 13,
    color: '#6B7280',
  },
  selectorTextActive: {
    color: '#FFFFFF',
  },
  itemsBlock: {
    marginHorizontal: PRODUCT_SIDE,
    paddingHorizontal: 8,
  },
  itemCard: {
    minHeight: 120,
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E6DF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemCardGap: {
    marginTop: 14,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F5F4F0',
  },
  itemInfo: {
    flex: 1,
    minHeight: 76,
    justifyContent: 'space-between',
  },
  itemName: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 19,
  },
  itemPrice: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14.5,
    color: '#1C1C1E',
  },
  qtyBox: {
    width: 104,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E6DF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  qtyText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: '#1C1C1E',
    minWidth: 14,
    textAlign: 'center',
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  actionButtonsRow: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  actionButtonsRow: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionBtnEdit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFBEE',
    borderWidth: 1,
    borderColor: '#F5CE2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDEAEA',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  softCard: {
    marginHorizontal: SIDE,
    marginTop: 17,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontFamily: FONTS.SEMIBOLD,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  noteInput: {
    flex: 1,
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: '#111827',
    height: '100%',
  },
  lineRow: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  lineLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13.5,
    color: '#111827',
  },
  addText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12.5,
    color: BRAND.RED,
  },
  promoInputBlock: {
    gap: 8,
  },
  promoInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14,
    color: '#111827',
  },
  applyBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: '#FFFFFF',
  },
  errorText: {
    fontFamily: FONTS.BODY,
    fontSize: 12,
    color: BRAND.RED,
  },
  totalCard: {
  },
  errorText: {
    fontFamily: FONTS.BODY,
    fontSize: 12,
    color: BRAND.RED,
  },
  totalCard: {
    marginHorizontal: SIDE,
    marginTop: 17,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  totalRow: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
    fontSize: 13.5,
    color: '#111827',
  },
  totalGap: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  totalLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.RED,
  },
  totalValue: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 16,
    color: '#111827',
  },
  warning: {
    marginHorizontal: SIDE,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontFamily: FONTS.BODY,
    fontSize: 11.5,
    color: '#92400E',
  },
  confirmBtn: {
    marginHorizontal: SIDE,
    marginTop: 14,
    height: 52,
    borderRadius: 12,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15.5,
    color: '#FFFFFF',
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  emptyIllustration: {
    width: 190,
    height: 170,
  },
  emptyTitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 8,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 22,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: '#FFFFFF',
  },
  itemCardContent: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  sheetOverlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetOverlayBg: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetDetailHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sheetDetailTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111827',
  },
  sheetDetailClose: {
    padding: 4,
  },
  sheetScroll: {
    paddingBottom: 16,
  },
  sheetRowMain: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  sheetDetailImage: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  sheetDetailImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDetailMeta: {
    flex: 1,
    gap: 4,
  },
  sheetDetailName: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 16,
    color: '#111827',
  },
  sheetDetailPrice: {
  },
  sheetDetailName: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 16,
    color: '#111827',
  },
  sheetDetailPrice: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.RED,
  },
  supplementsBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  supplementsTitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13.5,
    color: '#374151',
    marginBottom: 12,
  },
  supplementRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  supplementGroupLabel: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: '#9CA3AF',
  },
  supplementChoiceLabel: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 13,
    color: '#111827',
    marginTop: 2,
  },
  supplementPrice: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12.5,
    color: BRAND.GREEN,
  },
  itemOptionsSummary: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  noSupplementsBox: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
    marginTop: 16,
  },
  sheetDetailDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
  },
  sheetDetailTotalRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetDetailTotalLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14.5,
    color: '#374151',
  },
  sheetDetailTotalValue: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 18,
    color: '#111827',
  },
  cartPromoBanner: {
    backgroundColor: BRAND.PROMO_BG,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cartPromoText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});

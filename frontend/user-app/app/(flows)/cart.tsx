import React, { useRef } from 'react';
import { MotiView } from 'moti';
import {
  ActivityIndicator,
  Pressable,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Alert,
  Modal,
  InteractionManager,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { ASSETS } from '../../constants/assets';
import { BRAND, FONTS } from '../../constants/brand';
import { HapticTab } from '../../components/ui/HapticTab';
import { dirItems, dirRow, dirText } from '../../lib/direction';
import { previewCheckout } from '../../lib/orderApi';
import { getStoreById } from '../../lib/storeApi';
import { isStoreCurrentlyOpen } from '../../lib/storeStatus';
import { toCheckoutItems, useCheckoutQuote } from '../../hooks/queries/useCheckoutQuote';
import { useCartStore } from '../../store/cartStore';
import { useLangStore } from '../../store/languageStore';
import { useAuthStore } from '../../store/authStore';
import { RequireAuthSheet } from '../../components/auth/RequireAuthSheet';

const SIDE = 16;
const PRODUCT_SIDE = 8;

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

function itemImageSource(uri?: string | null) {
  return uri ? { uri } : ASSETS.illustrations.jaheez_grocery_large;
}

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lang, isRTL } = useLangStore();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [authSheetVisible, setAuthSheetVisible] = React.useState(false);
  
  const {
    items,
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
  const hasActiveItems = items.some((item) => item.quantity > 0);
  const checkoutQuote = useCheckoutQuote({
    storeId: activeStoreId,
    items,
    promoCode,
  });
  const serverQuote = checkoutQuote.data;
  const quoteLoading = checkoutQuote.isFetching && !serverQuote;
  const quoteUnavailable = !quoteLoading && (!serverQuote || checkoutQuote.isError);
  const quoteErrorText = checkoutQuote.error instanceof Error ? checkoutQuote.error.message : '';
  const serverItems = serverQuote?.items || [];
  const quoteForItem = React.useCallback((item: typeof items[number]) => {
    const selectedSignature = (item.selected_options || [])
      .map((option) => `${option.option_id || ''}:${option.choice_id || ''}`)
      .sort()
      .join('|');
    return serverItems.find((quotedItem) => {
      if (quotedItem.menu_item_id !== item.menu_item_id) return false;
      const quotedSignature = quotedItem.options
        .map((option) => `${option.option_id}:${option.choice_id}`)
        .sort()
        .join('|');
      return quotedSignature === selectedSignature;
    });
  }, [serverItems]);

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

  const previewLabels = {
    loading: lang === 'ar' ? 'جاري تحديث الأسعار...' : lang === 'en' ? 'Updating prices...' : 'Mise a jour des prix...',
    unavailable: lang === 'ar' ? 'تعذر تحديث الأسعار' : lang === 'en' ? 'Could not update prices' : 'Prix indisponibles',
    retry: lang === 'ar' ? 'إعادة المحاولة' : lang === 'en' ? 'Retry' : 'Reessayer',
  };

  const [promoCodeInput, setPromoCodeInput] = React.useState('');
  const [showPromoInput, setShowPromoInput] = React.useState(false);
  const [promoError, setPromoError] = React.useState('');
  const [validatingPromo, setValidatingPromo] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [storeClosed, setStoreClosed] = React.useState(false);
  const [storeClosedLabel, setStoreClosedLabel] = React.useState('');
  const [activeStore, setActiveStore] = React.useState<any>(null);
  const canConfirm = !storeClosed && Boolean(serverQuote?.can_checkout);
  const activeDiscount = serverQuote?.discount_dh ?? 0;
  const storeEtaLabel = activeStore?.delivery_time_min && activeStore?.delivery_time_max
    ? `${activeStore.delivery_time_min}-${activeStore.delivery_time_max} ${L.minutes}`
    : null;

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

  React.useEffect(() => {
    if (!promoCode || !serverQuote?.promo) return;
    if (!serverQuote.promo.is_valid) {
      clearPromo();
      setPromoCodeInput('');
      setPromoError('');
    }
  }, [clearPromo, promoCode, serverQuote?.promo]);

  const [activeItemDetails, setActiveItemDetails] = React.useState<any | null>(null);
  const activeItemQuote = activeItemDetails ? quoteForItem(activeItemDetails) : undefined;
  const sheetAnim = React.useRef(new Animated.Value(0)).current;

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
    if (!activeStoreId) {
      setPromoError(lang === 'ar' ? 'المتجر غير محدد' : 'Magasin indisponible');
      return;
    }
    setValidatingPromo(true);
    setPromoError('');
    try {
      const result = await previewCheckout({
        store_id: activeStoreId,
        items: toCheckoutItems(items),
        payment_method: 'cash',
        promo_code: code,
      });
      const quote = result.data;
      if (result.error || !quote) {
        setPromoError(result.error || (lang === 'ar' ? 'تعذر التحقق من الكود' : 'Impossible de valider le code'));
      } else if (quote.promo?.is_valid) {
        setPromo(code);
        setPromoCodeInput('');
        setShowPromoInput(false);
      } else {
        setPromoError(lang === 'ar' ? 'كود الخصم غير صحيح' : 'Code promo invalide');
      }
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
          if (!data) return;
          setActiveStore(data);
          const status = isStoreCurrentlyOpen(data);
          setStoreClosed(!status.isOpen);
          setStoreClosedLabel(status.labelAr);
        }).catch(() => {});
      });
      return () => task.cancel();
    }, [activeStoreId])
  );

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

      <Pressable
        style={styles.fixedHeaderBtn}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        accessibilityRole="button"
        accessibilityLabel={lang === 'ar' ? 'رجوع' : 'Back'}
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

  if (!hasActiveItems) {
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
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.replace('/(tabs)')}
              accessibilityRole="button"
              accessibilityLabel={L.startShopping}
            >
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
        contentContainerStyle={{ paddingTop: insets.top + 76, paddingBottom: insets.bottom + 104 }}
      >
        {storeName ? (
          <>
            <View style={[styles.storeSubtitleRow, { flexDirection: dirRow(isRTL) }]}>
              <Text style={[styles.pageSubtitle, { textAlign: dirText(isRTL), flex: 1 }]}>
                {parseBilingual(storeName, lang, L.unknownStore)}{storeEtaLabel ? ` - ${storeEtaLabel}` : ''}
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
                  accessibilityRole="button"
                  accessibilityLabel={lang === 'ar' ? 'مسح السلة' : lang === 'en' ? 'Clear cart' : 'Vider le panier'}
                >
                  <Ionicons name="trash-outline" size={20} color="#000000" />
                </Pressable>
              ) : null}
            </View>

            {/* Active Store Promotion Banner */}
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
                      setActiveStoreId(cart.storeId);
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
                accessibilityRole="button"
                accessibilityLabel={lang === 'ar' ? 'تفاصيل المنتج' : lang === 'en' ? 'Product details' : 'Details du produit'}
              >
                <Image source={itemImageSource(item.image_url)} style={styles.itemImage} contentFit="cover" />
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
                  <Text style={[styles.itemPrice, { marginTop: 4 }]}>
                    {quoteForItem(item) ? money(quoteForItem(item)!.unit_price_dh) : quoteLoading ? '...' : '-'}
                  </Text>
                </View>
              </Pressable>

              {/* Actions Column on the right */}
              <View style={styles.actionsContainerRight}>
                {/* Stepper */}
                <View style={[styles.qtyBox, { flexDirection: dirRow(isRTL) }]}>
                  <HapticTab 
                    scaleDown={0.9}
                    style={styles.qtyBtn} 
                    onPress={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : null}
                    accessibilityLabel={lang === 'ar' ? 'تقليل الكمية' : lang === 'en' ? 'Decrease quantity' : 'Diminuer la quantite'}
                  >
                    <Ionicons name="remove" size={20} color={item.quantity > 1 ? BRAND.TEXT : BRAND.TEXT3} />
                  </HapticTab>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <HapticTab
                    scaleDown={0.9}
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    accessibilityLabel={lang === 'ar' ? 'زيادة الكمية' : lang === 'en' ? 'Increase quantity' : 'Augmenter la quantite'}
                  >
                    <Ionicons name="add" size={20} color={BRAND.RED} />
                  </HapticTab>
                </View>
                
                {/* Action Buttons: Edit (Pencil) and Delete (Trash) */}
                <View style={[styles.actionButtonsRow, { flexDirection: dirRow(isRTL) }]}>
                  <HapticTab
                    scaleDown={0.9}
                    style={styles.actionBtnEdit}
                    onPress={() => router.push({
                      pathname: '/(flows)/store/[id]',
                      params: { id: activeStoreId || '', editMenuItemId: item.menu_item_id || '', editCartItemId: item.id || '' }
                    })}
                    accessibilityLabel={lang === 'ar' ? 'تعديل المنتج' : lang === 'en' ? 'Edit item' : 'Modifier le produit'}
                  >
                    <Ionicons name="create-outline" size={17} color={BRAND.YELLOW_DARK} />
                  </HapticTab>
                  
                  <HapticTab
                    scaleDown={0.9}
                    style={styles.actionBtnDelete}
                    onPress={() => removeItem(item.id)}
                    accessibilityLabel={lang === 'ar' ? 'حذف المنتج' : lang === 'en' ? 'Remove item' : 'Supprimer le produit'}
                  >
                    <Ionicons name="trash-outline" size={17} color={BRAND.RED} />
                  </HapticTab>
                </View>
              </View>
            </View>
          ))}
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing' as any, duration: 250, delay: 100 }}
          style={styles.softCard}
        >
          {promoCode ? (
            <View style={[styles.lineRow, { flexDirection: dirRow(isRTL) }]}>
              <View style={{ flex: 1, alignItems: dirItems(isRTL) }}>
                <Text style={styles.lineLabel}>{L.promo}</Text>
                <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.GREEN, marginTop: 2 }}>{promoCode} (-{money(activeDiscount)})</Text>
              </View>
              <Pressable
                onPress={() => { clearPromo(); setPromoCodeInput(''); setPromoError(''); }}
                accessibilityRole="button"
                accessibilityLabel={L.cancel}
              >
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
                <Pressable
                  style={styles.applyBtn}
                  onPress={handleApplyPromo}
                  disabled={validatingPromo}
                  accessibilityRole="button"
                  accessibilityLabel={L.add}
                >
                  {validatingPromo ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.applyBtnText}>{L.add}</Text>}
                </Pressable>
              </View>
              {promoError ? <Text style={[styles.errorText, { textAlign: dirText(isRTL) }]}>{promoError}</Text> : null}
            </View>
          ) : (
            <View style={[styles.lineRow, { flexDirection: dirRow(isRTL) }]}>
              <Text style={styles.lineLabel}>{L.promo}</Text>
              <Pressable
                onPress={() => setShowPromoInput(true)}
                accessibilityRole="button"
                accessibilityLabel={L.add}
              >
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
          {quoteLoading ? (
            <View style={[styles.previewStateRow, { flexDirection: dirRow(isRTL) }]}>
              <ActivityIndicator size="small" color={BRAND.RED} />
              <Text style={[styles.previewStateText, { textAlign: dirText(isRTL) }]}>{previewLabels.loading}</Text>
            </View>
          ) : quoteUnavailable ? (
            <View style={styles.previewErrorBox}>
              <Text style={[styles.previewErrorText, { textAlign: dirText(isRTL) }]}>
                {quoteErrorText || previewLabels.unavailable}
              </Text>
              <Pressable
                style={styles.previewRetryBtn}
                onPress={() => checkoutQuote.refetch()}
                accessibilityRole="button"
                accessibilityLabel={previewLabels.retry}
              >
                <Text style={styles.previewRetryText}>{previewLabels.retry}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <TotalRow label={L.products} value={money(serverQuote!.subtotal_dh)} isRTL={isRTL} />
              <TotalRow label={L.deliveryFee} value={money(serverQuote!.delivery_fee_dh)} isRTL={isRTL} />
              <TotalRow label={L.serviceFee} value={money(serverQuote!.service_fee_dh)} isRTL={isRTL} />
              {serverQuote!.discount_dh > 0 ? (
                <TotalRow label={L.discount} value={`-${money(serverQuote!.discount_dh)}`} isRTL={isRTL} valueStyle={{ color: BRAND.GREEN }} />
              ) : null}
              <View style={styles.totalGap} />
              <TotalRow label={L.total} value={money(serverQuote!.total_dh)} isRTL={isRTL} total />
            </>
          )}
        </MotiView>

        {storeClosed ? (
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
            style={({ pressed }) => [styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled, pressed && canConfirm && styles.pressed]}
            onPress={canConfirm ? () => isAuthenticated ? router.push({ pathname: '/(flows)/checkout', params: { notes } }) : setAuthSheetVisible(true) : undefined}
            disabled={!canConfirm}
            accessibilityRole="button"
            accessibilityLabel={storeClosed ? L.storeClosed : L.confirm}
          >
            <Text style={styles.confirmText}>{storeClosed ? L.storeClosed : L.confirm}</Text>
          </Pressable>
        </MotiView>
      </Animated.ScrollView>

      <RequireAuthSheet visible={authSheetVisible} next="/(flows)/checkout" onClose={() => setAuthSheetVisible(false)} />

      <Modal
        visible={activeItemDetails !== null}
        transparent
        animationType="none"
        onRequestClose={closeDetails}
      >
        <View style={styles.sheetOverlayContainer}>
          <Pressable style={styles.sheetOverlayBg} onPress={closeDetails} />
          
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
                  <Image source={itemImageSource(activeItemDetails.image_url)} style={styles.sheetDetailImage} contentFit="cover" />
                  <View style={[styles.sheetDetailMeta, { alignItems: dirItems(isRTL) }]}>
                    <Text style={[styles.sheetDetailName, { textAlign: dirText(isRTL) }]}>
                      {lang === 'ar'
                        ? parseBilingual(activeItemDetails.name_ar || activeItemDetails.name, 'ar')
                        : parseBilingual(activeItemDetails.name || activeItemDetails.name_ar, lang)}
                    </Text>
                    <Text style={styles.sheetDetailPrice}>
                      {activeItemQuote ? money(activeItemQuote.unit_price_dh) : quoteLoading ? '...' : '-'}
                    </Text>
                  </View>
                </View>

                {activeItemDetails.selected_options && activeItemDetails.selected_options.length > 0 ? (
                  <View style={styles.supplementsBlock}>
                    <Text style={[styles.supplementsTitle, { textAlign: dirText(isRTL) }]}>
                      {lang === 'ar' ? 'الإضافات والمكونات' : lang === 'en' ? 'Supplements & Options' : 'Suppléments & Options'}
                    </Text>
                    {activeItemDetails.selected_options.map((opt: any, optIdx: number) => (
                      <View key={`${opt.id || opt.choice_id}-${optIdx}`} style={[styles.supplementRow, { flexDirection: dirRow(isRTL) }]}>
                        <View style={{ flex: 1, alignItems: dirItems(isRTL) }}>
                          <Text style={styles.supplementGroupLabel}>{opt.option_label}</Text>
                          <Text style={styles.supplementChoiceLabel}>{opt.choice_name || opt.name}</Text>
                        </View>
                        {(() => {
                          const quotedOption = activeItemQuote?.options.find(
                            (option) => option.option_id === opt.option_id && option.choice_id === opt.choice_id,
                          );
                          return quotedOption && quotedOption.price_delta_dh > 0
                            ? <Text style={styles.supplementPrice}>+{money(quotedOption.price_delta_dh)}</Text>
                            : null;
                        })()}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noSupplementsBox}>
                    <Text style={styles.noSupplementsText}>
                      {lang === 'ar' ? 'لا توجد إضافات محددة لهذا المنتج.' : lang === 'en' ? 'No extra supplements selected.' : 'Aucun supplément sélectionné.'}
                    </Text>
                  </View>
                )}

                <View style={styles.sheetDetailTotalSection}>
                  <View style={styles.sheetDetailDivider} />
                  <View style={[styles.sheetDetailTotalRow, { flexDirection: dirRow(isRTL) }]}>
                    <Text style={styles.sheetDetailTotalLabel}>
                      {lang === 'ar' ? 'المجموع الفرعي' : lang === 'en' ? 'Subtotal' : 'Sous-total'} ({activeItemDetails.quantity} x)
                    </Text>
                    <Text style={styles.sheetDetailTotalValue}>
                      {activeItemQuote ? money(activeItemQuote.line_total_dh) : quoteLoading ? '...' : '-'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function TotalRow({ label, value, isRTL, total, valueStyle }: { label: string; value: string; isRTL: boolean; total?: boolean; valueStyle?: any }) {
  return (
    <View style={[styles.totalRow, { flexDirection: dirRow(isRTL) }]}>
      <Text style={[total ? styles.totalLabel : styles.totalLineLabel, { textAlign: dirText(isRTL) }]}>{label}</Text>
      <Text style={[total ? styles.totalValue : styles.totalLineValue, valueStyle]}>{value}</Text>
    </View>
  );
}

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
    fontFamily: FONTS.DISPLAY,
    fontSize: 28,
    color: '#111827',
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: '#6B7280',
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  storeSubtitleRow: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  clearStoreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cartSelector: {
    paddingHorizontal: SIDE,
    gap: 10,
    paddingBottom: 10,
  },
  selectorPill: {
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
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
    minHeight: 112,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E6DF',
  },
  itemCardGap: {
    marginTop: 10,
  },
  itemImage: {
    width: 74,
    height: 74,
    borderRadius: 16,
    backgroundColor: '#F5F4F0',
  },
  itemInfo: {
    flex: 1,
    minHeight: 70,
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
    marginLeft: 8,
  },
  actionButtonsRow: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtnEdit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFBEE',
    borderWidth: 0.5,
    borderColor: '#F5CE2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDEAEA',
    borderWidth: 0.5,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  softCard: {
    marginHorizontal: SIDE,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: '#111827',
    marginBottom: 10,
  },
  inputShell: {
    height: 46,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  noteInput: {
    flex: 1,
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: '#111827',
    height: '100%',
  },
  lineRow: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
    gap: 10,
  },
  promoInput: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14,
    color: '#111827',
  },
  applyBtn: {
    height: 42,
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
    marginHorizontal: SIDE,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: '#F3F4F6',
  },
  previewStateRow: {
    minHeight: 44,
    alignItems: 'center',
    gap: 10,
  },
  previewStateText: {
    flex: 1,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.TEXT2,
  },
  previewErrorBox: {
    gap: 10,
  },
  previewErrorText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.ERROR,
  },
  previewRetryBtn: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.RED_LIGHT,
  },
  previewRetryText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    color: BRAND.RED,
  },
  totalRow: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLineLabel: {
    fontFamily: FONTS.BODY,
    fontSize: 13.5,
    color: '#4B5563',
  },
  totalLineValue: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13.5,
    color: '#111827',
  },
  totalGap: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
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
    marginTop: 12,
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
    marginTop: 12,
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
    paddingHorizontal: 24,
    gap: 12,
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
    marginTop: 10,
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
    gap: 12,
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
    paddingTop: 10,
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
    marginBottom: 14,
  },
  sheetDetailHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    gap: 14,
    marginBottom: 18,
  },
  sheetDetailImage: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
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
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.RED,
  },
  supplementsBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
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
    paddingVertical: 9,
    borderBottomWidth: 0.5,
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
    borderWidth: 0.5,
    borderColor: '#F3F4F6',
  },
  noSupplementsText: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  sheetDetailTotalSection: {
    marginTop: 14,
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

import React, { useRef } from 'react';
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
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { ASSETS } from '../../constants/assets';
import { BRAND, FONTS, SHADOW_SM } from '../../constants/brand';
import { backendJson } from '../../lib/backendApi';
import { backArrow, dirItems, dirRow, dirText } from '../../lib/direction';
import { getStoreById } from '../../lib/storeApi';
import { isStoreCurrentlyOpen } from '../../lib/storeStatus';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useLangStore } from '../../store/languageStore';

const SIDE = 10;
const PRODUCT_SIDE = 4;
const SERVICE_FEE = 2;
const FALLBACK_ITEM = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=420&h=360&fit=crop';

function money(value: unknown) {
  const amount = Number(value || 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${safe.toFixed(2).replace('.', ',')} DH`;
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
    getTotals,
    storeName,
    getActiveCarts,
    activeStoreId,
    setActiveStoreId,
    promoCode,
    promoDiscount,
    setPromo,
    clearPromo,
  } = useCartStore();

  const totals = getTotals();
  const activeCarts = getActiveCarts();
  const finalTotal = totals.total + SERVICE_FEE;

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
  const [storeClosed, setStoreClosed] = React.useState(false);
  const [storeClosedLabel, setStoreClosedLabel] = React.useState('');

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
      const data = await backendJson<{ valid: boolean; discount_amount_dh: number; message?: string }>('/admin-api/validate-promo', {
        method: 'POST',
        body: JSON.stringify({ code, store_id: activeStoreId, order_total_dh: totals.subtotal }),
      });
      if (data.valid) {
        setPromo(code, data.discount_amount_dh);
        setPromoCodeInput('');
        setShowPromoInput(false);
      } else {
        setPromoError(data.message || (lang === 'ar' ? 'كود الخصم غير صحيح' : 'Code promo invalide'));
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
      getStoreById(activeStoreId).then(({ data }) => {
        if (!data) return;
        const status = isStoreCurrentlyOpen(data);
        setStoreClosed(!status.isOpen);
        setStoreClosedLabel(status.labelAr);
      }).catch(() => {});
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
      >
        <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color="#111827" />
      </Pressable>

      <View style={styles.fixedHeaderCenter}>
        <Animated.Text
          style={[
            styles.fixedHeaderTitle,
            {
              opacity: headerTitleOpacity,
              transform: [{ translateY: headerTitleTranslateY }],
            },
          ]}
          numberOfLines={1}
        >
          {L.title}
        </Animated.Text>
      </View>

      <View style={{ width: 40 }} />
    </Animated.View>
  );

  if (activeCarts.length === 0) {
    return (
      <View style={styles.root}>
        {renderHeader()}
        <View style={[styles.emptyBox, { paddingTop: insets.top + 60 }]}>
          <Image source={ASSETS.illustrations.jaheez_grocery_large} style={styles.emptyIllustration} contentFit="contain" />
          <Text style={styles.emptyTitle}>{L.emptyTitle}</Text>
          <Text style={styles.emptySub}>{L.emptySub}</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.emptyBtnText}>{L.startShopping}</Text>
          </Pressable>
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
        contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }}
      >
        <Text style={[styles.bigPageTitle, { textAlign: dirText(isRTL) }]}>{L.title}</Text>
        {storeName ? (
          <Text style={[styles.pageSubtitle, { textAlign: dirText(isRTL) }]}>
            {storeName} · {`20–35 ${L.minutes}`}
          </Text>
        ) : null}

        {activeCarts.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cartSelector}>
            {activeCarts.map((cart, index) => (
              <Pressable
                key={`${cart.storeId || 'cart'}-${index}`}
                style={[styles.selectorPill, cart.storeId === activeStoreId && styles.selectorPillActive]}
                onPress={() => setActiveStoreId(cart.storeId)}
              >
                <Text style={[styles.selectorText, cart.storeId === activeStoreId && styles.selectorTextActive]} numberOfLines={1}>
                  {cart.storeName || L.unknownStore}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.itemsBlock}>
          {items.map((item, index) => (
            <View key={`${item.id || item.menu_item_id || 'item'}-${index}`} style={[styles.itemCard, index > 0 && styles.itemCardGap, { flexDirection: dirRow(isRTL) }]}>
              <Image source={{ uri: item.image_url || FALLBACK_ITEM }} style={styles.itemImage} contentFit="cover" />
              <View style={[styles.itemInfo, { alignItems: dirItems(isRTL) }]}>
                <Text style={[styles.itemName, { textAlign: dirText(isRTL) }]} numberOfLines={2}>
                  {item.name_ar && lang === 'ar' ? item.name_ar : item.name}
                </Text>
                <Text style={styles.itemPrice}>{money(item.unit_price)}</Text>
              </View>
              <View style={[styles.qtyBox, { flexDirection: dirRow(isRTL) }]}>
                <Pressable style={styles.qtyBtn} onPress={() => item.quantity <= 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1)}>
                  <Ionicons name="remove-circle-outline" size={24} color={BRAND.TEXT3} />
                </Pressable>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Ionicons name="add-circle" size={24} color={BRAND.RED} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.softCard}>
          {promoCode ? (
            <View style={[styles.lineRow, { flexDirection: dirRow(isRTL) }]}>
              <View style={{ flex: 1, alignItems: dirItems(isRTL) }}>
                <Text style={styles.lineLabel}>{L.promo}</Text>
                <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.GREEN, marginTop: 2 }}>{promoCode} (-{money(promoDiscount)})</Text>
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
        </View>

        <View style={styles.softCard}>
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
        </View>

        <View style={styles.totalCard}>
          <TotalRow label={L.products} value={money(totals.subtotal)} isRTL={isRTL} />
          <TotalRow label={L.deliveryFee} value={money(totals.delivery_fee)} isRTL={isRTL} />
          <TotalRow label={L.serviceFee} value={money(SERVICE_FEE)} isRTL={isRTL} />
          {totals.promo_discount > 0 ? (
            <TotalRow label={L.discount} value={`-${money(totals.promo_discount)}`} isRTL={isRTL} valueStyle={{ color: BRAND.GREEN }} />
          ) : null}
          <View style={styles.totalGap} />
          <TotalRow label={L.total} value={money(finalTotal)} isRTL={isRTL} total />
        </View>

        {storeClosed ? (
          <View style={[styles.warning, { flexDirection: dirRow(isRTL) }]}>
            <Ionicons name="warning-outline" size={18} color="#B45309" />
            <Text style={[styles.warningText, { textAlign: dirText(isRTL) }]}>{L.closedNow} {storeClosedLabel}</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.confirmBtn, storeClosed && styles.confirmBtnDisabled, pressed && !storeClosed && styles.pressed]}
          onPress={storeClosed ? undefined : () => router.push('/(flows)/checkout')}
          disabled={storeClosed}
        >
          <Text style={styles.confirmText}>{storeClosed ? L.storeClosed : L.confirm}</Text>
        </Pressable>
      </Animated.ScrollView>
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
    ...SHADOW_SM,
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
    fontSize: 17,
    color: '#111827',
  },
  bigPageTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 28,
    color: '#111827',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: '#6B7280',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  cartSelector: {
    paddingHorizontal: SIDE,
    gap: 8,
    paddingBottom: 8,
  },
  selectorPill: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorPillActive: {
    backgroundColor: BRAND.RED,
  },
  selectorText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 11,
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
    borderColor: '#F3F4F6',
  },
  itemCardGap: {
    marginTop: 14,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
    minHeight: 76,
    justifyContent: 'space-between',
  },
  itemName: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 14,
    color: '#111827',
    lineHeight: 19,
  },
  itemPrice: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14.5,
    color: '#111827',
  },
  qtyBox: {
    width: 104,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
  },
  qtyText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: '#111827',
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
    fontSize: 13,
    color: '#111827',
    marginBottom: 8,
  },
  inputShell: {
    height: 44,
    borderRadius: 10,
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
});
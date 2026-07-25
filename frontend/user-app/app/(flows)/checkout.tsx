import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { AppIcon } from '@/components/ui/AppIcon';
import { BRAND, FONTS, RADIUS, SIZE, SPACE } from '@/constants/brand';
import { TText } from '@/components/ui/TText';
import { backArrow, dirRow, dirText } from '@/lib/direction';
import { formatDh } from '@/lib/money';
import { useAuth } from '@/hooks/useAuth';
import { toCheckoutItems, useCheckoutQuote } from '@/hooks/queries/useCheckoutQuote';
import { useCreateOrder } from '@/hooks/mutations/useOrderMutations';
import { useCartStore } from '@/store/cartStore';
import { useLangStore } from '@/store/languageStore';
import { usePlatformStore } from '@/store/platformStore';
import {
  getDefaultCheckoutAddress,
  type CustomerCheckoutAddress,
} from '@/features/orders/services/orderApi';
import { checkoutCopy } from '@/features/orders/checkoutCopy';
import { parseCartBilingual } from '@/features/orders/cartFormatters';

function addressDetails(address: CustomerCheckoutAddress) {
  return [address.building_info, address.nearby_landmark, address.city]
    .filter(Boolean)
    .join(' · ');
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { lang, isRTL } = useLangStore();
  const copy = checkoutCopy(lang);
  const { items, storeId, storeName, promoCode, setPromo, clearPromo, deliveryNote, setDeliveryNote, clearCart } = useCartStore(useShallow((state) => ({
    items: state.items,
    storeId: state.storeId,
    storeName: state.storeName,
    promoCode: state.promoCode,
    setPromo: state.setPromo,
    clearPromo: state.clearPromo,
    deliveryNote: state.deliveryNote,
    setDeliveryNote: state.setDeliveryNote,
    clearCart: state.clearCart,
  })));
  const createOrder = useCreateOrder();
  const [address, setAddress] = useState<CustomerCheckoutAddress | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressError, setAddressError] = useState(false);

  // Promo input state
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const quote = useCheckoutQuote({ storeId, items, promoCode, riderTip: 0 });
  const checkoutItems = useMemo(() => toCheckoutItems(items), [items]);
  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  // Validate promo code response from backend
  React.useEffect(() => {
    if (!promoCode || !quote.data?.promo) return;
    if (!quote.data.promo.is_valid) {
      clearPromo();
      setPromoInput('');
      setPromoError(copy.promoInvalid);
    }
  }, [clearPromo, copy.promoInvalid, promoCode, quote.data?.promo]);

  const handleApplyPromo = useCallback(() => {
    const trimmed = promoInput.trim().toUpperCase();
    if (!trimmed) return;
    setPromoError('');
    setPromo(trimmed);
  }, [promoInput, setPromo]);

  const handleRemovePromo = useCallback(() => {
    clearPromo();
    setPromoInput('');
    setPromoError('');
  }, [clearPromo]);

  const loadAddress = useCallback(async () => {
    if (!user?.id) {
      setAddress(null);
      setAddressLoading(false);
      return;
    }
    setAddressLoading(true);
    setAddressError(false);
    try {
      setAddress(await getDefaultCheckoutAddress());
    } catch {
      setAddress(null);
      setAddressError(true);
    } finally {
      setAddressLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => {
    void loadAddress();
  }, [loadAddress]));

  const quotedLineTotal = useCallback((index: number) => {
    return quote.data?.items[index]?.line_total_dh;
  }, [quote.data?.items]);

  const addressComplete = Boolean(address?.address && address.lat != null && address.lng != null);
  const actionLoading = addressLoading || quote.isUpdating || createOrder.isPending;
  const primaryLabel = !addressComplete
    ? copy.completeAddress
    : quote.isError || !quote.data
      ? copy.retry
      : copy.placeOrder;

  const primaryHint = address && !addressComplete
    ? copy.addressIncomplete
    : quote.data && !quote.data.can_checkout
      ? copy.storeUnavailable
      : null;

  const submit = async () => {
    if (!user?.id) {
      Alert.alert(copy.title, copy.signInRequired);
      router.replace('/(auth)/login');
      return;
    }
    if (!storeId || items.length === 0) {
      Alert.alert(copy.title, copy.emptyCart);
      router.replace('/(tabs)/cart');
      return;
    }
    if (!address || address.lat == null || address.lng == null) {
      Alert.alert(copy.address, copy.addressMissing);
      router.push('/(flows)/addresses');
      return;
    }
    if (!quote.isQuoteCurrent || !quote.data?.can_checkout) {
      Alert.alert(copy.title, copy.quoteUnavailable);
      return;
    }
    if (usePlatformStore.getState().isInMaintenance) {
      Alert.alert(copy.title, copy.maintenance);
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        store_id: storeId,
        delivery_address: address.address,
        delivery_lat: address.lat,
        delivery_lng: address.lng,
        notes: deliveryNote.trim() || null,
        items: checkoutItems,
        payment_method: 'cash',
        rider_tip: 0,
        promo_code: promoCode,
      });
      if (!order.order_id) throw new Error('missing_order_id');
      clearCart(storeId);
      router.replace(`/(flows)/confirmation?orderId=${encodeURIComponent(order.order_id)}` as never);
    } catch {
      Alert.alert(copy.title, copy.orderFailed);
    }
  };

  const handlePrimaryAction = () => {
    if (actionLoading) return;
    if (!addressComplete) {
      router.push('/(flows)/addresses');
      return;
    }
    if (quote.isError || !quote.data) {
      void quote.refetch();
      return;
    }
    if (!quote.data.can_checkout) {
      Alert.alert(copy.title, copy.storeUnavailable);
      return;
    }
    void submit();
  };

  if (!storeId || items.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <AppIcon name="bag-outline" size={40} color={BRAND.TEXT3} />
        <Text style={[styles.emptyText, { textAlign: dirText(isRTL) }]}>{copy.emptyCart}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.secondaryButtonText}>{copy.back}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={[styles.header, { flexDirection: dirRow(isRTL) }]}>
        <Pressable
          accessibilityLabel={copy.back}
          hitSlop={8}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/cart')}
          style={styles.iconButton}
        >
          <AppIcon name={backArrow(isRTL)} size={22} color={BRAND.TEXT} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { textAlign: dirText(isRTL) }]}>{copy.title}</Text>
          <Text style={[styles.subtitle, { textAlign: dirText(isRTL) }]}>{copy.subtitle}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Delivery Address */}
          <SectionTitle title={copy.address} isRTL={isRTL} />
          <View style={styles.section}>
            {addressLoading ? (
              <LoadingRow label={copy.loading} isRTL={isRTL} />
            ) : addressError ? (
              <InlineError label={copy.addressLoadError} action={copy.retry} onPress={loadAddress} isRTL={isRTL} />
            ) : address ? (
              <View style={[styles.addressRow, { flexDirection: dirRow(isRTL) }]}>
                <View style={styles.leadingIcon}>
                  <AppIcon name="location" size={20} color={BRAND.RED} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { textAlign: dirText(isRTL) }]}>{address.label || copy.address}</Text>
                  <Text style={[styles.rowBody, { textAlign: dirText(isRTL) }]}>{address.address}</Text>
                  {addressDetails(address) ? (
                    <Text style={[styles.rowMeta, { textAlign: dirText(isRTL) }]}>{addressDetails(address)}</Text>
                  ) : null}
                  {!addressComplete ? (
                    <Text style={[styles.addressWarning, { textAlign: dirText(isRTL) }]}>{copy.addressIncomplete}</Text>
                  ) : null}
                </View>
                <Pressable onPress={() => router.push('/(flows)/addresses')} hitSlop={8}>
                  <Text style={styles.link}>{copy.change}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={[styles.addressRow, { flexDirection: dirRow(isRTL) }]} onPress={() => router.push('/(flows)/addresses')}>
                <View style={styles.leadingIcon}>
                  <AppIcon name="add" size={20} color={BRAND.RED} />
                </View>
                <Text style={[styles.rowTitle, styles.rowContent, { textAlign: dirText(isRTL) }]}>{copy.addressMissing}</Text>
                <AppIcon name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={BRAND.TEXT3} />
              </Pressable>
            )}
          </View>

          {/* Order Items */}
          <View style={[styles.sectionHeading, { flexDirection: dirRow(isRTL) }]}>
            <SectionTitle title={copy.order} isRTL={isRTL} compact />
            <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/cart')} hitSlop={8}>
              <Text style={styles.link}>{copy.editCart}</Text>
            </Pressable>
          </View>
          <View style={styles.section}>
            {storeName ? <Text style={[styles.storeName, { textAlign: dirText(isRTL) }]}>{storeName}</Text> : null}
            {items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  { flexDirection: dirRow(isRTL) },
                  index < items.length - 1 && styles.divider,
                ]}
              >
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                </View>
                <View style={styles.rowContent}>
                  <TText ar={item.name_ar} style={[styles.rowTitle, { textAlign: dirText(isRTL) }]} />
                  {(item.selected_options || []).length > 0 ? (
                    <Text style={[styles.rowMeta, { textAlign: dirText(isRTL) }]} numberOfLines={2}>
                      {(item.selected_options || []).map((option) => parseCartBilingual(option.choice_name, lang)).filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.linePrice}>
                  {quotedLineTotal(index) == null ? '—' : formatDh(quotedLineTotal(index)!)}
                </Text>
              </View>
            ))}
            <Text style={[styles.itemCount, { textAlign: dirText(isRTL) }]}>{copy.quantity}: {itemCount}</Text>
          </View>

          {/* Promo Code Section */}
          <SectionTitle title={copy.promoCode} isRTL={isRTL} />
          <View style={styles.section}>
            {promoCode ? (
              <View style={[styles.promoActiveRow, { flexDirection: dirRow(isRTL) }]}>
                <View style={styles.leadingIcon}>
                  <AppIcon name="pricetag" size={20} color={BRAND.GREEN} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { textAlign: dirText(isRTL) }]}>{promoCode}</Text>
                  {quote.data?.discount_dh ? (
                    <Text style={[styles.promoDiscountText, { textAlign: dirText(isRTL) }]}>
                      -{formatDh(quote.data.discount_dh)}
                    </Text>
                  ) : null}
                </View>
                <Pressable onPress={handleRemovePromo} hitSlop={8}>
                  <Text style={styles.removePromoLink}>{copy.promoRemove}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={[styles.promoInputRow, { flexDirection: dirRow(isRTL) }]}>
                <TextInput
                  value={promoInput}
                  onChangeText={(val) => {
                    setPromoInput(val.toUpperCase());
                    setPromoError('');
                  }}
                  placeholder={copy.promoPlaceholder}
                  placeholderTextColor={BRAND.TEXT3}
                  style={[styles.promoInput, { textAlign: dirText(isRTL) }]}
                  autoCapitalize="characters"
                />
                <Pressable
                  style={[styles.applyPromoBtn, !promoInput.trim() && styles.disabled]}
                  onPress={handleApplyPromo}
                  disabled={!promoInput.trim()}
                >
                  <Text style={styles.applyPromoBtnText}>{copy.promoApply}</Text>
                </Pressable>
              </View>
            )}
            {promoError ? (
              <Text style={[styles.promoErrorText, { textAlign: dirText(isRTL) }]}>
                {promoError}
              </Text>
            ) : null}
          </View>

          {/* Payment Method */}
          <SectionTitle title={copy.payment} isRTL={isRTL} />
          <View style={[styles.section, styles.paymentRow, { flexDirection: dirRow(isRTL) }]}>
            <View style={styles.leadingIcon}>
              <AppIcon name="cash-outline" size={20} color={BRAND.GREEN} />
            </View>
            <Text style={[styles.rowTitle, styles.rowContent, { textAlign: dirText(isRTL) }]}>{copy.cash}</Text>
            <AppIcon name="checkmark-circle" size={20} color={BRAND.GREEN} />
          </View>

          {/* Delivery Note */}
          <SectionTitle title={copy.note} isRTL={isRTL} />
          <TextInput
            value={deliveryNote}
            onChangeText={setDeliveryNote}
            maxLength={500}
            multiline
            placeholder={copy.notePlaceholder}
            placeholderTextColor={BRAND.TEXT3}
            textAlign={dirText(isRTL)}
            style={styles.noteInput}
          />

          {/* Price Summary Breakdown */}
          <SectionTitle title={copy.summary} isRTL={isRTL} />
          <View style={styles.section}>
            {quote.isLoading ? (
              <LoadingRow label={copy.loading} isRTL={isRTL} />
            ) : quote.isError || !quote.data ? (
              <InlineError label={copy.quoteUnavailable} action={copy.retry} onPress={() => quote.refetch()} isRTL={isRTL} />
            ) : (
              <>
                <PriceRow label={copy.subtotal} value={quote.data.subtotal_dh} isRTL={isRTL} />
                <PriceRow label={copy.delivery} value={quote.data.delivery_fee_dh} isRTL={isRTL} />
                {quote.data.service_fee_dh > 0 ? <PriceRow label={copy.serviceFee} value={quote.data.service_fee_dh} isRTL={isRTL} /> : null}
                {quote.data.discount_dh > 0 ? <PriceRow label={copy.discount} value={-quote.data.discount_dh} isRTL={isRTL} accent /> : null}
                <View style={styles.totalDivider} />
                <PriceRow label={copy.total} value={quote.data.total_dh} isRTL={isRTL} total />
              </>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACE.MD) }]}>
          {primaryHint ? (
            <View style={[styles.footerNotice, { flexDirection: dirRow(isRTL) }]}>
              <AppIcon name="information-circle-outline" size={18} color={BRAND.WARN} />
              <Text style={[styles.footerNoticeText, { textAlign: dirText(isRTL) }]}>{primaryHint}</Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={actionLoading}
            onPress={handlePrimaryAction}
            style={({ pressed }) => [
              styles.primaryButton,
              actionLoading && styles.disabled,
              pressed && !actionLoading && styles.pressed,
            ]}
          >
            {actionLoading ? (
              <ActivityIndicator color={BRAND.SURFACE} />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
                {addressComplete && quote.data?.can_checkout ? <Text style={styles.primaryButtonPrice}>{formatDh(quote.data.total_dh)}</Text> : null}
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function SectionTitle({ title, isRTL, compact = false }: { title: string; isRTL: boolean; compact?: boolean }) {
  return <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact, { textAlign: dirText(isRTL) }]}>{title}</Text>;
}

function LoadingRow({ label, isRTL }: { label: string; isRTL: boolean }) {
  return (
    <View style={[styles.statusRow, { flexDirection: dirRow(isRTL) }]}>
      <ActivityIndicator color={BRAND.RED} />
      <Text style={[styles.rowBody, styles.rowContent, { textAlign: dirText(isRTL) }]}>{label}</Text>
    </View>
  );
}

function InlineError({ label, action, onPress, isRTL }: { label: string; action: string; onPress: () => void; isRTL: boolean }) {
  return (
    <View style={[styles.statusRow, { flexDirection: dirRow(isRTL) }]}>
      <AppIcon name="alert-circle-outline" size={20} color={BRAND.ERROR} />
      <Text style={[styles.errorText, styles.rowContent, { textAlign: dirText(isRTL) }]}>{label}</Text>
      <Pressable onPress={onPress} hitSlop={8}><Text style={styles.link}>{action}</Text></Pressable>
    </View>
  );
}

function PriceRow({ label, value, isRTL, accent = false, total = false }: { label: string; value: number; isRTL: boolean; accent?: boolean; total?: boolean }) {
  return (
    <View style={[styles.priceRow, { flexDirection: dirRow(isRTL) }]}>
      <Text style={[total ? styles.totalLabel : styles.priceLabel, { textAlign: dirText(isRTL) }]}>{label}</Text>
      <Text style={[total ? styles.totalValue : styles.priceValue, accent && styles.accent]}>{formatDh(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.BG },
  flex: { flex: 1 },
  header: { minHeight: 76, alignItems: 'center', paddingHorizontal: SPACE.MD, gap: SPACE.SM, borderBottomWidth: 1, borderBottomColor: BRAND.BORDER },
  iconButton: { width: SIZE.TOUCH_MIN, height: SIZE.TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { fontFamily: FONTS.SEMIBOLD, fontSize: 21, color: BRAND.TEXT },
  subtitle: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT3, marginTop: 2 },
  content: { padding: SPACE.MD, paddingBottom: SPACE.XL },
  sectionTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 15, color: BRAND.TEXT, marginTop: SPACE.LG, marginBottom: SPACE.SM },
  sectionTitleCompact: { marginTop: 0, marginBottom: 0 },
  sectionHeading: { alignItems: 'center', justifyContent: 'space-between', marginTop: SPACE.LG, marginBottom: SPACE.SM },
  section: { backgroundColor: BRAND.SURFACE, borderWidth: 1, borderColor: BRAND.BORDER, borderRadius: RADIUS.SM, overflow: 'hidden' },
  addressRow: { minHeight: 84, alignItems: 'center', padding: SPACE.MD, gap: SPACE.SM },
  paymentRow: { minHeight: 68, alignItems: 'center', padding: SPACE.MD, gap: SPACE.SM },
  leadingIcon: { width: 40, height: 40, borderRadius: RADIUS.SM, backgroundColor: BRAND.LIGHT, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT },
  rowBody: { fontFamily: FONTS.BODY, fontSize: 13, lineHeight: 19, color: BRAND.TEXT2, marginTop: 3 },
  rowMeta: { fontFamily: FONTS.BODY, fontSize: 12, lineHeight: 18, color: BRAND.TEXT3, marginTop: 3 },
  addressWarning: { fontFamily: FONTS.BODY, fontSize: 12, lineHeight: 18, color: BRAND.WARN, marginTop: 5 },
  link: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.RED },
  storeName: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT2, paddingHorizontal: SPACE.MD, paddingTop: SPACE.MD },
  itemRow: { minHeight: 68, alignItems: 'center', padding: SPACE.MD, gap: SPACE.SM },
  divider: { borderBottomWidth: 1, borderBottomColor: BRAND.BORDER },
  quantityBadge: { minWidth: 30, height: 30, paddingHorizontal: 6, borderRadius: RADIUS.SM, backgroundColor: BRAND.LIGHT, alignItems: 'center', justifyContent: 'center' },
  quantityText: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT },
  linePrice: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT },
  itemCount: { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT3, paddingHorizontal: SPACE.MD, paddingBottom: SPACE.MD },
  noteInput: { minHeight: 92, borderWidth: 1, borderColor: BRAND.INPUT_BORDER, borderRadius: RADIUS.SM, padding: SPACE.MD, backgroundColor: BRAND.INPUT_BG, color: BRAND.TEXT, fontFamily: FONTS.BODY, fontSize: 14, textAlignVertical: 'top' },
  statusRow: { minHeight: 64, alignItems: 'center', padding: SPACE.MD, gap: SPACE.SM },
  errorText: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.ERROR },
  priceRow: { justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACE.MD, paddingVertical: 9 },
  priceLabel: { flex: 1, fontFamily: FONTS.BODY, fontSize: 14, color: BRAND.TEXT2 },
  priceValue: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT },
  accent: { color: BRAND.GREEN },
  totalDivider: { height: 1, backgroundColor: BRAND.BORDER, marginVertical: 4 },
  totalLabel: { flex: 1, fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: BRAND.TEXT },
  totalValue: { fontFamily: FONTS.SEMIBOLD, fontSize: 18, color: BRAND.TEXT },
  footer: { paddingHorizontal: SPACE.MD, paddingTop: SPACE.SM, borderTopWidth: 1, borderTopColor: BRAND.BORDER, backgroundColor: BRAND.SURFACE },
  footerNotice: { alignItems: 'center', gap: SPACE.SM, paddingBottom: SPACE.SM },
  footerNoticeText: { flex: 1, fontFamily: FONTS.BODY, fontSize: 12, lineHeight: 18, color: BRAND.TEXT2 },
  primaryButton: { minHeight: 56, borderRadius: RADIUS.SM, backgroundColor: BRAND.RED, paddingHorizontal: SPACE.MD, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.SM },
  primaryButtonText: { fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: BRAND.SURFACE },
  primaryButtonPrice: { fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: BRAND.SURFACE },
  secondaryButton: { minHeight: 48, borderRadius: RADIUS.SM, borderWidth: 1, borderColor: BRAND.BORDER, paddingHorizontal: SPACE.LG, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.82 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.BG, padding: SPACE.LG, gap: SPACE.MD },
  emptyText: { fontFamily: FONTS.BODY, fontSize: 15, color: BRAND.TEXT2 },

  /* Promo Section Styles */
  promoInputRow: {
    padding: SPACE.SM,
    alignItems: 'center',
    gap: SPACE.SM,
  },
  promoInput: {
    flex: 1,
    height: 44,
    backgroundColor: BRAND.INPUT_BG,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    borderRadius: RADIUS.SM,
    paddingHorizontal: SPACE.MD,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14,
    color: BRAND.TEXT,
  },
  applyPromoBtn: {
    height: 44,
    paddingHorizontal: SPACE.MD,
    backgroundColor: BRAND.RED,
    borderRadius: RADIUS.SM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyPromoBtnText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.SURFACE,
  },
  promoActiveRow: {
    padding: SPACE.MD,
    alignItems: 'center',
    gap: SPACE.SM,
  },
  promoDiscountText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    color: BRAND.GREEN,
    marginTop: 2,
  },
  removePromoLink: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.RED,
  },
  promoErrorText: {
    fontFamily: FONTS.BODY,
    fontSize: 12,
    color: BRAND.ERROR,
    paddingHorizontal: SPACE.MD,
    paddingBottom: SPACE.SM,
  },
});

import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { CheckoutQuoteItem } from '@shared/types';
import { AppIcon } from '@/components/ui/AppIcon';
import { ASSETS } from '@/constants/assets';
import { BRAND, FONTS } from '@/constants/brand';
import { formatCartMoney, parseCartBilingual, type CartLanguage } from '../cartFormatters';
import type { CartLine } from '../store/cartStore';

const DETAIL_LABELS = {
  ar: { title: 'تفاصيل المنتج', supplements: 'الإضافات والمكونات', none: 'لم يتم اختيار إضافات لهذا المنتج.', subtotal: 'المجموع الفرعي', close: 'إغلاق' },
  fr: { title: 'Détails du produit', supplements: 'Suppléments et options', none: 'Aucun supplément sélectionné.', subtotal: 'Sous-total', close: 'Fermer' },
  en: { title: 'Product details', supplements: 'Supplements & options', none: 'No extra supplements selected.', subtotal: 'Subtotal', close: 'Close' },
} as const;

type Props = {
  item: CartLine | null;
  quote?: CheckoutQuoteItem;
  quoteLoading: boolean;
  lang: CartLanguage;
  isRTL: boolean;
  bottomInset: number;
  onClose: () => void;
};

export function CartItemDetailsModal({ item, quote, quoteLoading, lang, isRTL, bottomInset, onClose }: Props) {
  const animation = useRef(new Animated.Value(0)).current;
  const labels = DETAIL_LABELS[lang];
  const insetStyle = React.useMemo(() => ({ paddingBottom: bottomInset + 20 }), [bottomInset]);
  const animationStyle = React.useMemo(() => ({
    transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
  }), [animation]);

  useEffect(() => {
    if (!item) {
      animation.setValue(0);
      return;
    }
    Animated.spring(animation, { toValue: 1, useNativeDriver: true, bounciness: 4 }).start();
  }, [animation, item]);

  const close = React.useCallback(() => {
    Animated.timing(animation, { toValue: 0, duration: 180, useNativeDriver: true }).start(onClose);
  }, [animation, onClose]);

  return (
    <Modal visible={item !== null} transparent animationType="none" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityRole="button" accessibilityLabel={labels.close} />
        <Animated.View
          style={[
            styles.card,
            insetStyle,
            animationStyle,
          ]}
        >
          <View style={styles.handle} />
          <View style={[styles.header, isRTL && styles.rowReverse]}>
            <Text style={[styles.title, isRTL && styles.textRight]}>{labels.title}</Text>
            <Pressable style={styles.closeButton} onPress={close} accessibilityRole="button" accessibilityLabel={labels.close}>
              <AppIcon name="close" size={22} color={BRAND.TEXT2} />
            </Pressable>
          </View>

          {item ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              <View style={[styles.mainRow, isRTL && styles.rowReverse]}>
                <Image
                  source={item.image_url ? { uri: item.image_url } : ASSETS.illustrations.jaheez_grocery_large}
                  style={styles.image}
                  contentFit="cover"
                  accessibilityLabel={parseCartBilingual(lang === 'ar' ? item.name_ar || item.name : item.name || item.name_ar, lang)}
                />
                <View style={[styles.meta, isRTL && styles.alignEnd]}>
                  <Text style={[styles.name, isRTL && styles.textRight]}>
                    {parseCartBilingual(lang === 'ar' ? item.name_ar || item.name : item.name || item.name_ar, lang)}
                  </Text>
                  <Text style={styles.price}>{quote ? formatCartMoney(quote.unit_price_dh) : quoteLoading ? '…' : '—'}</Text>
                </View>
              </View>

              {item.selected_options?.length ? (
                <View style={styles.supplements}>
                  <Text style={[styles.supplementsTitle, isRTL && styles.textRight]}>{labels.supplements}</Text>
                  {item.selected_options.map((option) => {
                    const quotedOption = quote?.options.find((candidate) => candidate.option_id === option.option_id && candidate.choice_id === option.choice_id);
                    return (
                      <View key={`${option.option_id}:${option.choice_id}`} style={[styles.optionRow, isRTL && styles.rowReverse]}>
                        <View style={[styles.grow, isRTL && styles.alignEnd]}>
                          <Text style={styles.groupLabel}>{quotedOption?.option_label || option.option_id}</Text>
                          <Text style={styles.choiceLabel}>{parseCartBilingual(option.choice_name, lang)}</Text>
                        </View>
                        {quotedOption && quotedOption.price_delta_dh > 0 ? <Text style={styles.optionPrice}>+{formatCartMoney(quotedOption.price_delta_dh)}</Text> : null}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.noneBox}><Text style={styles.noneText}>{labels.none}</Text></View>
              )}

              <View style={styles.totalSection}>
                <View style={styles.divider} />
                <View style={[styles.totalRow, isRTL && styles.rowReverse]}>
                  <Text style={styles.totalLabel}>{labels.subtotal} ({item.quantity} ×)</Text>
                  <Text style={styles.totalValue}>{quote ? formatCartMoney(quote.line_total_dh) : quoteLoading ? '…' : '—'}</Text>
                </View>
              </View>
            </ScrollView>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: BRAND.OVERLAY },
  backdrop: { ...StyleSheet.absoluteFillObject },
  card: { backgroundColor: BRAND.SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, maxHeight: '80%', shadowColor: BRAND.TEXT, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: BRAND.BORDER, alignSelf: 'center', marginBottom: 14 },
  header: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  alignEnd: { alignItems: 'flex-end' },
  grow: { flex: 1 },
  title: { flex: 1, fontFamily: FONTS.DISPLAY, fontSize: 19, fontWeight: 'bold', color: BRAND.TEXT },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 16 },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  image: { width: 90, height: 90, borderRadius: 18, backgroundColor: BRAND.LIGHT },
  meta: { flex: 1, gap: 4 },
  name: { fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: BRAND.TEXT },
  price: { fontFamily: FONTS.SEMIBOLD, fontSize: 15, color: BRAND.RED },
  supplements: { backgroundColor: BRAND.BG, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: BRAND.LIGHT },
  supplementsTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 13.5, color: BRAND.TEXT2, marginBottom: 12 },
  optionRow: { minHeight: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: BRAND.LIGHT },
  groupLabel: { fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3 },
  choiceLabel: { fontFamily: FONTS.MEDIUM, fontSize: 13, color: BRAND.TEXT, marginTop: 2 },
  optionPrice: { fontFamily: FONTS.SEMIBOLD, fontSize: 12.5, color: BRAND.GREEN },
  noneBox: { padding: 24, alignItems: 'center', backgroundColor: BRAND.BG, borderRadius: 16, borderWidth: 0.5, borderColor: BRAND.LIGHT },
  noneText: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2, textAlign: 'center' },
  totalSection: { marginTop: 14 },
  divider: { height: 1, backgroundColor: BRAND.BORDER, marginBottom: 14 },
  totalRow: { minHeight: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: FONTS.SEMIBOLD, fontSize: 14.5, color: BRAND.TEXT2 },
  totalValue: { fontFamily: FONTS.SEMIBOLD, fontSize: 18, color: BRAND.TEXT },
});

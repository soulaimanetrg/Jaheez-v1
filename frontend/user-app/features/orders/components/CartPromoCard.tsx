import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BRAND, FONTS } from '@/constants/brand';
import { AppIcon } from '@/components/ui/AppIcon';
import { formatCartMoney } from '../cartFormatters';

type Props = {
  promoCode: string | null;
  inputValue: string;
  discount: number;
  error: string;
  showInput: boolean;
  validating: boolean;
  isRTL: boolean;
  promoLabel: string;
  addLabel: string;
  cancelLabel: string;
  onOpen: () => void;
  onClear: () => void;
  onApply: () => void;
  onInputChange: (value: string) => void;
};

function CartPromoCardComponent(props: Props) {
  const { promoCode, inputValue, discount, error, showInput, validating, isRTL, promoLabel, addLabel, cancelLabel, onOpen, onClear, onApply, onInputChange } = props;
  return (
    <View style={styles.card}>
      {promoCode ? (
        <View style={[styles.row, isRTL && styles.rowReverse]}>
          <View style={styles.iconWrap}>
            <AppIcon name="pricetag-outline" size={16} color={BRAND.RED} />
          </View>
          <View style={[styles.grow, isRTL && styles.alignEnd]}>
            <Text style={styles.label}>{promoLabel}</Text>
            <Text style={styles.applied}>{promoCode} (-{formatCartMoney(discount)})</Text>
          </View>
          <Pressable style={styles.textButton} onPress={onClear} accessibilityRole="button" accessibilityLabel={cancelLabel}>
            <Text style={styles.actionText}>{cancelLabel}</Text>
          </Pressable>
        </View>
      ) : showInput ? (
        <View style={styles.inputBlock}>
          <View style={[styles.row, isRTL && styles.rowReverse]}>
            <View style={styles.iconWrap}>
              <AppIcon name="pricetag-outline" size={16} color={BRAND.RED} />
            </View>
            <TextInput
              value={inputValue}
              onChangeText={onInputChange}
              placeholder={promoLabel}
              placeholderTextColor={BRAND.TEXT3}
              autoCapitalize="characters"
              style={[styles.input, isRTL && styles.textRight]}
              accessibilityLabel={promoLabel}
            />
            <Pressable style={styles.applyButton} onPress={onApply} disabled={validating} accessibilityRole="button" accessibilityLabel={addLabel}>
              {validating ? <ActivityIndicator size="small" color={BRAND.SURFACE} /> : <Text style={styles.applyText}>{addLabel}</Text>}
            </Pressable>
          </View>
          {error ? <Text style={[styles.error, isRTL && styles.textRight]}>{error}</Text> : null}
        </View>
      ) : (
        <View style={[styles.row, isRTL && styles.rowReverse]}>
          <View style={styles.iconWrap}>
            <AppIcon name="pricetag-outline" size={16} color={BRAND.RED} />
          </View>
          <Text style={[styles.label, styles.grow]}>{promoLabel}</Text>
          <Pressable style={styles.textButton} onPress={onOpen} accessibilityRole="button" accessibilityLabel={addLabel}>
            <Text style={styles.actionText}>{addLabel} &rsaquo;</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export const CartPromoCard = React.memo(CartPromoCardComponent);

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 12, backgroundColor: BRAND.SURFACE, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: BRAND.RED_LIGHT, alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowReverse: { flexDirection: 'row-reverse' },
  grow: { flex: 1 },
  alignEnd: { alignItems: 'flex-end' },
  textRight: { textAlign: 'right' },
  label: { fontFamily: FONTS.SEMIBOLD, fontSize: 13.5, color: BRAND.TEXT },
  applied: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.GREEN, marginTop: 2 },
  textButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: FONTS.SEMIBOLD, fontSize: 12.5, color: BRAND.RED },
  inputBlock: { gap: 10 },
  input: { flex: 1, height: 52, borderRadius: 12, backgroundColor: BRAND.LIGHT, paddingHorizontal: 10, fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT },
  applyButton: { minWidth: 52, height: 52, paddingHorizontal: 16, borderRadius: 12, backgroundColor: BRAND.RED, alignItems: 'center', justifyContent: 'center' },
  applyText: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.SURFACE },
  error: { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.ERROR },
});

import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { BRAND, FONTS } from '@/constants/brand';

type Props = {
  value: string;
  title: string;
  placeholder: string;
  isRTL: boolean;
  onChange: (value: string) => void;
};

function CartDeliveryNoteComponent({ value, title, placeholder, isRTL, onChange }: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.title, isRTL && styles.textRight]}>{title}</Text>
      <View style={[styles.inputShell, isRTL && styles.rowReverse]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={BRAND.TEXT3}
          style={[styles.input, isRTL && styles.textRight]}
          accessibilityLabel={title}
        />
        <AppIcon name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={BRAND.TEXT3} />
      </View>
    </View>
  );
}

export const CartDeliveryNote = React.memo(CartDeliveryNoteComponent);

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 12, backgroundColor: BRAND.SURFACE, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 0.5, borderColor: BRAND.LIGHT },
  title: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT, marginBottom: 10 },
  textRight: { textAlign: 'right' },
  rowReverse: { flexDirection: 'row-reverse' },
  inputShell: { height: 52, borderRadius: 12, backgroundColor: BRAND.LIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  input: { flex: 1, fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT, height: '100%' },
});

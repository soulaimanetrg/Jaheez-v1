import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { BRAND, FONTS, SHADOW_SM } from '../../constants/brand';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 60 }]}>
      <View style={styles.iconWrap}>
        <Ionicons name="pause-circle" size={56} color={BRAND.RED} />
      </View>
      <Text style={styles.title}>الدفع الإلكتروني متوقف مؤقتًا</Text>
      <Text style={styles.sub}>
        نعمل على مزود دفع مناسب للسوق المغربي. حاليًا يمكنك إتمام الطلب بالدفع نقدًا عند الاستلام.
      </Text>
      <Pressable style={styles.btn} onPress={() => router.replace('/(flows)/cart' as any)}>
        <Text style={styles.btnTxt}>العودة إلى السلة</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.BG, alignItems: 'center', paddingHorizontal: 24 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: BRAND.RED_LIGHT,
    ...SHADOW_SM,
  },
  title: { fontFamily: FONTS.DISPLAY, fontSize: 22, color: BRAND.TEXT, marginTop: 16, textAlign: 'center' },
  sub: { fontFamily: FONTS.BODY, fontSize: 14, color: BRAND.TEXT3, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  btn: { marginTop: 24, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, backgroundColor: BRAND.RED },
  btnTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 15, color: '#FFF' },
});

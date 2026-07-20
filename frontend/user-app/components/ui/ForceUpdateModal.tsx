import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@/components/ui/Ionicons';
import { usePlatformStore } from '../../store/platformStore';
import { useLangStore } from '../../store/languageStore';
import { BRAND, FONTS } from '../../constants/brand';

// Store URLs are configurable via env so non-engineers can update them
// without a code change. Fallbacks point to the public store search by
// app name (always resolvable) instead of a placeholder ID.
const STORE_URL_IOS =
  process.env.EXPO_PUBLIC_STORE_URL_IOS
  || 'https://apps.apple.com/search?term=jaheez';
const STORE_URL_ANDROID =
  process.env.EXPO_PUBLIC_STORE_URL_ANDROID
  || 'https://play.google.com/store/search?q=jaheez&c=apps';

export function ForceUpdateModal() {
  const needs = usePlatformStore(s => s.needsForceUpdate);
  const lang  = useLangStore(s => s.lang);

  if (!needs) return null;

  const isAr   = lang === 'ar';
  const title  = isAr ? 'تحديث مطلوب' : 'Mise à jour requise';
  const body   = isAr
    ? 'إصدار التطبيق الحالي لم يعد مدعومًا. يُرجى التحديث للاستمرار.'
    : "La version actuelle de l'application n'est plus prise en charge. Veuillez mettre à jour pour continuer.";
  const cta    = isAr ? 'تحديث الآن' : 'Mettre à jour';

  const onUpdate = () => {
    const url = Platform.OS === 'ios' ? STORE_URL_IOS
              : Platform.OS === 'android' ? STORE_URL_ANDROID
              : STORE_URL_ANDROID;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      onRequestClose={() => {}} /* non-dismissible */
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="cloud-download" size={42} color={BRAND.RED} />
          </View>
          <Text style={[styles.title, { textAlign: isAr ? 'right' : 'center' }]}>{title}</Text>
          <Text style={[styles.body, { textAlign: isAr ? 'right' : 'center' }]}>{body}</Text>
          <Pressable style={styles.btn} onPress={onUpdate} accessibilityRole="button" accessibilityLabel={cta}>
            <Text style={styles.btnTxt}>{cta}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: BRAND.SURFACE,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: BRAND.RED_LIGHT,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontFamily: FONTS.DISPLAY, fontSize: 20, color: BRAND.TEXT, marginBottom: 4 },
  body:  { fontFamily: FONTS.BODY, fontSize: 14, color: BRAND.TEXT2, lineHeight: 20, marginBottom: 8 },
  btn: {
    width: '100%',
    backgroundColor: BRAND.RED,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  btnTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: '#fff' },
});

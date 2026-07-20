import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@/components/ui/Ionicons';
import { usePlatformStore } from '../../store/platformStore';
import { useLangStore } from '../../store/languageStore';
import { BRAND, FONTS } from '../../constants/brand';

export function MaintenanceBanner() {
  const isInMaintenance = usePlatformStore(s => s.isInMaintenance);
  const getMessage      = usePlatformStore(s => s.maintenanceMessage);
  const lang            = useLangStore(s => s.lang);

  if (!isInMaintenance) return null;
  const msg = getMessage(lang) || (lang === 'ar'
    ? 'التطبيق قيد الصيانة'
    : 'Application en maintenance');

  return (
    <View style={styles.root} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Ionicons name="warning" size={16} color="#fff" />
      <Text style={styles.txt} numberOfLines={2}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: BRAND.WARN || '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txt: {
    flex: 1,
    color: '#fff',
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
  },
});

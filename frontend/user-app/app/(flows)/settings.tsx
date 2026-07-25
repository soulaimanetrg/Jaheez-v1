import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { BRAND, FONTS } from '../../constants/brand';
import { useLangStore } from '../../store/languageStore';
import { dirRow, dirText, backArrow } from '../../lib/direction';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lang, isRTL } = useLangStore();

  const isAr = lang === 'ar';
  const rowChevron = isRTL ? 'chevron-back' : 'chevron-forward';

  const SETTINGS_OPTIONS = [
    {
      id: 'password',
      icon: 'lock-closed-outline',
      label: isAr ? 'تغيير كلمة المرور' : 'Changer le mot de passe',
      route: '/(flows)/change-password' as const,
      color: '#64748B',
      bg: '#F1F5F9',
    },
    {
      id: 'terms',
      icon: 'document-text-outline',
      label: isAr ? 'الشروط والأحكام (CGU)' : 'Conditions Générales d\'Utilisation',
      route: '/(flows)/terms' as const,
      color: '#0284C7',
      bg: '#E0F2FE',
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline',
      label: isAr ? 'سياسة الخصوصية' : 'Charte de Confidentialité',
      route: '/(flows)/terms' as const, // Re-uses terms file or layout
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      id: 'delete',
      icon: 'trash-outline',
      label: isAr ? 'حذف الحساب' : 'Supprimer mon compte',
      route: '/(flows)/delete-account' as const,
      color: '#EF4444',
      bg: '#FEF2F2',
      isDestructive: true,
    },
  ];

  return (
    <View style={styles.container}>
      {/* ── Top Bar ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8, flexDirection: dirRow(isRTL) }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
        >
          <AppIcon name={backArrow(isRTL)} size={22} color="#1E293B" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isAr ? 'الإعدادات' : 'Paramètres'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.subtitle, { textAlign: dirText(isRTL) }]}>
          {isAr ? 'إعدادات الحساب والأمان' : 'Paramètres du compte & sécurité'}
        </Text>

        <View style={styles.card}>
          {SETTINGS_OPTIONS.map((item, idx) => {
            const isLast = idx === SETTINGS_OPTIONS.length - 1;
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.row,
                  { flexDirection: dirRow(isRTL) },
                  !isLast && styles.border,
                  pressed && { backgroundColor: '#F8FAFC' },
                ]}
                onPress={() => router.push(item.route)}
              >
                <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
                  <AppIcon name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.labelWrap}>
                  <Text style={[
                    styles.label,
                    { textAlign: dirText(isRTL) },
                    item.isDestructive && styles.destructiveLabel
                  ]}>
                    {item.label}
                  </Text>
                </View>
                <AppIcon name={rowChevron} size={16} color={item.isDestructive ? '#FCA5A5' : '#94A3B8'} />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.version}>
          JaheeZ
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.DISPLAY,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: FONTS.DISPLAY,
    fontWeight: 'bold',
    color: '#0F172A',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginHorizontal: 20,
    marginTop: 16,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.SEMIBOLD,
    color: '#1E293B',
  },
  destructiveLabel: {
    color: '#EF4444',
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FONTS.BODY,
    color: '#94A3B8',
    marginTop: 32,
  },
});

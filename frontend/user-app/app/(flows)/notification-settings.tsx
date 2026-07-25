import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { BRAND, FONTS } from '../../constants/brand';
import { useAuthStore } from '../../store/authStore';
import { useUpdateProfile } from '../../hooks/mutations/useAuth';
import { useLangStore } from '../../store/languageStore';
import { dirRow, dirText, backArrow } from '../../lib/direction';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lang, isRTL } = useLangStore();
  const user = useAuthStore((s) => s.user);

  const isAr = lang === 'ar';
  const updateProfile = useUpdateProfile();

  const handleToggle = async (key: 'notification_enabled' | 'notif_orders' | 'notif_promos' | 'location_share', value: boolean) => {
    try {
      await updateProfile.mutateAsync({ [key]: value });
    } catch (err: any) {
      Alert.alert(
        isAr ? 'خطأ' : 'Erreur',
        isAr ? 'فشل تحديث الإعدادات. حاول مجدداً.' : 'Échec de la mise à jour des paramètres.'
      );
    }
  };

  const isMasterEnabled = user?.notification_enabled ?? true;

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
          {isAr ? 'إعدادات الإشعارات' : 'Paramètres des notifications'}
        </Text>
        {updateProfile.isPending ? (
          <ActivityIndicator size="small" color={BRAND.RED} style={styles.loader} />
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.subtitle, { textAlign: dirText(isRTL) }]}>
          {isAr ? 'تخصيص تنبيهاتك' : 'Personnalisez vos alertes'}
        </Text>

        <View style={styles.settingsCard}>
          {/* Master Toggle */}
          <View style={[styles.settingRow, { flexDirection: dirRow(isRTL) }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { textAlign: dirText(isRTL) }]}>
                {isAr ? 'تفعيل الإشعارات' : 'Activer les notifications'}
              </Text>
              <Text style={[styles.settingDescription, { textAlign: dirText(isRTL) }]}>
                {isAr
                  ? 'السماح للتطبيق بإرسال تنبيهات لهاتفك'
                  : 'Autoriser l\'application à envoyer des alertes sur votre téléphone'}
              </Text>
            </View>
            <Switch
              value={user?.notification_enabled ?? true}
              onValueChange={(val) => handleToggle('notification_enabled', val)}
              trackColor={{ false: '#CBD5E1', true: '#FEE2E2' }}
              thumbColor={user?.notification_enabled ? BRAND.RED : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          {/* Orders Toggle */}
          <View
            style={[
              styles.settingRow,
              { flexDirection: dirRow(isRTL) },
              !isMasterEnabled && styles.disabledRow,
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { textAlign: dirText(isRTL) }]}>
                {isAr ? 'تحديثات الطلبات' : 'Suivi des commandes'}
              </Text>
              <Text style={[styles.settingDescription, { textAlign: dirText(isRTL) }]}>
                {isAr
                  ? 'تنبيهات عند تغيير حالة طلبك أو وصول السائق'
                  : 'Alertes lors des changements de statut ou de l\'arrivée du livreur'}
              </Text>
            </View>
            <Switch
              disabled={!isMasterEnabled}
              value={isMasterEnabled ? (user?.notif_orders ?? true) : false}
              onValueChange={(val) => handleToggle('notif_orders', val)}
              trackColor={{ false: '#CBD5E1', true: '#FEE2E2' }}
              thumbColor={isMasterEnabled && user?.notif_orders ? BRAND.RED : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          {/* Promos Toggle */}
          <View
            style={[
              styles.settingRow,
              { flexDirection: dirRow(isRTL) },
              !isMasterEnabled && styles.disabledRow,
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { textAlign: dirText(isRTL) }]}>
                {isAr ? 'العروض والتخفيضات' : 'Offres & Promotions'}
              </Text>
              <Text style={[styles.settingDescription, { textAlign: dirText(isRTL) }]}>
                {isAr
                  ? 'تنبيهات حول العروض الخاصة وأكواد الخصم الجديدة'
                  : 'Alertes concernant les offres spéciales et codes de réduction'}
              </Text>
            </View>
            <Switch
              disabled={!isMasterEnabled}
              value={isMasterEnabled ? (user?.notif_promos ?? true) : false}
              onValueChange={(val) => handleToggle('notif_promos', val)}
              trackColor={{ false: '#CBD5E1', true: '#FEE2E2' }}
              thumbColor={isMasterEnabled && user?.notif_promos ? BRAND.RED : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          {/* Location share Toggle */}
          <View style={[styles.settingRow, { flexDirection: dirRow(isRTL) }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { textAlign: dirText(isRTL) }]}>
                {isAr ? 'مشاركة الموقع' : 'Partage de position'}
              </Text>
              <Text style={[styles.settingDescription, { textAlign: dirText(isRTL) }]}>
                {isAr
                  ? 'تسهيل العثور على عنوانك من طرف سائق التوصيل'
                  : 'Aider le livreur à localiser votre adresse de livraison'}
              </Text>
            </View>
            <Switch
              value={user?.location_share ?? true}
              onValueChange={(val) => handleToggle('location_share', val)}
              trackColor={{ false: '#CBD5E1', true: '#FEE2E2' }}
              thumbColor={user?.location_share ? BRAND.RED : '#94A3B8'}
            />
          </View>
        </View>
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
  loader: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginHorizontal: 20,
    marginTop: 16,
    overflow: 'hidden',
  },
  settingRow: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  settingTitle: {
    fontSize: 14.5,
    fontFamily: FONTS.SEMIBOLD,
    color: '#1E293B',
  },
  settingDescription: {
    fontSize: 12.5,
    fontFamily: FONTS.BODY,
    color: '#64748B',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F8FAFC',
  },
  disabledRow: {
    opacity: 0.5,
  },
});

import { AppIcon } from '@/components/ui/AppIcon';
import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Lock, User, ShieldCheck, Car, CreditCard, DollarSign, Languages } from 'lucide-react-native';
import { BRAND, FONTS, SHADOW } from '@/constants/brand';
import { useLangStore, type Lang } from '@/lib/i18n';
import { driverApi, tokenStore } from '@/lib/api';
import { useDriverStore } from '@/store/driverStore';

export function ProfileScreen() {
  const router = useRouter();
  const { t, lang, setLang } = useLangStore();
  const driver = useDriverStore(s => s.driver);
  const setDriver = useDriverStore(s => s.setDriver);
  const logout = useDriverStore(s => s.logout);

  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const me = await driverApi.me();
      setDriver(me);
    } catch {/* ignore */} finally { setLoading(false); }
  }, [setDriver]);

  useEffect(() => { load(); }, [load]);

  async function doLogout() {
    await tokenStore.clear();
    logout();
    router.replace('/(auth)/welcome');
  }

  if (!driver) return null;

  const isRTL = lang === 'ar';
  const codDH = Number(driver.cod_due_dh || 0).toFixed(2);

  const getVehicleLabel = (type: string) => {
    if (type === 'motorcycle') return t.motorcycle || 'Moto';
    if (type === 'bicycle') return t.bicycle || 'Vélo';
    return t.car || 'Voiture';
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: BRAND.BG }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={BRAND.RED} />}
      >
        {/* Header Profile Card */}
        <View style={[styles.card, styles.heroCard, SHADOW]}>
          <View style={[styles.avatar, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.avatarText}>{driver.full_name?.[0] || '?'}</Text>
          </View>
          <Text style={[styles.heroName, { textAlign: isRTL ? 'right' : 'left' }]}>{driver.full_name}</Text>
          <Text style={[styles.heroPhone, { textAlign: isRTL ? 'right' : 'left' }]}>{driver.phone}</Text>

          <View style={styles.divider} />

          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={{ fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT3 }}>
                {isRTL ? 'الحالة الحالية' : 'Statut de disponibilité'}
              </Text>
              <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: driver.is_online ? BRAND.GREEN : BRAND.TEXT3 }}>
                {driver.is_online ? (t.online || 'En ligne') : (t.offline || 'Hors ligne')}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: driver.is_online ? BRAND.GREEN : BRAND.LIGHT }}>
              <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: driver.is_online ? '#fff' : BRAND.TEXT3 }}>
                {driver.state || (driver.is_online ? 'AVAILABLE' : 'OFFLINE')}
              </Text>
            </View>
          </View>
        </View>

        {/* Financial Balances Card */}
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'الوضعية المالية' : 'Situation financière'}
        </Text>
        <View style={[styles.card, SHADOW]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 14 }}>
            <View style={styles.balanceCol}>
              <View style={[styles.iconWrap, { backgroundColor: BRAND.YELLOW_LIGHT }]}> 
                <AppIcon icon={DollarSign} size={20} color={BRAND.YELLOW_DARK} />
              </View>
              <Text style={styles.balanceLabel}>{isRTL ? 'دفعات الشيفت' : 'Payouts de shifts'}</Text>
              <Text style={[styles.balanceVal, { color: BRAND.YELLOW_DARK }]}>{isRTL ? 'بعد الإغلاق' : 'Apres cloture'}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceCol}>
              <View style={[styles.iconWrap, { backgroundColor: BRAND.RED_LIGHT }]}>
                <AppIcon icon={CreditCard} size={20} color={BRAND.RED} />
              </View>
              <Text style={styles.balanceLabel}>{t.codBalance || 'Espèces collectées'}</Text>
              <Text style={[styles.balanceVal, { color: BRAND.RED }]}>{codDH} DH</Text>
            </View>
          </View>
          <Text style={[styles.hintText, { textAlign: isRTL ? 'right' : 'left' }]}> 
            {isRTL ? 'يتم حساب عمولتك في ملخص نهاية الشيفت. أي مبلغ COD غير مسدد قد يوقف الدفع.' : 'Votre commission est calculee dans le recap de fin de shift. Un COD non regle peut bloquer le payout.'}
          </Text>
        </View>

        {/* Driver General Details */}
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'المعلومات الشخصية' : 'Informations personnelles'}
        </Text>
        <View style={[styles.card, SHADOW]}>
          <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AppIcon icon={User} size={18} color={BRAND.TEXT3} />
            <View style={[styles.infoText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.infoLabel}>{t.fullName || 'Nom complet'}</Text>
              <Text style={styles.infoVal}>{driver.full_name}</Text>
            </View>
          </View>
          <View style={styles.rowDivider} />
          <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AppIcon icon={ShieldCheck} size={18} color={BRAND.TEXT3} />
            <View style={[styles.infoText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.infoLabel}>{isRTL ? 'رقم البطاقة الوطنية' : 'CIN / Identifiant'}</Text>
              <Text style={styles.infoVal}>{driver.cin || '—'}</Text>
            </View>
          </View>
          <View style={styles.rowDivider} />
          <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AppIcon icon={ShieldCheck} size={18} color={BRAND.TEXT3} />
            <View style={[styles.infoText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.infoLabel}>{isRTL ? 'حالة الحساب' : 'Statut du compte'}</Text>
              <Text style={[styles.infoVal, { color: driver.is_active !== false ? BRAND.GREEN : BRAND.ERROR, fontFamily: FONTS.SEMIBOLD }]}>
                {driver.is_active !== false ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'غير نشط' : 'Inactif')}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Information */}
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t.vehicleInfo || 'Véhicule'}
        </Text>
        <View style={[styles.card, SHADOW]}>
          <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AppIcon icon={Car} size={18} color={BRAND.TEXT3} />
            <View style={[styles.infoText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.infoLabel}>{t.vehicleType || 'Type de véhicule'}</Text>
              <Text style={styles.infoVal}>{getVehicleLabel(driver.vehicle_type)}</Text>
            </View>
          </View>
          {driver.vehicle_plate ? (
            <>
              <View style={styles.rowDivider} />
              <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppIcon icon={Car} size={18} color={BRAND.TEXT3} />
                <View style={[styles.infoText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={styles.infoLabel}>{isRTL ? 'رقم اللوحة' : 'Numéro de plaque'}</Text>
                  <Text style={styles.infoVal}>{driver.vehicle_plate}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>


        {/* Change password action */}
        <Pressable
          onPress={() => router.push('/(flows)/change-password')}
          style={[styles.card, styles.changePwBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }, SHADOW]}
        >
          <AppIcon icon={Lock} size={18} color={BRAND.TEXT2} />
          <Text style={styles.changePwText}>{t.changePassword || 'Modifier le mot de passe'}</Text>
        </Pressable>

        {/* Language selector */}
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'لغة التطبيق' : 'Langue de l\'application'}
        </Text>
        <View style={[styles.card, { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 }, SHADOW]}>
          {(['ar', 'fr', 'en'] as Lang[]).map(l => (
            <Pressable
              key={l}
              onPress={() => setLang(l)}
              style={[styles.langChip, lang === l && styles.langChipActive]}
            >
              <AppIcon icon={Languages} size={14} color={lang === l ? '#fff' : BRAND.TEXT3} active={lang === l} />
              <Text style={[styles.langChipText, lang === l && { color: '#fff', fontFamily: FONTS.SEMIBOLD }]}>
                {l === 'ar' ? 'العربية' : l === 'fr' ? 'Français' : 'English'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable onPress={doLogout} style={[styles.logoutBtn, SHADOW]}>
          <AppIcon icon={LogOut} size={16} color={BRAND.ERROR} />
          <Text style={{ color: BRAND.ERROR, fontFamily: FONTS.SEMIBOLD, fontSize: 14 }}>{t.logout || 'Déconnexion'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BRAND.SURFACE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
  },
  heroCard: {
    paddingVertical: 20,
    alignItems: 'stretch',
    borderColor: BRAND.RED_LIGHT,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND.RED_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 24,
    color: BRAND.RED,
  },
  heroName: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 20,
    color: BRAND.TEXT,
    marginBottom: 4,
  },
  heroPhone: {
    fontFamily: FONTS.BODY,
    fontSize: 14,
    color: BRAND.TEXT2,
  },
  divider: {
    height: 1,
    backgroundColor: BRAND.BORDER,
    marginVertical: 14,
  },
  sectionTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 14,
    color: BRAND.TEXT3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
    marginHorizontal: 4,
  },
  balanceCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  balanceDivider: {
    width: 1,
    backgroundColor: BRAND.BORDER,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontFamily: FONTS.BODY,
    fontSize: 10,
    color: BRAND.TEXT3,
    textAlign: 'center',
    marginBottom: 4,
  },
  balanceVal: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 16,
  },
  hintText: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: BRAND.TEXT3,
    marginTop: 12,
    lineHeight: 16,
  },
  infoRow: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  rowDivider: {
    height: 1,
    backgroundColor: BRAND.BORDER2,
    marginVertical: 8,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: BRAND.TEXT3,
    marginBottom: 2,
  },
  infoVal: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14,
    color: BRAND.TEXT,
  },
  changePwBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND.LIGHT,
    paddingVertical: 14,
  },
  changePwText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14,
    color: BRAND.TEXT2,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BRAND.BORDER,
  },
  langChipActive: {
    backgroundColor: BRAND.RED,
    borderColor: BRAND.RED,
  },
  langChipText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 13,
    color: BRAND.TEXT3,
  },
  logoutBtn: {
    marginTop: 12,
    backgroundColor: BRAND.SURFACE,
    borderWidth: 1,
    borderColor: BRAND.ERROR,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
});

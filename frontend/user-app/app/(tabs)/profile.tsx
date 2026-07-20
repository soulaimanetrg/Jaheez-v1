import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND, FONTS, SHADOW, SHADOW_SM } from '../../constants/brand';
import { ASSETS } from '../../constants/assets';
import { useAuthStore } from '../../store/authStore';
import { Lang, useLangStore } from '../../store/languageStore';
import { dirItems, dirRow, dirRowReverse, dirText, leadingChevron } from '../../lib/direction';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { t, lang, setLang, isRTL } = useLangStore();

  const name    = user?.full_name || user?.phone || 'المستخدم';
  const phone   = user?.phone || '';
  const initial = name.charAt(0);
  const isPlusMember = user?.is_plus_member ?? false;

  // ─── Menu Items ───
  const MENU = [
    { id: 'orders',   icon: 'receipt-outline'      as const, label: t.myOrders2,      color: '#F97316', route: '/(tabs)/orders'           as const },
    { id: 'addr',     icon: 'location-outline'     as const, label: t.myAddresses,    color: '#EF4444', route: '/(flows)/addresses'       as const },
    { id: 'favs',     icon: 'heart-outline'        as const, label: t.favorites,      color: '#EC4899', route: '/(flows)/favorites'       as const },
    { id: 'notifs',   icon: 'notifications-outline' as const, label: t.notifications,  color: '#F59E0B', route: '/(flows)/notifications'   as const },
    { id: 'pay',      icon: 'card-outline'         as const, label: t.paymentMethods, color: '#EF4444', route: '/(flows)/payment-methods' as const },
  ];

  const performLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const doLogout = () => {
    if (Platform.OS === 'web') {
      performLogout();
      return;
    }
    Alert.alert(t.logoutConfirmTitle, t.logoutConfirmMsg, [
      { text: t.cancel, style: 'cancel' },
      { text: t.logoutConfirmBtn, style: 'destructive', onPress: performLogout },
    ]);
  };

  const languageLabel =
    lang === 'fr' ? 'Français' :
    lang === 'ar' ? 'العربية' :
    'English';

  const changeLanguage = (nextLang?: Lang) => {
    if (nextLang) {
      setLang(nextLang);
      return;
    }

    if (Platform.OS === 'web') {
      setLang(lang === 'fr' ? 'ar' : lang === 'ar' ? 'en' : 'fr');
      return;
    }

    Alert.alert('Langue', 'Choisir la langue de l\'interface', [
      { text: 'Français', onPress: () => setLang('fr') },
      { text: 'العربية', onPress: () => setLang('ar') },
      { text: 'English', onPress: () => setLang('en') },
      { text: t.cancel, style: 'cancel' },
    ]);
  };

  // ── Helpers for directional chevrons ──
  const rowChevron = isRTL ? 'chevron-back' : 'chevron-forward';

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ─── TOP NAV BAR ─── */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8, flexDirection: dirRow(isRTL) }]}>
          <Image source={ASSETS.branding.logo_custom} style={styles.topLogo} resizeMode="contain" />
          <View style={[styles.topActions, { flexDirection: dirRow(isRTL) }]}>
            <Pressable
              style={styles.topBtn}
              onPress={() => router.push('/(flows)/notifications')}
              accessibilityLabel={t.notifications}
            >
              <Ionicons name="notifications-outline" size={22} color={BRAND.TEXT} />
              {/* Badge */}
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeTxt}>3</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.topBtn}
              onPress={() => router.push('/(flows)/profile-edit')}
              accessibilityLabel={t.editProfile}
            >
              <Ionicons name="person-outline" size={22} color={BRAND.TEXT} />
            </Pressable>
          </View>
        </View>

        {/* ─── PROFILE CARD ─── */}
        <Pressable
          style={styles.profileCardOuter}
          onPress={() => router.push('/(flows)/profile-edit')}
        >
          <LinearGradient
            colors={['#FBBF24', '#F59E0B', '#F97316']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.profileCard}
          >
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
              )}
              <Pressable style={styles.camBadge} accessibilityLabel={t.editProfile}>
                <Ionicons name="camera" size={12} color="#666" />
              </Pressable>
            </View>

            {/* User Info */}
            <View style={[styles.profileInfo, { alignItems: dirItems(isRTL) }]}>
              <View style={[styles.nameRow, { flexDirection: dirRow(isRTL) }]}>
                <Text style={[styles.profileName, { textAlign: dirText(isRTL) }]} numberOfLines={1}>
                  {name}
                </Text>
                {isPlusMember && (
                  <View style={styles.starBadge}>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                  </View>
                )}
              </View>
              <Text style={[styles.profilePhone, { textAlign: dirText(isRTL) }]}>{phone}</Text>
              {isPlusMember && (
                <View style={styles.plusBadge}>
                  <Image source={ASSETS.branding.logo_custom} style={styles.plusBadgeLogo} resizeMode="contain" />
                  <Text style={styles.plusBadgeTxt}>Jaheez Plus</Text>
                </View>
              )}
            </View>

            {/* Right Chevron */}
            <Ionicons name={rowChevron as any} size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </Pressable>

        {/* ─── PROMO BANNER ─── */}
        <View style={styles.promoBanner}>
          <View style={[styles.promoLeft, { flexDirection: dirRow(isRTL) }]}>
            <View style={styles.promoGiftIcon}>
              <Ionicons name="gift" size={22} color={BRAND.RED} />
            </View>
            <View style={[styles.promoTextWrap, { alignItems: dirItems(isRTL) }]}>
              <Text style={[styles.promoTitle, { textAlign: dirText(isRTL) }]}>
                {isRTL ? 'اطلب أكثر، ووفر أكثر!' : lang === 'fr' ? 'Commandez plus, économisez plus !' : 'Order more, save more!'}
              </Text>
              <Text style={[styles.promoSub, { textAlign: dirText(isRTL) }]}>
                {isRTL ? 'حصريًا لأعضاء Jaheez Plus' : lang === 'fr' ? 'Exclusif aux membres Jaheez Plus' : 'Exclusive for Jaheez Plus members'}
              </Text>
              <View style={[styles.promoLinkRow, { flexDirection: dirRow(isRTL) }]}>
                <Text style={styles.promoLink}>
                  {isRTL ? 'اكتشف المزايا' : lang === 'fr' ? 'Découvrir les avantages' : 'Discover benefits'}
                </Text>
                <Ionicons name={rowChevron as any} size={14} color={BRAND.RED} />
              </View>
            </View>
          </View>
          <Image
            source={ASSETS.illustrations.jaheez_discount}
            style={styles.promoImage}
            resizeMode="contain"
          />
          <Ionicons name={rowChevron as any} size={18} color={BRAND.TEXT3} style={styles.promoChevron} />
        </View>

        {/* ─── MENU LIST ─── */}
        <View style={styles.menuCard}>
          {MENU.map((item, i) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.menuRow,
                { flexDirection: dirRow(isRTL) },
                i < MENU.length - 1 && styles.menuBorder,
                pressed && { backgroundColor: '#f9f9f9' },
              ]}
              onPress={() => router.push(item.route)}
              accessibilityLabel={item.label}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}14` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={[styles.menuCenter, { alignItems: dirItems(isRTL) }]}>
                <Text style={[styles.menuTxt, { textAlign: dirText(isRTL) }]}>{item.label}</Text>
              </View>
              <Ionicons name={rowChevron as any} size={16} color={BRAND.TEXT3} />
            </Pressable>
          ))}
        </View>

        {/* ─── WHATSAPP SUPPORT CARD ─── */}
        <Pressable
          style={styles.supportCard}
          onPress={() => router.push('/(flows)/support-ticket')}
        >
          <View style={[styles.supportInner, { flexDirection: dirRow(isRTL) }]}>
            <View style={styles.whatsappIcon}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <View style={[styles.supportTextWrap, { alignItems: dirItems(isRTL) }]}>
              <Text style={[styles.supportTitle, { textAlign: dirText(isRTL) }]}>
                {isRTL ? 'المساعدة والدعم' : lang === 'fr' ? 'Aide et support' : 'Help & Support'}
              </Text>
              <Text style={[styles.supportSub, { textAlign: dirText(isRTL) }]}>
                {isRTL ? 'تواصل معنا عبر واتساب للدعم السريع' : lang === 'fr' ? 'Contactez-nous via WhatsApp pour une aide rapide' : 'Contact us via WhatsApp for quick support'}
              </Text>
            </View>
            <Ionicons name={rowChevron as any} size={16} color={BRAND.TEXT3} />
          </View>
        </Pressable>

        {/* ─── LANGUAGE ─── */}
        <Pressable
          style={styles.settingsRow}
          onPress={() => changeLanguage()}
        >
          <View style={[styles.settingsRowInner, { flexDirection: dirRow(isRTL) }]}>
            <View style={[styles.menuIcon, { backgroundColor: `${BRAND.BLUE}14` }]}>
              <Ionicons name="globe-outline" size={20} color={BRAND.BLUE} />
            </View>
            <View style={[styles.menuCenter, { alignItems: dirItems(isRTL) }]}>
              <Text style={[styles.menuTxt, { textAlign: dirText(isRTL) }]}>{t.language}</Text>
              <Text style={[styles.settingsSub, { textAlign: dirText(isRTL) }]}>{languageLabel}</Text>
            </View>
            <Ionicons name={rowChevron as any} size={16} color={BRAND.TEXT3} />
          </View>
        </Pressable>

        {/* ─── SETTINGS ─── */}
        <Pressable
          style={[styles.settingsRow, { marginTop: 0 }]}
          onPress={() => router.push('/(flows)/settings' as any)}
        >
          <View style={[styles.settingsRowInner, { flexDirection: dirRow(isRTL) }]}>
            <View style={[styles.menuIcon, { backgroundColor: `${BRAND.TEXT3}14` }]}>
              <Ionicons name="settings-outline" size={20} color={BRAND.TEXT3} />
            </View>
            <View style={[styles.menuCenter, { alignItems: dirItems(isRTL) }]}>
              <Text style={[styles.menuTxt, { textAlign: dirText(isRTL) }]}>{t.settings}</Text>
            </View>
            <Ionicons name={rowChevron as any} size={16} color={BRAND.TEXT3} />
          </View>
        </Pressable>

        {/* ─── LOGOUT ─── */}
        <Pressable style={[styles.logoutBtn, { flexDirection: dirRow(isRTL) }]} onPress={doLogout} accessibilityLabel={t.logout}>
          <Ionicons name="log-out-outline" size={20} color={BRAND.RED} />
          <Text style={styles.logoutTxt}>{t.logout}</Text>
        </Pressable>

        <Text style={styles.version}>JaheeZ</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.BG },

  /* ── Top Nav Bar ── */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  topLogo: {
    width: 80,
    height: 36,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  topBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF4E6',
  },
  notifBadgeTxt: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 9,
    color: '#fff',
  },

  /* ── Profile Card ── */
  profileCardOuter: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 22,
    ...SHADOW_SM,
  },
  profileCard: {
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitial: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 32,
    color: '#fff',
  },
  camBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 20,
    color: '#fff',
  },
  starBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhone: {
    fontFamily: FONTS.BODY,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  plusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  plusBadgeLogo: {
    width: 16,
    height: 16,
  },
  plusBadgeTxt: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 11,
    color: '#fff',
  },

  /* ── Promo Banner ── */
  promoBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    ...SHADOW,
  },
  promoLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoGiftIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTextWrap: {
    flex: 1,
    gap: 2,
  },
  promoTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 14,
    color: BRAND.TEXT,
  },
  promoSub: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: BRAND.TEXT2,
  },
  promoLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  promoLink: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    color: BRAND.RED,
  },
  promoImage: {
    width: 70,
    height: 60,
  },
  promoChevron: {
    marginLeft: 4,
  },

  /* ── Menu List ── */
  menuCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    ...SHADOW,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCenter: {
    flex: 1,
  },
  menuTxt: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.TEXT,
  },

  /* ── WhatsApp Support ── */
  supportCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    ...SHADOW,
  },
  supportInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  whatsappIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextWrap: {
    flex: 1,
    gap: 2,
  },
  supportTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 15,
    color: BRAND.TEXT,
  },
  supportSub: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: BRAND.TEXT2,
  },

  /* ── Settings Rows ── */
  settingsRow: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    ...SHADOW,
  },
  settingsRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  settingsSub: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: BRAND.TEXT3,
    marginTop: 2,
  },

  /* ── Logout ── */
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: 'rgba(240,48,48,0.15)',
  },
  logoutTxt: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 16,
    color: BRAND.RED,
  },

  version: {
    fontFamily: FONTS.BODY,
    fontSize: 12,
    color: BRAND.TEXT3,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
});

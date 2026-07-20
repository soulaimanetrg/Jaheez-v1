import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Linking,
  ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { BRAND, FONTS, SHADOW, SHADOW_SM, SHADOW_LG } from '../../constants/brand';
import { ASSETS } from '../../constants/assets';
import { useSupportTickets } from '../../hooks/queries/useSupportTickets';
import type { SupportRequest } from '../../lib/supportApi';
import { usePlatformStore } from '../../features/stores/store/platformStore';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { id: 'track',  icon: 'cube-outline',        iconColor: BRAND.YELLOW_DARK, iconBg: BRAND.YELLOW_LIGHT, title: 'تتبع طلبك',        sub: 'تابع حالة طلبك خطوة بخطوة' },
  { id: 'report', icon: 'alert-circle-outline', iconColor: BRAND.RED,         iconBg: BRAND.RED_LIGHT,    title: 'الإبلاغ عن مشكلة', sub: 'أخبرنا عن أي مشكلة تواجهها' },
  { id: 'faq',    icon: 'help-circle-outline',  iconColor: BRAND.TEXT2,       iconBg: BRAND.LIGHT,        title: 'الأسئلة الشائعة',  sub: 'إجابات سريعة على أكثر الأسئلة' },
];

function statusMeta(status: SupportRequest['status']): { label: string; color: string; bg: string } {
  switch (status) {
    case 'open':        return { label: 'مفتوح',          color: BRAND.GREEN, bg: '#ECFDF5' };
    case 'in_progress': return { label: 'قيد المتابعة',   color: BRAND.WARN,  bg: '#FFF7ED' };
    case 'resolved':    return { label: 'تم الحل',        color: BRAND.BLUE,  bg: '#EEF6FF' };
    case 'closed':      return { label: 'مغلق',           color: BRAND.TEXT3, bg: BRAND.LIGHT };
    default:            return { label: status,            color: BRAND.TEXT3, bg: BRAND.LIGHT };
  }
}

function urgencyIcon(urgency: string): { icon: string; color: string } {
  if (urgency === 'urgent') return { icon: 'flash',       color: BRAND.RED };
  if (urgency === 'high')   return { icon: 'alert-circle', color: BRAND.WARN };
  return                           { icon: 'chatbubble',   color: BRAND.TEXT2 };
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return `اليوم، ${d.toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `أمس، ${d.toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('ar-MA', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: tickets = [], isLoading } = useSupportTickets();
  const supportPhone = usePlatformStore(s => s.supportPhoneE164);

  const openWhatsApp = () => {
    if (!supportPhone) return router.push('/(flows)/support-ticket');
    Linking.openURL(`https://wa.me/${supportPhone.replace(/\D/g,'')}`).catch(() => router.push('/(flows)/support-ticket'));
  };

  const callSupport = () => {
    if (!supportPhone) return router.push('/(flows)/support-ticket');
    Linking.openURL(`tel:${supportPhone}`).catch(() => router.push('/(flows)/support-ticket'));
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerLogoWrap}>
            <Text style={styles.headerLogoText}>J</Text>
          </View>
          <Text style={styles.headerTitle}>المساعدة والدعم</Text>
          <Pressable
            style={styles.headerBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            accessibilityLabel="رجوع"
          >
            <Ionicons name="arrow-back" size={20} color={BRAND.TEXT} />
          </Pressable>
        </View>

        {/* ── HERO BANNER ── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>كيف يمكننا مساعدتك؟</Text>
            <Text style={styles.heroSub}>فريق الدعم جاهز لمساعدتك</Text>
            <Text style={styles.heroDesc}>
              اختر الطريقة الأنسب لك وسنكون معك{'\n'}في كل خطوة.
            </Text>
          </View>
          <View style={styles.heroAgentWrap}>
            <Image source={ASSETS.illustrations.jaheez_support_agent} style={styles.supportHeroImage} resizeMode="contain" />
          </View>
        </View>

        {/* ── CONTACT OPTIONS ── */}
        <View style={styles.contactRow}>
          <Pressable
            style={[styles.contactCard, styles.contactCardHighlight]}
            onPress={openWhatsApp}
            accessibilityLabel="تواصل عبر واتساب"
          >
            <View style={styles.recommendedBadge}>
              <Ionicons name="star" size={9} color="#FFF" />
              <Text style={styles.recommendedText}>موصى به</Text>
            </View>
            <View style={styles.contactIconCircle}>
              <Ionicons name="logo-whatsapp" size={24} color={BRAND.WHATSAPP} />
            </View>
            <Text style={styles.contactTitle}>واتساب</Text>
            <Text style={styles.contactSub}>أسرع طريقة للمساعدة{'\n'}الفورية</Text>
          </Pressable>

          <Pressable
            style={styles.contactCard}
            onPress={callSupport}
            accessibilityLabel="اتصل بنا"
          >
            <View style={[styles.contactIconCircle, { backgroundColor: BRAND.RED_LIGHT }]}>
              <Ionicons name="call-outline" size={24} color={BRAND.RED} />
            </View>
            <Text style={styles.contactTitle}>اتصل بنا</Text>
            <Text style={styles.contactSub}>تحدث مباشرة مع{'\n'}فريق الدعم</Text>
          </Pressable>
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View style={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={styles.quickActionCard}
              onPress={() => {
                if (action.id === 'faq')    router.push('/(flows)/faq');
                if (action.id === 'report') router.push('/(flows)/support-ticket');
              }}
              accessibilityLabel={action.title}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.iconBg }]}>
                <Ionicons name={action.icon as any} size={22} color={action.iconColor} />
              </View>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={styles.quickActionSub}>{action.sub}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── RECENT TICKETS ── */}
        <View style={styles.recentHeader}>
          <View style={styles.recentHeaderRight}>
            <Ionicons name="chatbubbles-outline" size={20} color={BRAND.TEXT} />
            <Text style={styles.recentTitle}>تذاكر الدعم</Text>
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={BRAND.RED} />
          </View>
        )}

        {!isLoading && tickets.length === 0 && (
          <View style={styles.emptyWrap}>
            <Image source={ASSETS.illustrations.jaheez_support_agent} style={styles.emptySupportImage} resizeMode="contain" />
            <Text style={styles.emptyText}>لا توجد تذاكر دعم</Text>
            <Text style={styles.emptySub}>عند فتح تذكرة ستظهر هنا</Text>
          </View>
        )}

        {!isLoading && tickets.map((ticket) => {
          const st  = statusMeta(ticket.status);
          const urg = urgencyIcon(ticket.urgency);
          return (
            <View key={ticket.id} style={styles.chatCard}>
              <View style={[styles.chatIcon, { backgroundColor: `${urg.color}18` }]}>
                <Ionicons name={urg.icon as any} size={20} color={urg.color} />
              </View>
              <View style={styles.chatInfoCol}>
                <View style={styles.chatTopRow}>
                  <View style={[styles.chatStatusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.chatStatusText, { color: st.color }]}>{st.label}</Text>
                  </View>
                  <Text style={styles.chatTitle} numberOfLines={1}>{ticket.subject}</Text>
                </View>
                <View style={styles.chatBottomRow}>
                  <Text style={styles.chatDate}>{formatDate(ticket.created_at)}</Text>
                  <Text style={styles.chatOrderId}>{ticket.ref_number}</Text>
                </View>
              </View>
              <Ionicons name="chevron-back" size={17} color={BRAND.TEXT3} />
            </View>
          );
        })}

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* ── STICKY WHATSAPP BUTTON ── */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 88 }]}>
        <Pressable
          style={styles.whatsappBtn}
          onPress={openWhatsApp}
          accessibilityLabel="بدء محادثة واتساب"
        >
          <View style={styles.fastBadge}>
            <Ionicons name="flash" size={11} color="#FFF" />
            <Text style={styles.fastBadgeText}>الأسرع</Text>
          </View>
          <View style={styles.whatsappBtnContent}>
            <Text style={styles.whatsappBtnText}>بدء محادثة واتساب</Text>
            <Ionicons name="logo-whatsapp" size={22} color="#FFF" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BRAND.BG },
  scroll: { paddingHorizontal: 20 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: BRAND.SURFACE, alignItems: 'center', justifyContent: 'center', ...SHADOW_SM,
  },
  headerTitle:    { fontFamily: FONTS.DISPLAY, fontSize: 20, color: BRAND.TEXT },
  headerLogoWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: BRAND.RED, alignItems: 'center', justifyContent: 'center' },
  headerLogoText: { fontFamily: FONTS.DISPLAY, fontSize: 20, color: BRAND.YELLOW },

  heroBanner: {
    backgroundColor: BRAND.YELLOW_LIGHT, borderRadius: 20,
    padding: 20, flexDirection: 'row-reverse',
    marginBottom: 16, overflow: 'hidden', minHeight: 170,
    borderWidth: 1, borderColor: 'rgba(201,168,0,0.15)', ...SHADOW_SM,
  },
  heroTextCol: { flex: 1, alignItems: 'flex-end', zIndex: 2 },
  heroTitle:   { fontFamily: FONTS.DISPLAY, fontSize: 20, color: BRAND.TEXT, textAlign: 'right', marginBottom: 6 },
  heroSub:     { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.RED, textAlign: 'right', marginBottom: 6 },
  heroDesc:    { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT2, textAlign: 'right', lineHeight: 18 },

  heroAgentWrap: { width: 118, height: 130, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  supportHeroImage: { width: 150, height: 150 },
  speechBubble1: {
    position: 'absolute', top: 5, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: BRAND.YELLOW, alignItems: 'center', justifyContent: 'center',
  },
  speechBubble2: {
    position: 'absolute', top: 22, left: 5,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: BRAND.RED_LIGHT, alignItems: 'center', justifyContent: 'center',
  },
  agentAvatar: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: BRAND.SURFACE, alignItems: 'center', justifyContent: 'center', ...SHADOW,
  },
  agentLogoBadge: {
    position: 'absolute', bottom: -4, right: 16,
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: BRAND.RED, alignItems: 'center', justifyContent: 'center',
  },
  agentLogoText: { fontFamily: FONTS.DISPLAY, fontSize: 11, color: BRAND.YELLOW },

  contactRow:          { flexDirection: 'row-reverse', gap: 12, marginBottom: 12 },
  contactCard:         {
    flex: 1, backgroundColor: BRAND.SURFACE, borderRadius: 16,
    padding: 16, alignItems: 'flex-end', ...SHADOW_SM,
    borderWidth: 1, borderColor: BRAND.BORDER, position: 'relative',
  },
  contactCardHighlight: { borderColor: BRAND.WHATSAPP, borderWidth: 1.5 },
  recommendedBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: BRAND.WHATSAPP, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  recommendedText:  { fontFamily: FONTS.SEMIBOLD, fontSize: 9, color: '#FFF' },
  contactIconCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#F0FFF0', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  contactTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT, textAlign: 'right', marginBottom: 4 },
  contactSub:   { fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3, textAlign: 'right', lineHeight: 16 },

  quickActionsRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 24 },
  quickActionCard: {
    flex: 1, backgroundColor: BRAND.SURFACE, borderRadius: 14,
    padding: 14, alignItems: 'center', ...SHADOW_SM,
    borderWidth: 1, borderColor: BRAND.BORDER,
  },
  quickActionIcon:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickActionTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.TEXT, textAlign: 'center', marginBottom: 4 },
  quickActionSub:   { fontFamily: FONTS.BODY, fontSize: 10, color: BRAND.TEXT3, textAlign: 'center', lineHeight: 14 },

  recentHeader:      { marginBottom: 12 },
  recentHeaderRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  recentTitle:       { fontFamily: FONTS.DISPLAY, fontSize: 18, color: BRAND.TEXT },

  loadingWrap: { alignItems: 'center', paddingVertical: 32 },
  emptyWrap:   { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptySupportImage: { width: 128, height: 112, marginBottom: 2 },
  emptyText:   { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT3 },
  emptySub:    { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT3 },

  chatCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    backgroundColor: BRAND.SURFACE, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: BRAND.BORDER, ...SHADOW_SM,
  },
  chatIcon:        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chatInfoCol:     { flex: 1 },
  chatTopRow:      { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 4 },
  chatTitle:       { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT, flex: 1, textAlign: 'right' },
  chatStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  chatStatusText:  { fontFamily: FONTS.SEMIBOLD, fontSize: 11 },
  chatBottomRow:   { flexDirection: 'row-reverse', gap: 8 },
  chatOrderId:     { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT3 },
  chatDate:        { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT3 },

  stickyBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20 },
  whatsappBtn: {
    backgroundColor: BRAND.WHATSAPP, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row-reverse', alignItems: 'center',
    ...SHADOW_LG, shadowColor: BRAND.WHATSAPP,
  },
  fastBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: BRAND.RED, paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 8, marginLeft: 12,
  },
  fastBadgeText:     { fontFamily: FONTS.SEMIBOLD, fontSize: 11, color: '#FFF' },
  whatsappBtnContent: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10 },
  whatsappBtnText:    { fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: '#FFF' },
});

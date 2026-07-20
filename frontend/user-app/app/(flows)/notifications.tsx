import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { BRAND, FONTS } from '../../constants/brand';
import { useNotifications, useMarkAllRead, useMarkRead } from '../../hooks/queries/useNotifications';
import type { InboxNotif } from '../../lib/notificationInbox';
import { useLangStore } from '../../store/languageStore';
import { backArrow, dirRow, dirText, dirItems } from '../../lib/direction';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental && !(global as any).RN$Fabric) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterType = 'all' | 'order' | 'broadcast' | 'system';

// Custom springy tab pill component
function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 45,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.tabPill,
          active && styles.tabPillActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isRTL, t, lang } = useLangStore();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedNotif, setSelectedNotif] = useState<InboxNotif | null>(null);

  // Animation values
  const animValue = useRef(new Animated.Value(0)).current; // Modal animation
  const listOpacity = useRef(new Animated.Value(1)).current; // List transition opacity
  const listTranslateY = useRef(new Animated.Value(0)).current; // List transition slide

  const { data: notifs = [], isLoading, isFetching, refetch } = useNotifications();
  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();

  const unreadCount = notifs.filter(n => !n.read).length;
  const refreshing = !isLoading && isFetching;

  // Filter tabs titles
  const filterTabs = [
    { key: 'all' as FilterType, label: lang === 'ar' ? 'الكل' : lang === 'en' ? 'All' : 'Toutes' },
    { key: 'order' as FilterType, label: lang === 'ar' ? 'الطلبات' : lang === 'en' ? 'Orders' : 'Commandes' },
    { key: 'broadcast' as FilterType, label: lang === 'ar' ? 'العروض' : lang === 'en' ? 'Offers' : 'Offres' },
    { key: 'system' as FilterType, label: lang === 'ar' ? 'النظام' : lang === 'en' ? 'System' : 'Système' },
  ];

  // Filter notifications list
  const filteredNotifs = notifs.filter(n => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  // Helper to parse hidden action metadata from notification body
  const parseNotifMeta = (bodyText: string) => {
    if (!bodyText) return { cleanBody: '', storeId: null, orderId: null, appContent: null };

    const storeMatch = bodyText.match(/\[store_id:\s*([^\]]+)\]/);
    const orderMatch = bodyText.match(/\[order_id:\s*([^\]]+)\]/);
    const appContentMatch = bodyText.match(/\[app_content:\s*([^\]]+)\]/);

    const storeId = storeMatch ? storeMatch[1].trim() : null;
    const orderId = orderMatch ? orderMatch[1].trim() : null;
    const appContent = appContentMatch ? appContentMatch[1].trim() : null;

    const cleanBody = bodyText
      .replace(/\[store_id:\s*[^\]]+\]/, '')
      .replace(/\[order_id:\s*[^\]]+\]/, '')
      .replace(/\[app_content:\s*[^\]]+\]/, '')
      .trim();

    return { cleanBody, storeId, orderId, appContent };
  };

  // Simple icon styling helper based on type/status
  function getNotifMeta(n: InboxNotif) {
    if (n.type === 'order') {
      const isDelivered =
        n.title.toLowerCase().includes('livr') ||
        n.title.toLowerCase().includes('deliv') ||
        n.title.includes('✅') ||
        n.title.includes('🎉') ||
        n.title.includes('completed');
      if (isDelivered) {
        return { icon: 'checkmark-circle', color: '#10B981', bg: '#DCFCE7' };
      }
      return { icon: 'bicycle', color: '#EA580C', bg: '#FFEDD5' };
    }
    if (n.type === 'broadcast') {
      return { icon: 'flame', color: '#D97706', bg: '#FEF9C3' };
    }
    return { icon: 'document-text', color: '#2563EB', bg: '#DBEAFE' };
  }

  // Handle click on filter tabs
  const handleFilterChange = (key: FilterType) => {
    if (activeFilter === key) return;

    // 1. Fade out the list quickly
    Animated.parallel([
      Animated.timing(listOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(listTranslateY, {
        toValue: 8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Change the filter state and perform LayoutAnimation
      LayoutAnimation.configureNext({
        duration: 200,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
      setActiveFilter(key);

      // 3. Fade in the list and slide back up
      Animated.parallel([
        Animated.timing(listOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(listTranslateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Handle opening of notification card
  const handleNotifPress = (notif: InboxNotif) => {
    setSelectedNotif(notif);
    markRead(notif.id);

    // Trigger details modal scale up & fade in transition
    Animated.timing(animValue, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.back(1.05)),
      useNativeDriver: true,
    }).start();
  };

  // Handle closing of notification modal
  const closeModal = () => {
    // Trigger details modal scale down & fade out transition
    Animated.timing(animValue, {
      toValue: 0,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setSelectedNotif(null);
    });
  };

  // Handle action redirection button press
  const handleActionPress = (storeId: string | null, orderId: string | null, appContent: string | null) => {
    closeModal();
    if (storeId) {
      router.push({ pathname: '/(flows)/store/[id]', params: { id: storeId } });
    } else if (orderId) {
      router.push({ pathname: '/(flows)/order/[id]', params: { id: orderId } });
    } else if (appContent) {
      if (appContent === 'faq') {
        router.push('/(flows)/faq');
      } else {
        router.push('/(flows)/terms');
      }
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10, flexDirection: dirRow(isRTL) }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        >
          <Ionicons name={backArrow(isRTL)} size={22} color="#1E293B" />
        </Pressable>
        <Text style={styles.headerTitle}>{t.notifications}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Scrollable Filter Tabs ── */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsScroll, { flexDirection: dirRow(isRTL) }]}
        >
          {filterTabs.map(tab => {
            const active = activeFilter === tab.key;
            return (
              <TabPill
                key={tab.key}
                label={tab.label}
                active={active}
                onPress={() => handleFilterChange(tab.key)}
              />
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Scroll View ── */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refetch()}
            colors={[BRAND.RED]}
            tintColor={BRAND.RED}
          />
        }
      >
        {/* Loading */}
        {isLoading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color={BRAND.RED} />
          </View>
        )}

        {/* Animated Container for transitions */}
        <Animated.View
          style={{
            flex: 1,
            opacity: listOpacity,
            transform: [{ translateY: listTranslateY }],
          }}
        >
          {/* Empty State */}
          {!isLoading && filteredNotifs.length === 0 && (
            <View style={styles.centerBox}>
              <Ionicons name="notifications-off-outline" size={80} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>{t.notifEmpty}</Text>
              <Text style={styles.emptySub}>{t.notifEmptySub}</Text>
            </View>
          )}

          {/* Notifications List */}
          {!isLoading && filteredNotifs.length > 0 && (
            <View style={styles.list}>
              {filteredNotifs.map((notif, index) => {
                const meta = getNotifMeta(notif);
                const parsed = parseNotifMeta(notif.body);
                const isLast = index === filteredNotifs.length - 1;
                const formattedTime = () => {
                  const diff = Date.now() - new Date(notif.created_at).getTime();
                  const mins = Math.floor(diff / 60000);
                  const hours = Math.floor(diff / 3600000);
                  const days = Math.floor(diff / 86400000);

                  if (lang === 'ar') {
                    if (mins < 1) return 'الآن';
                    if (mins < 60) return `منذ ${mins} د`;
                    if (hours < 24) return `منذ ${hours} سا`;
                    return `منذ ${days} ي`;
                  }
                  if (lang === 'fr') {
                    if (mins < 1) return 'Maintenant';
                    if (mins < 60) return `Il y a ${mins} min`;
                    if (hours < 24) return `Il y a ${hours} h`;
                    return `Il y a ${days} j`;
                  }
                  if (mins < 1) return 'Now';
                  if (mins < 60) return `${mins}m ago`;
                  if (hours < 24) return `${hours}h ago`;
                  return `${days}d ago`;
                };

                return (
                  <Pressable
                    key={notif.id}
                    style={({ pressed }) => [
                      styles.card,
                      { flexDirection: dirRow(isRTL) },
                      !notif.read && styles.cardUnread,
                      pressed && { opacity: 0.95 },
                      isLast && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => handleNotifPress(notif)}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: meta.bg },
                        isRTL ? { marginLeft: 14 } : { marginRight: 14 },
                      ]}
                    >
                      <Ionicons name={meta.icon as any} size={22} color={meta.color} />
                    </View>

                    <View style={[styles.content, { alignItems: dirItems(isRTL) }]}>
                      <Text style={[styles.title, { textAlign: dirText(isRTL) }]} numberOfLines={2}>
                        {notif.title}
                      </Text>
                      {parsed.cleanBody ? (
                        <Text style={[styles.body, { textAlign: dirText(isRTL) }]} numberOfLines={2}>
                          {parsed.cleanBody}
                        </Text>
                      ) : null}
                    </View>

                    <Text style={styles.time}>{formattedTime()}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Mark All Read Button at the bottom */}
        {!isLoading && unreadCount > 0 && (
          <Pressable
            style={styles.markAllBtn}
            onPress={() => markAllRead(notifs)}
          >
            <Text style={styles.markAllText}>{t.notifMarkAllRead}</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* ── Details Modal Popup ── */}
      {selectedNotif && (() => {
        const parsed = parseNotifMeta(selectedNotif.body);
        return (
          <View style={StyleSheet.absoluteFill}>
            {/* Backdrop */}
            <Animated.View
              style={[
                styles.modalBackdrop,
                {
                  opacity: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.45],
                  }),
                },
              ]}
            >
              <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
            </Animated.View>

            {/* Modal Container */}
            <View style={styles.modalCenterContainer}>
              <Animated.View
                style={[
                  styles.modalCard,
                  {
                    opacity: animValue,
                    transform: [
                      {
                        scale: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                      {
                        translateY: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [60, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {/* Icon */}
                <View style={[styles.modalIconWrap, { backgroundColor: getNotifMeta(selectedNotif).bg }]}>
                  <Ionicons
                    name={getNotifMeta(selectedNotif).icon as any}
                    size={32}
                    color={getNotifMeta(selectedNotif).color}
                  />
                </View>

                {/* Title */}
                <Text style={styles.modalTitle}>{selectedNotif.title}</Text>

                {/* Timestamp */}
                <Text style={styles.modalTime}>
                  {new Date(selectedNotif.created_at).toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>

                {/* Body */}
                {parsed.cleanBody ? (
                  <View style={styles.modalBodyContainer}>
                    <Text style={styles.modalBody}>{parsed.cleanBody}</Text>
                  </View>
                ) : null}

                {/* Action Redirect Button (e.g. Visit Store, View Order, View App Content) */}
                {(parsed.storeId || parsed.orderId || parsed.appContent) && (
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => handleActionPress(parsed.storeId, parsed.orderId, parsed.appContent)}
                  >
                    <Text style={styles.actionBtnTxt}>
                      {parsed.storeId
                        ? (lang === 'ar' ? 'زيارة المتجر' : lang === 'en' ? 'Visit Store' : 'Visiter le magasin')
                        : parsed.orderId
                        ? (lang === 'ar' ? 'عرض الطلب' : lang === 'en' ? 'View Order' : 'Voir la commande')
                        : (lang === 'ar' ? 'عرض المستند' : lang === 'en' ? 'View Document' : 'Voir le document')
                      }
                    </Text>
                  </Pressable>
                )}

                {/* Close Button */}
                <Pressable style={styles.modalCloseBtn} onPress={closeModal}>
                  <Text style={styles.modalCloseBtnTxt}>
                    {lang === 'ar' ? 'إغلاق' : lang === 'en' ? 'Close' : 'Fermer'}
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.DISPLAY,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  tabsContainer: {
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  tabPillActive: {
    backgroundColor: BRAND.RED,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: FONTS.SEMIBOLD,
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.DISPLAY,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13.5,
    fontFamily: FONTS.BODY,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 16,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardUnread: {
    backgroundColor: '#FAF5F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
    marginHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: FONTS.SEMIBOLD,
    color: '#1E293B',
    lineHeight: 18.5,
  },
  body: {
    fontSize: 12.5,
    fontFamily: FONTS.BODY,
    color: '#64748B',
    lineHeight: 17,
  },
  time: {
    fontSize: 11,
    fontFamily: FONTS.BODY,
    color: '#94A3B8',
    alignSelf: 'center',
  },
  markAllBtn: {
    alignSelf: 'center',
    marginTop: 36,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  markAllText: {
    fontSize: 14,
    fontFamily: FONTS.SEMIBOLD,
    color: BRAND.RED,
    fontWeight: 'bold',
  },

  /* Details Modal Styles */
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  modalCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16.5,
    fontFamily: FONTS.DISPLAY,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 22,
  },
  modalTime: {
    fontSize: 12,
    fontFamily: FONTS.BODY,
    color: '#94A3B8',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBodyContainer: {
    width: '100%',
    maxHeight: 180,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  modalBody: {
    fontSize: 13,
    fontFamily: FONTS.BODY,
    color: '#475569',
    lineHeight: 19,
    textAlign: 'center',
  },
  actionBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionBtnTxt: {
    fontSize: 14,
    fontFamily: FONTS.SEMIBOLD,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnTxt: {
    fontSize: 14,
    fontFamily: FONTS.SEMIBOLD,
    color: '#1E293B',
    fontWeight: 'bold',
  },
});

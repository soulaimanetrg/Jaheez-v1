import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions, Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { BRAND, FONTS, SHADOW, SHADOW_SM, SHADOW_LG, SHADOW_RED, RADIUS } from '../../../constants/brand';
import { useOrder, orderKeys } from '../../../hooks/queries/useOrders';
import { connectOrderSocket } from '../../../lib/orderApi';
import { getBackendAccessToken } from '../../../lib/backendApi';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslatedText } from '../../../hooks/useTranslatedText';
import { useLangStore } from '../../../store/languageStore';
import { dirRow } from '../../../lib/direction';

const { width } = Dimensions.get('window');

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'picked_up' | 'delivered' | 'completed' | 'cancelled';

interface StepItem {
  key: string;
  label: string;
  done: boolean;
  active: boolean;
  time?: string;
}

function buildSteps(status: OrderStatus): StepItem[] {
  const RANK: Record<string, number> = {
    pending: 0, confirmed: 1, preparing: 2, picked_up: 3, delivered: 4, completed: 4,
  };
  const rank = RANK[status] ?? 0;
  return [
    { key: 'confirmed', label: 'تم التأكيد',   done: rank >= 1, active: rank === 1 },
    { key: 'preparing', label: 'جاري التحضير',  done: rank >= 2, active: rank === 2 },
    { key: 'onway',     label: 'في الطريق',      done: rank >= 3, active: rank === 3 },
    { key: 'delivered', label: 'تم التسليم',     done: rank >= 4, active: rank === 4 },
  ];
}

export default function TrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data: order } = useOrder(id);
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;
    let socket: ReturnType<typeof connectOrderSocket> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    function startPolling() {
      if (pollInterval) return;
      pollInterval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(id as string) });
      }, 10000); // Poll every 10 seconds
    }

    function stopPolling() {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }

    async function initSocket() {
      try {
        const token = await getBackendAccessToken();
        if (!token) {
          startPolling();
          return;
        }

        socket = connectOrderSocket(id as string, token, {
          onStatusUpdate: (status) => {
            setLiveStatus(status as OrderStatus);
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(id as string) });
          },
          onLocationUpdate: (loc) => {
            setDriverLocation({ latitude: loc.latitude, longitude: loc.longitude });
          },
          onDriverOffline: () => {
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(id as string) });
          }
        });

        socket.on('connect', () => {
          setSocketConnected(true);
          stopPolling();
        });

        socket.on('disconnect', () => {
          setSocketConnected(false);
          startPolling();
        });

        socket.on('connect_error', () => {
          setSocketConnected(false);
          startPolling();
        });

      } catch {
        startPolling();
      }
    }

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      stopPolling();
    };
  }, [id, queryClient]);

  const { lang } = useLangStore();
  const isRTL = lang === 'ar';

  const handleShare = async () => {
    try {
      await Share.share({
        message: lang === 'ar'
          ? `تتبع طلبي من ${storeName} على تطبيق جاهز!`
          : `Suivez ma commande chez ${storeName} sur l'application Jaheez !`,
      });
    } catch {
    }
  };

  const currentStatus = (liveStatus ?? (order as any)?.status ?? 'confirmed') as OrderStatus;
  const STEPS = buildSteps(currentStatus);
  const o = order as any;
  const rawStoreName = o?.store?.name_ar || o?.store?.name || 'متجر';
  const storeName    = useTranslatedText(rawStoreName);
  const storeInitial = storeName.charAt(0);
  const storeLogoUrl = o?.store?.logo_url ?? null;
  const displayId    = o?.id ? `#JHZ-${o.id.slice(0, 8).toUpperCase()}` : '';
  const itemCount    = (o?.items ?? []).reduce((s: number, i: any) => s + (i.quantity ?? 1), 0);
  const totalAmount  = Number(o?.total_amount ?? 0);
  const driverName   = o?.driver?.full_name ?? 'السائق';
  const driverPhone  = o?.driver?.phone ?? null;
  const deliveryCode = typeof o?.delivery_confirmation_code === 'string' ? o.delivery_confirmation_code : null;

  return (
    <View style={styles.root}>
      {/* ── Fixed Header ── */}
      <View style={[styles.fixedHeader, { height: insets.top + 60, paddingTop: insets.top, flexDirection: dirRow(isRTL) }]}>
        <Pressable
          style={styles.fixedHeaderBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          accessibilityLabel={lang === 'ar' ? 'رجوع' : 'Retour'}
        >
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color={BRAND.TEXT} />
        </Pressable>
        <View style={styles.fixedHeaderCenter}>
          <Text style={styles.fixedHeaderTitle}>
            {lang === 'ar' ? 'تتبع الطلب' : lang === 'en' ? 'Tracking' : 'Suivi du colis'}
          </Text>
        </View>
        <Pressable 
          style={styles.fixedHeaderBtn} 
          onPress={handleShare}
          accessibilityLabel={lang === 'ar' ? 'مشاركة' : 'Partager'}
        >
          <Ionicons name="share-social-outline" size={20} color={BRAND.TEXT} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 72, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ═══ MAP PLACEHOLDER ═══ */}
        <View style={styles.mapCard}>
          <View style={styles.mapPlaceholder}>
            {/* Simulated map with street grid */}
            <View style={styles.mapGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={`h${i}`} style={[styles.mapLineH, { top: 20 + i * 30 }]} />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={`v${i}`} style={[styles.mapLineV, { left: 20 + i * 55 }]} />
              ))}
            </View>

            {/* Store marker */}
            <View style={[styles.mapMarker, styles.storeMarker]}>
              <Ionicons name="storefront" size={14} color={BRAND.RED} />
            </View>

            {/* Driver marker */}
            <View style={[styles.mapMarker, styles.driverMarker]}>
              <Text style={styles.driverEmoji}>🛵</Text>
            </View>
            <View style={styles.driverLabel}>
              <Text style={styles.driverLabelText}>في الطريق</Text>
            </View>

            {/* Route line */}
            <View style={styles.routeLine} />

            {/* Location names */}
            <Text style={[styles.mapLabel, { bottom: 12, right: 12 }]}>المعاريف</Text>
            <Text style={[styles.mapLabel, { bottom: 12, left: width * 0.25 }]}>ساحة الأمم المتحدة</Text>
          </View>
        </View>

        {/* ═══ STATUS CARD ═══ */}
        <View style={styles.statusCard}>
          {/* Header row */}
          <View style={styles.statusHeaderRow}>
            <View style={styles.statusLogoWrap}>
              <Text style={styles.statusLogoText}>J</Text>
            </View>
            <View style={styles.statusHeaderInfo}>
              <Text style={styles.statusTitle}>
                {currentStatus === 'confirmed' ? 'تم التأكيد' :
                 currentStatus === 'preparing' ? 'جارٍ التحضير' :
                 currentStatus === 'picked_up' ? 'الطلب في الطريق' :
                 currentStatus === 'delivered' || currentStatus === 'completed' ? 'تم التسليم' :
                 'جارٍ المعالجة'}
              </Text>
              <Text style={styles.statusSub}>
                {currentStatus === 'confirmed' ? 'تم استلام طلبك' :
                 currentStatus === 'preparing' ? 'المتجر يحضّر طلبك' :
                 currentStatus === 'picked_up' ? 'السائق متجه إليك' :
                 currentStatus === 'delivered' || currentStatus === 'completed' ? 'وصل طلبك!' :
                 'يرجى الانتظار'}
              </Text>
            </View>
            {/* Delivery bag illustration */}
            <View style={styles.deliveryBagWrap}>
              <Text style={styles.deliveryBagEmoji}>📦</Text>
            </View>
          </View>

          {/* ETA */}
          <View style={styles.etaRow}>
            <Ionicons name="time-outline" size={16} color={BRAND.TEXT2} />
            <Text style={styles.etaLabel}>الوصول المتوقع</Text>
            <Text style={styles.etaTime}>12:30 - 12:45</Text>
          </View>

          {/* ── Progress steps ── */}
          <View style={styles.stepsRow}>
            {STEPS.map((step, idx) => {
              const isLast = idx === STEPS.length - 1;
              const isDone = step.done;
              const isActive = step.active;

              return (
                <View key={step.key} style={styles.stepItem}>
                  {/* Dot */}
                  <View style={[
                    styles.stepDot,
                    isDone && styles.stepDotDone,
                    isActive && styles.stepDotActive,
                  ]}>
                    {isDone && <Ionicons name="checkmark" size={12} color="#FFF" />}
                    {isActive && <Ionicons name="bicycle" size={12} color="#FFF" />}
                  </View>

                  {/* Connector line */}
                  {!isLast && (
                    <View style={[
                      styles.stepLine,
                      (isDone || isActive) && styles.stepLineDone,
                    ]} />
                  )}

                  {/* Label */}
                  <Text style={[
                    styles.stepLabel,
                    (isDone || isActive) && styles.stepLabelActive,
                  ]}>
                    {step.label}
                  </Text>
                  {step.time ? (
                    <Text style={styles.stepTime}>{step.time}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {deliveryCode && currentStatus !== 'delivered' && currentStatus !== 'completed' ? (
          <View style={styles.codeCard}>
            <View style={styles.codeIconWrap}>
              <Ionicons name="keypad-outline" size={22} color={BRAND.RED} />
            </View>
            <View style={styles.codeTextCol}>
              <Text style={styles.codeTitle}>رمز تأكيد التسليم</Text>
              <Text style={styles.codeSub}>أعط هذا الرمز للسائق عند استلام الطلب فقط</Text>
            </View>
            <Text style={styles.codeValue}>{deliveryCode}</Text>
          </View>
        ) : null}

        {/* ═══ DRIVER CARD ═══ */}
        <View style={styles.driverCard}>
          {/* Avatar */}
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={28} color={BRAND.TEXT3} />
            <View style={styles.driverRating}>
              <Ionicons name="star" size={10} color="#FFF" />
              <Text style={styles.driverRatingText}>
                {o?.driver?.rating_avg?.toFixed(1) ?? '4.8'}
              </Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.driverInfoCol}>
            <Text style={styles.driverName}>{driverName}</Text>
            <Text style={styles.driverRole}>موصل طلبات</Text>
            {driverLocation && (
              <Text style={{ fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.GREEN, marginTop: 2 }}>
                📡 مباشر: {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
              </Text>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.driverActions}>
            <Pressable
              style={styles.driverActionBtn}
              onPress={() => router.push({ pathname: '/(flows)/chat/[id]' as any, params: { id: o?.driver?.id ?? 'driver', orderId: o?.id ?? id } })}
              accessibilityLabel="محادثة"
            >
              <Ionicons name="chatbubble-ellipses" size={18} color={BRAND.RED} />
              <Text style={styles.driverActionText}>محادثة</Text>
            </Pressable>
            {driverPhone && (
              <Pressable style={styles.driverActionBtn} accessibilityLabel="اتصال">
                <Ionicons name="call" size={18} color={BRAND.GREEN} />
                <Text style={styles.driverActionText}>اتصال</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ═══ ORDER SUMMARY ═══ */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Pressable
              style={styles.viewDetailsBtn}
              onPress={() => router.push({ pathname: '/(flows)/order/[id]' as any, params: { id: o?.id ?? id } })}
              accessibilityLabel="عرض التفاصيل"
            >
              <Ionicons name="chevron-back" size={14} color={BRAND.RED} />
              <Text style={styles.viewDetailsText}>عرض التفاصيل</Text>
            </Pressable>
            <Text style={styles.summaryTitle}>ملخص الطلب</Text>
          </View>

          <View style={styles.summaryBody}>
            {/* Store info */}
            <View style={styles.summaryStoreRow}>
              <View style={styles.summaryStoreLogo}>
                {storeLogoUrl ? (
                  <Image source={{ uri: storeLogoUrl }} style={styles.summaryStoreLogoImg} />
                ) : (
                  <Text style={styles.summaryStoreLogoText}>{storeInitial}</Text>
                )}
              </View>
              <View style={styles.summaryStoreInfo}>
                <Text style={styles.summaryStoreName}>{storeName}</Text>
                {!!displayId && <Text style={styles.summaryOrderId}>{displayId}</Text>}
              </View>
            </View>

            {/* Totals */}
            <View style={styles.summaryTotals}>
              <View style={styles.summaryTotalItem}>
                <Ionicons name="bag-handle-outline" size={16} color={BRAND.YELLOW_DARK} />
                <Text style={styles.summaryTotalLabel}>{itemCount} أصناف</Text>
              </View>
              <View style={styles.summaryTotalItem}>
                <Text style={styles.summaryTotalLabel}>المجموع</Text>
                <Text style={styles.summaryTotalVal}>{totalAmount.toFixed(2)} DH</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ HELP CARD ═══ */}
        <Pressable style={styles.helpCard} accessibilityLabel="تحتاج مساعدة؟">
          <Ionicons name="chevron-back" size={18} color={BRAND.TEXT3} />
          <View style={styles.helpTextCol}>
            <Text style={styles.helpTitle}>تحتاج مساعدة؟</Text>
            <Text style={styles.helpSub}>فريق الدعم جاهز لمساعدتك</Text>
          </View>
          <View style={styles.helpIconWrap}>
            <Ionicons name="headset" size={22} color={BRAND.YELLOW_DARK} />
          </View>
        </Pressable>

        <View style={{ height: 130 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.BG },
  scroll: { paddingHorizontal: 20 },

  /* Header */
  fixedHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fixedHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  fixedHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  fixedHeaderTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 22,
    fontWeight: 'bold',
    color: BRAND.TEXT,
  },

  /* Map — full bleed */
  mapCard: {
    borderRadius: 0, overflow: 'hidden', marginBottom: -32,
    marginHorizontal: -20,
    backgroundColor: '#F5F0EB', height: 250,
  },
  mapPlaceholder: {
    flex: 1, position: 'relative', backgroundColor: '#F5F0EB',
  },
  mapGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  mapLineH: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  mapLineV: {
    position: 'absolute', top: 0, bottom: 0, width: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  mapMarker: {
    position: 'absolute', width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, ...SHADOW_SM,
  },
  storeMarker: {
    top: 40, right: 60, borderColor: BRAND.RED,
  },
  driverMarker: {
    top: 80, left: 60, borderColor: BRAND.RED,
  },
  driverEmoji: { fontSize: 16 },
  driverLabel: {
    position: 'absolute', top: 118, left: 42,
    backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, ...SHADOW_SM,
  },
  driverLabelText: { fontFamily: FONTS.MEDIUM, fontSize: 11, color: BRAND.TEXT },
  routeLine: {
    position: 'absolute', top: 58, left: 96, width: width * 0.35, height: 3,
    backgroundColor: BRAND.RED, borderRadius: 2,
    transform: [{ rotate: '-15deg' }],
  },
  mapLabel: {
    position: 'absolute', fontFamily: FONTS.BODY, fontSize: 10, color: BRAND.TEXT3,
  },

  /* Status card — floating overlap */
  statusCard: {
    backgroundColor: '#FFFFFF', borderRadius: 22, padding: 20,
    marginBottom: 14,
    marginTop: 32, zIndex: 5,
    borderWidth: 0.5, borderColor: BRAND.BORDER,
    ...SHADOW_LG,
  },
  statusHeaderRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 12,
  },
  statusLogoWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: BRAND.RED, alignItems: 'center', justifyContent: 'center',
  },
  statusLogoText: { fontFamily: FONTS.DISPLAY, fontSize: 20, color: BRAND.YELLOW, transform: [{ rotate: '-10deg' }] },
  statusHeaderInfo: { flex: 1, alignItems: 'flex-end' },
  statusTitle: { fontFamily: FONTS.DISPLAY, fontSize: 20, color: BRAND.TEXT, marginBottom: 2 },
  statusSub: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2 },
  deliveryBagWrap: {
    width: 60, height: 50, alignItems: 'center', justifyContent: 'center',
  },
  deliveryBagEmoji: { fontSize: 36 },

  etaRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    marginBottom: 20, justifyContent: 'center',
  },
  etaLabel: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2 },
  etaTime: { fontFamily: FONTS.DISPLAY, fontSize: 22, color: BRAND.RED },

  /* Progress steps */
  stepsRow: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  stepItem: { alignItems: 'center', flex: 1, position: 'relative' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F0EBE5', alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: '#E8E3DD', zIndex: 2,
  },
  stepDotDone: { backgroundColor: BRAND.TEXT2, borderColor: BRAND.TEXT2 },
  stepDotActive: { backgroundColor: BRAND.RED, borderColor: BRAND.RED },
  stepLine: {
    position: 'absolute', top: 13, right: -1, left: '50%',
    height: 3, backgroundColor: '#E8E3DD', zIndex: 1,
  },
  stepLineDone: { backgroundColor: BRAND.RED },
  stepLabel: {
    fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3,
    textAlign: 'center', marginTop: 6,
  },
  stepLabelActive: { fontFamily: FONTS.SEMIBOLD, color: BRAND.RED },
  stepTime: { fontFamily: FONTS.BODY, fontSize: 10, color: BRAND.TEXT3, marginTop: 2 },

  codeCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    backgroundColor: BRAND.YELLOW_LIGHT, borderRadius: 18, padding: 16,
    marginBottom: 14, borderWidth: 0.5, borderColor: BRAND.YELLOW,
    ...SHADOW_SM,
  },
  codeIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: BRAND.SURFACE, alignItems: 'center', justifyContent: 'center',
  },
  codeTextCol: { flex: 1, alignItems: 'flex-end' },
  codeTitle: { fontFamily: FONTS.DISPLAY, fontSize: 15, color: BRAND.TEXT },
  codeSub: { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT2, marginTop: 2, textAlign: 'right' },
  codeValue: { fontFamily: FONTS.DISPLAY, fontSize: 24, letterSpacing: 4, color: BRAND.RED },

  /* Driver card — glass */
  driverCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 14,
    marginBottom: 14,
    borderWidth: 0.5, borderColor: BRAND.BORDER,
    ...SHADOW,
  },
  driverAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#F5F0EB', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  driverRating: {
    position: 'absolute', bottom: -4, left: -4,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: BRAND.YELLOW, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8, ...SHADOW_SM,
  },
  driverRatingText: { fontFamily: FONTS.SEMIBOLD, fontSize: 10, color: '#FFF' },
  driverInfoCol: { flex: 1, alignItems: 'flex-end' },
  driverName: { fontFamily: FONTS.SEMIBOLD, fontSize: 18, color: BRAND.TEXT, marginBottom: 2 },
  driverRole: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2, marginBottom: 4 },
  driverIdRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  driverIdText: { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT3 },
  driverActions: { gap: 8 },
  driverActionBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    borderWidth: 0.5, borderColor: '#E8E3DD',
  },
  driverActionText: { fontFamily: FONTS.MEDIUM, fontSize: 12, color: BRAND.TEXT },

  /* Summary */
  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18,
    marginBottom: 14, overflow: 'hidden', ...SHADOW_SM,
  },
  summaryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0EBE5',
  },
  summaryTitle: { fontFamily: FONTS.DISPLAY, fontSize: 16, color: BRAND.TEXT },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetailsText: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.RED },
  summaryBody: { padding: 16 },
  summaryStoreRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 14 },
  summaryStoreLogo: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#F9E8EF', alignItems: 'center', justifyContent: 'center',
  },
  summaryStoreLogoImg:  { width: 44, height: 44, borderRadius: 14 },
  summaryStoreLogoText: { fontFamily: FONTS.DISPLAY, fontSize: 18, color: '#C4548A' },
  summaryStoreInfo: { flex: 1, alignItems: 'flex-end' },
  summaryStoreName: { fontFamily: FONTS.SEMIBOLD, fontSize: 15, color: BRAND.TEXT, marginBottom: 2 },
  summaryOrderId: { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT3 },
  summaryTotals: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0EBE5',
  },
  summaryTotalItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  summaryTotalLabel: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT2 },
  summaryTotalVal: { fontFamily: FONTS.DISPLAY, fontSize: 16, color: BRAND.TEXT },

  /* Help card — cream glass */
  helpCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 14,
    backgroundColor: BRAND.CREAM, borderRadius: 20,
    padding: 18, borderWidth: 1, borderColor: 'rgba(201,168,0,0.20)',
    ...SHADOW_SM,
  },
  helpIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: BRAND.YELLOW, alignItems: 'center', justifyContent: 'center',
  },
  helpTextCol: { flex: 1, alignItems: 'flex-end' },
  helpTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 15, color: BRAND.TEXT, marginBottom: 2 },
  helpSub: { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT2 },
});

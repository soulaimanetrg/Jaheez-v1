import { AppIcon } from '@/components/ui/AppIcon';
import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator, Modal, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Package, AlertCircle, ArrowRight, X, Clock } from 'lucide-react-native';
import { BRAND, FONTS, SHADOW } from '@/constants/brand';
import { useLangStore, type T } from '@/lib/i18n';
import { driverApi, type OrderRow } from '@/lib/api';
import { useDriverStore } from '@/store/driverStore';
import { useDriverRealtime } from '@/hooks/useDriverRealtime';
import type { ShiftSummary } from '@/features/profile/services/profileApi';

const TABS = ['available', 'mine', 'history'] as const;
type TabKey = typeof TABS[number];

type OrderCardProps = {
  order: OrderRow;
  tab: TabKey;
  t: T;
  busy: boolean;
  navigationBusy: boolean;
  disabled: boolean;
  onClaim: () => void;
  onNavigate: () => void;
  onOpen: () => void;
};

type AcceptCountdownModalProps = {
  order: OrderRow | null;
  busy: boolean;
  navigationBusy: boolean;
  t: T;
  onNavigatePickup: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onExpire: () => void;
};

export function DriverDashboardScreen() {
  const router = useRouter();
  const t = useLangStore(s => s.t);
  const driver = useDriverStore(s => s.driver);
  const setDriver = useDriverStore(s => s.setDriver);

  const [tab, setTab] = useState<TabKey>('available');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [navigationBusy, setNavigationBusy] = useState<string | null>(null);
  const [shiftBusy, setShiftBusy] = useState(false);
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null);

  const [popOrder, setPopOrder] = useState<OrderRow | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const declinedIdsRef = useRef<Set<string>>(new Set());
  const loadRef = useRef<(opts?: { popup?: boolean }) => Promise<void>>(async () => undefined);

  const kycBlocked = false;

  const load = useCallback(async (opts: { popup?: boolean } = {}) => {
    setErr(null);
    try {
      const data = await driverApi.orders(tab);
      setOrders(data);

      if (tab === 'available') {
        if (driver?.is_online && !kycBlocked && !popOrder) {
          const fresh = data.find(o => !seenIdsRef.current.has(o.id) && !declinedIdsRef.current.has(o.id));
          if (fresh) {
            setPopOrder(fresh);
            seenIdsRef.current.add(fresh.id);
          }
        }
        data.forEach(o => seenIdsRef.current.add(o.id));
      }
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }, [tab, driver?.is_online, kycBlocked, popOrder]);

  useEffect(() => { loadRef.current = load; }, [load]);

  useDriverRealtime(driver, {
    onOffer: () => {
      if (tab === 'available') {
        loadRef.current({ popup: true });
      }
    },
    onOfferExpired: (payload) => {
      setPopOrder(current => current?.id === payload.order_id ? null : current);
      if (tab === 'available') {
        loadRef.current({ popup: true });
      }
    },
    onReassigned: (payload) => {
      setPopOrder(current => current?.id === payload.order_id ? null : current);
      loadRef.current({ popup: false });
    },
  });

  useEffect(() => { setLoading(true); seenIdsRef.current.clear(); load(); }, [tab]);

  useEffect(() => {
    if (tab === 'available' && driver?.is_online) {
      load({ popup: true });
    }
  }, [tab, driver?.is_online, load]);

  useEffect(() => {
    if (tab !== 'available') return;
    const id = setInterval(() => load({ popup: true }), 15000);
    return () => clearInterval(id);
  }, [tab, load]);

  async function claim(o: OrderRow) {
    setBusy(o.id);
    try {
      await driverApi.claim(o.id);
      setPopOrder(null);
      router.push({ pathname: '/(flows)/active-delivery', params: { id: o.id } });
    } catch (e: any) { setErr(e.message); setPopOrder(null); }
    finally { setBusy(null); }
  }

  async function decline(id: string) {
    declinedIdsRef.current.add(id);
    setPopOrder(null);
    try {
      await driverApi.decline(id);
    } catch (e: any) {
      if (__DEV__) console.warn('[decline] Failed to decline order:', e.message);
    }
  }

  async function openNavigation(orderId: string, destination: 'pickup' | 'dropoff') {
    const key = `${orderId}:${destination}`;
    setNavigationBusy(key);
    setErr(null);
    try {
      const nav = await driverApi.navigation(orderId, destination);
      const canOpen = await Linking.canOpenURL(nav.url);
      if (!canOpen) {
        throw new Error('Navigation indisponible');
      }
      await Linking.openURL(nav.url);
    } catch (e: any) {
      setErr(e?.message || 'Impossible d’ouvrir la navigation');
    } finally {
      setNavigationBusy(null);
    }
  }

  async function toggleShift() {
    if (!driver) return;
    setShiftBusy(true);
    setErr(null);
    try {
      const result = driver.is_online ? await driverApi.endShift() : await driverApi.startShift();
      if (result.driver) setDriver(result.driver);
      const summary = (result as { shift_summary?: ShiftSummary | null }).shift_summary;
      if (driver.is_online && summary) {
        setShiftSummary(summary);
      }
      await load({ popup: false });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setShiftBusy(false);
    }
  }

  if (!driver) return null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: BRAND.BG }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: BRAND.SURFACE, borderBottomWidth: 1, borderBottomColor: BRAND.BORDER }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT3 }}>Bonjour</Text>
            <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 20, color: BRAND.TEXT }} numberOfLines={1}>{driver.full_name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: driver.is_online ? BRAND.GREEN : BRAND.LIGHT }}>
              <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 11, color: driver.is_online ? '#fff' : BRAND.TEXT3 }}>
                {driver.is_online ? t.online : t.offline}
              </Text>
            </View>
            <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 11, color: driver.is_online ? BRAND.GREEN : BRAND.TEXT3, marginTop: 4 }}>
              Auto: {driver.state || 'OFFLINE'}
            </Text>
            <Pressable
              accessibilityLabel={driver.is_online ? 'Terminer le shift' : 'Commencer le shift'}
              onPress={toggleShift}
              disabled={shiftBusy}
              style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: driver.is_online ? BRAND.LIGHT : BRAND.RED, borderWidth: 1, borderColor: driver.is_online ? BRAND.BORDER : BRAND.RED, opacity: shiftBusy ? 0.6 : 1 }}
            >
              {shiftBusy ? (
                <ActivityIndicator size="small" color={driver.is_online ? BRAND.TEXT2 : '#fff'} />
              ) : (
                <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 11, color: driver.is_online ? BRAND.TEXT2 : '#fff' }}>
                  {driver.is_online ? 'Terminer shift' : 'Commencer shift'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
        {TABS.map(k => (
          <Pressable key={k} onPress={() => setTab(k)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center',
              backgroundColor: tab === k ? BRAND.RED : BRAND.SURFACE,
              borderWidth: 1, borderColor: tab === k ? BRAND.RED : BRAND.BORDER }}>
            <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: tab === k ? '#fff' : BRAND.TEXT2 }}>
              {t[k]}
            </Text>
          </Pressable>
        ))}
      </View>

      {err && (
        <View style={{ marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: '#FEE', borderRadius: 8 }}>
          <Text style={{ color: BRAND.ERROR, fontFamily: FONTS.SEMIBOLD, fontSize: 12 }}>{err}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={BRAND.RED} />}
      >
        {loading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}><ActivityIndicator color={BRAND.RED} /></View>
        ) : orders.length === 0 ? (
          <View style={{ paddingTop: 60, alignItems: 'center', gap: 8 }}>
            <AppIcon icon={Package} size={48} color={BRAND.TEXT3} />
            <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: BRAND.TEXT2 }}>{t.noOrders}</Text>
            <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT3 }}>{t.noOrdersSub}</Text>
          </View>
        ) : (
          orders.map(o => (
            <OrderCard key={o.id} order={o} tab={tab} t={t} busy={busy === o.id}
              navigationBusy={navigationBusy === `${o.id}:${tab === 'available' ? 'pickup' : 'dropoff'}`}
              disabled={tab === 'available' && kycBlocked}
              onClaim={() => claim(o)}
              onNavigate={() => openNavigation(o.id, tab === 'available' ? 'pickup' : 'dropoff')}
              onOpen={() => router.push({ pathname: '/(flows)/active-delivery', params: { id: o.id } })} />
          ))
        )}
      </ScrollView>

      <AcceptCountdownModal
        order={popOrder}
        busy={!!busy && busy === popOrder?.id}
        t={t}
        navigationBusy={navigationBusy === `${popOrder?.id}:pickup`}
        onNavigatePickup={() => popOrder && openNavigation(popOrder.id, 'pickup')}
        onAccept={() => popOrder && claim(popOrder)}
        onDecline={() => popOrder && decline(popOrder.id)}
        onExpire={() => {
          // Timeout is not a decline: the backend's timeout worker records
          // it separately, so just dismiss the offer locally.
          setPopOrder(null);
          loadRef.current({ popup: false });
        }}
      />
      <ShiftSummaryModal summary={shiftSummary} onClose={() => setShiftSummary(null)} />
    </SafeAreaView>
  );
}

function ShiftSummaryModal({ summary, onClose }: { summary: ShiftSummary | null; onClose: () => void }) {
  if (!summary) return null;
  const money = (dh: number) => `${Number(dh || 0).toFixed(2)} DH`;
  const isHeld = summary.payout_status === 'held';
  return (
    <Modal transparent animationType="fade" visible={!!summary} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: BRAND.SURFACE, borderRadius: 20, padding: 20, gap: 12 }}>
          <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 20, color: BRAND.TEXT }}>Résumé du shift</Text>
          <Text style={{ fontFamily: FONTS.BODY, color: BRAND.TEXT2 }}>{summary.orders_count} livraison(s) terminée(s)</Text>
          <View style={{ gap: 8, paddingVertical: 8 }}>
            <SummaryRow label="Gains calculés" value={money(summary.total_earnings_dh)} />
            <SummaryRow label="En revue" value={money(summary.payable_dh)} color={BRAND.GREEN} />
            <SummaryRow label="Bloqué" value={money(summary.held_dh)} color={isHeld ? BRAND.WARN : BRAND.TEXT} />
            <SummaryRow label="COD dû" value={money(summary.cod_due_dh)} color={summary.cod_due_dh > 0 ? BRAND.RED : BRAND.TEXT} />
          </View>
          {isHeld ? (
            <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.WARN }}>
              Payout bloqué: {summary.hold_reason || 'revue admin'}.
            </Text>
          ) : (
            <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.GREEN }}>Payout prêt pour validation finance.</Text>
          )}
          <Pressable accessibilityLabel="Fermer le résumé du shift" onPress={onClose} style={{ marginTop: 8, backgroundColor: BRAND.RED, borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontFamily: FONTS.SEMIBOLD }}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function SummaryRow({ label, value, color = BRAND.TEXT }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: FONTS.BODY, color: BRAND.TEXT2 }}>{label}</Text>
      <Text style={{ fontFamily: FONTS.DISPLAY, color }}>{value}</Text>
    </View>
  );
}

function AcceptCountdownModal({ order, busy, navigationBusy, t, onNavigatePickup, onAccept, onDecline, onExpire }: AcceptCountdownModalProps) {
  const lang = useLangStore(s => s.lang);
  const FALLBACK_SECS = 45;
  // Prefer the authoritative offer deadline from the backend; fall back to
  // the historical 45s only when the payload has no expiry.
  const deadlineSecs = (o: OrderRow | null) => {
    if (!o?.offer_expires_at) return FALLBACK_SECS;
    const remaining = Math.floor((new Date(o.offer_expires_at).getTime() - Date.now()) / 1000);
    return remaining > 0 ? Math.min(remaining, 120) : 0;
  };
  const [totalSecs, setTotalSecs] = useState(FALLBACK_SECS);
  const [secs, setSecs] = useState(FALLBACK_SECS);

  useEffect(() => {
    if (!order) return;
    const initial = deadlineSecs(order);
    setTotalSecs(initial || FALLBACK_SECS);
    setSecs(initial);
    if (initial <= 0) { onExpire(); return; }
    const id = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { clearInterval(id); onExpire(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [order?.id]);

  if (!order) return null;
  const fee = Number(order.delivery_fee || 0).toFixed(2);
  const total = Number(order.total_amount || 0).toFixed(2);
  const pct = Math.max(0, Math.min(1, secs / Math.max(1, totalSecs)));
  const storeName = lang === 'ar' && order.store_name_ar ? order.store_name_ar : (order.store_name || '');
  const pickupAddress = (lang === 'ar' && order.store_address_ar ? order.store_address_ar : order.store_address) || storeName || '—';

  return (
    <Modal transparent animationType="fade" visible={!!order} onRequestClose={onDecline}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: BRAND.SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppIcon icon={Clock} size={18} color={BRAND.RED} />
              <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 18, color: BRAND.TEXT }}>Nouvelle course</Text>
            </View>
            <Pressable onPress={onDecline} hitSlop={10}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: BRAND.LIGHT, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon icon={X} size={16} color={BRAND.TEXT2} />
            </Pressable>
          </View>

          {/* Countdown bar */}
          <View style={{ height: 6, borderRadius: 3, backgroundColor: BRAND.LIGHT, overflow: 'hidden', marginBottom: 6 }}>
            <View style={{ height: 6, width: `${pct * 100}%`, backgroundColor: secs <= 10 ? BRAND.ERROR : BRAND.RED }} />
          </View>
          <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: secs <= 10 ? BRAND.ERROR : BRAND.TEXT3, marginBottom: 14, textAlign: 'right' }}>
            {secs}s pour répondre
          </Text>

          {/* Pickup navigation */}
          <Pressable onPress={onNavigatePickup} disabled={navigationBusy}
            style={{ flexDirection: 'row', gap: 8, marginBottom: 14, padding: 12, backgroundColor: BRAND.BG, borderRadius: 12, opacity: navigationBusy ? 0.65 : 1 }}>
            <AppIcon icon={MapPin} size={16} color={BRAND.RED} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 11, color: BRAND.TEXT3, marginBottom: 2 }}>
                {lang === 'ar' ? 'نقطة الاستلام' : (lang === 'en' ? 'Pickup' : 'Point de retrait')}
              </Text>
              <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT, lineHeight: 18 }} numberOfLines={3}>
                {pickupAddress}
              </Text>
            </View>
            {navigationBusy && <ActivityIndicator size="small" color={BRAND.RED} />}
          </Pressable>

          {/* Money line */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <View>
              <Text style={{ fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3 }}>Frais livraison</Text>
              <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 22, color: BRAND.RED }}>{fee} DH</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3 }}>
                {order.payment_method === 'cash' ? 'À encaisser' : 'Total'}
              </Text>
              <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: BRAND.TEXT }}>{total} DH</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={onDecline} disabled={busy}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: BRAND.LIGHT, borderWidth: 1, borderColor: BRAND.BORDER }}>
              <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT2 }}>Refuser</Text>
            </Pressable>
            <Pressable onPress={onAccept} disabled={busy}
              style={{ flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: BRAND.RED, opacity: busy ? 0.6 : 1 }}>
              {busy
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 15, color: '#fff' }}>Accepter ({secs}s)</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function OrderCard({ order, tab, t, busy, navigationBusy, disabled, onClaim, onNavigate, onOpen }: OrderCardProps) {
  const lang = useLangStore(s => s.lang);
  const fee = Number(order.delivery_fee || 0).toFixed(2);
  const total = Number(order.total_amount || 0).toFixed(2);
  const itemCount = order.items?.length || 0;
  const storeName = lang === 'ar' && order.store_name_ar ? order.store_name_ar : (order.store_name || '');
  const customerName = order.customer_name || '';
  const pickupAddress = (lang === 'ar' && order.store_address_ar ? order.store_address_ar : order.store_address) || storeName || '—';
  const navigationAddress = tab === 'available' ? pickupAddress : (order.delivery_address || '—');
  const navigationLabel = tab === 'available'
    ? (lang === 'ar' ? 'نقطة الاستلام' : (lang === 'en' ? 'Pickup' : 'Point de retrait'))
    : (lang === 'ar' ? 'عنوان العميل' : (lang === 'en' ? 'Customer address' : 'Adresse client'));

  const createdAt = order.created_at ? new Date(order.created_at) : null;
  const timeStr = createdAt
    ? `${createdAt.getHours().toString().padStart(2, '0')}:${createdAt.getMinutes().toString().padStart(2, '0')}`
    : '';

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    confirmed:  { label: lang === 'ar' ? 'مؤكد' : (lang === 'en' ? 'Confirmed' : 'Confirmée'), color: BRAND.BLUE, bg: '#EFF6FF' },
    preparing:  { label: lang === 'ar' ? 'قيد التحضير' : (lang === 'en' ? 'Preparing' : 'En préparation'), color: BRAND.WARN, bg: '#FFFBEB' },
    picked_up:  { label: lang === 'ar' ? 'تم الاستلام' : (lang === 'en' ? 'Picked Up' : 'Récupérée'), color: BRAND.GREEN, bg: '#ECFDF5' },
    delivered:  { label: lang === 'ar' ? 'تم التوصيل' : (lang === 'en' ? 'Delivered' : 'Livrée'), color: BRAND.GREEN, bg: '#ECFDF5' },
    completed:  { label: lang === 'ar' ? 'مكتملة' : (lang === 'en' ? 'Completed' : 'Terminée'), color: BRAND.GREEN, bg: '#ECFDF5' },
    cancelled:  { label: lang === 'ar' ? 'ملغية' : (lang === 'en' ? 'Cancelled' : 'Annulée'), color: BRAND.ERROR, bg: '#FEF2F2' },
  };
  const statusInfo = statusMap[order.status] || { label: order.status, color: BRAND.TEXT3, bg: BRAND.LIGHT };

  return (
    <View style={[{ backgroundColor: BRAND.SURFACE, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BRAND.BORDER }, SHADOW]}>
      {/* Top row: ID + payment method + status */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 11, color: BRAND.TEXT3 }}>#{order.id.slice(0, 8)}</Text>
          {!!timeStr && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <AppIcon icon={Clock} size={10} color={BRAND.TEXT3} />
              <Text style={{ fontFamily: FONTS.BODY, fontSize: 10, color: BRAND.TEXT3 }}>{timeStr}</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {tab !== 'available' && (
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: statusInfo.bg }}>
              <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 10, color: statusInfo.color }}>{statusInfo.label}</Text>
            </View>
          )}
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: order.payment_method === 'cash' ? BRAND.YELLOW_LIGHT : BRAND.RED_LIGHT }}>
            <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 10, color: order.payment_method === 'cash' ? BRAND.YELLOW_DARK : BRAND.RED }}>
              {order.payment_method === 'cash' ? t.cash : t.card}
            </Text>
          </View>
        </View>
      </View>

      {/* Store name */}
      {!!storeName && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
          <AppIcon icon={Package} size={14} color={BRAND.GREEN} style={{ marginTop: 2 }} />
          <Text style={{ flex: 1, fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT }} numberOfLines={1}>{storeName}</Text>
        </View>
      )}

      {/* Navigation address */}
      <Pressable onPress={onNavigate} disabled={navigationBusy}
        style={{ flexDirection: 'row', gap: 8, marginBottom: 6, opacity: navigationBusy ? 0.65 : 1 }}>
        <AppIcon icon={MapPin} size={14} color={BRAND.RED} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 10, color: BRAND.TEXT3, marginBottom: 1 }}>
            {navigationLabel}
          </Text>
          <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT, lineHeight: 18 }} numberOfLines={2}>
            {navigationAddress}
          </Text>
        </View>
        {navigationBusy && <ActivityIndicator size="small" color={BRAND.RED} />}
      </Pressable>

      {/* Customer name + item count row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        {!!customerName && (
          <Text style={{ fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT2 }} numberOfLines={1}>
            {lang === 'ar' ? 'العميل' : (lang === 'en' ? 'Customer' : 'Client')}: {customerName}
          </Text>
        )}
        {itemCount > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BRAND.LIGHT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
            <AppIcon icon={Package} size={11} color={BRAND.TEXT3} />
            <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 11, color: BRAND.TEXT2 }}>
              {itemCount} {lang === 'ar' ? 'عنصر' : (lang === 'en' ? (itemCount === 1 ? 'item' : 'items') : (itemCount === 1 ? 'article' : 'articles'))}
            </Text>
          </View>
        )}
      </View>

      {/* Notes */}
      {!!order.notes && (
        <Text style={{ fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3, fontStyle: 'italic', marginBottom: 4 }} numberOfLines={2}>
          « {order.notes} »
        </Text>
      )}

      {/* Cancelled reason (for history) */}
      {order.status === 'cancelled' && !!order.cancelled_reason && (
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4, padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 }}>
          <AppIcon icon={AlertCircle} size={13} color={BRAND.ERROR} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.ERROR }} numberOfLines={2}>
            {order.cancelled_reason}
          </Text>
        </View>
      )}

      {/* Money line */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: BRAND.BORDER2 }}>
        <View>
          <Text style={{ fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3 }}>
            {lang === 'ar' ? 'رسوم التوصيل' : (lang === 'en' ? 'Delivery Fee' : 'Frais livraison')}
          </Text>
          <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 17, color: BRAND.RED }}>{fee} DH</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3 }}>
            {lang === 'ar' ? 'المجموع' : (lang === 'en' ? 'Total' : 'Total commande')}
          </Text>
          <Text style={{ fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT }}>{total} DH</Text>
        </View>
      </View>

      {/* CTA Button */}
      <Pressable onPress={tab === 'available' ? onClaim : onOpen} disabled={busy || disabled}
        style={{ marginTop: 12, backgroundColor: disabled ? BRAND.LIGHT : BRAND.RED, paddingVertical: 12, borderRadius: 12, alignItems: 'center', opacity: busy ? 0.6 : 1 }}>
        {busy ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: disabled ? BRAND.TEXT3 : '#fff', fontFamily: FONTS.SEMIBOLD, fontSize: 14 }}>
              {tab === 'available' ? t.claim : (lang === 'ar' ? 'فتح' : (lang === 'en' ? 'Open' : 'Ouvrir'))}
            </Text>}
      </Pressable>
    </View>
  );
}

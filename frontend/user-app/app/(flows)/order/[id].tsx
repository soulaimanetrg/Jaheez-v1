import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
  Animated,
  ScrollView,
  Share,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { BRAND, FONTS, SHADOW_SM } from '../../../constants/brand';
import { useOrder, orderKeys } from '../../../hooks/queries/useOrders';
import { useTranslatedText } from '../../../hooks/useTranslatedText';
import { cancelOrder } from '../../../lib/api';
import { submitReview } from '../../../lib/orderApi';
import { formatDh } from '../../../lib/money';
import { useLangStore } from '../../../store/languageStore';
import { dirItems, dirRow, dirText } from '../../../lib/direction';
import { useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../../../store/cartStore';

const { width: SCREEN_W } = Dimensions.get('window');

const STATUS_META: Record<string, { label: string; label_fr: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'قيد الانتظار', label_fr: 'En attente', color: BRAND.WARN, bg: '#FFF8ED', icon: 'time-outline' },
  confirmed: { label: 'مؤكد', label_fr: 'Confirmé', color: BRAND.BLUE, bg: '#EEF6FF', icon: 'checkmark-circle-outline' },
  preparing: { label: 'قيد التحضير', label_fr: 'Préparation', color: '#F59E0B', bg: '#FFFBEB', icon: 'restaurant-outline' },
  picked_up: { label: 'في الطريق', label_fr: 'En route', color: BRAND.GREEN, bg: '#ECFDF5', icon: 'bicycle-outline' },
  delivered: { label: 'تم التوصيل', label_fr: 'Livré', color: BRAND.GREEN, bg: '#ECFDF5', icon: 'checkmark-circle' },
  completed: { label: 'مكتمل', label_fr: 'Mactamal', color: BRAND.GREEN, bg: '#ECFDF5', icon: 'checkmark-circle' },
  cancelled: { label: 'ملغي', label_fr: 'Annulé', color: BRAND.ERROR, bg: BRAND.RED_LIGHT, icon: 'close-circle' },
};

function formatDate(value: string | undefined, lang: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function parseBilingual(text: string | null | undefined, lang: string, fallback: string = ''): string {
  if (!text) return fallback;
  const parts = text.split('|');
  if (parts.length > 1) {
    if (lang === 'ar') {
      return (parts[0] || '').trim();
    } else {
      return (parts[1] || parts[0] || '').trim();
    }
  }
  return text.trim();
}

function getStoreName(store: any, lang: string, fallback: string = ''): string {
  if (!store) return fallback;
  const nameAr = store.name_ar;
  const nameEn = store.name;
  if (lang === 'ar') {
    if (nameAr) return parseBilingual(nameAr, 'ar');
    return parseBilingual(nameEn, 'ar', fallback);
  } else {
    if (nameEn) return parseBilingual(nameEn, 'fr', fallback);
    return parseBilingual(nameAr, 'fr', fallback);
  }
}

function HeaderBtn({ icon, color, onPress }: { icon: any; color?: string; onPress?: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.headerBtn,
        pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 }
      ]}
      onPress={onPress}
    >
      <AppIcon name={icon} size={20} color={color || BRAND.TEXT} />
    </Pressable>
  );
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, isRTL } = useLangStore();
  const queryClient = useQueryClient();

  const { data: order, isLoading, error } = useOrder(id);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const [activeItemDetails, setActiveItemDetails] = useState<any | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeItemDetails) {
      Animated.spring(sheetAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      sheetAnim.setValue(0);
    }
  }, [activeItemDetails]);

  const closeDetails = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActiveItemDetails(null);
    });
  };

  const scrollY = useRef(new Animated.Value(0)).current;
  const HERO_H = 240;
  const HEADER_HEIGHT = insets.top + 60;

  // Scroll animations for collapsible header
  const heroFade = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.5, HERO_H],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-HERO_H, 0, HERO_H],
    outputRange: [2.0, 1.0, 1.0],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp',
  });

  const heroTranslate = scrollY.interpolate({
    inputRange: [-HERO_H, 0, HERO_H],
    outputRange: [-HERO_H * 0.5, 0, HERO_H * 0.35],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp',
  });

  const diffY = 249 - insets.top;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, diffY * 0.4, diffY * 0.9, diffY],
    outputRange: [0, 0, 0.85, 1],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [
      0, 
      diffY * 0.2, 
      diffY * 0.5, 
      diffY * 0.8, 
      diffY
    ],
    outputRange: [
      diffY, 
      diffY * 0.95, 
      diffY * 0.60, 
      diffY * 0.15, 
      0
    ],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [
      0, 
      diffY * 0.2, 
      diffY * 0.5, 
      diffY * 0.8, 
      diffY
    ],
    outputRange: [
      1, 
      0.99, 
      0.90, 
      0.78, 
      18 / 24
    ],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem('jaheez_rated_orders').then(raw => {
      const rated: string[] = raw ? JSON.parse(raw) : [];
      setAlreadyRated(rated.includes(id));
    }).catch(() => { });
  }, [id]);

  const o0 = order as any;
  const storeName = getStoreName(o0?.store, lang, lang === 'ar' ? 'متجر جاهز' : 'Store');

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Commande de ${storeName} sur l'application Jaheez !`,
      });
    } catch {
      // Share cancellation is not an application error.
    }
  };

  const handleSubmitRating = async () => {
    if (!userRating || !order) return;
    setSubmittingRating(true);
    try {
      const result = await submitReview(id as string, userRating, ratingComment.trim() || undefined);
      if (!result.error || result.error.includes('deja') || result.error.includes('already')) {
        const raw = await AsyncStorage.getItem('jaheez_rated_orders');
        const rated: string[] = raw ? JSON.parse(raw) : [];
        if (!rated.includes(id as string)) {
          await AsyncStorage.setItem('jaheez_rated_orders', JSON.stringify([...rated, id as string]));
        }
        setAlreadyRated(true);
        setRatingSubmitted(true);
        setShowRatingModal(false);
      } else {
        Alert.alert(
          lang === 'ar' ? 'خطأ' : 'Erreur',
          lang === 'ar' ? 'تعذّر إرسال التقييم. حاول مجدداً.' : 'Impossible d’envoyer l’avis. Réessayez.',
        );
      }
    } catch {
      Alert.alert(
        lang === 'ar' ? 'خطأ' : 'Erreur',
        lang === 'ar' ? 'تعذّر إرسال التقييم. تحقق من اتصالك.' : 'Impossible d’envoyer l’avis. Vérifiez votre connexion.',
      );
    } finally {
      setSubmittingRating(false);
    }
  };

  const confirmCancellation = async () => {
    if (!id) return;
    const finalReason = cancelReason === 'other' ? customReason.trim() : cancelReason;
    if (!finalReason) {
      Alert.alert(
        lang === 'ar' ? 'خطأ' : 'Erreur',
        lang === 'ar' ? 'يرجى تحديد أو كتابة سبب إلغاء الطلب.' : 'Veuillez choisir ou écrire une raison d’annulation.',
      );
      return;
    }

    setIsCancelling(true);
    setShowCancelModal(false);
    const { error } = await cancelOrder(id as string, finalReason);
    setIsCancelling(false);

    if (error) {
      Alert.alert(
        lang === 'ar' ? 'خطأ' : 'Erreur',
        lang === 'ar' ? 'تعذّر إلغاء الطلب. ربما تم قبوله بالفعل.' : 'Impossible d’annuler la commande. Elle a peut-être déjà été acceptée.',
      );
    } else {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id as string) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all() });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={BRAND.RED} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.root, styles.centered]}>
        <AppIcon name="cloud-offline-outline" size={48} color={BRAND.TEXT3} />
        <Text style={styles.errorText}>
          {lang === 'ar' ? 'تعذر تحميل تفاصيل الطلب' : 'Impossible de charger la commande'}
        </Text>
        <Pressable
          style={styles.errorBackBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/orders')}
        >
          <Text style={styles.errorBackTxt}>{lang === 'ar' ? 'رجوع' : 'Retour'}</Text>
        </Pressable>
      </View>
    );
  }

  const o = order as any;
  const status = o.status || 'pending';
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  const displayId = `#JHZ-${o.id.slice(0, 8).toUpperCase()}`;
  const storeLogoUrl = o.store?.logo_url || null;
  const storeInitial = storeName.charAt(0);
  const deliveryAddr = o.delivery_address || '';
  const paymentLabel = o.payment_method === 'cash' ? (lang === 'ar' ? 'الدفع عند الاستلام' : 'Paiement à la livraison') : (lang === 'ar' ? 'بطاقة بنكية' : 'Carte bancaire');
  const orderItems: any[] = o.items || [];
  const subtotal = Number(o.subtotal ?? 0);
  const deliveryFee = Number(o.delivery_fee ?? 0);
  const serviceFee = Number(o.service_fee ?? o.service_fee_dh ?? 0);
  const discount = Number(o.discount ?? 0);
  const totalAmount = Number(o.total_amount ?? 0);
  const createdAt = o.created_at || '';
  const isActive = ['confirmed', 'preparing', 'picked_up', 'on_the_way'].includes(status);
  const canRate = (status === 'delivered' || status === 'completed') && !alreadyRated && !ratingSubmitted;
  const hasRated = (status === 'delivered' || status === 'completed') && (alreadyRated || ratingSubmitted);
  const storeCoverUrl = o.store?.cover_url || o.store?.logo_url || null;

  return (
    <View style={styles.root}>
      {/* ─── Fixed header (always visible) ───────────── */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.fixedHeader, { height: HEADER_HEIGHT, paddingTop: insets.top, flexDirection: dirRow(isRTL) }]}
      >
        <Animated.View style={[styles.fixedHeaderBg, { opacity: headerBgOpacity }]} />

        <HeaderBtn
          icon={isRTL ? "arrow-forward" : "arrow-back"}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/orders')}
        />

        <View style={styles.headerCenter}>
          <Animated.Text
            style={[
              styles.headerTitle,
              {
                transform: [
                  { translateY: titleTranslateY },
                  { scale: titleScale },
                ],
              },
            ]}
            numberOfLines={1}
          >
            {storeName}
          </Animated.Text>
        </View>

        <View style={[styles.headerRight, { flexDirection: dirRow(isRTL) }]}>
          <HeaderBtn icon="share-social-outline" onPress={handleShare} />
          <HeaderBtn icon="help-circle-outline" onPress={() => router.push('/(flows)/support-ticket' as any)} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        snapToOffsets={[0, diffY + 16]}
        decelerationRate="fast"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* ── Collapsible cover image header inside scroll list ── */}
        <Animated.View style={[styles.heroWrap, { opacity: heroFade, transform: [{ translateY: heroTranslate }, { scale: heroScale }] }]}>
          <View style={styles.heroClip}>
            {storeCoverUrl ? (
              <Image source={{ uri: storeCoverUrl }} style={styles.coverImg} contentFit="cover" />
            ) : (
              <View style={styles.coverPlaceholder}>
                <AppIcon name="storefront-outline" size={36} color={BRAND.TEXT3} />
              </View>
            )}
          </View>

          {/* Floating store logo overlay (no text, matches store products screen) */}
          <View style={[styles.logoOverlay, isRTL ? { left: 28 } : { right: 28 }]}>
            {storeLogoUrl ? (
              <Image source={{ uri: storeLogoUrl }} style={styles.logoImg} contentFit="cover" />
            ) : (
              <View style={[styles.logoImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' }]}>
                <Text style={{ fontFamily: FONTS.DISPLAY, fontSize: 24, color: BRAND.RED }}>{storeInitial}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <View style={styles.simpleContainer}>
          {/* Store title placeholder to preserve spacing for the morphing title */}
          <View style={{ height: 36, width: '100%', marginBottom: 12 }} />

          <View style={[styles.storeTitleRow, { alignItems: dirItems(isRTL) }]}>
            <Text style={[styles.simpleOrderDate, { textAlign: dirText(isRTL) }]}>{formatDate(createdAt, lang)}</Text>
            <Text style={[styles.simpleOrderId, { textAlign: dirText(isRTL) }]}>{displayId}</Text>
          </View>

          <View style={styles.simpleDivider} />

          {/* Delivery route addresses section */}
          <Text style={[styles.simpleSectionTitle, { textAlign: dirText(isRTL) }]}>
            {lang === 'ar' ? 'تفاصيل التوصيل' : 'Détails de livraison'}
          </Text>
          <View style={styles.routeContainer}>
            <View style={[styles.routeLine, isRTL ? { right: 13, left: undefined } : { left: 13, right: undefined }]} />
            <View style={[styles.routePoint, { flexDirection: dirRow(isRTL) }]}>
              <View style={[styles.routeDot, { backgroundColor: BRAND.RED }]} />
              <View style={[styles.routeInfo, { alignItems: dirItems(isRTL), [isRTL ? 'marginRight' : 'marginLeft']: 14 }]}>
                <Text style={styles.routeLabel}>{lang === 'ar' ? 'من (المحل)' : 'De (Magasin)'}</Text>
                <Text style={styles.routeValue}>{storeName}</Text>
                {o.store?.address ? (
                  <Text style={[styles.routeSub, { textAlign: dirText(isRTL) }]}>{o.store.address}</Text>
                ) : null}
              </View>
            </View>
            <View style={[styles.routePoint, { marginTop: 16, flexDirection: dirRow(isRTL) }]}>
              <View style={[styles.routeDot, { backgroundColor: BRAND.GREEN }]} />
              <View style={[styles.routeInfo, { alignItems: dirItems(isRTL), [isRTL ? 'marginRight' : 'marginLeft']: 14 }]}>
                <Text style={styles.routeLabel}>{lang === 'ar' ? 'إلى (الزبون)' : 'À (Client)'}</Text>
                <Text style={styles.routeValue}>{o.user?.name || o.user_id || (lang === 'ar' ? 'زبون جاهز' : 'Client')}</Text>
                <Text style={[styles.routeSub, { textAlign: dirText(isRTL) }]}>{deliveryAddr}</Text>
                {o.notes ? (
                  <View style={{ marginTop: 12, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6', width: '100%' }}>
                    <Text style={{ fontFamily: FONTS.MEDIUM, fontSize: 11, color: '#9CA3AF', textAlign: dirText(isRTL) }}>
                      {lang === 'ar' ? 'تعليمات التوصيل' : 'Instructions de livraison'}
                    </Text>
                    <Text style={{ fontFamily: FONTS.BODY, fontSize: 13, color: '#4B5563', marginTop: 2, textAlign: dirText(isRTL) }}>
                      {o.notes}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.simpleDivider} />

          {/* Order items */}
          <Text style={[styles.simpleSectionTitle, { textAlign: dirText(isRTL) }]}>
            {lang === 'ar' ? 'الأصناف المطلوبة' : 'Articles commandés'}
          </Text>
          {orderItems.map((item: any, index: number) => {
            const itemName = item.menu_item?.name_ar || item.menu_item?.name || item.name || (lang === 'ar' ? 'منتج' : 'Article');
            const qty = Number(item.quantity ?? 1);
            const unitPrice = Number(item.unit_price ?? item.price ?? 0);
            const lineTotal = Number(item.total_price ?? item.line_total ?? unitPrice * qty);
            return (
              <Pressable
                key={item.id ?? index}
                onPress={() => setActiveItemDetails(item)}
                style={[styles.simpleItemRow, { flexDirection: dirRow(isRTL) }]}
              >
                <View style={[styles.simpleItemLeft, { alignItems: dirItems(isRTL) }]}>
                  <Text style={[styles.simpleItemName, { textAlign: dirText(isRTL) }]}>{itemName}</Text>
                  {item.options && item.options.length > 0 && (
                    <Text style={[styles.itemOptionsSummary, { textAlign: dirText(isRTL) }]} numberOfLines={2}>
                      {item.options.map((o: any) => o.choice_name || o.name || '').filter(Boolean).join(', ')}
                    </Text>
                  )}
                  <Text style={styles.simpleItemQty}>x{qty} · {formatDh(unitPrice)}</Text>
                </View>
                <Text style={styles.simpleItemPrice}>{formatDh(lineTotal)}</Text>
              </Pressable>
            );
          })}

          <View style={styles.simpleDivider} />

          {/* Payment summary */}
          <Text style={[styles.simpleSectionTitle, { textAlign: dirText(isRTL) }]}>
            {lang === 'ar' ? 'الدفع' : 'Paiement'}
          </Text>
          <View style={styles.simpleSummaryBlock}>
            <PriceRow label={lang === 'ar' ? 'المنتجات' : 'Produits'} value={formatDh(subtotal)} isRTL={isRTL} />
            <PriceRow label={lang === 'ar' ? 'التوصيل' : 'Livraison'} value={formatDh(deliveryFee)} isRTL={isRTL} />
            {serviceFee > 0 ? (
              <PriceRow label={lang === 'ar' ? 'رسوم الخدمة' : 'Frais de service'} value={formatDh(serviceFee)} isRTL={isRTL} />
            ) : null}
            {discount > 0 ? <PriceRow label={lang === 'ar' ? 'الخصم' : 'Réduction'} value={`-${formatDh(discount)}`} valueColor={BRAND.GREEN} isRTL={isRTL} /> : null}
            <View style={styles.simpleDividerMini} />
            <View style={[styles.simplePriceRow, { flexDirection: dirRow(isRTL) }]}>
              <Text style={styles.simpleTotalLabel}>{lang === 'ar' ? 'المجموع' : 'Total'}</Text>
              <Text style={styles.simpleTotalValue}>{formatDh(totalAmount)}</Text>
            </View>
          </View>

          <View style={styles.simpleDivider} />

          {/* Metadata info */}
          <View style={[styles.metaInfoRow, { flexDirection: dirRow(isRTL) }]}>
            <Text style={styles.metaInfoLabel}>{lang === 'ar' ? 'طريقة الدفع' : 'Mode de paiement'}</Text>
            <Text style={styles.metaInfoVal}>{paymentLabel}</Text>
          </View>
          <View style={[styles.metaInfoRow, { flexDirection: dirRow(isRTL) }]}>
            <Text style={styles.metaInfoLabel}>{lang === 'ar' ? 'حالة الطلب' : 'Statut'}</Text>
            <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
              <Text style={[styles.statusText, { color: meta.color }]}>{lang === 'ar' ? meta.label : meta.label_fr}</Text>
            </View>
          </View>

          {/* Rating Card if applicable */}
          {canRate && (
            <Pressable style={[styles.simpleRateCard, { flexDirection: dirRow(isRTL) }]} onPress={() => setShowRatingModal(true)}>
              <AppIcon name="star" size={20} color={BRAND.YELLOW_DARK} />
              <View style={[styles.rateCardInfo, { alignItems: dirItems(isRTL) }]}>
                <Text style={styles.rateCardTitle}>{lang === 'ar' ? 'كيف كانت تجربتك؟' : 'Comment était votre expérience ?'}</Text>
                <Text style={styles.rateCardSub}>{lang === 'ar' ? `قيّم ${storeName} وساعد الآخرين` : `Notez ${storeName} et aidez les autres clients`}</Text>
              </View>
            </Pressable>
          )}

          {hasRated && (
            <View style={[styles.simpleRateCard, { backgroundColor: '#F0FDF4', flexDirection: dirRow(isRTL) }]}>
              <AppIcon name="checkmark-circle" size={20} color={BRAND.GREEN} />
              <View style={[styles.rateCardInfo, { alignItems: dirItems(isRTL) }]}>
                <Text style={[styles.rateCardTitle, { color: '#166534' }]}>{lang === 'ar' ? 'شكراً على تقييمك!' : 'Merci pour votre avis !'}</Text>
                <Text style={[styles.rateCardSub, { color: '#166534' }]}>{lang === 'ar' ? 'تقييمك يساعد في تحسين الخدمة' : 'Votre avis aide à améliorer le service.'}</Text>
              </View>
            </View>
          )}

          {/* Main action CTAs */}
          {((status === 'pending' || status === 'pending_moderation' || status === 'pending_driver') || isActive) && (
            <View style={styles.simpleActionsWrap}>
              {(status === 'pending' || status === 'pending_moderation' || status === 'pending_driver') && (
                <Pressable
                  style={styles.simpleCancelBtn}
                  onPress={() => {
                    setCancelReason('');
                    setCustomReason('');
                    setShowCancelModal(true);
                  }}
                  disabled={isCancelling}
                >
                  {isCancelling ? <ActivityIndicator size="small" color={BRAND.ERROR} /> : <Text style={styles.simpleCancelText}>{lang === 'ar' ? 'إلغاء الطلب' : 'Annuler la commande'}</Text>}
                </Pressable>
              )}
              
              {isActive && (
                <Pressable
                  style={styles.simpleTrackBtn}
                  onPress={() => router.push({ pathname: '/(flows)/tracking/[id]' as any, params: { id: o.id } })}
                >
                  <Text style={styles.simpleTrackText}>{lang === 'ar' ? 'تتبع' : 'Suivre'}</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* ── Rating Modal ── */}
      <Modal visible={showRatingModal} transparent animationType="slide" onRequestClose={() => setShowRatingModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowRatingModal(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetLogo}>
              {storeLogoUrl ? <Image source={{ uri: storeLogoUrl }} style={styles.sheetLogoImg} /> : <Text style={styles.sheetLogoText}>{storeInitial}</Text>}
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.sheetTitle}>{lang === 'ar' ? 'قيّم تجربتك' : 'Noter votre expérience'}</Text>
              <Text style={styles.sheetSub}>{storeName}</Text>
            </View>
          </View>

          <Text style={styles.ratingInstruction}>{lang === 'ar' ? 'اختر تقييمك' : 'Choisissez votre note'}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(s => (
              <Pressable key={s} onPress={() => setUserRating(s)} accessibilityLabel={`${s} نجوم`}>
                <AppIcon name={s <= userRating ? 'star' : 'star-outline'} size={40} color={s <= userRating ? BRAND.YELLOW_DARK : BRAND.TEXT3} active={s <= userRating} style={{ marginHorizontal: 4 }} />
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.ratingInput}
            placeholder={lang === 'ar' ? 'أخبرنا عن تجربتك مع المتجر والتوصيل... (اختياري)' : 'Dites-nous ce que vous avez pensé du magasin et de la livraison… (optionnel)'}
            placeholderTextColor={BRAND.TEXT3}
            value={ratingComment}
            onChangeText={setRatingComment}
            multiline
            textAlign={isRTL ? 'right' : 'left'}
            textAlignVertical="top"
          />

          <Pressable
            style={[styles.submitButton, (!userRating || submittingRating) && styles.disabledButton]}
            onPress={handleSubmitRating}
            disabled={!userRating || submittingRating}
          >
            {submittingRating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>{lang === 'ar' ? 'إرسال التقييم' : 'Envoyer l’avis'}</Text>}
          </Pressable>
        </View>
      </Modal>

      {/* ── Cancellation Modal ── */}
      <Modal visible={showCancelModal} transparent animationType="slide" onRequestClose={() => setShowCancelModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCancelModal(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />

          <Text style={[styles.sheetTitle, { textAlign: dirText(isRTL) }]}>{lang === 'ar' ? 'سبب إلغاء الطلب' : 'Raison de l’annulation'}</Text>
          <Text style={[styles.cancelSub, { textAlign: dirText(isRTL) }]}>{lang === 'ar' ? 'الإلغاء المتكرر قد يعرض حسابك للتجميد المؤقت' : 'Les annulations répétées peuvent limiter votre compte temporairement.'}</Text>

          <ScrollView style={styles.reasonsScroll} showsVerticalScrollIndicator={false}>
            {[
              { key: 'غيرت رأيي', label: lang === 'ar' ? 'غيرت رأيي' : 'J’ai changé d’avis' },
              { key: 'وقت التوصيل طويل جداً', label: lang === 'ar' ? 'وقت التوصيل طويل جداً' : 'Le délai est trop long' },
              { key: 'أريد تعديل صنف في الطلب', label: lang === 'ar' ? 'أريد تعديل صنف في الطلب' : 'Je veux modifier les articles' },
              { key: 'أريد تعديل العنوان', label: lang === 'ar' ? 'أريد تعديل عنوان التوصيل' : 'Je veux modifier l’adresse' },
              { key: 'other', label: lang === 'ar' ? 'سبب آخر' : 'Autre raison' },
            ].map(item => {
              const selected = cancelReason === item.key;
              return (
                <Pressable
                  key={item.key}
                  style={[styles.reasonRow, selected && styles.reasonRowActive, { flexDirection: dirRow(isRTL) }]}
                  onPress={() => setCancelReason(item.key)}
                >
                  <View style={[styles.radio, selected && styles.radioActive]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.reasonText, selected && styles.reasonTextActive, { textAlign: dirText(isRTL) }]}>{item.label}</Text>
                </Pressable>
              );
            })}

            {cancelReason === 'other' && (
              <TextInput
                style={styles.cancelInput}
                placeholder={lang === 'ar' ? 'يرجى كتابة سبب الإلغاء بالتفصيل...' : 'Veuillez écrire la raison en détail…'}
                placeholderTextColor={BRAND.TEXT3}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                textAlign={isRTL ? 'right' : 'left'}
                textAlignVertical="top"
              />
            )}
          </ScrollView>

          <View style={[styles.sheetActions, { flexDirection: dirRow(isRTL) }]}>
            <Pressable
              style={[styles.confirmCancelButton, (!cancelReason || (cancelReason === 'other' && !customReason.trim())) && styles.disabledButton]}
              onPress={confirmCancellation}
              disabled={!cancelReason || (cancelReason === 'other' && !customReason.trim())}
            >
              <Text style={styles.confirmCancelText}>{lang === 'ar' ? 'تأكيد الإلغاء' : 'Confirmer'}</Text>
            </Pressable>
            <Pressable style={styles.keepButton} onPress={() => setShowCancelModal(false)}>
              <Text style={styles.keepButtonText}>{lang === 'ar' ? 'تراجع' : 'Garder'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Item Details Popup */}
      <Modal
        visible={activeItemDetails !== null}
        transparent
        animationType="none"
        onRequestClose={closeDetails}
      >
        <View style={styles.sheetOverlayContainer}>
          <Pressable style={styles.sheetOverlayBg} onPress={closeDetails} />
          
          <Animated.View
            style={[
              styles.sheetDetailsCard,
              {
                paddingBottom: insets.bottom + 20,
                transform: [
                  {
                    translateY: sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.sheetHandle} />
            
            <View style={[styles.sheetDetailHeader, { flexDirection: dirRow(isRTL) }]}>
              <Text style={styles.sheetDetailTitle}>
                {lang === 'ar' ? 'تفاصيل المنتج' : lang === 'en' ? 'Product Details' : 'Détails du produit'}
              </Text>
              <Pressable style={styles.sheetDetailClose} onPress={closeDetails}>
                <AppIcon name="close" size={22} color="#4B5563" />
              </Pressable>
            </View>

            {activeItemDetails && (() => {
              const itemName = activeItemDetails.menu_item?.name_ar || activeItemDetails.menu_item?.name || activeItemDetails.name || (lang === 'ar' ? 'منتج' : 'Article');
              const itemImage = activeItemDetails.menu_item?.image_url || activeItemDetails.image_url || null;
              const itemPrice = Number(activeItemDetails.unit_price ?? activeItemDetails.price ?? 0);
              const qty = Number(activeItemDetails.quantity ?? 1);
              const opts = activeItemDetails.options || activeItemDetails.selected_options || [];

              return (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
                  <View style={[styles.sheetRowMain, { flexDirection: dirRow(isRTL) }]}>
                    {itemImage ? (
                      <Image source={{ uri: itemImage }} style={styles.sheetDetailImage} contentFit="cover" />
                    ) : (
                      <View style={[styles.sheetDetailImage, styles.sheetDetailImagePlaceholder]}>
                        <AppIcon name="restaurant-outline" size={28} color={BRAND.TEXT3} />
                      </View>
                    )}
                    <View style={[styles.sheetDetailMeta, { alignItems: dirItems(isRTL) }]}>
                      <Text style={[styles.sheetDetailName, { textAlign: dirText(isRTL) }]}>
                        {lang === 'ar'
                          ? parseBilingual(activeItemDetails.menu_item?.name_ar || activeItemDetails.name_ar || activeItemDetails.name, 'ar')
                          : parseBilingual(activeItemDetails.menu_item?.name || activeItemDetails.name || activeItemDetails.name_ar, lang)}
                      </Text>
                      <Text style={styles.sheetDetailPrice}>{formatDh(itemPrice)}</Text>
                    </View>
                  </View>

                  {opts.length > 0 ? (
                    <View style={styles.supplementsBlock}>
                      <Text style={[styles.supplementsTitle, { textAlign: dirText(isRTL) }]}>
                        {lang === 'ar' ? 'الإضافات والمكونات' : lang === 'en' ? 'Supplements & Options' : 'Suppléments & Options'}
                      </Text>
                      {opts.map((opt: any, optIdx: number) => (
                        <View key={`${opt.id || opt.choice_id}-${optIdx}`} style={[styles.supplementRow, { flexDirection: dirRow(isRTL) }]}>
                          <View style={{ flex: 1, alignItems: dirItems(isRTL) }}>
                            <Text style={styles.supplementGroupLabel}>{opt.option_label}</Text>
                            <Text style={styles.supplementChoiceLabel}>{opt.choice_name || opt.name}</Text>
                          </View>
                          {opt.price_delta > 0 && (
                            <Text style={styles.supplementPrice}>+{formatDh(opt.price_delta)}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noSupplementsBox}>
                      <Text style={styles.noSupplementsText}>
                        {lang === 'ar' ? 'لا توجد إضافات محددة لهذا المنتج.' : lang === 'en' ? 'No extra supplements selected.' : 'Aucun supplément sélectionné.'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.sheetDetailTotalSection}>
                    <View style={styles.sheetDetailDivider} />
                    <View style={[styles.sheetDetailTotalRow, { flexDirection: dirRow(isRTL) }]}>
                      <Text style={styles.sheetDetailTotalLabel}>
                        {lang === 'ar' ? 'المجموع الفرعي' : lang === 'en' ? 'Subtotal' : 'Sous-total'} ({qty} x)
                      </Text>
                      <Text style={styles.sheetDetailTotalValue}>
                        {formatDh(itemPrice * qty)}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              );
            })()}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function PriceRow({
  label,
  value,
  valueColor,
  valueStyle,
  labelStyle,
  isRTL,
}: {
  label: string;
  value: string;
  valueColor?: string;
  valueStyle?: any;
  labelStyle?: any;
  isRTL: boolean;
}) {
  return (
    <View style={[styles.priceRow, { flexDirection: dirRow(isRTL) }]}>
      <Text style={[styles.priceLabel, labelStyle]}>{label}</Text>
      <Text style={[styles.priceValue, valueColor ? { color: valueColor } : null, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 30 },
  errorText: { fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: BRAND.TEXT2, textAlign: 'center' },
  errorBackBtn: { backgroundColor: BRAND.RED, borderRadius: 17, paddingHorizontal: 24, paddingVertical: 13 },
  errorBackTxt: { fontFamily: FONTS.SEMIBOLD, color: '#FFF', fontSize: 14 },

  fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  fixedHeaderBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFFFFF' },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...SHADOW_SM, zIndex: 2 },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  headerTitle: { fontFamily: FONTS.DISPLAY, fontSize: 24, color: BRAND.TEXT, lineHeight: 30, textAlign: 'center' },
  headerRight: { gap: 12, zIndex: 2 },

  heroWrap: { width: SCREEN_W, height: 240, position: 'relative', marginBottom: 50 },
  heroClip: { width: '100%', height: '100%', borderBottomLeftRadius: 22, borderBottomRightRadius: 22, overflow: 'hidden' },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', backgroundColor: BRAND.LIGHT, alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  logoOverlay: { position: 'absolute', bottom: -32, width: 78, height: 78, borderRadius: 21, borderWidth: 2.5, borderColor: '#FFFFFF', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 10 },
  logoImg: { width: '100%', height: '100%' },

  simpleContainer: { paddingHorizontal: 16, paddingTop: 20 },
  storeTitleRow: { marginBottom: 12 },
  simpleOrderDate: { fontFamily: FONTS.BODY, fontSize: 13, color: '#6B7280', marginTop: 4 },
  simpleOrderId: { fontFamily: FONTS.MEDIUM, fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  simpleDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  simpleDividerMini: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },

  simpleSectionTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 15, color: '#111827', marginBottom: 12 },

  routeContainer: { paddingLeft: 8, position: 'relative' },
  routeLine: { position: 'absolute', top: 12, bottom: 12, width: 2, backgroundColor: '#E5E7EB', zIndex: 1 },
  routePoint: { alignItems: 'flex-start' },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, zIndex: 2 },
  routeInfo: { flex: 1 },
  routeLabel: { fontFamily: FONTS.MEDIUM, fontSize: 11, color: '#9CA3AF' },
  routeValue: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: '#111827', marginTop: 2 },
  routeSub: { fontFamily: FONTS.BODY, fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 18 },

  simpleItemRow: { justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  simpleItemLeft: { flex: 1 },
  simpleItemName: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: '#111827' },
  simpleItemQty: { fontFamily: FONTS.BODY, fontSize: 12, color: '#6B7280', marginTop: 2 },
  simpleItemPrice: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: '#111827' },

  simpleSummaryBlock: { width: '100%' },
  priceRow: { justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  priceLabel: { fontFamily: FONTS.BODY, fontSize: 13, color: '#4B5563' },
  priceValue: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: '#111827' },
  simplePriceRow: { justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  simpleTotalLabel: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.RED },
  simpleTotalValue: { fontFamily: FONTS.SEMIBOLD, fontSize: 15, color: '#111827' },

  metaInfoRow: { justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  metaInfoLabel: { fontFamily: FONTS.BODY, fontSize: 13, color: '#4B5563' },
  metaInfoVal: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: '#111827' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontFamily: FONTS.SEMIBOLD, fontSize: 11 },

  simpleRateCard: { alignItems: 'center', gap: 12, backgroundColor: '#FFFDF2', borderWidth: 1, borderColor: '#FFF3C7', padding: 14, borderRadius: 14, marginTop: 14 },
  rateCardInfo: { flex: 1 },
  rateCardTitle: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: '#854D0E' },
  rateCardSub: { fontFamily: FONTS.BODY, fontSize: 12, color: '#854D0E', marginTop: 2 },

  simpleActionsWrap: { marginTop: 20 },
  simpleReorderBtn: { backgroundColor: BRAND.RED, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  simpleReorderText: { fontFamily: FONTS.SEMIBOLD, color: '#FFF', fontSize: 14 },
  simpleCancelBtn: { borderWidth: 1, borderColor: '#EF4444', height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  simpleCancelText: { fontFamily: FONTS.SEMIBOLD, color: '#EF4444', fontSize: 14 },
  simpleTrackBtn: { backgroundColor: BRAND.BLUE, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  simpleTrackText: { fontFamily: FONTS.SEMIBOLD, color: '#FFF', fontSize: 14 },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: BRAND.SURFACE, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 22, paddingTop: 16 },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: BRAND.BORDER2, alignSelf: 'center', marginBottom: 18 },
  sheetHeader: { alignItems: 'center', gap: 12, marginBottom: 18 },
  sheetLogo: { width: 54, height: 54, borderRadius: 18, backgroundColor: BRAND.RED_LIGHT, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  sheetLogoImg: { width: '100%', height: '100%' },
  sheetLogoText: { fontFamily: FONTS.DISPLAY, color: BRAND.RED, fontSize: 20 },
  sheetTitleBlock: { flex: 1 },
  sheetTitle: { fontFamily: FONTS.DISPLAY, color: BRAND.TEXT, fontSize: 18 },
  sheetSub: { fontFamily: FONTS.BODY, color: BRAND.TEXT3, fontSize: 12, marginTop: 2 },
  ratingInstruction: { fontFamily: FONTS.SEMIBOLD, color: BRAND.TEXT2, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 18 },
  ratingInput: { minHeight: 88, borderRadius: 18, backgroundColor: BRAND.BG, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.BODY, color: BRAND.TEXT, fontSize: 14, marginBottom: 18 },
  submitButton: { height: 54, borderRadius: 18, backgroundColor: BRAND.RED, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitButtonText: { fontFamily: FONTS.SEMIBOLD, color: '#FFF', fontSize: 15 },
  disabledButton: { opacity: 0.45 },
  cancelSub: { fontFamily: FONTS.BODY, color: BRAND.RED, fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 16 },
  reasonsScroll: { maxHeight: 300, marginBottom: 14 },
  reasonRow: { alignItems: 'center', gap: 11, borderRadius: 16, backgroundColor: BRAND.BG, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8 },
  reasonRowActive: { backgroundColor: BRAND.RED_LIGHT },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: BRAND.BORDER2, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: BRAND.RED },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND.RED },
  reasonText: { flex: 1, fontFamily: FONTS.MEDIUM, color: BRAND.TEXT2, fontSize: 13 },
  reasonTextActive: { color: BRAND.RED, fontFamily: FONTS.SEMIBOLD },
  cancelInput: { minHeight: 72, borderRadius: 16, backgroundColor: BRAND.BG, padding: 12, fontFamily: FONTS.BODY, color: BRAND.TEXT, marginTop: 4, marginBottom: 8 },
  sheetActions: { gap: 10 },
  confirmCancelButton: { flex: 2, height: 50, borderRadius: 17, backgroundColor: BRAND.RED, alignItems: 'center', justifyContent: 'center' },
  confirmCancelText: { fontFamily: FONTS.SEMIBOLD, color: '#FFF', fontSize: 14 },
  keepButton: { flex: 1, height: 50, borderRadius: 17, backgroundColor: BRAND.LIGHT, alignItems: 'center', justifyContent: 'center' },
  keepButtonText: { fontFamily: FONTS.SEMIBOLD, color: BRAND.TEXT2, fontSize: 14 },

  sheetOverlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetOverlayBg: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetDetailHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sheetDetailTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111827',
  },
  sheetDetailClose: {
    padding: 4,
  },
  sheetScroll: {
    paddingBottom: 16,
  },
  sheetRowMain: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  sheetDetailImage: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  sheetDetailImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDetailMeta: {
    flex: 1,
    gap: 4,
  },
  sheetDetailName: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 16,
    color: '#111827',
  },
  sheetDetailPrice: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.RED,
  },
  supplementsBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  supplementsTitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13.5,
    color: '#374151',
    marginBottom: 12,
  },
  supplementRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  supplementGroupLabel: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: '#9CA3AF',
  },
  supplementChoiceLabel: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 13,
    color: '#111827',
    marginTop: 2,
  },
  supplementPrice: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12.5,
    color: BRAND.GREEN,
  },
  itemOptionsSummary: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  noSupplementsBox: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  noSupplementsText: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  sheetDetailTotalSection: {
    marginTop: 16,
  },
  sheetDetailDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
  },
  sheetDetailTotalRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetDetailTotalLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14.5,
    color: '#374151',
  },
  sheetDetailTotalValue: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 18,
    color: '#111827',
  },
});

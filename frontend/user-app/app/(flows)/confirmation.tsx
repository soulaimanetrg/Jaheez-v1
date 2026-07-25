import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND, FONTS } from '../../constants/brand';
import { useOrder } from '../../hooks/queries/useOrders';
import { Loader, EmptyState } from '../../components/ui';
import { HapticTab } from '../../components/ui/HapticTab';
import { AppIcon } from '@/components/ui/AppIcon';

const { width: W } = Dimensions.get('window');

function isOrderId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f-]{8,}$/i.test(value);
}

export default function ConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrder(orderId);

  // Entrance animations
  const circleScale   = useRef(new RNAnimated.Value(0)).current;
  const checkOpacity  = useRef(new RNAnimated.Value(0)).current;
  const textOpacity   = useRef(new RNAnimated.Value(0)).current;
  const textTranslate = useRef(new RNAnimated.Value(20)).current;
  const cardOpacity   = useRef(new RNAnimated.Value(0)).current;
  const cardTranslate = useRef(new RNAnimated.Value(30)).current;

  useEffect(() => {
    RNAnimated.spring(circleScale, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 12 }).start();
    RNAnimated.timing(checkOpacity, { toValue: 1, duration: 300, delay: 300, useNativeDriver: true }).start();
    RNAnimated.timing(textOpacity, { toValue: 1, duration: 400, delay: 500, useNativeDriver: true }).start();
    RNAnimated.timing(textTranslate, { toValue: 0, duration: 400, delay: 500, useNativeDriver: true }).start();
    RNAnimated.timing(cardOpacity, { toValue: 1, duration: 400, delay: 700, useNativeDriver: true }).start();
    RNAnimated.timing(cardTranslate, { toValue: 0, duration: 400, delay: 700, useNativeDriver: true }).start();
  }, []);

  const btnScale = useRef(new RNAnimated.Value(1)).current;

  if (isLoading) return <Loader />;

  const hasRealOrder = isOrderId(orderId);
  if (!hasRealOrder) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <EmptyState
          title="Commande introuvable"
          subtitle="Impossible d'afficher la confirmation sans identifiant de commande valide."
        />
      </View>
    );
  }
  const priceRaw    = (order as any)?.total_amount ?? (order as any)?.estimated_price ?? (order as any)?.final_price ?? 0;
  const priceDH    = priceRaw > 0 ? Number(priceRaw).toFixed(2) : null;
  const dropoff     = (order as any)?.dropoff_address ?? 'عنوان التوصيل';
  const displayId   = `#JHZ-${orderId.slice(0, 8).toUpperCase()}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Success circle */}
      <RNAnimated.View style={[styles.circleWrap, { transform: [{ scale: circleScale }] }]}>
        <LinearGradient
          colors={['#22C55E', '#16A34A']}
          style={styles.circle}
        >
          <RNAnimated.Text style={[styles.checkmark, { opacity: checkOpacity }]} accessibilityLabel="Order confirmed">
            ✓
          </RNAnimated.Text>
        </LinearGradient>
      </RNAnimated.View>

      {/* Title & reference */}
      <RNAnimated.View style={[styles.centerContent, { opacity: textOpacity, transform: [{ translateY: textTranslate }] }]}>
        <Text style={styles.title}>تم إرسال طلبك!</Text>
        <Text style={styles.orderId}>{displayId}</Text>
        {priceDH && <Text style={styles.price}>{priceDH} DH</Text>}
      </RNAnimated.View>

      {/* Info card */}
      <RNAnimated.View style={[styles.infoCard, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>
        <View style={styles.infoRow}>
          <Text style={styles.infoEmoji}>🕐</Text>
          <Text style={styles.infoText}>سيتم تعيين سائق خلال دقائق</Text>
        </View>
        <View style={[styles.infoRow, styles.infoRowBorder]}>
          <Text style={styles.infoEmoji}>📍</Text>
          <Text style={styles.infoText} numberOfLines={2}>{dropoff}</Text>
        </View>
        <View style={[styles.infoRow, styles.infoRowBorder]}>
          <Text style={styles.infoEmoji}>⏱️</Text>
          <Text style={styles.infoText}>الوقت المتوقع: 20-40 دقيقة</Text>
        </View>
      </RNAnimated.View>

      {/* Action buttons */}
      <RNAnimated.View style={[styles.buttonsWrap, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>
        {/* Track button — only when we have a real order ID */}
        {hasRealOrder && (
          <RNAnimated.View style={[styles.primaryBtnWrap, { transform: [{ scale: btnScale }] }]}>
            <Pressable
              onPress={() => router.push({ pathname: '/(flows)/tracking/[id]' as any, params: { id: orderId } })}
              onPressIn={() => { RNAnimated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start(); }}
              onPressOut={() => { RNAnimated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 50 }).start(); }}
              accessibilityLabel="تتبع طلبك"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[BRAND.RED, BRAND.RED_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>تتبع طلبك</Text>
              </LinearGradient>
            </Pressable>
          </RNAnimated.View>
        )}

        {/* Home ghost */}
        <HapticTab
          scaleDown={0.96}
          style={styles.ghostBtn}
          onPress={() => router.replace('/(tabs)' as any)}
          accessibilityLabel="العودة للرئيسية"
          accessibilityRole="button"
        >
          <Text style={styles.ghostBtnText}>العودة للرئيسية</Text>
        </HapticTab>

        {/* My Orders */}
        <HapticTab
          scaleDown={0.96}
          style={styles.ordersBtn}
          onPress={() => router.push('/(tabs)/orders' as any)}
          accessibilityLabel="طلباتي"
          accessibilityRole="button"
        >
          <AppIcon name="receipt-outline" size={18} color={BRAND.TEXT2} />
          <Text style={styles.ordersBtnText}>طلباتي</Text>
        </HapticTab>
      </RNAnimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.BG,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  circleWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  circle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  checkmark: { fontSize: 48, color: '#FFFFFF', fontFamily: FONTS.DISPLAY },

  centerContent: { alignItems: 'center', marginBottom: 32 },
  title: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 26,
    color: BRAND.TEXT,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  orderId: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14,
    color: BRAND.TEXT2,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  price: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 34,
    color: BRAND.RED,
    letterSpacing: -1,
  },

  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  infoRowBorder: { borderTopWidth: 0.5, borderTopColor: '#F0EEEC' },
  infoEmoji: { fontSize: 20 },
  infoText: { flex: 1, fontFamily: FONTS.MEDIUM, fontSize: 14, color: BRAND.TEXT2, lineHeight: 20 },

  buttonsWrap: { width: '100%', gap: 12 },
  primaryBtnWrap: { borderRadius: 999, overflow: 'hidden', shadowColor: BRAND.RED, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 6 },
  primaryBtn: { height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontFamily: FONTS.SEMIBOLD, fontSize: 17, color: '#FFFFFF' },

  ghostBtn: { height: 56, borderRadius: 999, borderWidth: 0.5, borderColor: '#EDE8E5', alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { fontFamily: FONTS.SEMIBOLD, fontSize: 16, color: BRAND.TEXT2 },

  ordersBtn: { height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  ordersBtnText: { fontFamily: FONTS.SEMIBOLD, fontSize: 15, color: BRAND.TEXT2 },
});

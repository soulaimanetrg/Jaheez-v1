import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { CheckoutQuote } from '@shared/types';
import { BRAND, FONTS } from '@/constants/brand';
import { AppIcon } from '@/components/ui/AppIcon';
import { formatCartMoney } from '../cartFormatters';

/* ── Types ───────────────────────────────────────────────── */
type Labels = {
  loading: string;
  unavailable: string;
  retry: string;
  products: string;
  deliveryFee: string;
  serviceFee: string;
  discount: string;
  total: string;
};

type Props = {
  quote?: CheckoutQuote;
  isLoading: boolean;
  isUpdating: boolean;
  errorText: string;
  isRTL: boolean;
  labels: Labels;
  onRetry: () => void;
};

/* ── Shared shimmer interpolation ────────────────────────── */
function useShimmerOpacity(anim: Animated.Value) {
  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.72] });
}

/* ── Inline value skeleton (replaces price text during update) */
function ValueSkeleton({
  shimmer,
  size = 'normal',
}: {
  shimmer: Animated.Value;
  size?: 'normal' | 'large';
}) {
  const opacity = useShimmerOpacity(shimmer);
  return (
    <Animated.View
      style={[sk.valueBlock, size === 'large' && sk.valueLarge, { opacity }]}
    />
  );
}

/* ── Red sliding progress bar (card top, shown during update) */
// Runs alongside the value-cell shimmer — gives a clear directional motion
// while shimmer shows which values are refreshing.
function RefreshProgress({ active }: { active: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      anim.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      anim.stopAnimation();
      anim.setValue(0);
    }
  }, [active, anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 520],
  });

  return (
    <View style={rp.track} pointerEvents="none">
      <Animated.View
        style={[
          rp.bar,
          { transform: [{ translateX }], opacity: active ? 0.82 : 0 },
        ]}
      />
    </View>
  );
}

/* ── Full-row skeleton (initial load only) ───────────────── */
function SkeletonRow({ shimmer, wide }: { shimmer: Animated.Value; wide?: boolean }) {
  const opacity = useShimmerOpacity(shimmer);
  return (
    <View style={sk.row}>
      <Animated.View style={[sk.block, { width: wide ? '55%' : '40%', opacity }]} />
      <Animated.View style={[sk.block, { width: 64, opacity }]} />
    </View>
  );
}

function TotalsSkeletonCard({ isRTL: _isRTL }: { isRTL: boolean }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  return (
    <View style={styles.card}>
      <View style={styles.rows}>
        <SkeletonRow shimmer={shimmer} />
        <SkeletonRow shimmer={shimmer} wide />
        <SkeletonRow shimmer={shimmer} />
        <View style={styles.divider} />
        <SkeletonRow shimmer={shimmer} wide />
      </View>
    </View>
  );
}

/* ── Individual line row ─────────────────────────────────── */
function LineRow({
  icon,
  label,
  value,
  isRTL,
  shimmer,
}: {
  icon: string;
  label: string;
  value: string;
  isRTL: boolean;
  shimmer: Animated.Value | null;
}) {
  return (
    <View style={[styles.lineRow, isRTL && styles.rowReverse]}>
      <View style={[styles.lineLeft, isRTL && styles.rowReverse]}>
        <AppIcon name={icon as any} size={15} color={BRAND.TEXT3} />
        <Text style={[styles.lineLabel, isRTL && styles.textRight]}>{label}</Text>
      </View>
      {shimmer
        ? <ValueSkeleton shimmer={shimmer} />
        : <Text style={styles.lineValue}>{value}</Text>
      }
    </View>
  );
}

/* ── Discount pill ───────────────────────────────────────── */
function DiscountRow({
  label,
  value,
  isRTL,
  shimmer,
}: {
  label: string;
  value: string;
  isRTL: boolean;
  shimmer: Animated.Value | null;
}) {
  return (
    <View style={[styles.lineRow, isRTL && styles.rowReverse]}>
      <View style={[styles.lineLeft, isRTL && styles.rowReverse]}>
        <AppIcon name="pricetag" size={14} color={BRAND.GREEN} />
        <Text style={[styles.discountLabel, isRTL && styles.textRight]}>{label}</Text>
      </View>
      {shimmer
        ? <ValueSkeleton shimmer={shimmer} />
        : (
          <View style={styles.discountPill}>
            <Text style={styles.discountPillText}>{value}</Text>
          </View>
        )
      }
    </View>
  );
}

/* ── Main component ──────────────────────────────────────── */
function CartQuoteTotalsComponent({
  quote,
  isLoading,
  isUpdating,
  errorText,
  isRTL,
  labels,
  onRetry,
}: Props) {
  // One-shot fade-in on first data arrival — never resets opacity
  const fadeAnim = useRef(new Animated.Value(quote ? 1 : 0)).current;
  const hasAnimated = useRef(!!quote);

  useEffect(() => {
    if (quote && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [quote, fadeAnim]);

  // Shared shimmer for the "updating" state — drives all value cells simultaneously
  const updateShimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isUpdating && !errorText) {
      updateShimmer.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(updateShimmer, { toValue: 1, duration: 520, useNativeDriver: false }),
          Animated.timing(updateShimmer, { toValue: 0, duration: 520, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isUpdating, errorText, updateShimmer]);

  // Pass the live shimmer to rows when updating; null otherwise
  const activeShimmer: Animated.Value | null =
    isUpdating && !errorText ? updateShimmer : null;

  // Initial loading — show full skeleton
  if (isLoading && !quote) return <TotalsSkeletonCard isRTL={isRTL} />;

  // Error without any quote — full error card
  if (!isLoading && !quote) {
    return (
      <View style={styles.card}>
        <View style={styles.rows}>
          <View style={styles.errorBox}>
            <AppIcon name="alert-circle-outline" size={20} color={BRAND.ERROR} />
            <Text style={[styles.errorText, isRTL && styles.textRight]}>
              {errorText || labels.unavailable}
            </Text>
          </View>
          <Pressable
            style={styles.retryButton}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={labels.retry}
          >
            <AppIcon name="refresh-outline" size={14} color={BRAND.RED} />
            <Text style={styles.retryText}>{labels.retry}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!quote) return null;

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      {/* Sliding red progress bar at card top — visible during update */}
      <RefreshProgress active={activeShimmer !== null} />

      {/* Error badge (stale quote) — top-right, non-intrusive */}
      {errorText ? (
        <Pressable
          style={styles.compactRetry}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={labels.retry}
        >
          <Text style={styles.compactRetryText}>↻</Text>
        </Pressable>
      ) : null}

      {/* Line items — price values come 100% from server quote */}
      <View style={styles.rows}>
        <LineRow
          icon="cart-outline"
          label={labels.products}
          value={formatCartMoney(quote.subtotal_dh)}
          isRTL={isRTL}
          shimmer={activeShimmer}
        />
        <LineRow
          icon="bicycle-outline"
          label={labels.deliveryFee}
          value={formatCartMoney(quote.delivery_fee_dh)}
          isRTL={isRTL}
          shimmer={activeShimmer}
        />
        <LineRow
          icon="shield-checkmark-outline"
          label={labels.serviceFee}
          value={formatCartMoney(quote.service_fee_dh)}
          isRTL={isRTL}
          shimmer={activeShimmer}
        />

        {quote.discount_dh > 0 && (
          <DiscountRow
            label={labels.discount}
            value={`-${formatCartMoney(quote.discount_dh)}`}
            isRTL={isRTL}
            shimmer={activeShimmer}
          />
        )}

        <View style={styles.divider} />
      </View>

      {/* Grand total block */}
      <View style={[styles.totalBlock, isRTL && styles.rowReverse]}>
        <Text style={[styles.totalLabel, isRTL && styles.textRight]}>{labels.total}</Text>
        {activeShimmer
          ? <ValueSkeleton shimmer={activeShimmer} size="large" />
          : <Text style={styles.totalValue}>{formatCartMoney(quote.total_dh)}</Text>
        }
      </View>
    </Animated.View>
  );
}

export const CartQuoteTotals = React.memo(CartQuoteTotalsComponent);

/* ── Styles ────────────────────────────────────────────── */
const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: BRAND.SURFACE,
    borderRadius: 16,
    overflow: 'hidden',
  },
  rows: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  compactRetry: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.RED_LIGHT,
    zIndex: 4,
  },
  compactRetryText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 16,
    color: BRAND.RED,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },

  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  lineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  lineLabel: {
    fontFamily: FONTS.BODY,
    fontSize: 13.5,
    color: BRAND.TEXT2,
  },
  lineValue: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13.5,
    color: BRAND.TEXT,
  },

  discountLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13.5,
    color: BRAND.GREEN,
  },
  discountPill: {
    backgroundColor: '#E8FAF2',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: BRAND.GREEN,
  },
  discountPillText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12.5,
    color: BRAND.GREEN,
  },

  divider: {
    height: 1,
    backgroundColor: BRAND.BORDER,
    marginTop: 4,
  },

  totalBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND.YELLOW_LIGHT,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  totalLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.TEXT,
  },
  totalValue: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 18,
    color: BRAND.RED,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  errorText: {
    flex: 1,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.ERROR,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 4,
    height: 38,
    borderRadius: 99,
    paddingHorizontal: 14,
    backgroundColor: BRAND.RED_LIGHT,
  },
  retryText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12.5,
    color: BRAND.RED,
  },
});

/* ── Skeleton styles ────────────────────────────────────── */
const sk = StyleSheet.create({
  /* Full-row skeleton (initial load) */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  block: {
    height: 14,
    borderRadius: 7,
    backgroundColor: BRAND.BORDER,
  },
  /* Inline value skeleton (update state) */
  valueBlock: {
    height: 13,
    width: 62,
    borderRadius: 6,
    backgroundColor: BRAND.BORDER,
  },
  valueLarge: {
    height: 17,
    width: 86,
    borderRadius: 8,
  },
});

/* ── Progress bar styles ─────────────────────────────────── */
const rp = StyleSheet.create({
  // Pinned to the very top of the card; card's overflow:hidden clips the bar.
  track: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
    overflow: 'hidden',
  },
  // The short bar that slides across the track
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 130,
    height: 3,
    backgroundColor: BRAND.RED,
    borderRadius: 99,
  },
});


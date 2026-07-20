/**
 * Animated skeleton loader — now powered by Shimmer.
 * API surface preserved for backward compatibility.
 *
 * Usage:
 *   <SkeletonBox width={120} height={16} borderRadius={8} />
 *   <SkeletonBox width="100%" height={120} />
 */
import React from 'react';
import { StyleProp, ViewStyle, DimensionValue, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Shimmer } from './Shimmer';

type Props = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  delay?: number;
};

export default function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  delay = 0,
}: Props) {
  return (
    <Shimmer
      width={width}
      height={height}
      borderRadius={borderRadius}
      delay={delay}
      style={style}
    />
  );
}

/** Pre-built store card skeleton */
export function StoreCardSkeleton() {
  return (
    <Animated.View style={styles.storeCard}>
      <Shimmer width="100%" height={120} borderRadius={0} />
      <Animated.View style={styles.storeDetails}>
        <Shimmer width="70%" height={14} borderRadius={6} delay={80} />
        <Shimmer width="50%" height={11} borderRadius={6} delay={120} />
        <Shimmer width="85%" height={11} borderRadius={6} delay={160} />
      </Animated.View>
    </Animated.View>
  );
}

/** Pre-built order card skeleton */
export function OrderCardSkeleton() {
  return (
    <Animated.View style={styles.orderCard}>
      <Animated.View style={styles.orderRow}>
        <Shimmer width="35%" height={13} borderRadius={6} />
        <Shimmer width="25%" height={13} borderRadius={6} delay={60} />
      </Animated.View>
      <Shimmer width="55%" height={16} borderRadius={7} delay={100} />
      <Shimmer width="40%" height={11} borderRadius={6} delay={140} />
      <Animated.View style={styles.orderBtnRow}>
        <Shimmer width={80} height={32} borderRadius={10} delay={180} />
        <Shimmer width={80} height={32} borderRadius={10} delay={220} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  storeCard: {
    width: 200,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
  },
  storeDetails: {
    padding: 12,
    gap: 8,
  },
  orderCard: {
    borderRadius: 18,
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 10,
    marginBottom: 12,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
});

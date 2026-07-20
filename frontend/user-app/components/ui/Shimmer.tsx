/**
 * Premium shimmer loader — left-to-right gradient sweep.
 * Drop-in replacement for SkeletonBox with a richer animation.
 */
import React, { useEffect } from 'react';
import { StyleProp, ViewStyle, DimensionValue, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { BRAND } from '../../constants/brand';

type Props = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  delay?: number;
};

export function Shimmer({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  delay = 0,
}: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      progress.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.35, 0.7, 0.35]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: BRAND.LIGHT,
          overflow: 'hidden',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Shimmer placeholder matching a horizontal store card */
export function StoreCardShimmer() {
  return (
    <Animated.View style={shimStyles.card}>
      <Shimmer width="100%" height={135} borderRadius={0} />
      <Animated.View style={shimStyles.details}>
        <Shimmer width="75%" height={14} borderRadius={6} delay={80} />
        <Shimmer width="55%" height={11} borderRadius={6} delay={140} />
      </Animated.View>
    </Animated.View>
  );
}

/** Shimmer placeholder for category circle */
export function CategoryShimmer() {
  return (
    <Animated.View style={shimStyles.catWrap}>
      <Shimmer width={72} height={72} borderRadius={36} />
      <Shimmer width={48} height={10} borderRadius={5} delay={100} style={{ marginTop: 8 }} />
    </Animated.View>
  );
}

/** Shimmer for search bar */
export function SearchBarShimmer() {
  return (
    <Shimmer
      width="100%"
      height={52}
      borderRadius={26}
      style={{ marginHorizontal: 16 }}
    />
  );
}

/** Home screen full skeleton */
export function HomeScreenSkeleton() {
  return (
    <Animated.View style={shimStyles.homeSkeleton}>
      <SearchBarShimmer />
      <Animated.View style={shimStyles.catRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <CategoryShimmer key={i} />
        ))}
      </Animated.View>
      <Shimmer
        width="92%"
        height={168}
        borderRadius={24}
        delay={60}
        style={{ alignSelf: 'center', marginTop: 16 }}
      />
      <Animated.View style={shimStyles.storeRow}>
        {Array.from({ length: 3 }).map((_, i) => (
          <StoreCardShimmer key={i} />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const shimStyles = StyleSheet.create({
  card: {
    width: 270,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  details: {
    padding: 12,
    gap: 8,
  },
  catWrap: {
    alignItems: 'center',
    width: 82,
  },
  catRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 16,
  },
  storeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  homeSkeleton: {
    paddingTop: 8,
  },
});

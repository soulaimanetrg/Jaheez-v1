import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { BRAND } from '../../constants/brand';

export interface ShimmerPlaceholderProps {
  width: number | string;
  height: number | string;
  radius?: number;
}

export function ShimmerPlaceholder({ width, height, radius = 8 }: ShimmerPlaceholderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [BRAND.INPUT_BG, BRAND.BORDER, BRAND.INPUT_BG],
  });

  return (
    <Animated.View
      style={{
        width: width as any,
        height: height as any,
        borderRadius: radius,
        backgroundColor,
        overflow: 'hidden',
      }}
    />
  );
}

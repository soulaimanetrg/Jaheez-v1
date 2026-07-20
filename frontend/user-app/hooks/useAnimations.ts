import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { SCALE_PRESS, SCALE_CARD_PRESS, SPRING_SNAPPY, SPRING_GENTLE, FADE_IN } from '../constants/animations';

export function usePressAnimation(type: 'button' | 'card' = 'button') {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    const targetScale = type === 'card' ? SCALE_CARD_PRESS : SCALE_PRESS;
    Animated.spring(scale, { toValue: targetScale, useNativeDriver: true, speed: 50 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return {
    animatedStyle: { transform: [{ scale }] },
    handlePressIn,
    handlePressOut,
  };
}

export function useStaggerAnimation(index: number, startDelay = 0, staggerDelay = 50) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const totalDelay = startDelay + (index * staggerDelay);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 12, delay: totalDelay }),
      Animated.timing(opacity, { toValue: 1, useNativeDriver: true, duration: FADE_IN.duration, delay: totalDelay }),
    ]).start();
  }, [index, startDelay, staggerDelay]);

  return {
    transform: [{ scale }],
    opacity,
  };
}

export function useFadeIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, useNativeDriver: true, duration: FADE_IN.duration, delay }).start();
  }, [delay]);

  return { opacity };
}

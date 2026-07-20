import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { FADE_IN } from '../../constants/animations';

export interface AnimatedTransitionProps {
  type: 'fade' | 'slide-up' | 'scale';
  children: React.ReactNode;
  delay?: number;
}

export function AnimatedTransition({ type, children, delay = 0 }: AnimatedTransitionProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: FADE_IN.duration, delay, useNativeDriver: true }).start();
  }, [delay]);

  const getStyle = () => {
    switch (type) {
      case 'fade':
        return { opacity: progress };
      case 'slide-up':
        return {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
        };
      case 'scale':
        return {
          opacity: progress,
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
        };
      default:
        return { opacity: 1 };
    }
  };

  return (
    <Animated.View style={getStyle()}>
      {children}
    </Animated.View>
  );
}

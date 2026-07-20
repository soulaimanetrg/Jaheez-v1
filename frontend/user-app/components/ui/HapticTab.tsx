/**
 * Pressable wrapper with scale micro-animation and optional haptic feedback.
 * Use as a drop-in replacement for Pressable on any tappable element.
 */
import React from 'react';
import { Platform, Pressable, PressableProps, Vibration } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ANIM } from '../../constants/brand';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  /** Scale factor when pressed (default 0.97) */
  scaleDown?: number;
  /** Enable haptic vibration on press (default true) */
  haptic?: boolean;
  children: React.ReactNode;
};

export function HapticTab({
  scaleDown = 0.97,
  haptic = true,
  onPressIn,
  onPressOut,
  style,
  children,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(scaleDown, ANIM.SPRING);
    if (haptic && Platform.OS !== 'web') {
      Vibration.vibrate(1);
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, ANIM.SPRING);
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={(state) => {
        const resolvedStyle = typeof style === 'function' ? style(state) : style;
        return [animatedStyle, resolvedStyle];
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

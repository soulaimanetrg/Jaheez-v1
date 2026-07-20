/**
 * Drop-in Pressable replacement with Reanimated spring scale feedback.
 * Replaces the `transform: [{scale: 0.98}]` pressed style pattern.
 */
import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

type Props = PressableProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
};

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export default function AnimatedPressable({
  children,
  style,
  pressedScale = 0.975,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      {...rest}
      style={[style, animStyle]}
      onPressIn={(e) => {
        scale.value = withSpring(pressedScale, { damping: 20, stiffness: 260 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 20, stiffness: 260 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressableBase>
  );
}

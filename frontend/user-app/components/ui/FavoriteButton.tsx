import React from 'react';
import { Pressable, StyleProp, ViewStyle, Platform, Vibration } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { AppIcon } from './AppIcon';
import { BRAND } from '@/constants/brand';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  activeColor?: string;
  inactiveColor?: string;
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = 22,
  style,
  activeColor = BRAND.RED,
  inactiveColor = BRAND.TEXT3,
}: FavoriteButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = (e: any) => {
    e?.stopPropagation?.();
    if (Platform.OS !== 'web') Vibration.vibrate(1);

    scale.value = withSequence(
      withTiming(0.88, { duration: 60, easing: Easing.out(Easing.ease) }),
      withTiming(1.0, { duration: 120, easing: Easing.out(Easing.ease) })
    );

    onToggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Animated.View style={animatedStyle}>
        <AppIcon
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size}
          color={isFavorite ? activeColor : inactiveColor}
          fill={isFavorite ? activeColor : 'none'}
          active={isFavorite}
          filled={isFavorite}
        />
      </Animated.View>
    </Pressable>
  );
}

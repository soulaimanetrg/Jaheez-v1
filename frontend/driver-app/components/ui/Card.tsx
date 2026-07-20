import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { BRAND, RADIUS, SHADOW, SPACE } from '../../constants/brand';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  accessibilityLabel?: string;
}

export function Card({
  children,
  onPress,
  style,
  padding = SPACE.MD,
  accessibilityLabel,
}: CardProps) {
  const cardStyle = [
    styles.card,
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BRAND.SURFACE,
    borderRadius: RADIUS.CARD,
    ...SHADOW,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
});

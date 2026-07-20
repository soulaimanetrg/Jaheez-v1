import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { BRAND, RADIUS, SPACE } from '../../constants/brand';

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
    backgroundColor: 'rgba(255,255,255,0.66)',
    borderRadius: RADIUS.CARD,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
});

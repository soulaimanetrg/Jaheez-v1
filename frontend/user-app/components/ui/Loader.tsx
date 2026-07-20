import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { BRAND, SPACE } from '../../constants/brand';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export function Loader({
  size = 'large',
  color = BRAND.RED,
  fullScreen = false,
}: LoaderProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.BG,
  },
  inline: {
    padding: SPACE.XL,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

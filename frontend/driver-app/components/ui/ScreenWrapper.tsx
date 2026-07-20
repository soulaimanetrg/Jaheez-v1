import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, SPACE } from '../../constants/brand';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  bg?: string;
  padHorizontal?: boolean;
  style?: ViewStyle;
}

export function ScreenWrapper({
  children,
  scroll = true,
  bg = BRAND.BG,
  padHorizontal = true,
  style,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  const content = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        padHorizontal && styles.padH,
        { paddingBottom: insets.bottom + SPACE.XL },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flexFill, padHorizontal && styles.padH, style]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexFill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padH: {
    paddingHorizontal: SPACE.MD,
  },
});

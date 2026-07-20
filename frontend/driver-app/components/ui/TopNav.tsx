import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, FONTS, SIZE, SPACE } from '../../constants/brand';

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  transparent?: boolean;
  lightContent?: boolean;
  style?: ViewStyle;
}

export function TopNav({
  title,
  showBack = true,
  rightElement,
  leftElement,
  transparent = false,
  lightContent = false,
  style,
}: TopNavProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const textColor = lightContent ? '#FFFFFF' : BRAND.TEXT;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
        !transparent && styles.solidBg,
        style,
      ]}
    >
      <View style={styles.row}>
        {/* Left */}
        <View style={styles.side}>
          {leftElement ?? (
            showBack ? (
              <Pressable
                onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                style={styles.backBtn}
                accessibilityLabel="رجوع"
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={24} color={textColor} />
              </Pressable>
            ) : null
          )}
        </View>

        {/* Center */}
        {title && (
          <Text
            style={[styles.title, { color: textColor }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}

        {/* Right */}
        <View style={styles.side}>
          {rightElement}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 10,
  },
  solidBg: {
    backgroundColor: BRAND.SURFACE,
  },
  row: {
    height: SIZE.NAV_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.MD,
  },
  side: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: SIZE.TOUCH_MIN,
    height: SIZE.TOUCH_MIN,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.DISPLAY,
    fontSize: 18,
    letterSpacing: -0.3,
  },
});

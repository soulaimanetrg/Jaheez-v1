import React from 'react';
import { View, Image, Text, StyleSheet, ImageStyle, StyleProp } from 'react-native';
import { BRAND, FONTS, RADIUS } from '../../constants/brand';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function Avatar({ uri, name, size = 56, style }: AvatarProps) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
        accessibilityLabel={name ? `صورة ${name}` : 'صورة المستخدم'}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: BRAND.BORDER,
  },
  placeholder: {
    backgroundColor: BRAND.RED_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: FONTS.DISPLAY,
    color: BRAND.RED,
  },
});

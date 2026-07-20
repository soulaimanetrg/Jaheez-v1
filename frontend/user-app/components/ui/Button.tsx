import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { BRAND, FONTS, RADIUS, SIZE } from '../../constants/brand';
import { useLangStore } from '../../store/languageStore';
import { dirRow } from '../../lib/direction';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'yellow';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isRTL = useLangStore(s => s.isRTL);

  const containerStyle = [
    styles.base,
    { flexDirection: dirRow(isRTL) },
    variantStyles[variant],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    variantTextStyles[variant],
    textStyle,
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        ...containerStyle,
        pressed && !isDisabled && styles.pressed,
      ]}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' || variant === 'yellow' ? BRAND.RED : '#FFFFFF'}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={labelStyle}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: SIZE.BUTTON_HEIGHT,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.982 }],
    opacity: 0.94,
  },
  label: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.15,
  },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: BRAND.RED,
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.66)',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: BRAND.ERROR_RED,
  },
  yellow: {
    backgroundColor: BRAND.YELLOW,
  },
};

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  primary: {
    color: '#FFFFFF',
  },
  secondary: {
    color: BRAND.TEXT,
  },
  ghost: {
    color: BRAND.RED,
  },
  danger: {
    color: '#FFFFFF',
  },
  yellow: {
    color: BRAND.TEXT,
  },
};

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, FONTS, RADIUS, SIZE, SPACE } from '../../constants/brand';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  countryCode?: string;
  onCountryCodePress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  countryCode,
  onCountryCodePress,
  containerStyle,
  secureTextEntry,
  ...textInputProps
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isSecure = secureTextEntry && !showPassword;

  const borderColor = error
    ? BRAND.ERROR
    : focused
    ? BRAND.RED
    : BRAND.BORDER;

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, { borderColor }]}>
        {/* Country code section */}
        {countryCode && (
          <Pressable
            style={styles.countryCode}
            onPress={onCountryCodePress}
            accessibilityLabel="Select country code"
          >
            <Text style={styles.countryCodeText}>{countryCode}</Text>
            <Ionicons name="chevron-down" size={14} color={BRAND.TEXT2} />
            <View style={styles.codeDivider} />
          </Pressable>
        )}

        {/* Left icon */}
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        {/* Input field */}
        <TextInput
          style={[
            styles.input,
            I18nManager.isRTL && styles.inputRTL,
          ]}
          placeholderTextColor={BRAND.TEXT3}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isSecure}
          {...textInputProps}
        />

        {/* Password toggle */}
        {secureTextEntry && (
          <Pressable
            style={styles.iconRight}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={BRAND.TEXT3} />
          </Pressable>
        )}

        {/* Right icon */}
        {rightIcon && !secureTextEntry && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 14,
    color: BRAND.TEXT2,
    marginBottom: SPACE.SM,
  },
  inputContainer: {
    height: SIZE.INPUT_HEIGHT,
    backgroundColor: BRAND.INPUT_BG,
    borderRadius: RADIUS.INPUT,
    borderWidth: 1.5,
    borderColor: BRAND.BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.MD,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: FONTS.BODY,
    fontSize: 16,
    color: BRAND.TEXT,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  inputRTL: {
    textAlign: 'right',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACE.SM,
    gap: 4,
  },
  countryCodeText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.TEXT,
  },
  codeDivider: {
    width: 1,
    height: 24,
    backgroundColor: BRAND.BORDER,
    marginLeft: SPACE.SM,
  },
  iconLeft: {
    marginRight: SPACE.SM,
  },
  iconRight: {
    marginLeft: SPACE.SM,
  },
  error: {
    fontFamily: FONTS.BODY,
    fontSize: 12,
    color: BRAND.ERROR,
    marginTop: SPACE.XS,
  },
});

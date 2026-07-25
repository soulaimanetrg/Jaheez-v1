import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { BRAND, FONTS, RADIUS, SIZE, SPACE } from '../../constants/brand';
import { useLangStore } from '../../store/languageStore';
import { dirRow, dirText } from '../../lib/direction';

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
  const isRTL = useLangStore(s => s.isRTL);
  const isSecure = secureTextEntry && !showPassword;

  const borderColor = error
    ? BRAND.ERROR
    : focused
    ? 'rgba(240,48,48,0.26)'
    : 'transparent';

  return (
    <View style={containerStyle}>
      {label && <Text style={[styles.label, { textAlign: dirText(isRTL) }]}>{label}</Text>}

      <View style={[styles.inputContainer, { borderColor, flexDirection: dirRow(isRTL) }]}>
        {/* Country code section */}
        {countryCode && (
          <Pressable
            style={styles.countryCode}
            onPress={onCountryCodePress}
            accessibilityLabel="Select country code"
          >
            <Text style={styles.countryCodeText}>{countryCode}</Text>
            <AppIcon name="chevron-down" size={13} color={BRAND.TEXT2} />
            <View style={styles.codeDivider} />
          </Pressable>
        )}

        {/* Left icon */}
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        {/* Input field */}
        <TextInput
          style={[
            styles.input,
            { textAlign: dirText(isRTL) },
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
            <AppIcon name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={BRAND.TEXT3} />
          </Pressable>
        )}

        {/* Right icon */}
        {rightIcon && !secureTextEntry && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>

      {error && <Text style={[styles.error, { textAlign: dirText(isRTL) }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.MEDIUM,
    fontSize: 13,
    color: BRAND.TEXT2,
    marginBottom: SPACE.SM,
  },
  inputContainer: {
    height: SIZE.INPUT_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: RADIUS.INPUT,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    alignItems: 'center',
    paddingHorizontal: SPACE.MD,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: FONTS.BODY,
    fontSize: 14,
    color: BRAND.TEXT,
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
    backgroundColor: 'rgba(120,90,55,0.08)',
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

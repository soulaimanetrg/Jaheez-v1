import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { BRAND, FONTS, RADIUS, SPACE } from '../../constants/brand';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
}: OTPInputProps) {
  const refs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (text: string, index: number) => {
    // Only accept digits
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newValue = digits.map((d, i) => (i === index ? digit : d)).join('');
    onChange(newValue);

    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }

    if (digit && index === length - 1) {
      const finalCode = newValue.replace(/\s/g, '');
      if (finalCode.length === length) {
        onComplete?.(finalCode);
      }
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
      const newValue = digits.map((d, i) => (i === index - 1 ? '' : d)).join('');
      onChange(newValue);
    }
  };

  return (
    <View style={styles.container}>
      {digits.map((digit, index) => {
        const isFocused = focusedIndex === index;
        const isFilled = !!digit;

        return (
          <TextInput
            key={index}
            ref={(ref) => { refs.current[index] = ref; }}
            style={[
              styles.box,
              isFocused && styles.boxFocused,
              isFilled && styles.boxFilled,
            ]}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            accessibilityLabel={`OTP digit ${index + 1}`}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACE.SM,
  },
  box: {
    width: 44,
    height: 52,
    borderRadius: RADIUS.INPUT,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    fontFamily: FONTS.DISPLAY,
    fontSize: 20,
    color: BRAND.TEXT,
  },
  boxFocused: {
    borderColor: 'rgba(240,48,48,0.26)',
    borderWidth: 1,
  },
  boxFilled: {
    borderColor: 'transparent',
    backgroundColor: 'rgba(245,206,46,0.16)',
  },
});

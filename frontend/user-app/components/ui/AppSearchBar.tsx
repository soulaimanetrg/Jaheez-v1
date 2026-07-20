import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from './Ionicons';
import { BRAND, FONTS } from '../../constants/brand';

type AppSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  isRTL?: boolean;
  onSubmit?: () => void;
  onClear?: () => void;
  showClear?: boolean;
  showSubmit?: boolean;
  submitIcon?: React.ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  inputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'style'>;
  inputRef?: React.Ref<TextInput>;
};

export function AppSearchBar({
  value,
  onChangeText,
  placeholder,
  isRTL = false,
  onSubmit,
  onClear,
  showClear = false,
  showSubmit = true,
  submitIcon = 'search-outline',
  accessibilityLabel,
  style,
  inputProps,
  inputRef,
}: AppSearchBarProps) {
  return (
    <View style={[styles.searchBar, isRTL && styles.searchBarRtl, style]}>
      <Ionicons name="search-outline" size={20} color={BRAND.TEXT2} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor={BRAND.TEXT3}
        accessibilityLabel={accessibilityLabel}
        style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
        {...inputProps}
      />
      {showClear && value.length > 0 && onClear ? (
        <Pressable
          style={styles.clearButton}
          onPress={onClear}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color={BRAND.TEXT3} />
        </Pressable>
      ) : null}
      {showSubmit && onSubmit ? (
        <Pressable
          style={styles.submitButton}
          onPress={onSubmit}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <Ionicons name={submitIcon} size={18} color={BRAND.SURFACE} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: BRAND.LIGHT,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 6,
  },
  searchBarRtl: {
    flexDirection: 'row-reverse',
    paddingLeft: 6,
    paddingRight: 16,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 0,
    fontFamily: FONTS.BODY,
    fontSize: 14,
    color: BRAND.TEXT,
  },
  clearButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

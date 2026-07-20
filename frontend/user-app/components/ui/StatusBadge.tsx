import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BRAND, FONTS, RADIUS } from '../../constants/brand';
import type { OrderStatus } from '@shared/types';

export interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  pending_moderation:   { bg: BRAND.WARN, text: BRAND.SURFACE },
  pending_driver:       { bg: BRAND.YELLOW, text: BRAND.TEXT },
  driver_assigned:      { bg: BRAND.BLUE, text: BRAND.SURFACE },
  in_progress:          { bg: BRAND.RED, text: BRAND.SURFACE },
  picked_up:            { bg: BRAND.RED, text: BRAND.SURFACE },
  delivered:            { bg: BRAND.GREEN, text: BRAND.SURFACE },
  completed:            { bg: BRAND.GREEN, text: BRAND.SURFACE },
  cancelled:            { bg: BRAND.BORDER, text: BRAND.TEXT2 },
  disputed:             { bg: BRAND.ERROR, text: BRAND.SURFACE },
  moderation_rejected:  { bg: BRAND.ERROR, text: BRAND.SURFACE },
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_moderation:   'قيد المراجعة',
  pending_driver:       'بحث عن سائق',
  driver_assigned:      'تم التعيين',
  in_progress:          'في الطريق',
  picked_up:            'تم الاستلام',
  delivered:            'تم التسليم',
  completed:            'مكتمل',
  cancelled:            'ملغي',
  disputed:             'متنازع عليه',
  moderation_rejected:  'مرفوض',
};

export function StatusBadge({ status, size = 'sm', style }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] ?? { bg: BRAND.BORDER, text: BRAND.TEXT2 };
  const label = STATUS_LABELS[status] ?? 'غير معروف';

  const containerStyle = [
    styles.container,
    size === 'sm' ? styles.smContainer : styles.mdContainer,
    { backgroundColor: colors.bg },
    style,
  ];

  const textStyle = [
    styles.text,
    size === 'sm' ? styles.smText : styles.mdText,
    { color: colors.text },
  ];

  return (
    <View accessibilityLabel={`حالة الطلب: ${label}`} style={containerStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.PILL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mdContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    fontFamily: FONTS.SEMIBOLD,
    textAlign: 'center',
  },
  smText: {
    fontSize: 10,
  },
  mdText: {
    fontSize: 12,
  },
});

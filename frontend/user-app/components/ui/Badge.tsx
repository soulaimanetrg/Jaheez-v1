import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BRAND, FONTS, RADIUS, SPACE } from '../../constants/brand';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: BRAND.BORDER, text: BRAND.TEXT2 },
  success: { bg: '#DCFCE7', text: '#166534' },
  warning: { bg: '#FEF3C7', text: '#92400E' },
  error:   { bg: '#FEE2E2', text: '#991B1B' },
  info:    { bg: '#DBEAFE', text: '#1E40AF' },
};

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const colors = VARIANT_COLORS[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

// ── Order Status Badge ──
type OrderStatusKey =
  | 'pending_moderation'
  | 'pending_driver'
  | 'driver_assigned'
  | 'in_progress'
  | 'picked_up'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'moderation_rejected';

const STATUS_CONFIG: Record<OrderStatusKey, { label: string; variant: BadgeVariant }> = {
  pending_moderation:   { label: 'قيد المراجعة',   variant: 'warning' },
  pending_driver:       { label: 'بحث عن سائق',   variant: 'warning' },
  driver_assigned:      { label: 'تم التعيين',     variant: 'info' },
  in_progress:          { label: 'في الطريق',      variant: 'info' },
  picked_up:            { label: 'تم الاستلام',    variant: 'info' },
  delivered:            { label: 'تم التسليم',     variant: 'success' },
  completed:            { label: 'مكتملة',         variant: 'success' },
  cancelled:            { label: 'ملغاة',          variant: 'error' },
  disputed:             { label: 'متنازع عليه',    variant: 'error' },
  moderation_rejected:  { label: 'مرفوض',          variant: 'error' },
};

interface StatusBadgeProps {
  status: OrderStatusKey;
  style?: ViewStyle;
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'default' as BadgeVariant };
  return <Badge label={config.label} variant={config.variant} style={style} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACE.SM + 4,
    paddingVertical: SPACE.XS,
    borderRadius: RADIUS.PILL,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});

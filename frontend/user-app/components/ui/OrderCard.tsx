import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { BRAND, FONTS, RADIUS } from '../../constants/brand';
import type { Order } from '@shared/types';
import { StatusBadge } from './StatusBadge';

export interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  variant?: 'compact' | 'full';
}

export function OrderCard({ order, onPress, variant = 'compact' }: OrderCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, speed: 42, bounciness: 0 }).start();
  };

  const handlePressOut = () => {
    if (onPress) Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  const formattedDate = new Date(order.created_at).toLocaleDateString('ar-MA', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`طلب: ${order.title}`}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText} numberOfLines={2}>
              {order.title}
            </Text>
          </View>
          <StatusBadge status={order.status} size="sm" />
        </View>

        <View style={styles.footer}>
          <Text style={styles.dateText}>
            {formattedDate}
          </Text>
          <Text style={styles.priceText}>
            {order.final_price || order.estimated_price || '--'} درهم
          </Text>
        </View>

        {variant === 'full' && (
          <View style={styles.detailsContainer}>
            {order.description && (
              <Text style={styles.descriptionText}>
                {order.description}
              </Text>
            )}
            <Text style={styles.addressLabel}>
              الاستلام:{' '}
              <Text style={styles.addressValue}>{order.pickup_address || 'لم يحدد'}</Text>
            </Text>
            <Text style={styles.addressLabel}>
              التسليم:{' '}
              <Text style={styles.addressValue}>{order.dropoff_address}</Text>
            </Text>
            
            {order.driver_id && (
              <View style={styles.driverContainer}>
                <Text style={styles.driverText}>
                  السائق المعين للطلب
                </Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: RADIUS.CARD,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.74)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleText: {
    fontSize: 15,
    color: BRAND.TEXT,
    fontFamily: FONTS.DISPLAY,
    textAlign: 'left',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  dateText: {
    color: BRAND.TEXT2,
    fontFamily: FONTS.BODY,
    fontSize: 13,
  },
  priceText: {
    color: BRAND.RED,
    fontFamily: FONTS.MONO_BOLD,
    fontSize: 16,
  },
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 0,
  },
  descriptionText: {
    marginBottom: 8,
    textAlign: 'left',
    color: BRAND.TEXT2,
    fontFamily: FONTS.BODY,
    fontSize: 13,
  },
  addressLabel: {
    color: BRAND.TEXT,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'left',
  },
  addressValue: {
    fontFamily: FONTS.BODY,
    fontWeight: 'normal',
  },
  driverContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.LIGHT,
    padding: 12,
    borderRadius: RADIUS.INPUT,
    borderWidth: 0,
  },
  driverText: {
    color: BRAND.TEXT,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
  },
});


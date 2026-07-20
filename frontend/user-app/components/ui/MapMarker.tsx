import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BRAND, FONTS, SHADOW_SM } from '../../constants/brand';

export interface MapMarkerProps {
  type: 'driver' | 'pickup' | 'dropoff' | 'user';
  label?: string;
}

export function MapMarker({ type, label }: MapMarkerProps) {
  let markerBg: string = BRAND.RED;
  
  switch (type) {
    case 'driver': markerBg = BRAND.RED; break;
    case 'pickup': markerBg = BRAND.YELLOW; break;
    case 'dropoff': markerBg = BRAND.GREEN; break;
    case 'user': markerBg = BRAND.BLUE; break;
  }

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      )}
      <View style={[styles.marker, { backgroundColor: markerBg }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: BRAND.SURFACE,
    ...SHADOW_SM,
  },
  labelText: {
    color: BRAND.TEXT,
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 12,
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: BRAND.SURFACE,
    ...SHADOW_SM,
  },
});


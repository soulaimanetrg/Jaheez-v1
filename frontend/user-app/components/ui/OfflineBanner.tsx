import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { FONTS } from '../../constants/brand';

export function OfflineBanner() {
  const isOnline  = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-52)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue:         isOnline ? -52 : 0,
      duration:        300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.inner}>
        <AppIcon name="wifi-outline" size={16} color="#FFF" />
        <Text style={styles.text}>تحقق من اتصالك بالإنترنت</Text>
        <AppIcon name="refresh-circle-outline" size={16} color="#FFF" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    zIndex:          9999,
    backgroundColor: '#1C1C1E',
  },
  inner: {
    flexDirection:  'row-reverse',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  text: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize:   13,
    color:      '#FFFFFF',
  },
});

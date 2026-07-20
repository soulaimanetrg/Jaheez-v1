import React, { useEffect } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useJaheezTransition } from '../../hooks/useJaheezTransition';
import { ASSETS } from '../../constants/assets';

const { width, height } = Dimensions.get('window');

export default function JaheezTransitionOverlay() {
  const router = useRouter();
  const {
    isTransitioning,
    originX,
    originY,
    route,
    serviceName,
    finishTransition,
  } = useJaheezTransition();

  const isReducedMotion = useReducedMotion();

  // Animated values
  const overlayScale = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);

  const startX = originX || width / 2;
  const startY = originY || height / 2;

  const getOverlayColor = (name: string | null) => {
    if (!name) return '#F5CE2E';
    const lower = name.toLowerCase();
    if (lower.includes('restauration') || lower.includes('food') || lower.includes('طعام')) {
      return '#F5CE2E'; // Jaheez Yellow
    }
    if (lower.includes('épicerie') || lower.includes('grocery') || lower.includes('بقالة') || lower.includes('courses')) {
      return '#DFF7E9'; // Soft Green
    }
    if (lower.includes('pharmacie') || lower.includes('pharmacy') || lower.includes('صيدلية')) {
      return '#E6F8EF'; // Soft Green/White
    }
    if (lower.includes('colis') || lower.includes('parcel') || lower.includes('طرود')) {
      return '#FFE3EC'; // Soft Pink
    }
    if (lower.includes('envois') || lower.includes('errand') || lower.includes('طلبات')) {
      return '#DDEEFF'; // Soft Blue
    }
    return '#F5CE2E';
  };

  const overlayColor = getOverlayColor(serviceName);

  // Calculate target scale to cover the entire screen from start coordinates
  const distTL = Math.sqrt(startX * startX + startY * startY);
  const distTR = Math.sqrt(Math.pow(width - startX, 2) + startY * startY);
  const distBL = Math.sqrt(startX * startX + Math.pow(height - startY, 2));
  const distBR = Math.sqrt(Math.pow(width - startX, 2) + Math.pow(height - startY, 2));
  const maxRadius = Math.max(distTL, distTR, distBL, distBR);
  
  // Base circle radius is 60 (size 120), add 30px safety padding
  const targetScale = (maxRadius + 30) / 60;

  useEffect(() => {
    if (isTransitioning && route) {
      if (isReducedMotion) {
        overlayOpacity.value = 0;
        overlayOpacity.value = withTiming(1, { duration: 180 }, (finished) => {
          if (finished) {
            runOnJS(handleNavigationReducedMotion)();
          }
        });
      } else {
        // Reset values for start
        overlayScale.value = 0;
        overlayOpacity.value = 1;
        logoOpacity.value = 0;
        logoScale.value = 0.8;

        // 1. Expand circle quickly from tap origin (260ms)
        overlayScale.value = withTiming(
          targetScale,
          {
            duration: 260,
            easing: Easing.bezier(0.16, 1, 0.3, 1), // ultra smooth ease-out
          },
          (finished) => {
            if (finished) {
              runOnJS(handleNavigationAndExit)();
            }
          }
        );

        // 2. Animate logo concurrently (200ms)
        logoOpacity.value = withTiming(1, { duration: 180 });
        logoScale.value = withTiming(1.0, {
          duration: 200,
          easing: Easing.out(Easing.back(1.4)),
        });
      }
    }
  }, [isTransitioning, route]);

  const handleNavigationReducedMotion = () => {
    router.push(route as any);
    setTimeout(() => {
      overlayOpacity.value = withTiming(0, { duration: 180 }, (finished) => {
        if (finished) {
          runOnJS(finishTransition)();
        }
      });
    }, 100);
  };

  const handleNavigationAndExit = () => {
    router.push(route as any);

    // Immediately fade out the full overlay to reveal the new screen (zero lagging/delay)
    overlayOpacity.value = withTiming(0, {
      duration: 380,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    }, (finished) => {
      if (finished) {
        runOnJS(finishTransition)();
      }
    });

    logoOpacity.value = withTiming(0, { duration: 250 });
    logoScale.value = withTiming(0.9, { duration: 250 });
  };

  // Animated styles
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: overlayScale.value }],
    opacity: overlayOpacity.value,
    left: startX - 60,
    top: startY - 60,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  if (!isTransitioning) return null;

  return (
    <View style={styles.container} pointerEvents="auto">
      {/* Expanding yellow bubble */}
      <Animated.View style={[styles.expandingCircle, circleStyle, { backgroundColor: overlayColor }]} />

      {/* Centered logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]} pointerEvents="none">
        <Image
          source={ASSETS.branding.logo_custom}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
  },
  expandingCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5CE2E', // Jaheez primary yellow
  },
  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100000,
  },
  logoImage: {
    width: width * 0.35,
    height: (width * 0.35) * 0.4,
    tintColor: '#FF3131',
  },
});

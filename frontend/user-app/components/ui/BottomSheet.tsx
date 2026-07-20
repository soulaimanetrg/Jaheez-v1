import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Dimensions, PanResponder, KeyboardAvoidingView, Platform, Animated, StyleSheet } from 'react-native';
import { BRAND, FONTS } from '../../constants/brand';

export interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BottomSheet({ isVisible, onClose, children, title }: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: Platform.OS !== 'web', speed: 12, bounciness: 4 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateY, { toValue: SCREEN_HEIGHT, useNativeDriver: Platform.OS !== 'web', speed: 12 }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    }
  }, [isVisible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => { if (gs.dy > 0) translateY.setValue(gs.dy); },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > SCREEN_HEIGHT * 0.3 || gs.vy > 1.5) {
          Animated.spring(translateY, { toValue: SCREEN_HEIGHT, useNativeDriver: Platform.OS !== 'web', speed: 12 }).start(() => onClose());
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: Platform.OS !== 'web', speed: 12 }).start();
        }
      },
    })
  ).current;

  if (!isVisible) return null;

  return (
    <View style={styles.overlayContainer} pointerEvents="auto">
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={styles.backdropPressable} onPress={onClose} accessibilityLabel="Close bottom sheet" />
      </Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
        {title && <Text style={styles.title}>{title}</Text>}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.contentContainer}>{children}</View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
    zIndex: 50,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: BRAND.SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BRAND.BORDER,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 16,
    color: BRAND.TEXT,
    fontFamily: FONTS.DISPLAY,
  },
  contentContainer: {
    paddingHorizontal: 24,
  },
});


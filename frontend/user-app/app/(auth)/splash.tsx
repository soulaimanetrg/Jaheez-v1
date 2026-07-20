// ─────────────────────────────────────────────────────
// Fallback: redirect any stale deep-link to root index.
// The real splash UI is rendered inline in app/index.tsx.
// ─────────────────────────────────────────────────────
import React from 'react';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { BRAND } from '@/constants/brand';

export default function SplashFallback() {
  const router = useRouter();

  useEffect(() => {
    // Replace so there's no back-stack entry
    router.replace('/');
  }, []);

  // Brief blank screen while redirect processes
  return <View style={styles.root} accessibilityLabel="Redirecting" />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.YELLOW,
  },
});

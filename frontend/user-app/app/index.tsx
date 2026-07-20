// ─────────────────────────────────────────────────────
// JAHEEZ — Root Entry Point
//
// This file handles routing decisions AND renders a
// branded splash inline while auth state is loading.
//
// Rendering inline (instead of redirecting to a separate
// splash screen) keeps the auth-store subscription alive
// so the redirect fires immediately when isLoading → false.
// ─────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Image, Platform, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { routeForCustomer } from '../features/auth/services/authApi';
import { BRAND } from '../constants/brand';
import { ASSETS } from '../constants/assets';
import { hasSeenWelcome } from '../features/auth/welcomeState';

export default function RootIndex() {
  const isLoading = useAuthStore(s => s.isLoading);
  const isAuth    = useAuthStore(s => s.isAuthenticated);
  const user      = useAuthStore(s => s.user);
  const [welcomeChecked,setWelcomeChecked]=useState(false);
  const [seenWelcome,setSeenWelcome]=useState(true);
  useEffect(()=>{hasSeenWelcome().then(seen=>{setSeenWelcome(seen);setWelcomeChecked(true)}).catch(()=>setWelcomeChecked(true))},[]);

  // While checking auth, show branded splash inline
  if (isLoading || !welcomeChecked) {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webLoading} />
      );
    }
    return (
      <View style={styles.splash} accessibilityLabel="Jaheez splash screen">
        <Image
          source={ASSETS.branding.logo_custom}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Jaheez logo"
        />
        <ActivityIndicator
          size="small"
          color={BRAND.RED}
          style={styles.loader}
        />
      </View>
    );
  }

  // Route based on auth state
  if (isAuth && user) return <Redirect href={routeForCustomer(user) as any} />;
  if (!seenWelcome) return <Redirect href="/(auth)/welcome" />;
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: BRAND.YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 72,
    tintColor: BRAND.RED,
  },
  loader: {
    marginTop: 32,
  },
  webLoading: {
    flex: 1,
    backgroundColor: '#0A0A12',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

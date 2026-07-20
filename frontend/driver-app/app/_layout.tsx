import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import * as SplashScreen from 'expo-splash-screen';
import { View, Platform, StyleSheet } from 'react-native';
import { useDriverStore } from '../store/driverStore';
import { usePlatformStore } from '../store/platformStore';
import { driverApi, tokenStore } from '../lib/api';
import { BRAND } from '../constants/brand';
import { useDriverHeartbeat } from '../hooks/useDriverHeartbeat';
import { MaintenanceBanner } from '../components/MaintenanceBanner';
import { ForceUpdateModal } from '../components/ForceUpdateModal';
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    'Cairo-Regular':  Cairo_400Regular,
    'Cairo-SemiBold': Cairo_600SemiBold,
    'Cairo-Bold':     Cairo_700Bold,
  });
  // Fallback: if Google Fonts is slow/blocked (e.g. proxied iframe), unblock the
  // UI after 2s so the app renders with the system font instead of staying on a
  // blank splash. The fontfaceobserver lib otherwise rejects after 12s and the
  // app never recovers.
  const [fontsTimeout, setFontsTimeout] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFontsTimeout(true), 2000);
    return () => clearTimeout(t);
  }, []);
  const fontsReady = fontsLoaded || !!fontsError || fontsTimeout;

  const driver = useDriverStore(s => s.driver);
  const setDriver = useDriverStore(s => s.setDriver);
  const segments = useSegments();
  const rootSegment = segments[0];
  const router = useRouter();

  useDriverHeartbeat(driver);

  // Start platform settings polling (maintenance mode + force update)
  const startPlatform = usePlatformStore(s => s.start);
  useEffect(() => {
    const stop = startPlatform();
    return stop;
  }, [startPlatform]);

  // Restore session on cold start
  useEffect(() => {
    (async () => {
      const token = await tokenStore.get();
      if (!token) return;
      try {
        const fresh = await driverApi.me();
        setDriver(fresh);
      } catch { setDriver(null); await tokenStore.clear(); }
    })();
  }, []);

  // Route gate
  useEffect(() => {
    if (!fontsReady) return;
    SplashScreen.hideAsync().catch(() => {});
    const inAuth = rootSegment === '(auth)';
    const inTabs = rootSegment === '(tabs)';

    if (!driver && !inAuth) {
      router.replace('/(auth)/welcome');
    } else if (driver && inAuth && !inTabs) {
      router.replace('/(tabs)');
    }
  }, [fontsReady, driver, rootSegment, router]);

  if (!fontsReady) return <View style={{ flex: 1, backgroundColor: BRAND.BG }} />;

  const content = (
    <View style={{ flex: 1 }}>
      <MaintenanceBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BRAND.BG } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(flows)" options={{ presentation: 'card' }} />
      </Stack>
      <ForceUpdateModal />
    </View>
  );

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {Platform.OS === 'web' ? (
        <View style={webStyles.webWrapper}>
          <View style={webStyles.webContainer}>
            {content}
          </View>
        </View>
      ) : (
        content
      )}
    </SafeAreaProvider>
  );
}

const webStyles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    backgroundColor: '#0A0A12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webContainer: {
    width: '100%',
    maxWidth: 480,
    height: '100%',
    backgroundColor: BRAND.BG,
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1F1F2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
});

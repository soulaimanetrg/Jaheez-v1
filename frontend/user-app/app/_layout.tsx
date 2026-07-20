import React, { useEffect, Component, ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
} from 'expo-font';
import {
  ReadexPro_400Regular,
  ReadexPro_500Medium,
  ReadexPro_600SemiBold,
  ReadexPro_700Bold,
} from '@expo-google-fonts/readex-pro';
import { View, Text, ScrollView, StyleSheet, Platform, Dimensions, AppState } from 'react-native';

// Constrain viewport dimensions on Web globally to align layout measuring
if (Platform.OS === 'web') {
  const originalGet = Dimensions.get;
  Dimensions.get = (type: 'window' | 'screen') => {
    const dims = originalGet(type);
    return {
      ...dims,
      width: Math.min(dims.width, 480),
    };
  };

  // Inject global CSS overrides to disable square focus outlines and tap highlight shapes
  const style = document.createElement('style');
  style.textContent = `
    * {
      outline-width: 0 !important;
      outline-style: none !important;
      -webkit-tap-highlight-color: transparent !important;
      user-select: none;
      -webkit-user-select: none;
    }
    input, textarea, [contenteditable] {
      user-select: text !important;
      -webkit-user-select: text !important;
    }
  `;
  document.head.appendChild(style);
}

import { BRAND } from '../constants/brand';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { MaintenanceBanner } from '../components/ui/MaintenanceBanner';
import { ForceUpdateModal } from '../components/ui/ForceUpdateModal';
import JaheezTransitionOverlay from '../components/transitions/JaheezTransitionOverlay';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { ThemeProvider } from '../lib/ThemeProvider';
import { supabase } from '../lib/supabase';
import { bootstrapCurrentCustomer } from '../features/auth/services/authApi';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../store/languageStore';
import { usePlatformStore } from '../store/platformStore';
import type { CustomerProfile } from '../features/auth/services/authApi';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30000 } },
});

interface EBState { error: Error | null }
class AppErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error): EBState { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={eb.root}>
          <Text style={eb.title}>Runtime Error</Text>
          <ScrollView>
            <Text style={eb.msg}>{this.state.error.message}</Text>
            <Text style={eb.stack}>{this.state.error.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
const eb = StyleSheet.create({
  root:  { flex: 1, backgroundColor: BRAND.BG, padding: 24, paddingTop: 60 },
  title: { color: BRAND.RED, fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  msg:   { color: BRAND.TEXT, fontSize: 14, marginBottom: 12 },
  stack: { color: BRAND.TEXT3, fontSize: 11, fontFamily: 'monospace' },
});

function useSupabaseAuthInit() {
  const setUser    = useAuthStore(s => s.setUser);
  const setLoading = useAuthStore(s => s.setLoading);

  const loadProfile = async (): Promise<CustomerProfile> => bootstrapCurrentCustomer();

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try { setUser(await loadProfile()); }
        catch { await supabase.auth.signOut(); setUser(null); }
      } else {
        setUser(null);
      }
    }).catch(() => setUser(null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          setTimeout(() => loadProfile().then(setUser).catch(async () => { await supabase.auth.signOut(); setUser(null); }), 0);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    const appState = AppState.addEventListener('change', state => {
      if (Platform.OS === 'web') return;
      if (state === 'active') { supabase.auth.startAutoRefresh(); loadProfile().then(setUser).catch(() => undefined); } else supabase.auth.stopAutoRefresh();
    });
    if (Platform.OS !== 'web') supabase.auth.startAutoRefresh();
    return () => { subscription.unsubscribe(); appState.remove(); if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function useDirectionSync() {
  const isRTL = useLangStore(s => s.isRTL);
  const lang = useLangStore(s => s.lang);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = lang;
    }
  }, [isRTL, lang]);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'ReadexPro-Regular':  ReadexPro_400Regular,
    'ReadexPro-Medium':   ReadexPro_500Medium,
    'ReadexPro-SemiBold': ReadexPro_600SemiBold,
    'ReadexPro-Bold':     ReadexPro_700Bold,
  });

  useSupabaseAuthInit();
  useDirectionSync();
  usePushNotifications();

  const startPlatform = usePlatformStore(s => s.start);
  useEffect(() => {
    const stop = startPlatform();
    return stop;
  }, [startPlatform]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 1500);
    return () => clearTimeout(t);
  }, []);

  const content = (
    <View style={{ flex: 1 }}>
      <MaintenanceBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: BRAND.BG },
          animation: 'fade',
        }}
      />
      <OfflineBanner />
      <ForceUpdateModal />
      <JaheezTransitionOverlay />
    </View>
  );

  return (
    <ThemeProvider><AppErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
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
        </QueryClientProvider>
      </SafeAreaProvider>
    </AppErrorBoundary></ThemeProvider>
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

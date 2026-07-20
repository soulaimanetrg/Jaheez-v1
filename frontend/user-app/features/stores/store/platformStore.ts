import { create } from 'zustand';
import { Platform, AppState } from 'react-native';
import Constants from 'expo-constants';
import { adminApiUrl } from '@/lib/adminApi';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export interface PublicSettings {
  maintenance_mode?:             string;
  maintenance_message_fr?:       string;
  maintenance_message_ar?:       string;
  min_required_version_ios?:     string;
  min_required_version_android?: string;
  support_phone_e164?:           string;
  support_phone?:                string;
  whatsapp_support?:             string;
  feature_customer_google_auth_enabled?: string;
  feature_customer_facebook_auth_enabled?: string;
  feature_customer_email_otp_enabled?: string;
  feature_customer_whatsapp_otp_enabled?: string;
  auth_whatsapp_trial_mode?: string;
}

interface PlatformStoreState {
  settings:           PublicSettings | null;
  loaded:             boolean;
  isInMaintenance:    boolean;
  needsForceUpdate:   boolean;
  maintenanceMessage: (lang: 'ar' | 'fr' | 'en') => string;
  supportPhoneE164:   string;
  fetch:              () => Promise<void>;
  start:              () => () => void;
}

function cmpSemver(a: string, b: string): number {
  const pa = String(a || '0').split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b || '0').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

function getCurrentVersion(): string {
  return (Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0') as string;
}

function computeForceUpdate(s: PublicSettings | null): boolean {
  if (!s) return false;
  const min = Platform.OS === 'ios'
    ? s.min_required_version_ios
    : Platform.OS === 'android'
      ? s.min_required_version_android
      : null;
  if (!min) return false;
  return cmpSemver(getCurrentVersion(), min) < 0;
}

export const usePlatformStore = create<PlatformStoreState>((set, get) => ({
  settings:         null,
  loaded:           false,
  isInMaintenance:  false,
  needsForceUpdate: false,
  supportPhoneE164: '',

  maintenanceMessage: (lang) => {
    const s = get().settings;
    if (!s) return '';
    if (lang === 'ar') return s.maintenance_message_ar || s.maintenance_message_fr || '';
    return s.maintenance_message_fr || s.maintenance_message_ar || '';
  },

  fetch: async () => {
    try {
      const res = await fetch(adminApiUrl('/admin-api/app-settings/public'), {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) return;
      const s: PublicSettings = await res.json();
      set({
        settings:         s,
        loaded:           true,
        isInMaintenance:  String(s.maintenance_mode).toLowerCase() === 'true',
        needsForceUpdate: computeForceUpdate(s),
        supportPhoneE164: s.support_phone_e164 || '',
      });
    } catch {
      // Silent: a transient network error must not falsely flip maintenance/force-update.
    }
  },

  start: () => {
    get().fetch();
    const interval = setInterval(() => { get().fetch(); }, POLL_INTERVAL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') get().fetch();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  },
}));

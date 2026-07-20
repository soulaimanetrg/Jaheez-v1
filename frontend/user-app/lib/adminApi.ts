// Build absolute URLs for /admin-api/* calls. On web we keep the relative
// proxy path; on native we resolve against EXPO_PUBLIC_ADMIN_API_BASE
// so fetch() works outside the Vite/Expo web proxy.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

function resolveApiBase(): string {
  if (Platform.OS === 'web') return '';

  const explicit =
    process.env.EXPO_PUBLIC_ADMIN_API_BASE
    || process.env.EXPO_PUBLIC_API_BASE;

  if (explicit) return explicit.replace(/\/$/, '');

  if (!__DEV__) {
    throw new Error('EXPO_PUBLIC_ADMIN_API_BASE is required for native production builds');
  }

  // Development-only discovery from the Expo host.
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.launchAsset?.url ||
    (Constants as any).manifest?.debuggerHost ||
    '';
  const lanIp = hostUri ? hostUri.split(':')[0] : null;

  if (lanIp && lanIp !== 'localhost' && lanIp !== '127.0.0.1') {
    return `http://${lanIp}:3002`;
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3002';
  return 'http://localhost:3002';
}

const API_BASE = resolveApiBase();

export function adminApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (Platform.OS === 'web') return p;
  return API_BASE + p;
}

export function resolveStoreImageUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  if (path.startsWith('/api/')) {
    return adminApiUrl(path);
  }
  return adminApiUrl(`/api/storage${path}`);
}

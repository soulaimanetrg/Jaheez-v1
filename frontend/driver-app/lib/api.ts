// Driver API client — talks to /admin-api/driver/* (proxied through scripts/proxy.js).
// Token stored in SecureStore on native; sent as Authorization: Bearer <token>.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const TOKEN_KEY = 'jaheez-driver-token';

/**
 * Resolve the absolute base URL for API calls.
 */
function resolveApiBase(): string {
  const explicit = process.env.EXPO_PUBLIC_API_BASE;

  if (Platform.OS === 'web') return '';

  // Auto-detect from Expo dev-server hostUri ("192.168.x.x:8081" or similar)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.launchAsset?.url ||
    (Constants as any).manifest?.debuggerHost ||
    '';
  const lanIp = hostUri ? hostUri.split(':')[0] : null;

  // On physical devices, we MUST use the LAN IP of the host machine
  // since 10.0.2.2 and localhost are unreachable.
  if (Device.isDevice && lanIp && lanIp !== 'localhost' && lanIp !== '127.0.0.1') {
    return `http://${lanIp}:3002`;
  }

  if (explicit) {
    let url = explicit.replace(/\/$/, '');
    // Automatically swap legacy (3001) or proxy (5000) ports to Express MVC backend port 3002
    if (url.endsWith(':3001')) {
      url = url.replace(':3001', ':3002');
    } else if (url.endsWith(':5000')) {
      url = url.replace(':5000', ':3002');
    }
    return url;
  }

  if (lanIp && lanIp !== 'localhost' && lanIp !== '127.0.0.1') {
    return `http://${lanIp}:3002`; // Direct to Express MVC backend
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3002';
  return 'http://localhost:3002';
}

const API_BASE = resolveApiBase();

export const apiBase = API_BASE;

export const tokenStore = {
  get: () => Platform.OS === 'web' ? AsyncStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY),
  set: (t: string) => Platform.OS === 'web' ? AsyncStorage.setItem(TOKEN_KEY, t) : SecureStore.setItemAsync(TOKEN_KEY, t),
  clear: () => Platform.OS === 'web' ? AsyncStorage.removeItem(TOKEN_KEY) : SecureStore.deleteItemAsync(TOKEN_KEY),
};

export async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await tokenStore.get();
  const url = `${API_BASE}/admin-api${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
  } catch (networkErr: any) {
    throw new Error(`Impossible de joindre le serveur (${url}): ${networkErr?.message || networkErr}`);
  }
  if (res.status === 401) {
    await tokenStore.clear();
    throw new Error('Session expirée');
  }
  if (res.status === 403) {
    // Token revocation path: a deactivated driver gets 403 account_disabled
    // on every request. Clear the session so the app returns to login
    // instead of showing the same error forever.
    const body = await res.clone().json().catch(() => ({} as any));
    if ((body as any)?.error_code === 'account_disabled') {
      await tokenStore.clear();
      throw new Error('Compte désactivé. Contactez l’administration.');
    }
  }
  if (!res.ok) {
    // Guard against non-JSON error responses (HTML 404 pages, proxy errors, etc.)
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Erreur serveur HTTP ${res.status} (réponse non-JSON)`);
    }
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  // Guard against non-JSON success responses
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error('Réponse serveur invalide (attendu JSON)');
  }
  return res.json() as Promise<T>;
}

export interface Driver {
  id: string; full_name: string; phone: string;
  vehicle_type: string; vehicle_plate?: string | null;
  is_online: boolean; is_verified: boolean;
  state?: string; shift_active?: boolean;
  kyc_status: 'pending' | 'partial' | 'full' | 'verified' | 'rejected';
  kyc_note?: string | null;
  jobs_completed: number; partial_jobs_cap: number;
  rating_avg: number; rating_count: number; city: string;
  current_lat?: number | null; current_lng?: number | null;
  rib?: string | null; bank_name?: string | null; rib_holder_name?: string | null;
  cod_due_dh: number;
  cooldown_until?: string | null; cooldown_reason?: string | null;
  last_seen_at?: string | null;
  created_at: string;
  cin: string;
  is_active: boolean;
  must_change_password?: boolean;
}

export interface OrderItem {
  id: string; quantity: number; unit_price: number; total_price: number;
  notes?: string | null; name: string; name_ar?: string | null;
}

export interface OrderRow {
  order_type?: 'standard'|'errand'|string;
  errand?: { service_type:string;errand_stage:string;pickup_address:string;item_category:string;item_size:string;weight_band:string;declared_value_dh:number;recipient_name:string } | null;
  id: string; status: string; payment_method: string;
  delivery_address: string; delivery_lat?: number | null; delivery_lng?: number | null;
  notes?: string | null;
  subtotal: number; delivery_fee: number; discount?: number; total_amount: number;
  rider_tip?: number; cancelled_reason?: string | null;
  store_id: string; user_id: string; driver_id?: string | null;
  heading_to_pickup_at?: string | null; arrived_pickup_at?: string | null;
  picked_up_at?: string | null; arrived_customer_at?: string | null; delivered_at?: string | null;
  offer_expires_at?: string | null;
  created_at: string; updated_at?: string;
  // Enriched by backend formatDriverOrder
  store_name?: string; store_name_ar?: string; store_phone?: string;
  store_address?: string; store_address_ar?: string;
  store_lat?: number | null; store_lng?: number | null;
  customer_name?: string; customer_phone?: string;
  items?: OrderItem[];
}

export interface DriverDoc {
  id: string; driver_id: string;
  doc_type: 'cin_front'|'cin_back'|'selfie'|'permis'|'carte_grise'|'assurance';
  url: string;
  status: 'pending'|'approved'|'rejected';
  rejection_reason?: string | null;
  created_at: string;
}

export interface Payout {
  id: string; driver_id: string;
  payout_status: 'not_ready'|'pending_review'|'held'|'approved'|'paid'|'rejected'|'reversed';
  total_earnings_dh: number; payable_dh: number; held_dh: number;
  cod_due_dh: number; hold_reason?: string | null;
  started_at: string; ended_at?: string | null; created_at: string;
}

import * as auth from '../features/auth/services/authApi';
import * as profile from '../features/profile/services/profileApi';
import * as delivery from '../features/delivery/services/deliveryApi';
import * as payout from '../features/payout/services/payoutApi';

export const driverApi = {
  // Auth
    loginDriver: auth.loginDriver,

  // Profile
  me: profile.me,
  updateMe: profile.updateMe,
  updateLocation: profile.updateLocation,
  startShift: profile.startShift,
  endShift: profile.endShift,
  changePassword: profile.changePassword,
  documents: profile.documents,
  uploadDocument: profile.uploadDocument,

  // Delivery
  orders: delivery.orders,
  navigation: delivery.navigation,
  claim: delivery.claim,
  decline: delivery.decline,
  stage: delivery.stage,
  cancel: delivery.cancel,
  reportIssue: delivery.reportIssue,
  uploadErrandProof: delivery.uploadErrandProof,

  // Payout
  payouts: payout.payouts,
};

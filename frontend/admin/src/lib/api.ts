/**
 * JAHEEZ Admin API client
 * Talks to /admin-api/* (Express on port 3001, proxied through proxy.js).
 * JWT is stored in localStorage and sent as Authorization: Bearer <token>.
 */

import { apiLogin, apiMe } from '../features/auth/services/authApi';
import { apiDashboard, apiAnalytics } from '../features/dashboard/services/dashboardApi';
import { apiOrders, apiPayouts, apiCodSettlements, apiWallets, apiRefunds } from '../features/orders/services/orderApi';
import { apiStores, apiProducts, apiPromotions, apiBanners, apiZones } from '../features/stores/services/storeApi';
import { apiUsers, apiDrivers, apiAdmins, apiReviews, apiAuditLogs } from '../features/users/services/userApi';
import { apiSettings, apiCities, apiServiceCategories } from '../features/settings/services/settingsApi';

const BASE      = '/admin-api';

import { getToken, saveToken, clearToken } from './token';
export { getToken, saveToken, clearToken };

export class ApiError extends Error {
  status: number;
  code?: string;
  retry_after_sec?: number;
  constructor(message: string, status: number, code?: string, retry_after_sec?: number) {
    super(message); this.status = status; this.code = code; this.retry_after_sec = retry_after_sec;
  }
}

export async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  });

  // Sliding session: pick up renewed token and persist it.
  const fresh = res.headers.get('X-New-Token');
  if (fresh) saveToken(fresh);

  if (res.status === 401) {
    const body = await res.json().catch(() => ({} as { error?: string; error_code?: string }));
    const code = (body as { error_code?: string }).error_code;
    clearToken();
    if (code === 'idle_expired') {
      sessionStorage.setItem('jaheez-admin-toast', 'Session expirée pour inactivité — veuillez vous reconnecter.');
    } else if (code === 'token_expired') {
      sessionStorage.setItem('jaheez-admin-toast', 'Session expirée — veuillez vous reconnecter.');
    }
    if (!location.pathname.endsWith('/login')) window.location.replace('/admin/login');
    throw new ApiError((body as { error?: string }).error ?? 'Session expirée', 401, code);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as { error?: string; error_code?: string; retry_after_sec?: number }));
    const b = body as { error?: string; error_code?: string; retry_after_sec?: number };
    throw new ApiError(b.error ?? `HTTP ${res.status}`, res.status, b.error_code, b.retry_after_sec);
  }
  return res.json() as Promise<T>;
}

/* ── Types ─────────────────────────────────────────────────────────────── */
export interface AdminProfile {
  id: string; auth_id: string; email: string; full_name: string; role: string;
}
export interface KPIStats {
  ordersToday: number; revenueToday: number; totalUsers: number;
  onlineDrivers: number; pendingOrders: number; openStores: number;
}
export interface DashboardResp {
  stats: KPIStats;
  recentOrders: Order[];
  weekOrders: { created_at: string }[];
}
export interface Order {
  id: string; status: string; total_amount: number; subtotal: number;
  delivery_fee: number; discount: number; payment_method: string;
  delivery_address: string; notes?: string;
  created_at: string; updated_at: string;
  user_id?: string; store_id?: string; driver_id?: string;
}
export interface OrderItem {
  id: string; quantity: number; unit_price: number; total_price: number; notes?: string;
  menu_items?: { name: string; name_ar: string };
}
export interface Store {
  id: string; name: string; name_ar: string; category: string; city: string;
  is_open: boolean; is_featured: boolean; is_verified: boolean;
  rating_avg: number; rating_count: number;
  delivery_fee: number; delivery_time: number; min_order_amount: number;
  phone?: string; created_at: string;
}
export interface OptionChoice {
  id: string; name: string; extra: number;
}
export interface OptionGroup {
  id: string; label: string; required: boolean; choices: OptionChoice[];
}
export interface MenuItem {
  id: string; store_id: string; category_id?: string;
  name: string; name_ar: string; description?: string; description_ar?: string;
  price: number; image_url?: string;
  is_available: boolean; is_popular: boolean; is_featured: boolean;
  sort_order: number; options: OptionGroup[]; created_at: string;
}
export interface Category {
  id: string; name: string; name_ar: string; sort_order: number;
}
export interface AppUser {
  id: string; full_name: string; phone: string; email?: string;
  role: string; is_banned: boolean; trust_score: number; city: string;
  is_plus_member: boolean; created_at: string;
}
export interface Driver {
  id: string; full_name: string; phone: string; vehicle_type: string;
  vehicle_plate?: string; is_online: boolean; is_verified: boolean;
  rating_avg: number; rating_count: number; city: string; created_at: string;
  kyc_status?: 'pending'|'partial'|'full'|'verified'|'rejected';
  kyc_note?: string | null;
  jobs_completed?: number; partial_jobs_cap?: number;
  rib?: string | null; bank_name?: string | null; rib_holder_name?: string | null;
  cod_due_dh?: number;
}

export interface DriverDoc {
  id: string; driver_id: string;
  doc_type: 'cin_front'|'cin_back'|'selfie'|'permis'|'carte_grise'|'assurance';
  url: string;
  status: 'pending'|'approved'|'rejected';
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface PayoutRequest {
  id: string; driver_id: string;
  amount_dh: number; rib: string;
  bank_name?: string | null; rib_holder_name?: string | null;
  status: 'pending'|'approved'|'paid'|'rejected';
  admin_note?: string | null; processed_at?: string | null;
  created_at: string;
  drivers?: { full_name: string; phone: string; city: string };
}

export interface DriverDetail {
  driver: Driver;
  documents: DriverDoc[];
  payouts: PayoutRequest[];
}

/* ── API methods ───────────────────────────────────────────────────────── */
export interface AnalyticsData {
  daily: { date: string; orders: number; revenue: number }[];
  statusBreakdown: { status: string; count: number }[];
  topStores: { id: string; name_ar: string; count: number; revenue: number }[];
  paymentBreakdown: { method: string; count: number; revenue: number }[];
  summary: { totalOrders: number; totalRevenue: number; avgOrderValue: number };
}

export interface AdminAccount {
  id: string; email: string; full_name: string;
  role: string; is_active: boolean; created_at: string;
}

export const api = {
  login: apiLogin,
  me: apiMe,
  dashboard: apiDashboard,
  analytics: apiAnalytics,
  orders: apiOrders,
  stores: apiStores,
  products: apiProducts,
  users: apiUsers,
  drivers: apiDrivers,
  payouts: apiPayouts,
  codSettlements: apiCodSettlements,
  support: {
    list: () => req<any[]>('/support'),
    update: (id: string, d: object) =>
      req<void>(`/support/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  },
  promotions: apiPromotions,
  settings: apiSettings,
  notifications: {
    list: () => req<NotificationLog[]>('/notifications'),
    send: (d: { title: string; body: string; target: string }) =>
      req<{ ok: boolean; sent: number; failed: number; total_tokens: number }>(
        '/notifications/send',
        { method: 'POST', body: JSON.stringify(d) }
      ),
  },
  admins: apiAdmins,
  banners: apiBanners,
  zones: apiZones,
  reviews: apiReviews,
  auditLogs: apiAuditLogs,
  cities: apiCities,
  serviceCategories: apiServiceCategories,
  wallets: apiWallets,
  refunds: apiRefunds,
};

export interface AuditLog {
  id: number;
  admin_id?: string;
  admin_email?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  summary?: string;
  old_value?: unknown;
  new_value?: unknown;
  ip?: string;
  created_at: string;
}

export interface City {
  id: string;
  name_ar: string;
  name_fr: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name_ar: string;
  name_fr: string;
  type: 'service' | 'store' | 'product' | 'errand';
  parent_id?: string | null;
  icon_emoji?: string | null;
  color_hex: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Refund {
  id: string;
  order_id?: string;
  user_id?: string;
  user_name?: string;
  user_phone?: string;
  amount_dh: number;
  method: 'wallet' | 'cash' | 'gateway';
  reason: string;
  internal_note?: string;
  status: 'pending' | 'approved' | 'denied' | 'processing' | 'completed' | 'failed';
  requested_by?: string;
  requested_by_email?: string;
  processed_by?: string;
  processed_by_email?: string;
  processed_at?: string;
  decision_note?: string;
  created_at: string;
}

export interface WalletListItem {
  user_id: string;
  full_name: string;
  phone: string;
  email?: string;
  city: string;
  is_banned: boolean;
  role: string;
  balance_dh: number;
  is_frozen: boolean;
  frozen_reason: string | null;
  has_wallet: boolean;
  updated_at: string | null;
}

export interface WalletTx {
  id: string;
  wallet_id: string | null;
  user_id: string;
  type: 'credit' | 'debit' | 'admin_adjustment' | 'refund' | 'payout' | 'cod_settle' | 'topup';
  direction?: 'credit' | 'debit' | null;
  amount_dh: number;
  label: string;
  sublabel: string | null;
  ref_id: string | null;
  created_at: string;
}

export function txDirection(t: WalletTx): 'credit' | 'debit' {
  return (t.direction ?? (t.type === 'debit' ? 'debit' : 'credit')) as 'credit' | 'debit';
}

export interface WalletDetail {
  user: { id: string; full_name: string; phone: string; email?: string; city: string; is_banned: boolean; role: string; created_at: string };
  wallet: {
    id?: string; user_id: string; balance_dh: number;
    is_frozen: boolean; frozen_reason: string | null;
    frozen_at?: string | null; frozen_by?: string | null;
    created_at?: string; updated_at?: string;
  };
  transactions: WalletTx[];
}

export interface NotificationLog {
  id: number;
  title: string;
  body: string;
  target: string;
  sent_count: number;
  failed_count: number;
  sent_by: string;
  created_at: string;
}

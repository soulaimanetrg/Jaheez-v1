import { getToken } from './token';

export const getAdminToken = getToken;
export const API_BASE = '/admin-api';

export function getAuthHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function handle401(res: Response) {
  if (res.status === 401) {
    localStorage.removeItem('jaheez-admin-token');
    if (!window.location.pathname.endsWith('/login')) {
      window.location.replace('/admin/login');
    }
    throw new Error('Unauthorized');
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  // Sliding session: pick up renewed token and persist it.
  const fresh = res.headers.get('X-New-Token');
  if (fresh) {
    try { localStorage.setItem('jaheez-admin-token', fresh); } catch {}
  }

  handle401(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export * from '../features/auth/services/authApi';
export * from '../features/dashboard/services/dashboardApi';
export * from '../features/orders/services/orderApi';
export * from '../features/stores/services/storeApi';
export * from '../features/users/services/userApi';
export * from '../features/settings/services/settingsApi';
export * from '../features/users/services/userApi'; // For audit logs re-export

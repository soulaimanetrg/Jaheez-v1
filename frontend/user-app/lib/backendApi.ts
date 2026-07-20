import { supabase } from './supabase';
import { adminApiUrl } from './adminApi';

export async function getBackendAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function backendJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getBackendAccessToken();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(adminApiUrl(path), { ...init, headers });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error || json?.message || `Request failed: ${res.status}`);
  }
  return json as T;
}

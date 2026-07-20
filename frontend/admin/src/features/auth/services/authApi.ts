import { apiRequest } from '@/lib/adminApi';
import { req, AdminProfile } from '@/lib/api';

// From adminApi.ts
export async function adminLogin(data: { email: string; password: string }): Promise<{ token: string }> {
  const res = await fetch('/admin-api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

// From api.ts
export const apiLogin = (email: string, password: string, remember_me = false) =>
  req<{ token: string; admin: AdminProfile }>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, remember_me }),
  });

export const apiMe = () => req<AdminProfile>('/me');

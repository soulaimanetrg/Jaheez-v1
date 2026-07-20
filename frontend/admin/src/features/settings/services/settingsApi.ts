import { getAuthHeader, handle401, API_BASE, apiRequest } from '@/lib/adminApi';
import { req, City, ServiceCategory } from '@/lib/api';

export async function adminGetSettings(): Promise<Record<string, string>> {
  return apiRequest<Record<string, string>>('/settings');
}

export async function adminSaveSettings(data: Record<string, string>): Promise<void> {
  await apiRequest('/settings', { method: 'POST', body: JSON.stringify(data) });
}

export async function adminGetCities(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/cities`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch cities');
  return res.json();
}

export async function adminCreateCity(data: Record<string, unknown>): Promise<any> {
  return apiRequest('/cities', { method: 'POST', body: JSON.stringify(data) });
}

export async function adminUpdateCity(id: string, data: Record<string, unknown>): Promise<any> {
  return apiRequest(`/cities/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function adminDeleteCity(id: string): Promise<void> {
  await apiRequest(`/cities/${id}`, { method: 'DELETE' });
}

// From api.ts
export const apiSettings = {
  get: () => req<Record<string, string>>('/settings'),
  save: (d: Record<string, string>) =>
    req<{ ok: boolean }>('/settings', { method: 'POST', body: JSON.stringify(d) }),
};

export const apiCities = {
  list:   ()                          => req<City[]>('/cities'),
  create: (d: Partial<City>)          => req<City>('/cities', { method: 'POST',  body: JSON.stringify(d) }),
  update: (id: string, d: Partial<City>) => req<void>(`/cities/${id}`, { method: 'PATCH',  body: JSON.stringify(d) }),
  remove: (id: string)                => req<void>(`/cities/${id}`, { method: 'DELETE' }),
};

export const apiServiceCategories = {
  list:   (type?: string)             => req<ServiceCategory[]>(`/service-categories${type ? '?type=' + type : ''}`),
  create: (d: Partial<ServiceCategory>) => req<ServiceCategory>('/service-categories', { method: 'POST', body: JSON.stringify(d) }),
  update: (id: string, d: Partial<ServiceCategory>) =>
    req<void>(`/service-categories/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  remove: (id: string)                => req<void>(`/service-categories/${id}`, { method: 'DELETE' }),
};

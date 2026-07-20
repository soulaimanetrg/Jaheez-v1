import { getAuthHeader, handle401, API_BASE, apiRequest } from '@/lib/adminApi';
import { req, Store, MenuItem, Category, ServiceCategory } from '@/lib/api';

async function readApiError(res: Response, fallback: string): Promise<Error> {
  const payload = await res.json().catch(() => null);
  const message =
    payload && typeof payload === 'object'
      ? String((payload as any).error || (payload as any).message || fallback)
      : fallback;
  return new Error(message);
}

export async function adminGetStores(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/stores`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch stores');
  return res.json();
}

export async function adminCreateStore(data: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_BASE}/stores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create store');
  return res.json();
}

export async function adminUpdateStore(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_BASE}/stores/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update store');
  return res.json();
}

export async function adminDeleteStore(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/stores/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to delete store');
}

export async function adminGetMenuCategories(storeId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/menu-categories?store_id=${storeId}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch menu categories');
  return res.json();
}

export async function adminCreateMenuCategory(storeId: string, data: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_BASE}/menu-categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ ...data, store_id: storeId }),
  });
  if (!res.ok) throw new Error('Failed to create menu category');
  return res.json();
}

export async function adminUpdateMenuCategory(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_BASE}/menu-categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update menu category');
  return res.json();
}

export async function adminDeleteMenuCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/menu-categories/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to delete menu category');
}

export async function adminGetStoreProducts(storeId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/products?store_id=${storeId}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function adminCreateProduct(storeId: string, data: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ ...data, store_id: storeId }),
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

export async function adminUpdateProduct(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  handle401(res);
  if (!res.ok) throw await readApiError(res, 'Failed to update product');
  return res.json();
}

export async function adminDeleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function adminGetCategories(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/service-categories`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function adminCreateCategory(data: { name: string; [k: string]: unknown }): Promise<any> {
  const res = await fetch(`${API_BASE}/service-categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
}

export async function adminUpdateCategory(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_BASE}/service-categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update category');
  return res.json();
}

export async function adminDeleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/service-categories/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to delete category');
}

export async function adminGetPromotions(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/promotions`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch promotions');
  return res.json();
}

export async function adminCreatePromotion(data: { title: string; [k: string]: unknown }): Promise<any> {
  const res = await fetch(`${API_BASE}/promotions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create promotion');
  return res.json();
}

export async function adminUpdatePromotion(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_BASE}/promotions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update promotion');
  return res.json();
}

export async function adminDeletePromotion(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/promotions/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to delete promotion');
}

// From api.ts
export const apiStores = {
  list: () => req<Store[]>('/stores'),
  create: (d: Partial<Store>) =>
    req<Store>('/stores', { method: 'POST', body: JSON.stringify(d) }),
  update: (id: string, d: Partial<Store> & { min_order?: number }) =>
    req<void>(`/stores/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
};

export const apiProducts = {
  list:       (store_id: string) => req<MenuItem[]>(`/products?store_id=${store_id}`),
  categories: (store_id: string) => req<Category[]>(`/menu-categories?store_id=${store_id}`),
  create:     (d: object)        => req<MenuItem>('/products', { method: 'POST', body: JSON.stringify(d) }),
  update:     (id: string, d: object) => req<void>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete:     (id: string)        => req<void>(`/products/${id}`, { method: 'DELETE' }),
};

export const apiPromotions = {
  list: () => req<any[]>('/promotions'),
  create: (d: object) =>
    req<any>('/promotions', { method: 'POST', body: JSON.stringify(d) }),
  update: (id: string, d: object) =>
    req<void>(`/promotions/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (id: string) =>
    req<void>(`/promotions/${id}`, { method: 'DELETE' }),
};

export const apiBanners = {
  list: () => req<any[]>('/banners'),
  create: (d: object) =>
    req<any>('/banners', { method: 'POST', body: JSON.stringify(d) }),
  update: (id: string, d: object) =>
    req<void>(`/banners/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (id: string) =>
    req<void>(`/banners/${id}`, { method: 'DELETE' }),
};

export const apiZones = {
  list: () => req<any[]>('/zones'),
  create: (d: object) =>
    req<any>('/zones', { method: 'POST', body: JSON.stringify(d) }),
  update: (id: string, d: object) =>
    req<void>(`/zones/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (id: string) =>
    req<void>(`/zones/${id}`, { method: 'DELETE' }),
};

export async function adminUploadImage(
  file: File,
  visibility: "public" | "private" = "public",
  folder: "general" | "stores" | "products" | "drivers" | "banners" | "categories" = "stores",
): Promise<{ objectPath: string }> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });

  const res = await apiRequest<{ ok: boolean; url: string; path: string }>("/upload", {
    method: "POST",
    body: JSON.stringify({
      file: base64,
      content_type: file.type,
      folder,
      filename: file.name,
    }),
  });

  return { objectPath: res.url };
}

export async function adminApplyStoreReduction(
  storeId: string,
  payload: { type: 'percentage' | 'fixed'; value: number }
): Promise<any> {
  const res = await fetch(`${API_BASE}/stores/${storeId}/reduction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errPayload = await res.json().catch(() => null);
    throw new Error(errPayload?.error || 'Failed to apply store reduction');
  }
  return res.json();
}

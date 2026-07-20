// ─────────────────────────────────────────────────────
// JAHEEZ — Store / Restaurant API Layer
// Backend REST API only. No substitute business data in production UI paths.
// ─────────────────────────────────────────────────────

import { backendJson } from '@/lib/backendApi';
import * as Location from 'expo-location';
import type {
  ApiResponse,
  PaginatedResponse,
  Store,
  MenuCategory,
  StoreReview,
  ServiceCategory,
} from '@shared/types';

// ── UUID validation ──
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Helper to resolve user coordinates ──
async function getCachedLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getLastKnownPositionAsync({});
      if (loc) {
        return { lat: loc.coords.latitude, lng: loc.coords.longitude };
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: current.coords.latitude, lng: current.coords.longitude };
    }
  } catch (e) {
    // Ignore location errors
  }
  return null;
}

// ── Helper to append query parameters including location ──
async function buildStoreUrl(basePath: string, params: Record<string, any> = {}): Promise<string> {
  const coords = await getCachedLocation();
  const queryParams = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null) {
      queryParams.append(key, String(val));
    }
  }
  if (coords) {
    queryParams.append('lat', String(coords.lat));
    queryParams.append('lng', String(coords.lng));
  }
  const queryStr = queryParams.toString();
  return queryStr ? `${basePath}?${queryStr}` : basePath;
}

// ── 1. Get featured/nearby stores (home screen) ──
export async function getFeaturedStores(): Promise<ApiResponse<Store[]>> {
  try {
    const url = await buildStoreUrl('/admin-api/v1/customer/stores', { is_featured: true });
    const data = await backendJson<Store[]>(url);
    return { data: (data || []) as Store[], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Impossible de charger les magasins en vedette' };
  }
}

// ── 2. Get all open stores ──
export async function getAllStores(
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<PaginatedResponse<Store>>> {
  try {
    const url = await buildStoreUrl('/admin-api/v1/customer/stores');
    const data = await backendJson<Store[]>(url);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = (data || []).slice(start, end);
    return {
      data: {
        data: slice as Store[],
        count: (data || []).length,
        page,
        pageSize,
        hasMore: (data || []).length > end,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Impossible de charger les magasins' };
  }
}

// ── 3. Get stores by category ──
export async function getStoresByCategory(
  category: string,
  page: number = 1,
  pageSize: number = 20,
  subCategory?: string,
  sort?: string,
  query?: string
): Promise<ApiResponse<PaginatedResponse<Store>>> {
  try {
    const params: any = { category };
    if (subCategory && subCategory !== 'الكل' && subCategory !== 'Tous') {
      params.sub_category = subCategory;
    }
    if (sort) {
      params.sort = sort;
    }
    if (query && query.trim().length >= 2) {
      params.query = query.trim();
    }
    const url = await buildStoreUrl('/admin-api/v1/customer/stores', params);
    const data = await backendJson<Store[]>(url);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = (data || []).slice(start, end);
    return {
      data: { data: slice as Store[], count: (data || []).length, page, pageSize, hasMore: (data || []).length > end },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Impossible de charger les magasins' };
  }
}

// ── 3b. Get stores with active promotions ──
export async function getPromoStores(): Promise<ApiResponse<Store[]>> {
  try {
    const url = await buildStoreUrl('/admin-api/v1/customer/stores', { sort: 'promotions' });
    const data = await backendJson<Store[]>(url);
    return { data: (data || []) as Store[], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'فشل في جلب المتاجر التي لديها عروض' };
  }
}

// ── 4. Search stores ──
export async function searchStores(query: string): Promise<ApiResponse<Store[]>> {
  try {
    const url = await buildStoreUrl('/admin-api/v1/customer/stores', { query });
    const data = await backendJson<Store[]>(url);
    return { data: (data || []) as Store[], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Impossible de rechercher les magasins' };
  }
}

// ── 5. Get single store detail ──
export async function getStoreById(storeId: string): Promise<ApiResponse<Store>> {
  // Security: validate UUID format before querying
  if (!UUID_RE.test(storeId)) {
    return { data: null, error: 'Identifiant magasin invalide' };
  }

  try {
    const data = await backendJson<Store>(`/admin-api/v1/customer/stores/${encodeURIComponent(storeId)}`);
    return { data: data as Store, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Impossible de charger le magasin';
    return { data: null, error: message };
  }
}

function normalizeMenuItem(item: any) {
  const groups = item?.option_groups || item?.options || [];

  return {
    ...item,
    options: Array.isArray(groups) ? groups : [],
    option_groups: Array.isArray(groups) ? groups : [],
  };
}

// ── 6. Get store menu ──
export async function getStoreMenu(storeId: string): Promise<ApiResponse<MenuCategory[]>> {
  // Security: validate UUID format
  if (!UUID_RE.test(storeId)) {
    return { data: null, error: 'Identifiant magasin invalide' };
  }

  try {
    const data = await backendJson<any[]>(`/admin-api/v1/customer/stores/${encodeURIComponent(storeId)}/menu`);
    const processed = (data || []).map((cat: any) => ({
      ...cat,
      items: (cat.items || [])
        .filter((item: any) => item.is_available !== false)
        .map((item: any) => normalizeMenuItem(item)),
    }));

    return { data: processed as MenuCategory[], error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Impossible de charger le menu' };
  }
}

// ── 7. Get store reviews ──
export async function getStoreReviews(
  storeId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<StoreReview>>> {
  try {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const data = await backendJson<PaginatedResponse<StoreReview>>(
      `/admin-api/v1/customer/stores/${encodeURIComponent(storeId)}/reviews?${query.toString()}`
    );
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : 'فشل في جلب التقييمات' };
  }
}

// ── 8. Toggle favorite ──
export async function toggleFavorite(userId: string, storeId: string): Promise<ApiResponse<boolean>> {
  try {
    const data = await backendJson<{ favorited: boolean }>('/admin-api/v1/customer/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ store_id: storeId }),
    });
    return { data: data.favorited, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : 'فشل في تحديث المفضلة' };
  }
}

export async function checkFavorite(userId: string, storeId: string): Promise<boolean> {
  try {
    const data = await backendJson<{ favorited: boolean }>(
      `/admin-api/v1/customer/favorites/stores/${encodeURIComponent(storeId)}`
    );
    return !!data.favorited;
  } catch {
    return false;
  }
}

// ── 9. Favorite products ──
export async function toggleFavoriteProduct(menuItemId: string): Promise<ApiResponse<boolean>> {
  try {
    const data = await backendJson<{ favorited: boolean }>('/admin-api/v1/customer/favorites/products/toggle', {
      method: 'POST',
      body: JSON.stringify({ menu_item_id: menuItemId }),
    });
    return { data: data.favorited, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : 'فشل في تحديث مفضلة المنتجات' };
  }
}

export async function checkFavoriteProduct(menuItemId: string): Promise<boolean> {
  try {
    const data = await backendJson<{ favorited: boolean }>(
      `/admin-api/v1/customer/favorites/products/${encodeURIComponent(menuItemId)}`
    );
    return !!data.favorited;
  } catch {
    return false;
  }
}

// ── 10. Get Public Service Categories ──
export async function getPublicServiceCategories(): Promise<ApiResponse<ServiceCategory[]>> {
  try {
    const url = await buildStoreUrl('/admin-api/service-categories/public');
    const data = await backendJson<ServiceCategory[]>(url);
    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'فشل في جلب فئات الخدمة' };
  }
}

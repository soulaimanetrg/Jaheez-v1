/**
 * React Query hooks for store / menu data.
 * All queries use staleTime / gcTime tuned for a delivery app:
 *  - store lists: 2 min stale (menus/prices change often)
 *  - featured: 5 min (curated, changes rarely)
 */
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  getFeaturedStores,
  getAllStores,
  getStoresByCategory,
  searchStores,
  getStoreById,
  getStoreMenu,
  getStoreReviews,
  getPublicServiceCategories,
  getPromoStores,
} from '../../lib/storeApi';

export const storeKeys = {
  all:          () => ['stores'] as const,
  featured:     () => ['stores', 'featured'] as const,
  promos:       () => ['stores', 'promos'] as const,
  list:         (page: number) => ['stores', 'list', page] as const,
  category:     (cat: string, subCategory: string, sort: string, page: number, query?: string) => ['stores', 'category', cat, subCategory, sort, page, query || ''] as const,
  search:       (q: string) => ['stores', 'search', q] as const,
  detail:       (id: string) => ['stores', 'detail', id] as const,
  menu:         (id: string) => ['stores', 'menu', id] as const,
  reviews:      (id: string, page: number) => ['stores', 'reviews', id, page] as const,
  serviceCategories: () => ['stores', 'serviceCategories'] as const,
};

/** Featured / home-screen stores */
export function useFeaturedStores() {
  return useQuery({
    queryKey: storeKeys.featured(),
    queryFn:  async () => {
      const res = await getFeaturedStores();
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    },
    staleTime: 5 * 1000,
  });
}

/** Stores with active promos */
export function usePromoStores() {
  return useQuery({
    queryKey: storeKeys.promos(),
    queryFn:  async () => {
      const res = await getPromoStores();
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    },
    staleTime: 5 * 1000,
  });
}

/** Paginated all-stores list */
export function useAllStores(page = 1) {
  return useQuery({
    queryKey: storeKeys.list(page),
    queryFn:  async () => {
      const res = await getAllStores(page);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    staleTime: 5 * 1000,
  });
}

/** Stores by category */
export function useStoresByCategory(category: string, subCategory: string = 'الكل', sort: string = 'recommended', page = 1, query?: string) {
  return useQuery({
    queryKey: storeKeys.category(category, subCategory, sort, page, query),
    queryFn:  async () => {
      const res = await getStoresByCategory(category, page, 100, subCategory, sort, query);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    staleTime: 5 * 1000,
    enabled:   !!category,
  });
}

/** Search stores — debounce query before enabling */
export function useSearchStores(query: string) {
  return useQuery({
    queryKey: storeKeys.search(query),
    queryFn:  async () => {
      const res = await searchStores(query);
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    },
    staleTime: 60 * 1000,
    enabled:   query.trim().length >= 2,
  });
}

/** Single store detail */
export function useStore(storeId: string) {
  return useQuery({
    queryKey: storeKeys.detail(storeId),
    queryFn:  async () => {
      const res = await getStoreById(storeId);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    staleTime: 5 * 1000,
    enabled:   !!storeId,
  });
}

/** Store menu */
export function useStoreMenu(storeId: string) {
  return useQuery({
    queryKey: storeKeys.menu(storeId),
    queryFn:  async () => {
      const res = await getStoreMenu(storeId);
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
    enabled:   !!storeId,
  });
}

/** Store reviews (paginated) */
export function useStoreReviews(storeId: string, page = 1) {
  return useQuery({
    queryKey: storeKeys.reviews(storeId, page),
    queryFn:  async () => {
      const res = await getStoreReviews(storeId, page);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled:   !!storeId,
  });
}

/** Active service categories (Home screen) */
export function usePublicServiceCategories() {
  return useQuery({
    queryKey: storeKeys.serviceCategories(),
    queryFn: async () => {
      const res = await getPublicServiceCategories();
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    },
    staleTime: 10 * 60 * 1000, // cache for 10 min (rarely changes)
  });
}

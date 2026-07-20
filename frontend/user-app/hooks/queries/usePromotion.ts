import { useQuery } from '@tanstack/react-query';
import { backendJson } from '@/lib/backendApi';

export interface ActivePromotion {
  id: string;
  title_ar: string;
  code: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_dh: number;
  end_at: string | null;
  store_name: string | null;
}

async function fetchActivePromotion(): Promise<ActivePromotion | null> {
  try {
    const rows = await backendJson<ActivePromotion[]>('/admin-api/active-promotions');
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export function useActivePromotion() {
  return useQuery<ActivePromotion | null>({
    queryKey: ['active-promotion'],
    queryFn: fetchActivePromotion,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

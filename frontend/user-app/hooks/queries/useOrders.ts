/**
 * React Query hooks for order data.
 * Orders are considered fresh for 30 seconds only —
 * they change frequently during active delivery.
 */
import { useQuery } from '@tanstack/react-query';
import { getUserOrders, getOrderById } from '../../lib/orderApi';

export const orderKeys = {
  all:    () => ['orders'] as const,
  list:   (userId: string) => ['orders', 'list', userId] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
};

/** All orders for the current user */
export function useOrders(userId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.list(userId ?? ''),
    queryFn:  async () => {
      if (!userId) return [];
      const res = await getUserOrders(userId);
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    },
    staleTime: 30 * 1000,
    enabled:   !!userId,
  });
}

/** Single order detail — refetches every 15 s while screen is open */
export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(orderId ?? ''),
    queryFn:  async () => {
      if (!orderId) return null;
      const res = await getOrderById(orderId);
      if (res.error) throw new Error(res.error);
      return res.data ?? null;
    },
    staleTime:     15 * 1000,
    refetchInterval: 15 * 1000,
    enabled:        !!orderId,
  });
}

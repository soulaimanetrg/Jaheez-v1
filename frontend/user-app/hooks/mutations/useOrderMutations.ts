/**
 * React Query mutation hooks for order operations.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder, cancelOrder } from '../../lib/orderApi';
import { orderKeys } from '../queries/useOrders';

type CreateOrderPayload = Parameters<typeof createOrder>[0];

/** Place a new order and invalidate the orders list */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const res = await createOrder(payload);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/** Cancel an order and update cached data optimistically */
export function useCancelOrder(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await cancelOrder(orderId);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(userId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
    },
  });
}

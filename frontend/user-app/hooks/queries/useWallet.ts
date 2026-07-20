import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../useAuth';
import { getWallet, getWalletTransactions } from '../../lib/walletApi';

export const walletKeys = {
  balance:      (uid: string) => ['wallet', 'balance', uid] as const,
  transactions: (uid: string, type?: string) => ['wallet', 'txs', uid, type ?? 'all'] as const,
};

export function useWallet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: walletKeys.balance(user?.id ?? ''),
    queryFn:  async () => {
      const res = await getWallet(user!.id);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    enabled:   !!user?.id,
    staleTime: 30 * 1000,
  });
}

export function useWalletTransactions(type?: 'credit' | 'debit') {
  const { user } = useAuth();
  return useQuery({
    queryKey: walletKeys.transactions(user?.id ?? '', type),
    queryFn:  async () => {
      const res = await getWalletTransactions(user!.id, type);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    enabled:   !!user?.id,
    staleTime: 30 * 1000,
  });
}

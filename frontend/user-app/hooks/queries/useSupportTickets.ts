import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../useAuth';
import { getUserSupportTickets } from '../../lib/supportApi';

export const supportKeys = {
  tickets: (uid: string) => ['support', 'tickets', uid] as const,
};

export function useSupportTickets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: supportKeys.tickets(user?.id ?? ''),
    queryFn:  async () => {
      const res = await getUserSupportTickets(user!.id);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    enabled:   !!user?.id,
    staleTime: 60 * 1000,
  });
}

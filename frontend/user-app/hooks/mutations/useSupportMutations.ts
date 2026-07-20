import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../useAuth';
import { createSupportTicket } from '../../lib/supportApi';
import { supportKeys } from '../queries/useSupportTickets';

export function useCreateSupportTicket() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      category: string;
      urgency:  string;
      subject:  string;
      message:  string;
      order_id?: string;
    }) => createSupportTicket({ ...input, user_id: user!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.tickets(user?.id ?? '') });
    },
  });
}

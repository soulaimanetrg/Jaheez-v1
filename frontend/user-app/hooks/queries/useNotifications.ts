import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllNotifs, markAllRead, markRead,
  type InboxNotif,
} from '../../lib/notificationInbox';

export const notifKeys = {
  all: ['notifications', 'inbox'] as const,
};

export function useNotifications() {
  return useQuery<InboxNotif[]>({
    queryKey:       notifKeys.all,
    queryFn:        fetchAllNotifs,
    staleTime:      0,
    refetchInterval: 15 * 1000,
    placeholderData: [],
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return async (notifs: InboxNotif[]) => {
    // 1. Optimistic update
    qc.setQueryData<InboxNotif[]>(notifKeys.all, (old) => {
      if (!old) return [];
      return old.map(n => ({ ...n, read: true }));
    });
    // 2. Background update
    try {
      await markAllRead(notifs);
    } catch {}
    qc.invalidateQueries({ queryKey: notifKeys.all });
  };
}

export function useMarkRead() {
  const qc = useQueryClient();
  return async (id: string) => {
    // 1. Optimistic update
    qc.setQueryData<InboxNotif[]>(notifKeys.all, (old) => {
      if (!old) return [];
      return old.map(n => n.id === id ? { ...n, read: true } : n);
    });
    // 2. Background update
    try {
      await markRead(id);
    } catch {}
    qc.invalidateQueries({ queryKey: notifKeys.all });
  };
}

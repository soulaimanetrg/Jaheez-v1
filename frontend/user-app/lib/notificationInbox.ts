import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminApiUrl } from './adminApi';

const READ_KEY  = 'jaheez:notif:read_ids';
const LOCAL_KEY = 'jaheez:notif:local';

export type NotifType = 'broadcast' | 'order' | 'system';

export interface InboxNotif {
  id: string;
  title: string;
  body: string;
  type: NotifType;
  orderId?: string;
  created_at: string;
  read: boolean;
}

function detectNotifType(title: string, body: string): NotifType {
  const text = `${title} ${body}`.toLowerCase();
  if (
    text.includes('commande') ||
    text.includes('order') ||
    text.includes('livr') ||
    text.includes('deliv') ||
    text.includes('l’adresse')
  ) {
    return 'order';
  }
  if (
    text.includes('mise à jour') ||
    text.includes('update') ||
    text.includes('conditions') ||
    text.includes('maintenance') ||
    text.includes('système') ||
    text.includes('system')
  ) {
    return 'system';
  }
  return 'broadcast';
}

/* ── Remote broadcast feed ─────────────────────────────────────────── */
export async function fetchBroadcastNotifs(): Promise<InboxNotif[]> {
  try {
    const res = await fetch(adminApiUrl('/admin-api/notification-feed/public'));
    if (!res.ok) return [];
    const rows: any[] = await res.json();
    const readIds = await getReadIds();
    return rows.map(r => ({
      id:         `bc-${r.id}`,
      title:      r.title,
      body:       r.body,
      type:       detectNotifType(r.title, r.body),
      created_at: r.created_at,
      read:       readIds.has(`bc-${r.id}`),
    }));
  } catch { return []; }
}

/* ── Local order/system notifications (from push) ──────────────────── */
export async function getLocalNotifs(): Promise<InboxNotif[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const items: InboxNotif[] = JSON.parse(raw);
    const readIds = await getReadIds();
    return items.map(n => ({ ...n, read: readIds.has(n.id) }));
  } catch { return []; }
}

export async function storeLocalNotif(notif: Omit<InboxNotif, 'read'>): Promise<void> {
  try {
    const existing = await getLocalNotifs();
    const deduped  = existing.filter(n => n.id !== notif.id);
    const updated  = [{ ...notif, read: false }, ...deduped].slice(0, 60);
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
  } catch {}
}

/* ── Read state ────────────────────────────────────────────────────── */
export async function markRead(...ids: string[]): Promise<void> {
  const readIds = await getReadIds();
  ids.forEach(id => readIds.add(id));
  await AsyncStorage.setItem(READ_KEY, JSON.stringify([...readIds]));
}

export async function markAllRead(notifs: InboxNotif[]): Promise<void> {
  await markRead(...notifs.map(n => n.id));
}

async function getReadIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(READ_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

/* ── Merge helper ──────────────────────────────────────────────────── */
export async function fetchAllNotifs(): Promise<InboxNotif[]> {
  const [broadcasts, local] = await Promise.all([
    fetchBroadcastNotifs(),
    getLocalNotifs(),
  ]);
  const merged = [...local, ...broadcasts];
  const seen   = new Set<string>();
  return merged
    .filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

import { getAuthHeader, handle401, API_BASE, adminGetAuditLogs } from '@/lib/adminApi';
import { req, DashboardResp, AnalyticsData } from '@/lib/api';

export async function adminGetStats(): Promise<any> {
  const res = await fetch(`${API_BASE}/dashboard`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch stats');
  const data = await res.json();
  const stats = data.stats ?? data;
  return {
    activeOrders: stats.pendingOrders ?? 0,
    totalOrders: stats.ordersToday ?? 0,
    revenueToday: stats.revenueToday ?? 0,
    deliveredToday: 0,
    cancelledToday: 0,
    byStatus: {},
    ...stats,
  };
}

export async function adminGetAnalyticsRevenue(days = 30): Promise<any[]> {
  const res = await fetch(`${API_BASE}/analytics?days=${days}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  const data = await res.json();
  return data.daily ?? [];
}

export async function adminGetAnalyticsOrders(days = 30): Promise<any[]> {
  const res = await fetch(`${API_BASE}/analytics?days=${days}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  const data = await res.json();
  return data.daily ?? [];
}

export async function adminGetAnalyticsTopStores(limit = 10): Promise<any[]> {
  const res = await fetch(`${API_BASE}/analytics`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch top stores');
  const data = await res.json();
  return (data.topStores ?? []).slice(0, limit);
}

export async function adminGetAnalyticsTopDrivers(limit = 10): Promise<any[]> {
  return [];
}

export async function adminGetSecurityAlerts(): Promise<{ failedLoginsLast24h: number; recentFailedAttempts: any[] }> {
  try {
    const logs = await adminGetAuditLogs({ action: 'login_failed', limit: 50 });
    const last24h = logs.filter((l: any) => {
      const d = new Date(l.created_at);
      return Date.now() - d.getTime() < 86400000;
    });
    return { failedLoginsLast24h: last24h.length, recentFailedAttempts: last24h };
  } catch {
    return { failedLoginsLast24h: 0, recentFailedAttempts: [] };
  }
}

export const apiDashboard = () => req<DashboardResp>('/dashboard');

export const apiAnalytics = (days?: number) =>
  req<AnalyticsData>(`/analytics${days ? `?days=${days}` : ''}`);

export async function adminExport(type: "orders" | "users" | "drivers"): Promise<void> {
  const res = await fetch(`${API_BASE}/export/${type}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jaheez-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}


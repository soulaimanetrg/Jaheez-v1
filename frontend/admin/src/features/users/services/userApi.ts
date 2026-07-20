import { getAuthHeader, handle401, API_BASE, apiRequest } from '@/lib/adminApi';
import { req, AppUser, Driver, DriverDetail, DriverDoc, AdminAccount, AuditLog } from '@/lib/api';

export async function adminGetUsers(search?: string): Promise<any[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_BASE}/users${q}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch users');
  }
  return res.json();
}

export async function adminUpdateUser(id: string, data: { name?: string; isSuspended?: boolean; is_banned?: boolean }): Promise<any> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  handle401(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update user');
  }
  return res.json();
}

export async function adminGetUserOrders(userId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/orders?user_id=${userId}`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to fetch user orders');
  return res.json();
}

export async function adminDeleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to delete user');
}

export async function adminGetDrivers(status?: string, search?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (status) params.append('filter', status);
  if (search) params.append('search', search);
  const q = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/drivers${q}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Failed to fetch drivers (${res.status})`);
  }
  return res.json();
}

export async function adminCreateDriver(data: {
  full_name: string;
  cin: string;
  phone: string;
  password: string;
  vehicle_type?: string;
  vehicle_plate?: string | null;
  city?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/admin/drivers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  handle401(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create driver');
  }
  return res.json();
}

export async function adminUpdateDriver(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_BASE}/drivers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  handle401(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Failed to update driver');
  }
  return res.json();
}

export async function adminResetDriverPassword(id: string, newPassword: string): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/admin/drivers/${id}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ new_password: newPassword }),
  });
  handle401(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Failed to reset driver password');
  }
  return res.json();
}

export async function adminDeleteDriver(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/drivers/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Failed to delete driver');
  }
}

export async function adminGetDriverIssues(status?: string): Promise<any[]> {
  const q = status && status !== 'all' ? `?status=${status}` : '';
  const res = await fetch(`${API_BASE}/driver-issues${q}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch driver issues');
  return res.json();
}

export async function adminResolveDriverIssue(id: string, resolutionNote?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/driver-issues/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ status: 'resolved', resolution_note: resolutionNote }),
  });
  handle401(res);
  if (!res.ok) throw new Error('Failed to resolve driver issue');
}


export async function adminGetAdmins(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/admins`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch admins');
  return res.json();
}

export async function adminCreateAdmin(data: { email: string; name: string; password: string; role: string }): Promise<any> {
  const res = await fetch(`${API_BASE}/admins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ email: data.email, full_name: data.name, password: data.password, role: data.role }),
  });
  handle401(res);
  if (!res.ok) throw new Error('Failed to create admin');
  return res.json();
}

export async function adminUpdateAdmin(id: string, data: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_BASE}/admins/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  handle401(res);
  if (!res.ok) throw new Error('Failed to update admin');
  return res.json();
}

export async function adminDeleteAdmin(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admins/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to delete admin');
}

export async function adminResetAdminToken(id: string): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE}/admins/${id}/reset-token`, { method: 'POST', headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to reset token');
  return res.json();
}

export async function adminGetAuditLogs(params?: { action?: string; targetType?: string; limit?: number }): Promise<any[]> {
  const q = new URLSearchParams();
  if (params?.action) q.set('action', params.action);
  if (params?.targetType) q.set('targetType', params.targetType);
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString() ? `?${q.toString()}` : '';
  const res = await fetch(`${API_BASE}/audit-logs${qs}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map((row: any) => ({
    id: String(row.id ?? ''),
    action: row.action ?? 'unknown',
    actorId: row.actorId ?? row.admin_id ?? row.actor_id ?? row.admin_email ?? '',
    actorRole: row.actorRole ?? row.actor_role ?? row.role ?? 'admin',
    targetType: row.targetType ?? row.entity_type ?? row.target_type ?? '',
    targetId: row.targetId ?? row.entity_id ?? row.target_id ?? '',
    result: row.result ?? (row.action?.includes('forbidden') ? 'failure' : 'success'),
    ipAddress: row.ipAddress ?? row.ip ?? row.ip_address ?? null,
    userAgent: row.userAgent ?? row.user_agent ?? null,
    failureReason: row.failureReason ?? row.failure_reason ?? null,
    previousValue: row.previousValue ?? row.old_value ?? null,
    newValue: row.newValue ?? row.new_value ?? null,
    createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
  }));
}

// From api.ts
export const apiUsers = {
  list: (filter?: string) =>
    req<AppUser[]>(
      `/users${filter && filter !== 'all'
        ? filter === 'banned' ? '?banned=true' : `?role=${filter}`
        : ''}`
    ),
  update: (id: string, d: object) =>
    req<void>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
};

export const apiDrivers = {
  list: (filter?: string) =>
    req<Driver[]>(`/drivers${filter && filter !== 'all' ? `?filter=${filter}` : ''}`),
  detail: (id: string) => req<DriverDetail>(`/drivers/${id}`),
  update: (id: string, d: object) =>
    req<void>(`/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
};

export const apiAdmins = {
  list: () => req<AdminAccount[]>('/admins'),
  create: (d: object) =>
    req<AdminAccount>('/admins', { method: 'POST', body: JSON.stringify(d) }),
  update: (id: string, d: object) =>
    req<void>(`/admins/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
};

export const apiReviews = {
  list: () => req<any[]>('/reviews'),
  update: (id: string, d: object) =>
    req<void>(`/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
};

export const apiAuditLogs = {
  list: (q?: { admin_id?: string; action?: string; entity_type?: string; from?: string; to?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.admin_id)    p.set('admin_id',    q.admin_id);
    if (q?.action)      p.set('action',      q.action);
    if (q?.entity_type) p.set('entity_type', q.entity_type);
    if (q?.from)        p.set('from',        q.from);
    if (q?.to)          p.set('to',          q.to);
    if (q?.limit)       p.set('limit',       String(q.limit));
    const qs = p.toString();
    return req<AuditLog[]>(`/audit-logs${qs ? '?' + qs : ''}`);
  },
  actions: () => req<string[]>('/audit-logs/actions'),
};

export async function adminGetWallets(): Promise<{ id: string; userId: string; userName: string; userPhone: string; balance: number }[]> {
  const res = await fetch(`${API_BASE}/wallets`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error("Failed to fetch wallets");
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map((row: any) => {
    const userId = row.userId ?? row.user_id ?? '';
    const balance = row.balance ?? (
      row.balance_dh !== undefined ? Number(row.balance_dh) : 0
    );
    return {
      id: row.id ?? row.wallet_id ?? userId,
      userId,
      userName: row.userName ?? row.full_name ?? row.user_name ?? '',
      userPhone: row.userPhone ?? row.phone ?? row.user_phone ?? '',
      balance: Number.isFinite(Number(balance)) ? Number(balance) : 0,
    };
  });
}

export async function adminAdjustWallet(userId: string, data: { amount: number; type: "credit" | "debit"; description: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/wallets/${userId}/adjust`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ amount_dh: data.amount, type: data.type, reason: data.description }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Failed to adjust wallet");
  }
}

export type SupportTicket = {
  id: string;
  userId: string;
  orderId: string | null;
  subject: string;
  description: string;
  status: string;
  assignedTo: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  userName?: string | null;
  userPhone?: string | null;
};

export async function adminGetSupportTickets(status?: string): Promise<SupportTicket[]> {
  const q = status && status !== "all" ? `?status=${status}` : "";
  const res = await fetch(`${API_BASE}/support/tickets${q}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error("Failed to fetch support tickets");
  return res.json();
}

export async function adminUpdateSupportTicket(id: string, data: { status?: string; adminNote?: string; assignedTo?: string }): Promise<SupportTicket> {
  const res = await fetch(`${API_BASE}/support/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update ticket");
  return res.json();
}

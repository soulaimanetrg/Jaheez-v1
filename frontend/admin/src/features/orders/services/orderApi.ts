import { getAuthHeader, handle401, API_BASE, apiRequest } from '@/lib/adminApi';
import { req, Order, OrderItem, PayoutRequest, Refund, WalletListItem, WalletDetail } from '@/lib/api';

export async function adminGetOrders(params?: { status?: string; search?: string }): Promise<any[]> {
  const sp = new URLSearchParams();
  if (params?.status && params.status !== 'all') sp.append('status', params.status);
  if (params?.search) sp.append('search', params.search);
  const q = sp.toString() ? `?${sp.toString()}` : '';
  const res = await fetch(`${API_BASE}/orders${q}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function adminGetAvailableDrivers(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/drivers?filter=active`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error("Failed to fetch available drivers");
  const drivers = await res.json();
  return Array.isArray(drivers) ? drivers.filter((driver) => driver.is_active === true && driver.is_verified === true) : [];
}

export interface AdminErrand {
  id:string;user_id:string;status:string;moderation_status:string;driver_id:string|null;total_dh:number;created_at:string;
  proofs:{id:string;proof_type:'pickup'|'delivery';mime_type:string;size_bytes:number;created_at:string;url:string|null}[];
  events:{event_type:string;actor_type:string;created_at:string;metadata:Record<string,unknown>}[];
  details:{service_type:string;errand_stage:string;pickup_address:string;pickup_contact_name:string;pickup_contact_phone:string;recipient_name:string;recipient_phone:string;item_category:string;item_size:string;weight_band:string;declared_value_dh:number;existing_order_code:string|null;existing_order_paid:boolean|null;instructions:string|null;scheduled_for:string|null;risk_flags:string[];quote:{version:number;pricing_version:string;expires_at:string;requires_manual_price:boolean;distance_km:number}|null}|null;
}
export async function adminGetErrands():Promise<AdminErrand[]>{const res=await fetch(`${API_BASE}/errands`,{headers:getAuthHeader()});handle401(res);if(!res.ok)throw new Error('Failed to fetch errands');return res.json();}
export async function adminReviewErrand(id:string,body:{action:'approve'|'reject'|'request_information';reason:string}){const res=await fetch(`${API_BASE}/errands/${id}/review`,{method:'POST',headers:{'Content-Type':'application/json',...getAuthHeader()},body:JSON.stringify(body)});handle401(res);if(!res.ok){const error=await res.json().catch(()=>({}));throw new Error(error.error||'Failed to review errand');}return res.json();}
export async function adminOpenErrandDispute(id:string,reason:string){const res=await fetch(`${API_BASE}/errands/${id}/dispute`,{method:'POST',headers:{'Content-Type':'application/json',...getAuthHeader()},body:JSON.stringify({reason})});handle401(res);if(!res.ok){const error=await res.json().catch(()=>({}));throw new Error(error.error||'Failed to open dispute');}return res.json();}
export interface AdminManualErrandQuote{id:string;version:number;distance_km:number;expires_at:string;created_at:string;draft:{id:string;user_id:string;service_type:string;pickup_address:string;dropoff_address:string;risk_flags:string[]}|null}
export async function adminGetManualErrandQuotes():Promise<AdminManualErrandQuote[]>{const res=await fetch(`${API_BASE}/errands/manual-quotes`,{headers:getAuthHeader()});handle401(res);if(!res.ok)throw new Error('Failed to fetch manual quotes');return res.json();}
export async function adminAdjustErrandQuote(id:string,total_dh:number,reason:string){const res=await fetch(`${API_BASE}/errands/manual-quotes/${id}`,{method:'POST',headers:{'Content-Type':'application/json',...getAuthHeader()},body:JSON.stringify({total_dh,reason})});handle401(res);if(!res.ok){const error=await res.json().catch(()=>({}));throw new Error(error.error||'Failed to adjust quote');}return res.json();}

export async function adminCleanupDevelopmentDispatch(): Promise<any> {
  const res = await fetch(`${API_BASE}/orders/dev-cleanup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ confirm: 'DELETE_TEST_ORDERS' }),
  });
  handle401(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Failed to clean dispatch');
  }
  return res.json();
}

export async function adminUpdateOrderStatus(id: string, data: { status: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  handle401(res);
  if (!res.ok) throw new Error('Failed to update status');
}

export async function adminAssignDriver(orderId: string, driverId: string | null): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ driver_id: driverId }),
  });
  handle401(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to assign driver');
  }
}

export async function adminCancelOrder(orderId: string, reason: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ status: 'cancelled', reason }),
  });
  handle401(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to cancel order');
  }
}

export async function adminUpdateOrderNote(orderId: string, note: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ admin_note: note }),
  });
  handle401(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update note');
  }
}

export async function adminGetRefunds(status?: string): Promise<any[]> {
  const q = status && status !== 'all' ? `?status=${status}` : '';
  const res = await fetch(`${API_BASE}/refunds${q}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch refunds');
  return res.json();
}

export async function adminCreateRefund(data: Record<string, unknown>): Promise<any> {
  return apiRequest('/refunds', { method: 'POST', body: JSON.stringify(data) });
}

export async function adminUpdateRefund(id: string, data: Record<string, unknown>): Promise<any> {
  return apiRequest(`/refunds/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function adminGetPayouts(status?: string): Promise<any[]> {
  const q = status && status !== 'all' ? `?status=${status}` : '';
  const res = await fetch(`${API_BASE}/payouts${q}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch payouts');
  return res.json();
}

export async function adminUpdatePayout(id: string, data: Record<string, unknown>): Promise<any> {
  return apiRequest(`/payouts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function adminCreatePayout(data: Record<string, unknown>): Promise<any> {
  return apiRequest('/payouts', { method: 'POST', body: JSON.stringify(data) });
}

export async function adminGetCodSettlements(driverId?: string): Promise<any[]> {
  const q = driverId ? `?driver_id=${driverId}` : '';
  const res = await fetch(`${API_BASE}/cod-settlements${q}`, { headers: getAuthHeader() });
  handle401(res);
  if (!res.ok) throw new Error('Failed to fetch COD settlements');
  return res.json();
}

export async function adminCreateCodSettlement(data: Record<string, unknown>): Promise<any> {
  return apiRequest('/cod-settlements', { method: 'POST', body: JSON.stringify(data) });
}

// From api.ts
export const apiOrders = {
  list: (status?: string) =>
    req<Order[]>(`/orders${status && status !== 'all' ? `?status=${status}` : ''}`),
  items: (id: string) => req<OrderItem[]>(`/orders/${id}/items`),
  updateStatus: (id: string, status: string) =>
    req<void>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignDriver: (id: string, driver_id: string | null) =>
    req<void>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ driver_id }) }),
};

export const apiPayouts = {
  list: (status?: string) =>
    req<PayoutRequest[]>(`/payouts${status && status !== 'all' ? `?status=${status}` : ''}`),
  update: (id: string, body: { status: 'approved'|'paid'|'rejected'; admin_note?: string }) =>
    req<PayoutRequest>(`/payouts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export const apiCodSettlements = {
  list: (driver_id?: string) =>
    req<any[]>(`/cod-settlements${driver_id ? '?driver_id=' + driver_id : ''}`),
  create: (body: { driver_id: string; amount_dh: number|string; request_id: string; external_reference?: string; method?: string; note?: string }) =>
    req<any>('/cod-settlements', { method: 'POST', body: JSON.stringify(body) }),
};

export const apiWallets = {
  list:   (q?: string) => req<WalletListItem[]>(`/wallets${q ? '?q=' + encodeURIComponent(q) : ''}`),
  detail: (user_id: string) => req<WalletDetail>(`/wallets/${user_id}`),
  adjust: (user_id: string, body: { type: 'credit'|'debit'; amount_dh: number|string; reason: string; note?: string }) =>
    req<{ ok: true; old_balance_dh: number; new_balance_dh: number }>(
      `/wallets/${user_id}/adjust`, { method: 'POST', body: JSON.stringify(body) }),
  freeze: (user_id: string, body: { reason: string }) =>
    req<{ ok: true }>(`/wallets/${user_id}/freeze`, { method: 'POST', body: JSON.stringify(body) }),
  unfreeze: (user_id: string, body?: { note?: string }) =>
    req<{ ok: true }>(`/wallets/${user_id}/unfreeze`, { method: 'POST', body: JSON.stringify(body || {}) }),
};

export const apiRefunds = {
  list:   (status?: string) => req<Refund[]>(`/refunds${status && status !== 'all' ? '?status=' + status : ''}`),
  create: (d: { order_id?: string; user_id?: string; user_name?: string; user_phone?: string;
                amount_dh: number|string; method: 'wallet'|'cash'|'gateway'; request_id: string;
                reason: string; internal_note?: string; payment_reference?: string }) =>
    req<Refund>('/refunds', { method: 'POST', body: JSON.stringify(d) }),
  update: (id: string, d: { status: string; decision_note?: string; request_id: string }) =>
    req<void>(`/refunds/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  stats: () => req<{ pending_count: number; pending_amount_dh: number; completed_count: number; completed_today_dh: number }>('/refunds/stats'),
};

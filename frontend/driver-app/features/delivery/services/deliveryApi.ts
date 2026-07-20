import { req, OrderRow } from '@/lib/api';

export interface IssueTicket {
  id: string;
  order_id: string;
  reason: string;
  note?: string | null;
  created_at: string;
}

export const orders = (scope: 'available'|'mine'|'history') => req<OrderRow[]>(`/driver/orders?scope=${scope}`);

export const navigation = (id: string, destination: 'pickup' | 'dropoff') =>
  req<{
    provider: 'google_maps';
    destination: 'pickup' | 'dropoff';
    label: string;
    address: string;
    has_coordinates: boolean;
    url: string;
  }>(`/driver/orders/${id}/navigation?destination=${destination}`);

export const claim = (id: string) => req<OrderRow>(`/driver/orders/${id}/claim`, { method: 'POST' });

export const decline = (id: string, reason = 'other', note?: string) =>
  req<{ success: boolean }>(`/driver/orders/${id}/decline`, {
    method: 'POST',
    body: JSON.stringify({ reason, note: note || null }),
  });

export const stage = (id: string, stage: 'arrived_pickup'|'picked_up'|'arrived_customer'|'delivered', code?: string) =>
  req<OrderRow>(`/driver/orders/${id}/stage`, { method: 'POST', body: JSON.stringify({ stage, code: code || null }) });

export const cancel = (id: string, reason: string) =>
  req<OrderRow>(`/driver/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });

export const reportIssue = (orderId: string, reason: string, note?: string) =>
  req<{ logged: boolean; ticket?: IssueTicket }>(`/driver/orders/${orderId}/issue`, {
    method: 'POST', body: JSON.stringify({ reason, note }),
  });

export const uploadErrandProof = (orderId:string,proofType:'pickup'|'delivery',mimeType:'image/jpeg'|'image/png'|'image/webp',fileBase64:string,idempotencyKey:string) =>
  req<{id:string;proof_type:string;created_at:string;replayed:boolean}>(`/driver/errands/${orderId}/proofs`,{
    method:'POST',headers:{'Idempotency-Key':idempotencyKey},body:JSON.stringify({proof_type:proofType,mime_type:mimeType,file_base64:fileBase64}),
  });

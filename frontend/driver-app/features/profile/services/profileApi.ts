import { req, Driver, DriverDoc } from '@/lib/api';

export type ShiftSummary = {
  shift_id: string;
  orders_count: number;
  total_earnings_dh: number;
  payable_dh: number;
  held_dh: number;
  cod_due_dh: number;
  payout_status: 'not_ready' | 'pending_review' | 'held' | 'approved' | 'paid' | 'rejected' | 'reversed';
  hold_reason?: string | null;
};

type DriverProfileUpdate = Pick<Driver, 'vehicle_type' | 'vehicle_plate' | 'full_name' | 'phone'>;

export const me = () => req<Driver>('/driver/me');

export const updateMe = (d: Partial<DriverProfileUpdate>) => req<Driver>('/driver/me', { method: 'PATCH', body: JSON.stringify(d) });

export const updateLocation = (loc: { latitude?: number; longitude?: number; accuracy?: number | null; heading?: number | null; speed?: number | null; battery_level?: number | null; app_active?: boolean; is_background?: boolean; client_recorded_at?: string | null; is_mocked?: boolean | null; continuity_valid?: boolean | null }) =>
  req<{ success: boolean; driver?: Driver }>('/driver/me/location', { method: 'PATCH', body: JSON.stringify(loc) });

export const startShift = () =>
  req<{ success: boolean; driver?: Driver }>('/driver/me/shift/start', { method: 'POST' });

export const endShift = () =>
  req<{ success: boolean; driver?: Driver; shift_summary?: ShiftSummary | null }>('/driver/me/shift/end', { method: 'POST' });

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export const changePassword = (body: ChangePasswordInput) =>
  req<{ success: boolean }>('/driver/me/change-password', { method: 'POST', body: JSON.stringify(body) });

export const documents = () => req<DriverDoc[]>('/driver/documents');

export const uploadDocument = (doc_type: string, url: string) =>
  req<DriverDoc>('/driver/documents', { method: 'POST', body: JSON.stringify({ doc_type, url }) });
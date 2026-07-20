// ─────────────────────────────────────────────────────
// JAHEEZ — Infobip OTP Service
//
// Sends and verifies SMS OTP via our own backend proxy
// at /admin-api/otp/send and /admin-api/otp/verify
// ─────────────────────────────────────────────────────

import type { ApiResponse } from '@shared/types';
import { adminApiUrl } from './adminApi';

const OTP_BASE = '/admin-api/otp';

// ── Send OTP ──────────────────────────────────────────
export async function infobipSendOTP(phone: string): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(adminApiUrl(`${OTP_BASE}/send`), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone }),
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: json.error ?? 'فشل إرسال رمز التحقق' };
    return { data: null, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'فشل الاتصال بالخادم';
    return { data: null, error: msg };
  }
}

// ── Verify OTP ────────────────────────────────────────
export async function infobipVerifyOTP(
  phone: string,
  code: string,
): Promise<ApiResponse<{ verified: boolean }>> {
  try {
    const res = await fetch(adminApiUrl(`${OTP_BASE}/verify`), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, code }),
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: json.error ?? 'رمز التحقق غير صحيح' };
    return { data: { verified: true }, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'فشل الاتصال بالخادم';
    return { data: null, error: msg };
  }
}

// ── Send Profile OTP (supports phone or email) ─────────
export async function sendProfileOtp(payload: { phone?: string; email?: string }): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const res = await fetch(adminApiUrl(`${OTP_BASE}/send`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, reason: 'profile_update' }),
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: json.error ?? 'فشل إرسال رمز التحقق' };
    return { data: { success: true }, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'فشل الاتصال بالخادم';
    return { data: null, error: msg };
  }
}

// ── Verify Profile OTP (supports phone or email) ───────
export async function verifyProfileOtp(payload: { phone?: string; email?: string; code: string }): Promise<ApiResponse<{ verified: boolean; otp_proof?: string }>> {
  try {
    const res = await fetch(adminApiUrl(`${OTP_BASE}/verify`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, reason: 'profile_update' }),
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: json.error ?? 'رمز التحقق غير صحيح' };
    return { data: { verified: true, otp_proof: json.otp_proof }, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'فشل الاتصال بالخادم';
    return { data: null, error: msg };
  }
}

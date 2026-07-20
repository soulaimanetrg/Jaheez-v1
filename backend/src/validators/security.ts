// ─────────────────────────────────────────────────────────────
// JAHEEZ — Security-first Zod utilities & base schemas
// OWASP API Security Top 10 2023 / ASVS 4.0 compliant hardened primitives
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

// ── Forbidden server-owned field names (mass assignment guard) ──
export const SERVER_OWNED_FIELDS = new Set([
  'id', 'user_id', 'driver_id', 'admin_id', 'status', 'assigned_driver_id',
  'payment_status', 'fraud_status', 'points_delta', 'score_after',
  'commission_amount', 'cod_balance', 'payout_status', 'responsible_party',
  'created_at', 'updated_at', 'role', 'is_banned', 'trust_score',
  'total_deliveries', 'rating_avg', 'legacy_earnings_dh', 'cod_due_dh',
  '_centimes', 'internal_id', 'ledger_id', 'rls_helper',
]);

/**
 * Reject any object containing server-owned keys (case-insensitive).
 * Throws a Zod-like error array for uniform handling in validate.middleware.
 */
export function rejectServerOwned<T extends Record<string, unknown>>(obj: T, pathPrefix = 'body'): void {
  const keys = Object.keys(obj);
  const found = keys.filter((k) =>
    SERVER_OWNED_FIELDS.has(k) ||
    SERVER_OWNED_FIELDS.has(k.toLowerCase())
  );
  if (found.length > 0) {
    throw new Error(
      `Mass assignment blocked: [${found.join(', ')}] at ${pathPrefix}`
    );
  }
}

// ── Sanitization helpers ──

const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

export function sanitizeString(input: string): string {
  return input
    .replace(CONTROL_CHARS, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\s*script\s*[^>]*>/gi, '')
    .trim();
}

export function sanitizeUrl(input: string): string {
  const lower = input.toLowerCase().trim();
  const blocked = [
    'javascript:', 'data:', 'vbscript:', 'file:', 'ftp:',
    'ldap:', 'smb:', 'ssh:', 'telnet:', 'http://localhost',
    'http://127.', 'http://0.', 'http://10.', 'http://192.168.',
    'https://localhost', 'https://127.', 'https://0.',
  ];
  if (blocked.some((b) => lower.startsWith(b))) {
    throw new Error("URL contains a forbidden scheme");
  }
  return input.trim();
}

// ── Base Zod schemas (hardened primitives) ──

/** Hardened string with trimming and control-char stripping */
export function zString(opts: { min?: number; max?: number; message?: string } = {}) {
  let s: z.ZodType<string> = z.string().transform((val) => sanitizeString(val)).pipe(z.string());
  if (opts.min !== undefined) s = s.pipe(z.string().min(opts.min, opts.message));
  if (opts.max !== undefined) s = s.pipe(z.string().max(opts.max, opts.message));
  return s;
}

export function zStringTrimmed(opts: { min?: number; max?: number; message?: string } = {}) {
  return zString(opts).transform((val) => val.trim());
}

export function zEmail() {
  return zString({ max: 254 }).pipe(
    z.string().email("L'adresse e-mail n'est pas valide")
  );
}

export function zUrlSafe() {
  return z.string().max(2048).transform(sanitizeUrl);
}

/** Coerce numeric strings to numbers safely */
export function zCoerceNumber(opts: { min?: number; max?: number; allowNull?: boolean } = {}) {
  const base = z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) {
        return opts.allowNull ? null : undefined;
      }
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const n = Number(val);
        return Number.isNaN(n) ? undefined : n;
      }
      return undefined;
    },
    opts.allowNull
      ? z.number().nullable().optional()
      : z.number().optional()
  );
  return base;
}

/** Coerce boolean from 'true'/'false', 0/1, booleans */
export function zCoerceBoolean() {
  return z.preprocess((val) => {
    if (typeof val === 'boolean') return val;
    if (val === 'true' || val === 1 || val === '1') return true;
    if (val === 'false' || val === 0 || val === '0') return false;
    return undefined;
  }, z.boolean().optional());
}

// ── Common field schemas ──

export function zPassword(minLength = 8) {
  return zString({ min: minLength, max: 128 }).pipe(
    z.string().regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une lettre et un chiffre'
    )
  );
}

export function zPhone() { return zString({ min: 8, max: 30 }); }
export function zCin() { return zString({ min: 3, max: 20 }); }
export function zUuid(message = 'UUID invalide') { return z.string().uuid(message); }
export function zLatitude() { return z.number().min(-90, 'Latitude invalide').max(90, 'Latitude invalide'); }
export function zLongitude() { return z.number().min(-180, 'Longitude invalide').max(180, 'Longitude invalide'); }
export function zPositiveInt() { return z.number().int().positive(); }
export function zNonEmptyString(max = 5000) { return zString({ min: 1, max }); }

// ── File/image helpers (for upload routes) ──

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_MB = 5;

export function sizeInBytes(mb: number): number {
  return mb * 1024 * 1024;
}

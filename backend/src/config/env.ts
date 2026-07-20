import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from local/private files first, then shared repo-level env files.
// .env.staging.local is intentionally ignored by Git and is the preferred place for staging secrets.
dotenv.config({ path: path.join(__dirname, '../../.env.staging.local') });
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// A staging process must use the isolated staging project exclusively. Do
// this mapping before validation so generic runtime names cannot silently
// fall back to production values loaded from .env.
if (process.env.JAHEEZ_TARGET_ENV === 'staging') {
  const stagingRuntime = {
    SUPABASE_URL: process.env.STAGING_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.STAGING_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.STAGING_ANON_KEY,
    DATABASE_URL: process.env.STAGING_DATABASE_URL,
  };
  const missing = Object.entries(stagingRuntime)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Staging runtime variables are missing: ${missing.join(', ')}`);
  }
  Object.assign(process.env, stagingRuntime);
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3002),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  SUPABASE_ANON_KEY: z.string().min(10),
  ADMIN_JWT_SECRET: z.string().min(32, "ADMIN_JWT_SECRET must be at least 32 characters for security"),
  // Separate signing/HMAC secrets per role so one leaked secret does not
  // compromise every actor type. Fall back to ADMIN_JWT_SECRET until the
  // dedicated values are provisioned (setting DRIVER_JWT_SECRET invalidates
  // outstanding driver tokens — drivers re-login once).
  DRIVER_JWT_SECRET: z.string().min(32, "DRIVER_JWT_SECRET must be at least 32 characters for security").optional(),
  OTP_HASH_SECRET: z.string().min(32, "OTP_HASH_SECRET must be at least 32 characters for security").optional(),
  DATABASE_URL: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REDIS_REQUIRED: z.preprocess((val) => val === 'true' || val === true || val === '1', z.boolean()).default(false),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  INFOBIP_API_KEY: z.string().optional(),
  INFOBIP_BASE_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('Jaheez <noreply@jaheez.ma>'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  // Master freeze for ALL provider OTP delivery (Wasender, Meta, Twilio).
  // Frozen by default: providers stay wired but no outbound OTP is sent and
  // no provider credential is used until this is explicitly set to false.
  // Driver login falls back to CIN+password; the customer send-SMS hook
  // answers 503 so Supabase surfaces a clean delivery failure.
  OTP_DELIVERY_FROZEN: z.preprocess((val) => !(val === 'false' || val === false || val === '0'), z.boolean()).default(true),
  WHATSAPP_OTP_PROVIDER: z.enum(['wasender', 'meta']).default('wasender'),
  SUPABASE_SEND_SMS_HOOK_SECRET: z.string().optional(),
  WASENDER_API_URL: z.string().url().default('https://www.wasenderapi.com/api'),
  WASENDER_SESSION_API_KEY: z.string().optional(),
  WASENDER_WEBHOOK_SECRET: z.string().optional(),
  META_WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  META_WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  META_WHATSAPP_TEMPLATE_NAME: z.string().optional(),
  META_WHATSAPP_TEMPLATE_LANGUAGE: z.string().default('fr'),
  GOOGLE_MAPS_SERVER_API_KEY: z.string().optional(),
  MODERNMT_API_KEY: z.string().optional(),
  DEFAULT_MAP_LATITUDE: z.coerce.number().min(-90).max(90).optional(),
  DEFAULT_MAP_LONGITUDE: z.coerce.number().min(-180).max(180).optional(),
  PAYMENT_PROVIDER: z.enum(['disabled', 'manual', 'cmi', 'payzone', 'cashplus']).default('disabled'),
  ONLINE_PAYMENTS_ENABLED: z.preprocess((val) => val === 'true' || val === true || val === '1', z.boolean()).default(false),
  CORS_ORIGINS: z.string().optional(),
  OUTBOUND_INTEGRATIONS_DISABLED: z.preprocess((val) => val === 'true' || val === true || val === '1', z.boolean()).default(false),
  JAHEEZ_TARGET_ENV: z.enum(['staging', 'production']).optional(),
}).superRefine((value, ctx) => {
  if (value.JAHEEZ_TARGET_ENV === 'staging') {
    if (!value.OUTBOUND_INTEGRATIONS_DISABLED) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Staging requires OUTBOUND_INTEGRATIONS_DISABLED=true' });
  }
  if (!value.ONLINE_PAYMENTS_ENABLED && value.PAYMENT_PROVIDER !== 'disabled') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'PAYMENT_PROVIDER must be disabled while ONLINE_PAYMENTS_ENABLED=false' });
  }
  if (value.JAHEEZ_TARGET_ENV === 'production' && value.ONLINE_PAYMENTS_ENABLED && value.PAYMENT_PROVIDER === 'disabled') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Production online payments require an explicit Moroccan-compatible PAYMENT_PROVIDER' });
  }
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Environment validation failed:', parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;

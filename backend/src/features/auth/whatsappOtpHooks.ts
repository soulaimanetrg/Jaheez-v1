import crypto from 'crypto';
import { Request, Response } from 'express';
import { Webhook } from 'standardwebhooks';
import { env } from '../../config/env';
import { redis } from '../../redis/redis';
import { CustomerAuthRepository } from './customerAuth.repository';
import { whatsappOtpSender } from './whatsappOtpSender';

const repo = new CustomerAuthRepository();
const sender = whatsappOtpSender();
const normalize = (value: string) => {
  const digits = String(value || '').replace(/\D/g, '');
  const local = digits.startsWith('212') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  if (!/^[67]\d{8}$/.test(local)) throw new Error('invalid_destination');
  return `+212${local}`;
};
const secureEqual = (left: string, right: string) => {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
async function enforceDeliveryLimits(phone: string) {
  if (!redis || redis.status !== 'ready') return;
  const hash = crypto.createHmac('sha256', env.OTP_HASH_SECRET || env.ADMIN_JWT_SECRET).update(phone).digest('hex').slice(0, 24);
  const hourKey = `otp:customer:phone:${hash}:${Math.floor(Date.now() / 3_600_000)}`;
  const dayKey = `otp:customer:wasender:day:${Math.floor(Date.now() / 86_400_000)}`;
  const [hour, day] = await Promise.all([redis.incr(hourKey), redis.incr(dayKey)]);
  if (hour === 1) await redis.expire(hourKey, 3700);
  if (day === 1) await redis.expire(dayKey, 86_500);
  if (hour > 3 || (env.WHATSAPP_OTP_PROVIDER === 'wasender' && day > 50)) throw new Error('delivery_rate_limited');
}

export async function supabaseSendSmsHook(req: Request, res: Response) {
  try {
    if (env.OTP_DELIVERY_FROZEN) return res.status(503).json({ error: { http_code: 503, message: 'OTP delivery is frozen' } });
    if (!env.SUPABASE_SEND_SMS_HOOK_SECRET) return res.status(503).json({ error: { http_code: 503, message: 'OTP delivery is not configured' } });
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body || {});
    const hookSecret = env.SUPABASE_SEND_SMS_HOOK_SECRET.split(',').pop()?.trim() || '';
    const event: any = new Webhook(hookSecret).verify(raw, {
      'webhook-id': String(req.headers['webhook-id'] || ''),
      'webhook-timestamp': String(req.headers['webhook-timestamp'] || ''),
      'webhook-signature': String(req.headers['webhook-signature'] || ''),
    });
    const phone = normalize(event?.user?.phone);
    const otp = String(event?.sms?.otp || '');
    if (!/^\d{6}$/.test(otp)) throw new Error('invalid_otp_payload');
    const settings = await repo.getSettings(['feature_customer_whatsapp_otp_enabled', 'auth_whatsapp_trial_mode', 'auth_whatsapp_trial_numbers']);
    if (settings.feature_customer_whatsapp_otp_enabled !== 'true') throw new Error('whatsapp_disabled');
    if (settings.auth_whatsapp_trial_mode !== 'true') throw new Error('internal_beta_required');
    let allowed: string[] = [];
    try { allowed = JSON.parse(settings.auth_whatsapp_trial_numbers || '[]'); } catch { allowed = []; }
    if (!allowed.some(value => { try { return normalize(value) === phone; } catch { return false; } })) throw new Error('destination_not_allowlisted');
    await enforceDeliveryLimits(phone);
    await sender.sendOtp(phone, otp);
    return res.status(204).send();
  } catch (error: any) {
    const authFailure = /signature|webhook/i.test(String(error?.message || ''));
    return res.status(authFailure ? 401 : 503).json({ error: { http_code: authFailure ? 401 : 503, message: authFailure ? 'Invalid hook signature' : 'WhatsApp OTP is temporarily unavailable' } });
  }
}

export async function wasenderWebhook(req: Request, res: Response) {
  const signature = String(req.headers['x-webhook-signature'] || '');
  if (!env.WASENDER_WEBHOOK_SECRET || !secureEqual(signature, env.WASENDER_WEBHOOK_SECRET)) return res.status(401).json({ error: 'invalid_signature' });
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body || {});
  try {
    const event = JSON.parse(raw);
    if (!['session.status', 'message.sent', 'messages.update'].includes(String(event.event || ''))) return res.status(204).send();
    return res.status(204).send();
  } catch { return res.status(400).json({ error: 'invalid_payload' }); }
}

export async function whatsappProviderHealth(_req: Request, res: Response) {
  if (env.OTP_DELIVERY_FROZEN) {
    return res.status(503).json({ available: false, provider: env.WHATSAPP_OTP_PROVIDER, status: 'frozen' });
  }
  const health = await sender.healthCheck().catch(() => ({ available: false, status: 'unreachable' }));
  return res.status(health.available ? 200 : 503).json({ available: health.available, provider: env.WHATSAPP_OTP_PROVIDER, status: health.status });
}

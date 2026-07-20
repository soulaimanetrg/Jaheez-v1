import { env } from '../../config/env';

export type WhatsAppProviderHealth = { available: boolean; status: string };
export interface WhatsAppOtpSender {
  sendOtp(phone: string, code: string): Promise<{ provider: string; messageId?: string }>;
  healthCheck(): Promise<WhatsAppProviderHealth>;
}

async function request(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timeout); }
}

export class WasenderOtpSender implements WhatsAppOtpSender {
  private cachedHealth: { value: WhatsAppProviderHealth; until: number } | null = null;
  private credentials() {
    if (!env.WASENDER_SESSION_API_KEY) throw new Error('wasender_not_configured');
    return { Authorization: `Bearer ${env.WASENDER_SESSION_API_KEY}`, 'Content-Type': 'application/json' };
  }
  async healthCheck(): Promise<WhatsAppProviderHealth> {
    if (this.cachedHealth && this.cachedHealth.until > Date.now()) return this.cachedHealth.value;
    try {
      const response = await request(`${env.WASENDER_API_URL}/status`, { headers: this.credentials() }, 1500);
      const body: any = await response.json().catch(() => ({}));
      const status = String(body.status || body.data?.status || 'unknown').toLowerCase();
      const value = { available: response.ok && status === 'connected', status };
      this.cachedHealth = { value, until: Date.now() + 30_000 };
      return value;
    } catch { return { available: false, status: 'unreachable' }; }
  }
  async sendOtp(phone: string, code: string) {
    const health = await this.healthCheck();
    if (!health.available) throw new Error(`wasender_session_${health.status}`);
    const response = await request(`${env.WASENDER_API_URL}/send-message`, {
      method: 'POST', headers: this.credentials(),
      body: JSON.stringify({ to: phone, text: `Votre code de verification Jaheez est ${code}. Il expire dans 10 minutes. Ne le partagez jamais.` }),
    }, 3000);
    const body: any = await response.json().catch(() => ({}));
    if (!response.ok || body.success === false) throw new Error('wasender_delivery_rejected');
    return { provider: 'wasender', messageId: String(body.data?.msgId || body.data?.id || '') || undefined };
  }
}

export class MetaOtpSender implements WhatsAppOtpSender {
  async healthCheck() { return { available: Boolean(env.META_WHATSAPP_ACCESS_TOKEN && env.META_WHATSAPP_PHONE_NUMBER_ID), status: 'configured' }; }
  async sendOtp(phone: string, code: string) {
    if (!env.META_WHATSAPP_ACCESS_TOKEN || !env.META_WHATSAPP_PHONE_NUMBER_ID || !env.META_WHATSAPP_TEMPLATE_NAME) throw new Error('meta_not_configured');
    const response = await request(`https://graph.facebook.com/v23.0/${env.META_WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${env.META_WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace(/^\+/, ''), type: 'template', template: { name: env.META_WHATSAPP_TEMPLATE_NAME, language: { code: env.META_WHATSAPP_TEMPLATE_LANGUAGE }, components: [{ type: 'body', parameters: [{ type: 'text', text: code }] }] } }),
    }, 3000);
    const body: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error('meta_delivery_rejected');
    return { provider: 'meta', messageId: body.messages?.[0]?.id };
  }
}

/**
 * Defense-in-depth freeze: even if a caller bypasses the hook-level gate,
 * no outbound OTP leaves the process while OTP_DELIVERY_FROZEN is set.
 */
class FrozenOtpSender implements WhatsAppOtpSender {
  async healthCheck(): Promise<WhatsAppProviderHealth> { return { available: false, status: 'frozen' }; }
  async sendOtp(): Promise<{ provider: string; messageId?: string }> { throw new Error('otp_delivery_frozen'); }
}

export function whatsappOtpSender(): WhatsAppOtpSender {
  if (env.OTP_DELIVERY_FROZEN) return new FrozenOtpSender();
  return env.WHATSAPP_OTP_PROVIDER === 'meta' ? new MetaOtpSender() : new WasenderOtpSender();
}

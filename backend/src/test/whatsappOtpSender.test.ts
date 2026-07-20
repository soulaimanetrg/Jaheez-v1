import { beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '../config/env';
import { WasenderOtpSender, whatsappOtpSender } from '../features/auth/whatsappOtpSender';

describe('WhatsApp OTP sender adapter', () => {
  beforeEach(() => {
    Object.assign(env as any, {
      WHATSAPP_OTP_PROVIDER: 'wasender',
      WASENDER_API_URL: 'https://www.wasenderapi.com/api',
      WASENDER_SESSION_API_KEY: 'private-session-key',
    });
    vi.restoreAllMocks();
  });

  it('rejects delivery when the linked session is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'need_scan' }) }));
    await expect(new WasenderOtpSender().sendOtp('+212612345678', '123456')).rejects.toThrow('wasender_session_need_scan');
  });

  it('checks health then sends the OTP using server-side bearer authentication', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'connected' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { msgId: 42 } }) });
    vi.stubGlobal('fetch', fetchMock);
    const result = await new WasenderOtpSender().sendOtp('+212612345678', '123456');
    expect(result).toEqual({ provider: 'wasender', messageId: '42' });
    expect(fetchMock.mock.calls[1][0]).toBe('https://www.wasenderapi.com/api/send-message');
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer private-session-key');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({ to: '+212612345678' });
  });

  it('switches providers only through server configuration', () => {
    expect(whatsappOtpSender()).toBeInstanceOf(WasenderOtpSender);
  });
});

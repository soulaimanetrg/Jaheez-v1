import { describe, expect, it } from 'vitest';
import { DisabledPaymentProviderAdapter } from '../features/payments/disabledPaymentProvider.adapter';
import { getPaymentProviderAdapter } from '../features/payments/paymentProvider.factory';
import { PaymentProviderService } from '../features/payments/paymentProvider.service';

describe('PaymentProviderService', () => {
  it('reports online payments as disabled and COD as enabled by default', () => {
    const status = new PaymentProviderService().getStatus();

    expect(status.online_payments_enabled).toBe(false);
    expect(status.provider).toBe('disabled');
    expect(status.provider_configured).toBe(false);
    expect(status.provider_adapter_ready).toBe(false);
    expect(status.cod_enabled).toBe(true);
    expect(status.card_checkout_enabled).toBe(false);
    expect(status.supported_future_providers).toContain('cmi');
    expect(status.supported_future_providers).toContain('payzone');
    expect(status.supported_future_providers).toContain('cashplus');
  });

  it('uses a disabled adapter while online payments are paused', () => {
    const adapter = getPaymentProviderAdapter();
    expect(adapter).toBeInstanceOf(DisabledPaymentProviderAdapter);
    expect(adapter.isOnlineCheckoutReady()).toBe(false);
  });

  it('disabled adapter rejects checkout and verification', async () => {
    const adapter = new DisabledPaymentProviderAdapter('cmi');

    await expect(adapter.createSession({
      user_id: 'user-1',
      order_id: 'order-1',
      origin: 'https://jaheez.ma',
      idempotency_key: 'idem-1',
    })).rejects.toThrow(/paused/);

    await expect(adapter.verifySession('user-1', 'session-1')).rejects.toThrow(/paused/);
  });
});

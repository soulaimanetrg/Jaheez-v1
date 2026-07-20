import { env } from '../../config/env';
import { getPaymentProviderAdapter } from './paymentProvider.factory';
import { PaymentProviderId } from './paymentProvider.types';

export class PaymentProviderService {
  getStatus() {
    const provider = env.PAYMENT_PROVIDER as PaymentProviderId;
    const adapter = getPaymentProviderAdapter();
    const adapterReady = adapter.isOnlineCheckoutReady();
    const onlineEnabled = env.ONLINE_PAYMENTS_ENABLED && provider !== 'disabled' && adapterReady;

    return {
      online_payments_enabled: onlineEnabled,
      provider,
      provider_configured: provider !== 'disabled',
      provider_adapter_ready: adapterReady,
      cod_enabled: true,
      wallet_refunds_enabled: true,
      card_checkout_enabled: onlineEnabled,
      message: onlineEnabled
        ? 'Online payments are enabled through the configured Moroccan-compatible provider.'
        : 'Online card payments are paused while JAHEEZ migrates to a Moroccan-compatible provider.',
      supported_future_providers: ['cmi', 'payzone', 'cashplus', 'manual'] as const,
    };
  }
}

import { env } from '../../config/env';
import { DisabledPaymentProviderAdapter } from './disabledPaymentProvider.adapter';
import { PaymentProviderAdapter, PaymentProviderId } from './paymentProvider.types';

export function getPaymentProviderAdapter(): PaymentProviderAdapter {
  const provider = env.PAYMENT_PROVIDER as PaymentProviderId;

  if (!env.ONLINE_PAYMENTS_ENABLED || provider === 'disabled') {
    return new DisabledPaymentProviderAdapter(provider);
  }

  // Fail closed until a contracted Moroccan provider adapter is implemented,
  // reviewed, staged, and explicitly enabled.
  return new DisabledPaymentProviderAdapter(provider);
}

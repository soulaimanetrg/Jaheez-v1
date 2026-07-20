import { ConflictError } from '../../middleware/error.middleware';
import {
  PaymentProviderAdapter,
  PaymentProviderId,
  PaymentSessionRequest,
  PaymentSessionResult,
  PaymentVerificationResult,
} from './paymentProvider.types';

export class DisabledPaymentProviderAdapter implements PaymentProviderAdapter {
  constructor(public readonly id: PaymentProviderId = 'disabled') {}

  isOnlineCheckoutReady(): boolean {
    return false;
  }

  async createSession(_input: PaymentSessionRequest): Promise<PaymentSessionResult> {
    throw new ConflictError('Online payment checkout is paused while JAHEEZ migrates to a Moroccan-compatible payment provider');
  }

  async verifySession(_userId: string, _sessionId: string): Promise<PaymentVerificationResult> {
    throw new ConflictError('Online payment verification is paused while JAHEEZ migrates to a Moroccan-compatible payment provider');
  }
}

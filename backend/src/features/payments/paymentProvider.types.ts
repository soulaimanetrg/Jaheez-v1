export type PaymentProviderId = 'disabled' | 'manual' | 'cmi' | 'payzone' | 'cashplus';

export type PaymentSessionRequest = {
  user_id: string;
  order_id: string;
  origin: string;
  idempotency_key: string | null;
};

export type PaymentSessionResult = {
  provider: PaymentProviderId;
  session_id: string;
  redirect_url?: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
};

export type PaymentVerificationResult = {
  provider: PaymentProviderId;
  session_id: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  order_id?: string;
};

export interface PaymentProviderAdapter {
  readonly id: PaymentProviderId;
  isOnlineCheckoutReady(): boolean;
  createSession(input: PaymentSessionRequest): Promise<PaymentSessionResult>;
  verifySession(userId: string, sessionId: string): Promise<PaymentVerificationResult>;
}

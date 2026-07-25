import crypto from 'crypto';
import { env } from '../../config/env';
import { CustomerAuthRepository } from './customerAuth.repository';
import {
  ConflictError,
  ForbiddenError,
  GoneError,
  InternalServerError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../../middleware/error.middleware';
import { sendCustomerRegistrationOtp, type CustomerRegistrationIdentifierType } from './customerRegistrationOtpSender';

function normalizeMoroccanPhone(value: string): string {
  const digits = String(value || '').replace(/\D/g, '');
  const local = digits.startsWith('212') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  if (!/^[67]\d{8}$/.test(local)) throw new ForbiddenError('Invalid Moroccan phone.', 'invalid_phone');
  return `+212${local}`;
}

function sessionDto(data: any) {
  const session = data?.session;
  return session ? { access_token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at } : null;
}

type RegistrationIdentifier = { type: CustomerRegistrationIdentifierType; value: string };
type RegistrationContext = { ip: string };
type AuthContinuationKind = 'password_challenge' | 'registration_otp_challenge' | 'registration_proof';
type AuthContinuationToken = {
  version: 1;
  kind: AuthContinuationKind;
  expiresAt: number;
  identifierType: CustomerRegistrationIdentifierType;
  identifier: string;
  deviceHash: string;
  challengeId?: string;
  nonce?: string;
};

const registrationSecret = () => env.OTP_HASH_SECRET || env.ADMIN_JWT_SECRET;
const secureHash = (value: string) => crypto.createHmac('sha256', registrationSecret()).update(value).digest('hex');
const safeHexEqual = (left: string, right: string) => {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

function registrationIdentifier(payload: { phone?: string; email?: string }): RegistrationIdentifier {
  if (payload.phone) return { type: 'phone', value: normalizeMoroccanPhone(payload.phone) };
  return { type: 'email', value: String(payload.email || '').trim().toLowerCase() };
}

function continuationEncryptionKey(): Buffer {
  return Buffer.from(crypto.hkdfSync(
    'sha256',
    Buffer.from(registrationSecret(), 'utf8'),
    Buffer.alloc(0),
    Buffer.from('jaheez-customer-auth-continuation-v1', 'utf8'),
    32,
  ));
}

function sealAuthContinuation(payload: AuthContinuationToken): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', continuationEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map(part => part.toString('base64url')).join('.');
}

function openAuthContinuation(token: string, expectedKind: AuthContinuationKind): AuthContinuationToken {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('invalid');
    const [ivPart, tagPart, ciphertextPart] = parts;
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      continuationEncryptionKey(),
      Buffer.from(ivPart, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    const decoded = JSON.parse(plaintext) as AuthContinuationToken;
    if (
      decoded.version !== 1 || decoded.kind !== expectedKind || !decoded.identifier ||
      !decoded.deviceHash || !['email', 'phone'].includes(decoded.identifierType) ||
      !Number.isFinite(decoded.expiresAt) || decoded.expiresAt <= Date.now()
    ) throw new Error('invalid');
    return decoded;
  } catch {
    throw new UnauthorizedError('Authentication challenge is invalid or expired.', 'auth_challenge_invalid');
  }
}

export class CustomerAuthService {
  private repo = new CustomerAuthRepository();

  private async ensureRegistrationDelivery(type: CustomerRegistrationIdentifierType): Promise<void> {
    if (env.OTP_DELIVERY_FROZEN || env.OUTBOUND_INTEGRATIONS_DISABLED) {
      throw new ForbiddenError('Verification is temporarily unavailable.', 'verification_delivery_unavailable');
    }
    const key = type === 'email' ? 'feature_customer_email_otp_enabled' : 'feature_customer_whatsapp_otp_enabled';
    const settings = await this.repo.getSettings([key]);
    if (settings[key] !== 'true' || (type === 'email' && !env.RESEND_API_KEY)) {
      throw new ForbiddenError('Verification is temporarily unavailable.', 'verification_delivery_unavailable');
    }
  }

  private checkedDevice(token: AuthContinuationToken, deviceId: string): void {
    const deviceHash = secureHash(`device:${deviceId}`);
    if (!safeHexEqual(token.deviceHash, deviceHash)) {
      throw new UnauthorizedError('Authentication challenge is invalid or expired.', 'auth_challenge_invalid');
    }
  }

  private async checkedRegistrationChallenge(token: AuthContinuationToken, deviceId: string) {
    if (!token.challengeId) {
      throw new UnauthorizedError('Verification challenge is invalid or expired.', 'registration_challenge_invalid');
    }
    const challenge = await this.repo.findRegistrationChallenge(token.challengeId);
    const deviceHash = secureHash(`device:${deviceId}`);
    const identifierHash = secureHash(`identifier:${token.identifierType}:${token.identifier}`);
    if (
      !challenge || challenge.consumed_at || challenge.identifier_type !== token.identifierType ||
      !safeHexEqual(challenge.identifier_hash, identifierHash) ||
      !safeHexEqual(challenge.device_hash, deviceHash) ||
      !safeHexEqual(token.deviceHash, deviceHash) ||
      new Date(challenge.expires_at).getTime() <= Date.now()
    ) {
      throw new UnauthorizedError('Verification challenge is invalid or expired.', 'registration_challenge_invalid');
    }
    return challenge;
  }

  async continueCustomerAuth(
    payload: { phone?: string; email?: string; device_id: string },
    context: { ip: string },
  ) {
    const identifier = registrationIdentifier(payload);
    const identifierHash = secureHash(`identifier:${identifier.type}:${identifier.value}`);
    const deviceHash = secureHash(`device:${payload.device_id}`);
    const ipHash = secureHash(`ip:${context.ip}`);
    const since = new Date(Date.now() - 60 * 60_000).toISOString();
    await this.repo.cleanupAuthContinuationAttempts();
    const counts = await this.repo.countRecentAuthContinuationAttempts(identifierHash, deviceHash, ipHash, since);
    if (counts.identifier >= 5 || counts.device >= 10 || counts.ip >= 20) {
      throw new TooManyRequestsError('Too many authentication attempts. Try again later.', 'auth_continuation_rate_limited');
    }
    await this.repo.recordAuthContinuationAttempt(identifierHash, deviceHash, ipHash);

    const exists = await this.repo.customerAuthIdentifierExists(identifier.type, identifier.value);
    if (exists) {
      return {
        continuation: 'password_challenge' as const,
        continuation_token: sealAuthContinuation({
          version: 1,
          kind: 'password_challenge',
          expiresAt: Date.now() + 10 * 60_000,
          identifierType: identifier.type,
          identifier: identifier.value,
          deviceHash,
        }),
      };
    }

    return this.startCustomerRegistration(identifier, payload.device_id, context);
  }

  private async startCustomerRegistration(
    identifier: RegistrationIdentifier,
    deviceId: string,
    context: { ip: string },
  ) {
    await this.ensureRegistrationDelivery(identifier.type);
    await this.repo.cleanupRegistrationChallenges();
    const id = crypto.randomUUID();
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const identifierHash = secureHash(`identifier:${identifier.type}:${identifier.value}`);
    const deviceHash = secureHash(`device:${deviceId}`);
    const ipHash = secureHash(`ip:${context.ip}`);
    const since = new Date(Date.now() - 60 * 60_000).toISOString();
    const counts = await this.repo.countRecentRegistrationChallenges(identifierHash, deviceHash, ipHash, since);
    if (counts.identifier >= 5 || counts.device >= 10 || counts.ip >= 20) {
      throw new TooManyRequestsError('Too many verification attempts. Try again later.', 'registration_rate_limited');
    }

    const now = Date.now();
    await this.repo.createRegistrationChallenge({
      id,
      identifier_type: identifier.type,
      identifier_hash: identifierHash,
      code_hash: secureHash(`otp:${id}:${code}`),
      proof_hash: null,
      provider_status: 'pending',
      attempts: 0,
      resend_available_at: new Date(now + 60_000).toISOString(),
      expires_at: new Date(now + 10 * 60_000).toISOString(),
      verified_at: null,
      consumed_at: null,
      locked_until: null,
      device_hash: deviceHash,
      ip_hash: ipHash,
    });

    try {
      await sendCustomerRegistrationOtp(identifier.type, identifier.value, code);
      await this.repo.updateRegistrationChallenge(id, { provider_status: 'sent' });
    } catch {
      await this.repo.updateRegistrationChallenge(id, { provider_status: 'failed' }).catch(() => undefined);
      throw new ForbiddenError('Verification is temporarily unavailable.', 'verification_delivery_unavailable');
    }

    const challengeToken = sealAuthContinuation({
      version: 1,
      kind: 'registration_otp_challenge',
      expiresAt: Date.now() + 10 * 60_000,
      challengeId: id,
      identifierType: identifier.type,
      identifier: identifier.value,
      deviceHash,
    });
    return {
      continuation: 'registration_otp_challenge' as const,
      challenge_token: challengeToken,
      resend_after_seconds: 60,
    };
  }

  async verifyCustomerRegistrationOtp(payload: { challenge_token: string; code: string; device_id: string }) {
    const token = openAuthContinuation(payload.challenge_token, 'registration_otp_challenge');
    const challenge = await this.checkedRegistrationChallenge(token, payload.device_id);
    if (
      challenge.provider_status !== 'sent' || challenge.verified_at || challenge.attempts >= 5 ||
      (challenge.locked_until && new Date(challenge.locked_until).getTime() > Date.now())
    ) throw new UnauthorizedError('The verification code is invalid or expired.', 'invalid_verification_code');

    const candidateHash = secureHash(`otp:${challenge.id}:${payload.code}`);
    const nonce = crypto.randomBytes(32).toString('hex');
    const proofHash = secureHash(`proof:${challenge.id}:${nonce}`);
    if (!await this.repo.verifyRegistrationCode(challenge.id, candidateHash, proofHash)) {
      throw new UnauthorizedError('The verification code is invalid or expired.', 'invalid_verification_code');
    }
    const registrationProof = sealAuthContinuation({
      version: 1,
      kind: 'registration_proof',
      expiresAt: Date.now() + 10 * 60_000,
      challengeId: challenge.id,
      identifierType: token.identifierType,
      identifier: token.identifier,
      deviceHash: token.deviceHash,
      nonce,
    });
    return { verified: true, registration_proof: registrationProof };
  }

  async resendCustomerRegistrationOtp(payload: { challenge_token: string; device_id: string }) {
    const token = openAuthContinuation(payload.challenge_token, 'registration_otp_challenge');
    const challenge = await this.checkedRegistrationChallenge(token, payload.device_id);
    await this.ensureRegistrationDelivery(token.identifierType);
    const now = Date.now();
    if (challenge.verified_at || new Date(challenge.resend_available_at).getTime() > now) {
      throw new TooManyRequestsError('Please wait before requesting another code.', 'registration_resend_too_soon');
    }
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const prepared = await this.repo.prepareRegistrationResend(
      challenge.id,
      secureHash(`otp:${challenge.id}:${code}`),
      new Date(now + 60_000).toISOString(),
    );
    if (!prepared) throw new TooManyRequestsError('Please wait before requesting another code.', 'registration_resend_too_soon');
    try {
      await sendCustomerRegistrationOtp(token.identifierType, token.identifier, code);
      await this.repo.updateRegistrationChallenge(challenge.id, { provider_status: 'sent' });
    } catch {
      await this.repo.updateRegistrationChallenge(challenge.id, { provider_status: 'failed' }).catch(() => undefined);
      throw new ForbiddenError('Verification is temporarily unavailable.', 'verification_delivery_unavailable');
    }
    return { accepted: true, resend_after_seconds: 60 };
  }

  async customerRegister(payload: {
    registration_proof: string;
    device_id: string;
    password: string;
    full_name: string;
    language: 'ar' | 'fr' | 'en';
    legal_consent_version: string;
  }, context: RegistrationContext) {
    if (['password123','1234567890','qwerty1234','azerty1234','motdepasse','jaheez1234'].includes(String(payload.password).toLowerCase())) throw new ForbiddenError('Choose a stronger password.', 'weak_password');
    const token = openAuthContinuation(payload.registration_proof, 'registration_proof');
    if (!token.nonce || !token.challengeId) throw new UnauthorizedError('Registration proof is invalid or expired.', 'registration_proof_invalid');
    await this.checkedRegistrationChallenge(token, payload.device_id);
    const proofHash = secureHash(`proof:${token.challengeId}:${token.nonce}`);
    if (!await this.repo.consumeRegistrationChallenge(token.challengeId, proofHash)) {
      throw new UnauthorizedError('Registration proof is invalid or expired.', 'registration_proof_invalid');
    }
    const phone = token.identifierType === 'phone' ? token.identifier : null;
    const email = token.identifierType === 'email' ? token.identifier : null;
    const metadata = {
      full_name: payload.full_name.trim(), language: payload.language,
      legal_consent_version: payload.legal_consent_version,
    };
    try {
      if (phone) await this.repo.createPasswordCustomer(phone, payload.password, metadata);
      else await this.repo.createEmailPasswordCustomer(email!, payload.password, metadata);
    } catch {
      throw new ConflictError('Unable to create account. Sign in or recover access.', 'account_unavailable');
    }
    const session = sessionDto(phone
      ? await this.repo.signInCustomer(phone, payload.password)
      : await this.repo.signInEmailCustomer(email!, payload.password));
    if (!session) throw new InternalServerError('Unable to establish the customer session.', 'session_creation_failed');
    await this.repo.writeAuditLog({
      admin_id: null,
      admin_email: null,
      action: 'customer_registration_complete',
      entity_type: 'customer_auth',
      entity_id: null,
      summary: 'Customer completed OTP-verified registration',
      new_value: { identifier_type: token.identifierType },
      ip: context.ip,
    });
    return { session };
  }
  async customerLogin(payload: { continuation_token: string; device_id: string; password: string }) {
    try {
      const token = openAuthContinuation(payload.continuation_token, 'password_challenge');
      this.checkedDevice(token, payload.device_id);
      const session = sessionDto(token.identifierType === 'phone'
        ? await this.repo.signInCustomer(token.identifier, payload.password)
        : await this.repo.signInEmailCustomer(token.identifier, payload.password));
      if (!session) throw new Error('missing session');
      return { session };
    } catch {
      throw new UnauthorizedError('Invalid credentials.', 'invalid_credentials');
    }
  }

  async bootstrapCustomer(authUser: any, payload: any) {
    const existing = await this.repo.findCustomerProfileById(authUser.id);
    if (existing?.deleted_at) throw new GoneError('account_deleted');
    if (existing?.is_banned || existing?.blocked_at || existing?.auth_risk_level === 'blocked') throw new ForbiddenError('account_disabled');
    if (existing?.role && existing.role !== 'user') throw new ForbiddenError('customer_role_required', 'role_mismatch');
    const provider = authUser.app_metadata?.provider || authUser.identities?.[0]?.provider || 'unknown';
    const phone = authUser.phone || existing?.phone_e164 || existing?.phone || null;
    const now = new Date().toISOString();
    const fullName = payload.full_name ?? authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? existing?.full_name ?? '';
    const city = payload.city ?? authUser.user_metadata?.city ?? existing?.city ?? '';
    // Password authentication and WhatsApp ownership are separate trust signals.
    const whatsappVerified = Boolean(existing?.whatsapp_verified_at && existing?.phone_e164 === phone);
    const legalConsentVersion = payload.legal_consent_version ?? authUser.user_metadata?.legal_consent_version ?? existing?.legal_consent_version ?? null;
    // City is collected with the authoritative default delivery address.
    const profileComplete = fullName.trim().length >= 2 && Boolean(legalConsentVersion);
    const complete = profileComplete;
    const profile = await this.repo.upsertUserProfile({
      ...(existing || {}), id: authUser.id, role: 'user', full_name: fullName, city,
      email: authUser.email || existing?.email || null, phone, phone_e164: phone,
      auth_provider: provider, auth_provider_primary: existing?.auth_provider_primary === 'unknown' ? provider : (existing?.auth_provider_primary || provider),
      email_verified: Boolean(authUser.email_confirmed_at), phone_verified: existing?.phone_verified ?? false,
      whatsapp_verified: whatsappVerified, whatsapp_verified_at: existing?.whatsapp_verified_at ?? null,
      preferred_contact_channel: 'whatsapp', last_auth_at: now,
      profile_completed_at: complete ? (existing?.profile_completed_at || now) : null,
      legal_consent_version: legalConsentVersion,
      legal_consent_at: payload.legal_consent_version ? (existing?.legal_consent_at || now) : existing?.legal_consent_at ?? null,
      auth_risk_level: existing?.auth_risk_level || 'low', is_banned: false,
      language: payload.language ?? authUser.user_metadata?.language ?? existing?.language ?? 'fr', notification_enabled: existing?.notification_enabled ?? true, updated_at: now,
    });
    const defaultAddress = await this.repo.findCompleteDefaultAddress(authUser.id);
    const emailRequired = provider === 'email';
    const emailVerified = !emailRequired || Boolean(authUser.email_confirmed_at);
    const nextStep = !emailVerified ? 'email_confirmation'
      : !profileComplete ? 'profile'
      : !defaultAddress ? 'location'
      : 'ready';
    return {
      ...profile,
      onboarding_state: {
        authenticated: true, email_verified: emailVerified, whatsapp_verified: whatsappVerified,
        profile_complete: profileComplete, default_address_complete: Boolean(defaultAddress), next_step: nextStep,
      },
      default_address: defaultAddress || null,
    };
  }
}

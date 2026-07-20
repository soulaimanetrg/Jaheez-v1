import { CustomerAuthRepository } from './customerAuth.repository';
import { ConflictError, ForbiddenError, GoneError, UnauthorizedError } from '../../middleware/error.middleware';

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

export class CustomerAuthService {
  private repo = new CustomerAuthRepository();

  async customerRegister(payload: any) {
    if (['password123','1234567890','qwerty1234','azerty1234','motdepasse','jaheez1234'].includes(String(payload.password).toLowerCase())) throw new ForbiddenError('Choose a stronger password.', 'weak_password');
    const phone = payload.phone ? normalizeMoroccanPhone(payload.phone) : null;
    const email = payload.email ? String(payload.email).trim().toLowerCase() : null;
    try {
      const metadata = {
        full_name: payload.full_name.trim(), language: payload.language,
        legal_consent_version: payload.legal_consent_version,
      };
      if (phone) await this.repo.createPasswordCustomer(phone, payload.password, metadata);
      else await this.repo.createEmailPasswordCustomer(email!, payload.password, metadata);
      const session = sessionDto(phone
        ? await this.repo.signInCustomer(phone, payload.password)
        : await this.repo.signInEmailCustomer(email!, payload.password));
      if (!session) throw new Error('missing session');
      return { phone, email, requires_verification: false, session };
    } catch (error: any) {
      if (/already|registered|exists|unique/i.test(String(error?.message || ''))) {
        throw new ConflictError('Unable to create account. Sign in or recover access.', 'account_unavailable');
      }
      throw new ForbiddenError('Unable to create account.', 'registration_failed');
    }
  }
  async customerLogin(payload: any) {
    try {
      const session = sessionDto(payload.phone
        ? await this.repo.signInCustomer(normalizeMoroccanPhone(payload.phone), payload.password)
        : await this.repo.signInEmailCustomer(String(payload.email).trim().toLowerCase(), payload.password));
      if (!session) throw new Error('missing session');
      return { session };
    } catch {
      throw new UnauthorizedError('Phone or password is incorrect.', 'invalid_credentials');
    }
  }

  async verifyCustomerRegistration(payload: any) {
    try {
      const session = sessionDto(await this.repo.verifyCustomerSignup(normalizeMoroccanPhone(payload.phone), payload.code));
      if (!session) throw new Error('missing session');
      return { session };
    } catch {
      throw new UnauthorizedError('The verification code is invalid or expired.', 'invalid_verification_code');
    }
  }

  async resendCustomerRegistration(payload: any) {
    try { await this.repo.resendCustomerSignup(normalizeMoroccanPhone(payload.phone)); } catch { throw new ForbiddenError('WhatsApp verification is temporarily unavailable.', 'verification_delivery_unavailable'); }
    return { accepted: true };
  }

  async requestCustomerRecovery(payload: any) {
    try { await this.repo.requestCustomerRecovery(normalizeMoroccanPhone(payload.phone)); } catch { /* Generic response prevents account discovery. */ }
    return { accepted: true };
  }

  async verifyCustomerRecovery(payload: any) { return this.verifyCustomerRegistration(payload); }

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

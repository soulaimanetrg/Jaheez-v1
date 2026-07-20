import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { DriverAuthRepository, DriverDbRow } from './driverAuth.repository';
import { signDriverToken } from '../../utils/jwt';
import { env } from '../../config/env';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../../middleware/error.middleware';

type DriverChallenge = { kind: 'driver_otp_challenge'; driver_id: string; nonce: string; iat: number; exp: number };

export class DriverAuthService {
  private repo = new DriverAuthRepository();

  private normalizePhone(phone: string): string {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('212')) return `+${digits}`;
    if (digits.startsWith('0')) return `+212${digits.slice(1)}`;
    return `+${digits}`;
  }

  private maskPhone(phone: string): string {
    const normalized = this.normalizePhone(phone);
    return `${normalized.slice(0, 4)}••••${normalized.slice(-3)}`;
  }

  private nonceHash(nonce: string): string {
    return crypto.createHmac('sha256', env.ADMIN_JWT_SECRET).update(nonce).digest('hex');
  }

  private issueChallenge(driverId: string, nonce: string): string {
    return jwt.sign({ kind: 'driver_otp_challenge', driver_id: driverId, nonce }, env.ADMIN_JWT_SECRET, { expiresIn: '5m' });
  }

  private parseChallenge(token: string): DriverChallenge {
    try {
      const payload = jwt.verify(token, env.ADMIN_JWT_SECRET) as DriverChallenge;
      if (payload.kind !== 'driver_otp_challenge' || !payload.driver_id || !payload.nonce) throw new Error('invalid');
      return payload;
    } catch {
      throw new UnauthorizedError('Challenge OTP invalide ou expire', 'otp_challenge_invalid');
    }
  }

  private async twilioRequest(path: string, params: Record<string, string>): Promise<any> {
    // Defense-in-depth: no provider call while OTP delivery is frozen.
    if (env.OTP_DELIVERY_FROZEN) {
      throw new ForbiddenError('Verification OTP temporairement indisponible. Contactez le support.', 'otp_provider_unavailable');
    }
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_VERIFY_SERVICE_SID) {
      throw new ForbiddenError('Verification OTP temporairement indisponible. Contactez le support.', 'otp_provider_unavailable');
    }
    const body = new URLSearchParams(params);
    const response = await fetch(`https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new ForbiddenError('Verification OTP temporairement indisponible. Contactez le support.', 'otp_provider_error');
    return result;
  }

  private async ensureTrialNumberAllowed(phone: string, settings: Record<string, string>) {
    if (settings.auth_whatsapp_trial_mode !== 'true') return;
    let allowed: string[] = [];
    try { allowed = JSON.parse(settings.auth_whatsapp_trial_numbers || '[]'); } catch { allowed = []; }
    if (!allowed.map(value => this.normalizePhone(value)).includes(phone)) {
      throw new ForbiddenError('Numero non autorise pendant le mode essai OTP.', 'otp_trial_number_not_allowed');
    }
  }

  private driverDto(driver: DriverDbRow) {
    return {
      id: driver.id, user_id: driver.user_id, full_name: driver.full_name, phone: driver.phone,
      cin: driver.cin, vehicle_type: driver.vehicle_type, vehicle_plate: driver.vehicle_plate,
      is_online: driver.is_online, is_verified: driver.is_verified, kyc_status: driver.kyc_status,
      city: driver.city, must_change_password: !driver.password_changed_at,
    };
  }

  private sessionResult(driver: DriverDbRow) {
    const token = signDriverToken({ driver_id: driver.id, user_id: driver.user_id || undefined, phone: driver.phone, cin: driver.cin || undefined });
    return { token, driver: this.driverDto(driver) };
  }

  private async startChallenge(driver: DriverDbRow, enforceCooldown: boolean) {
    // OTP delivery freeze: skip the second factor rather than lock drivers
    // out — CIN+password was already verified before reaching here.
    if (env.OTP_DELIVERY_FROZEN) return this.sessionResult(driver);
    const settings = await this.repo.getSettings(['feature_driver_otp_enabled', 'auth_whatsapp_trial_mode', 'auth_whatsapp_trial_numbers']);
    if (settings.feature_driver_otp_enabled === 'false' || driver.driver_otp_enabled === false) return this.sessionResult(driver);
    const now = Date.now();
    if (driver.otp_locked_until && new Date(driver.otp_locked_until).getTime() > now) {
      throw new ForbiddenError('Verification OTP temporairement verrouillee.', 'otp_locked');
    }
    if (enforceCooldown && driver.otp_last_sent_at && now - new Date(driver.otp_last_sent_at).getTime() < 60_000) {
      throw new ForbiddenError('Veuillez attendre avant de renvoyer le code.', 'otp_resend_cooldown');
    }
    const phone = this.normalizePhone(driver.phone);
    await this.ensureTrialNumberAllowed(phone, settings);
    await this.twilioRequest('/Verifications', { To: phone, Channel: 'whatsapp' });
    const nonce = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(now + 5 * 60_000).toISOString();
    await this.repo.updateDriverAuthMetadata(driver.id, {
      otp_challenge_nonce_hash: this.nonceHash(nonce), otp_challenge_expires_at: expiresAt,
      otp_last_sent_at: new Date(now).toISOString(), otp_failed_attempts: 0, otp_locked_until: null,
    });
    return { otp_required: true, challenge_token: this.issueChallenge(driver.id, nonce), channel: 'whatsapp', masked_destination: this.maskPhone(phone), expires_in_sec: 300, resend_after_sec: 60 };
  }

  async driverLogin(payload: any) {
    const cleanCin = String(payload.cin || '').trim().toUpperCase();
    const password = String(payload.password || '');
    if (!cleanCin || !password) throw new BadRequestError('CIN et mot de passe requis');
    const driver = await this.repo.findDriverByCin(cleanCin);
    if (!driver || !driver.password_hash) throw new UnauthorizedError('Identifiants invalides', 'invalid_credentials');
    if (driver.is_active === false || !driver.is_verified) throw new ForbiddenError('Compte inactif. Contactez administration.', 'account_inactive');
    const now = Date.now();
    if (driver.locked_until && new Date(driver.locked_until).getTime() > now) throw new ForbiddenError('Compte temporairement verrouille.', 'account_locked');
    if (!(await bcrypt.compare(password, driver.password_hash))) {
      const attempts = (driver.failed_login_attempts || 0) + 1;
      await this.repo.updateDriverAuthMetadata(driver.id, { failed_login_attempts: attempts, locked_until: attempts >= 5 ? new Date(now + 15 * 60_000).toISOString() : null });
      throw new UnauthorizedError('Identifiants invalides', 'invalid_credentials');
    }
    await this.repo.updateDriverAuthMetadata(driver.id, {
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date(now).toISOString(),
      otp_challenge_nonce_hash: null,
      otp_challenge_expires_at: null,
    });
    return this.sessionResult(driver);
  }

  async verifyDriverOtp(payload: any) {
    const challenge = this.parseChallenge(payload.challenge_token);
    const driver = await this.repo.findDriverById(challenge.driver_id);
    if (!driver || driver.is_active === false || !driver.is_verified) throw new UnauthorizedError('Challenge OTP invalide', 'otp_challenge_invalid');
    const now = Date.now();
    if (driver.otp_locked_until && new Date(driver.otp_locked_until).getTime() > now) throw new ForbiddenError('Verification OTP temporairement verrouillee.', 'otp_locked');
    if (!driver.otp_challenge_nonce_hash || !driver.otp_challenge_expires_at || new Date(driver.otp_challenge_expires_at).getTime() <= now || this.nonceHash(challenge.nonce) !== driver.otp_challenge_nonce_hash) {
      throw new UnauthorizedError('Challenge OTP invalide ou expire', 'otp_challenge_invalid');
    }
    const result = await this.twilioRequest('/VerificationCheck', { To: this.normalizePhone(driver.phone), Code: String(payload.code) });
    if (result.status !== 'approved') {
      const attempts = (driver.otp_failed_attempts || 0) + 1;
      await this.repo.updateDriverAuthMetadata(driver.id, { otp_failed_attempts: attempts, otp_locked_until: attempts >= 5 ? new Date(now + 15 * 60_000).toISOString() : null });
      throw new UnauthorizedError('Code invalide', 'otp_invalid');
    }
    const verifiedAt = new Date(now).toISOString();
    await this.repo.updateDriverAuthMetadata(driver.id, {
      otp_failed_attempts: 0, otp_locked_until: null, otp_challenge_nonce_hash: null,
      otp_challenge_expires_at: null, last_otp_verified_at: verifiedAt, last_login_at: verifiedAt,
      trusted_device_id: payload.trusted_device_id || driver.trusted_device_id || null,
    });
    return this.sessionResult(driver);
  }

  async resendDriverOtp(payload: any) {
    const challenge = this.parseChallenge(payload.challenge_token);
    const driver = await this.repo.findDriverById(challenge.driver_id);
    if (!driver || this.nonceHash(challenge.nonce) !== driver.otp_challenge_nonce_hash) throw new UnauthorizedError('Challenge OTP invalide', 'otp_challenge_invalid');
    return this.startChallenge(driver, true);
  }
}

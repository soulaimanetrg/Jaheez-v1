# Customer unified authentication rollout

The customer app now uses one automatic continuation entry:

- Existing account: phone/email -> password.
- New account: phone/email -> OTP -> full name/password/legal consent.

The existence lookup runs only through a service-role PostgreSQL function. The API returns an AES-GCM encrypted, device-bound continuation and never returns an `account_exists` flag, user ID, or account metadata. Registration OTP is not a demo path: the backend stores only HMAC hashes, limits attempts by identifier/device/IP, returns an encrypted short-lived proof after verification, and atomically consumes that proof before creating the account.

## Required deployment order

1. Apply `057_secure_customer_registration_otp.sql` and then `058_customer_auth_continuation.sql` through the checksum-tracked migration runner.
2. Provision Redis, `OTP_HASH_SECRET`, and the selected delivery provider.
3. Test continuation tampering/expiry/device binding, delivery, resend, replay, rate limits, concurrent creation, and provider monitoring in isolated staging.
4. Set `OTP_DELIVERY_FROZEN=false` only after staging sign-off.
5. Enable only the provider that passed staging:

```sql
update public.app_settings
set value = 'true'
where key = 'feature_customer_email_otp_enabled';
```

or:

```sql
update public.app_settings
set value = 'true'
where key = 'feature_customer_whatsapp_otp_enabled';
```

Email delivery requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. Phone delivery uses the configured WhatsApp adapter and remains protected by the master OTP freeze.

If the migration, Redis, feature flag, freeze switch, or provider is unavailable, the API fails closed with `verification_delivery_unavailable`. It never accepts a local or universal OTP.

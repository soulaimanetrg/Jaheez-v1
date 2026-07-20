# Wasender Internal Beta Setup

Wasender is an unofficial, temporary delivery provider. Use a dedicated Jaheez test number and allowlisted internal testers only.

1. Create a Wasender session and connect the dedicated number through QR/Linked Devices.
2. Copy the values from `backend/.env.wasender.example` into the private `backend/.env`.
3. Configure the Wasender session webhook as:
   - URL: `https://YOUR_BACKEND/admin-api/webhooks/wasender`
   - Events: `session.status`, `message.sent`, `messages.update`
4. In Supabase Authentication > Hooks, enable the HTTP Send SMS hook:
   - URL: `https://YOUR_BACKEND/admin-api/auth/hooks/send-sms`
   - Copy its signing secret into `SUPABASE_SEND_SMS_HOOK_SECRET`.
5. Apply migration `052_temporary_wasender_auth_hook.sql`.
6. Add test numbers in E.164 format and enable customer delivery:

```sql
update public.app_settings set value='["+2126XXXXXXXX"]' where key='auth_whatsapp_trial_numbers';
update public.app_settings set value='true' where key='feature_customer_whatsapp_otp_enabled';
```

Verify `GET /admin-api/auth/whatsapp/health` returns `available: true` before testing login. Never enable public rollout with this provider.

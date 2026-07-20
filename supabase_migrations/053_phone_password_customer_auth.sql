-- Customer v1 auth is phone + password. WhatsApp confirms registration and
-- recovers passwords; email auth is no longer exposed by the customer app.
INSERT INTO public.app_settings (key, value) VALUES
  ('feature_customer_email_password_enabled', 'false'),
  ('customer_email_signup_otp_enabled', 'false'),
  ('feature_customer_phone_password_enabled', 'true'),
  ('customer_phone_confirmation_channel', 'whatsapp')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

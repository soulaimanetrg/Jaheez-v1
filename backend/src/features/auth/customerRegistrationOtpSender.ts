import { env } from '../../config/env';
import { whatsappOtpSender } from './whatsappOtpSender';

export type CustomerRegistrationIdentifierType = 'email' | 'phone';

async function sendEmailOtp(email: string, code: string): Promise<void> {
  if (!env.RESEND_API_KEY || env.OUTBOUND_INTEGRATIONS_DISABLED) {
    throw new Error('email_otp_provider_unavailable');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [email],
        subject: 'Votre code de verification JAHEEZ',
        text: `Votre code de verification JAHEEZ est ${code}. Il expire dans 10 minutes. Ne le partagez jamais.`,
      }),
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) throw new Error('email_otp_delivery_rejected');
}

export async function sendCustomerRegistrationOtp(
  type: CustomerRegistrationIdentifierType,
  identifier: string,
  code: string,
): Promise<void> {
  if (env.OUTBOUND_INTEGRATIONS_DISABLED) throw new Error('otp_provider_unavailable');
  if (type === 'email') return sendEmailOtp(identifier, code);
  await whatsappOtpSender().sendOtp(identifier, code);
}

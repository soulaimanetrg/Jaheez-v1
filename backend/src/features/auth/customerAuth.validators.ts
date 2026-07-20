import { z } from 'zod';

const moroccanPhone = z.string().trim().min(8).max(30);

export const customerRegisterSchema = z.object({
  phone: moroccanPhone.optional(),
  email: z.string().trim().email().max(254).optional(),
  password: z.string().min(10).max(128).regex(/[A-Za-z]/).regex(/[0-9]/),
  full_name: z.string().trim().min(2).max(120),
  language: z.enum(['ar','fr','en']).default('fr'),
  legal_consent_version: z.string().trim().min(1).max(40),
}).strict().refine(value => Boolean(value.phone) !== Boolean(value.email), { message: 'Provide either phone or email.' });

export const customerLoginSchema = z.object({
  phone: moroccanPhone.optional(),
  email: z.string().trim().email().max(254).optional(),
  password: z.string().min(1).max(128),
}).strict().refine(value => Boolean(value.phone) !== Boolean(value.email), { message: 'Provide either phone or email.' });

export const customerVerifySignupSchema = z.object({
  phone: moroccanPhone,
  code: z.string().trim().regex(/^\d{6}$/),
}).strict();

export const customerPhoneSchema = z.object({ phone: moroccanPhone }).strict();

export const customerSendOtpSchema = z.object({
  phone: moroccanPhone.optional(),
  email: z.string().trim().email().optional(),
  reason: z.enum(['login','profile_update','delete_account','driver_step_up']).optional(),
  channel: z.enum(['email','sms','whatsapp']).optional(),
}).refine((value) => Boolean(value.phone || value.email), {
  message: 'phone or email is required',
});

export const customerVerifyOtpSchema = z.object({
  phone: moroccanPhone.optional(),
  email: z.string().trim().email().optional(),
  code: z.string().trim().regex(/^[0-9]{6}$/),
  reason: z.enum(['login','profile_update','delete_account','driver_step_up']).optional(),
}).refine((value) => Boolean(value.phone || value.email), {
  message: 'phone or email is required',
});

export const customerDeleteAccountSchema = z.object({
  otp_proof: z.string().min(20).max(2000),
  reason: z.string().trim().max(500).optional().nullable(),
}).strict();

export const customerBootstrapSchema = z.object({
  full_name: z.string().trim().min(2).max(120).optional(),
  city: z.string().trim().max(80).optional(),
  preferred_contact_channel: z.enum(['email', 'whatsapp', 'sms']).optional(),
  language: z.enum(['ar', 'fr', 'en']).optional(),
  legal_consent_version: z.string().trim().min(1).max(40).optional(),
}).strict();

export const customerWhatsappStartSchema = z.object({
  phone: z.string().trim().min(9).max(20),
  purpose: z.enum(['attach_phone', 'change_phone', 'step_up']).default('attach_phone'),
  device_id: z.string().trim().min(8).max(200),
}).strict();

export const customerWhatsappVerifySchema = z.object({
  challenge_token: z.string().min(20).max(2000),
  phone: z.string().trim().min(9).max(20),
  code: z.string().trim().regex(/^\d{6}$/),
  device_id: z.string().trim().min(8).max(200),
}).strict();

export const customerChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit comporter au moins 6 caractères"),
  confirmPassword: z.string().min(6, "La confirmation du mot de passe doit comporter au moins 6 caractères"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

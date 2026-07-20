import { z } from 'zod';

export const driverLoginSchema = z.object({
  cin: z.string().min(3, "Le CIN doit comporter au moins 3 caractères"),
  password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères"),
}).strict();

export const driverOtpVerifySchema = z.object({
  challenge_token: z.string().min(20).max(2000),
  code: z.string().trim().regex(/^\d{6}$/, 'Le code doit contenir 6 chiffres'),
  trusted_device_id: z.string().trim().max(160).optional(),
}).strict();

export const driverOtpResendSchema = z.object({
  challenge_token: z.string().min(20).max(2000),
}).strict();

export const driverChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit comporter au moins 8 caractères"),
  confirmPassword: z.string().min(8, "La confirmation du mot de passe doit comporter au moins 8 caractères"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

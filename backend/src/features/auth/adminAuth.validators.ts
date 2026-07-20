import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().email("L'adresse email n'est pas valide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  remember_me: z.boolean().optional().default(false),
});

export const adminRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  role: z.enum(['super_admin', 'operations', 'finance', 'support', 'content_manager']),
});

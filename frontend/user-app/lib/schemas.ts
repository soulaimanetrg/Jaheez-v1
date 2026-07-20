/**
 * JAHEEZ — Zod validation schemas
 * Single source of truth for all form validation.
 */
import { z } from 'zod';

const phoneRegex = /^(06|07)\d{8}$|^\+212(6|7)\d{8}$/;

// ── Auth ──────────────────────────────────────────────
export const loginSchema = z.object({
  phone: z
    .string()
    .min(1, 'رقم الهاتف مطلوب')
    .refine(v => phoneRegex.test(v.replace(/\s/g, '')), 'رقم هاتف غير صحيح (مثال: 0612345678)'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(1, 'الاسم الكامل مطلوب').min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    phone: z
      .string()
      .min(1, 'رقم الهاتف مطلوب')
      .refine(v => phoneRegex.test(v.replace(/\s/g, '')), 'رقم هاتف غير صحيح'),
    password: z.string().min(6, 'يجب أن تكون 6 أحرف على الأقل'),
    confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
    city: z.string().optional(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  });

export const otpSchema = z.object({
  code: z
    .string()
    .min(4, 'الرمز يجب أن يكون 4-6 أرقام')
    .max(6, 'الرمز يجب أن يكون 4-6 أرقام')
    .regex(/^\d+$/, 'أرقام فقط'),
});

// ── Profile ───────────────────────────────────────────
export const profileSchema = z.object({
  full_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  city: z.string().optional(),
});

// ── Address ───────────────────────────────────────────
export const addressSchema = z.object({
  label: z.string().min(1, 'اسم العنوان مطلوب'),
  address: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل'),
  notes: z.string().optional(),
});

// ── Checkout ──────────────────────────────────────────
export const checkoutSchema = z.object({
  delivery_address: z.string().min(3, 'عنوان التوصيل مطلوب'),
  notes: z.string().max(200, '200 حرف كحد أقصى').optional(),
  promo_code: z.string().optional(),
  payment_method: z.enum(['cash']).default('cash'),
  time_slot: z.string().default('في أقرب وقت'),
});

// ── Support / Feedback ────────────────────────────────
export const supportSchema = z.object({
  subject: z.string().min(3, 'الموضوع مطلوب'),
  message: z.string().min(10, 'الرسالة يجب أن تكون 10 أحرف على الأقل').max(500),
  category: z.enum(['order', 'payment', 'driver', 'app', 'other']).default('other'),
});

// ── Review ────────────────────────────────────────────
export const reviewSchema = z.object({
  rating: z.number().min(1, 'التقييم مطلوب').max(5),
  comment: z.string().max(300).optional(),
});

// ── Email Auth ────────────────────────────────────────
export const emailLoginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export const emailRegisterSchema = z
  .object({
    full_name: z.string().min(1, 'الاسم الكامل مطلوب').min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    email: z.string().email('بريد إلكتروني غير صحيح'),
    password: z.string().min(6, 'يجب أن تكون 6 أحرف على الأقل'),
    confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
    city: z.string().optional(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  });

// ── Inferred types ────────────────────────────────────
export type LoginInput         = z.infer<typeof loginSchema>;
export type RegisterInput      = z.infer<typeof registerSchema>;
export type EmailLoginInput    = z.infer<typeof emailLoginSchema>;
export type EmailRegisterInput = z.infer<typeof emailRegisterSchema>;
export type OtpInput           = z.infer<typeof otpSchema>;
export type ProfileInput       = z.infer<typeof profileSchema>;
export type AddressInput       = z.infer<typeof addressSchema>;
export type CheckoutInput      = z.infer<typeof checkoutSchema>;
export type SupportInput       = z.infer<typeof supportSchema>;
export type ReviewInput        = z.infer<typeof reviewSchema>;

import { z } from 'zod';

export const createDriverSchema = z.object({
  full_name: z.string().min(2, 'Full name must contain at least 2 characters'),
  cin: z.string().min(3, 'CIN must contain at least 3 characters'),
  phone: z.string().min(9, 'Phone number is invalid'),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
  vehicle_type: z.enum(['motorcycle', 'bicycle', 'car']).default('motorcycle'),
  vehicle_plate: z.string().optional().nullable(),
  city: z.string().default('Safi'),
  zone_id: z.string().uuid('Zone id must be a valid UUID').optional().nullable(),
  driver_otp_enabled: z.boolean().optional(),
  reset_otp_lock: z.boolean().optional(),
});

export const updateDriverAdminSchema = z.object({
  full_name: z.string().min(2, 'Full name must contain at least 2 characters').optional(),
  cin: z.string().min(3, 'CIN must contain at least 3 characters').optional(),
  phone: z.string().min(9, 'Phone number is invalid').optional(),
  vehicle_type: z.enum(['motorcycle', 'bicycle', 'car']).optional(),
  vehicle_plate: z.string().optional().nullable(),
  city: z.string().optional(),
  is_active: z.boolean().optional(),
  zone_id: z.string().uuid('Zone id must be a valid UUID').optional().nullable(),
});

export const resetDriverPasswordSchema = z.object({
  new_password: z.string().min(8, 'New password must contain at least 8 characters'),
});

export const pauseDriverSchema = z.object({
  duration_minutes: z.number().min(1, 'Pause duration must be at least 1 minute'),
});

export const suspendDriverSchema = z.object({
  duration_hours: z.number().min(1, 'Suspension duration must be at least 1 hour'),
});

export const manualReassignSchema = z.object({
  target_driver_id: z.string().uuid('Driver id must be a valid UUID').optional().nullable(),
});

export const driverCooldownSchema = z.object({
  duration_seconds: z.number().min(0).max(86400),
  reason: z.enum(['DECLINED_OFFER', 'TIMED_OUT', 'BREAK_ABUSE', 'ADMIN_ACTION']).default('ADMIN_ACTION'),
});


export const dispatchModeSchema = z.object({
  dispatch_mode: z.enum(['AUTO_DISPATCH', 'MANUAL_DISPATCH']),
});

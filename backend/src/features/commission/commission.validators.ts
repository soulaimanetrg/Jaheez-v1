import { z } from 'zod';

const rateFields = {
  delivery_percent: z.number().min(0).max(100),
  tip_percent: z.number().min(0).max(100),
  effective_from: z.string().datetime().optional(),
  effective_to: z.string().datetime().nullable().optional(),
  reason: z.string().trim().min(5).max(300),
};

export const commissionRateSchema = z.object(rateFields).refine(
  v => !v.effective_from || !v.effective_to || Date.parse(v.effective_to) > Date.parse(v.effective_from),
  { message: 'effective_to must be after effective_from' }
);
export const driverCommissionOverrideSchema = z.object({ driver_id: z.string().uuid(), ...rateFields }).refine(
  v => !v.effective_from || !v.effective_to || Date.parse(v.effective_to) > Date.parse(v.effective_from),
  { message: 'effective_to must be after effective_from' }
);

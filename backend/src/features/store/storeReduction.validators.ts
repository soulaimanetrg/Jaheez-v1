import { z } from 'zod';

export const storeReductionSchema = z.object({
  type: z.enum(['percentage', 'fixed']).default('percentage'),
  value: z.number().min(0),
  percentage: z.number().min(0).max(100).optional(),
}).strict();

import { z } from 'zod';

export const validatePromoSchema = z.object({
  code: z.string().trim().min(2).max(50),
  store_id: z.string().uuid().optional().nullable(),
  order_total_dh: z.union([z.string(), z.number()]),
}).strict();

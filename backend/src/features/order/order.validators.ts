import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'picked_up', 'delivered', 'completed', 'cancelled']),
  notes: z.string().max(500).optional(),
  admin_note: z.string().max(500).optional(),
});

export const updateOrderNotesSchema = z.object({
  notes: z.string().max(500).optional(),
  admin_note: z.string().max(500).optional(),
});

export const assignDriverSchema = z.object({
  driver_id: z.string().uuid().nullable(),
});

export const adminPatchOrderSchema=z.object({
  status:z.enum(['pending','confirmed','preparing','picked_up','delivered','completed','cancelled']).optional(),
  driver_id:z.string().uuid().nullable().optional(),
  notes:z.string().trim().max(500).optional(),
  admin_note:z.string().trim().max(500).optional(),
  payment_status:z.enum(['pending','paid','failed','refunded']).optional(),
  reason:z.string().trim().min(3).max(500).optional(),
}).strict().refine(value=>Object.keys(value).length>0,{message:'At least one update is required'});

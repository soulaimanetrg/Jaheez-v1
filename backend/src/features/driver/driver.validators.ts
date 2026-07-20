import { z } from 'zod';

export const updateDriverSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  vehicle_type: z.enum(['motorcycle', 'bicycle', 'car']).optional(),
  vehicle_plate: z.string().max(20).optional(),
  city: z.string().optional(),
  is_online: z.boolean().optional(),
  current_lat: z.number().optional().nullable(),
  current_lng: z.number().optional().nullable(),
  heading: z.number().optional().nullable(),
});

export const driverUpdateMeSchema = z.object({
  vehicle_type: z.enum(['motorcycle', 'bicycle', 'car']).optional(),
  vehicle_plate: z.string().max(20).optional().nullable(),
  full_name: z.string().min(2).max(120).optional(),
  phone: z.string().min(8).max(30).optional(),
}).strict();

export const orderIssueSchema = z.object({
  reason: z.enum(['customer_no_answer', 'customer_not_present', 'wrong_address', 'store_problem', 'vehicle_problem', 'other']),
  note: z.string().max(500).optional().nullable(),
});

export const declineOrderSchema = z.object({
  reason: z.enum(['vehicle_problem', 'emergency', 'unsafe_location', 'shift_ending', 'admin_task', 'other']),
  note: z.string().max(500).optional().nullable(),
}).strict();

export const driverDocumentSchema = z.object({
  doc_type: z.enum(['cin_front', 'cin_back', 'selfie', 'permis', 'carte_grise', 'assurance']),
  url: z.string().url().max(2048).refine((value) => /^https?:\/\//i.test(value), {
    message: 'Document URL must use http or https',
  }),
}).strict();

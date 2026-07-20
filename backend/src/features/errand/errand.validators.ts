import { z } from 'zod';

const coordinates = {
  pickup_lat: z.number().min(-90).max(90),
  pickup_lng: z.number().min(-180).max(180),
  dropoff_lat: z.number().min(-90).max(90),
  dropoff_lng: z.number().min(-180).max(180),
};

const errandDraftObject = z.object({
  service_type: z.enum(['send_item', 'pickup_existing_order']),
  pickup_address: z.string().trim().min(3).max(500),
  ...coordinates,
  dropoff_address: z.string().trim().min(3).max(500),
  pickup_contact_name: z.string().trim().min(2).max(120),
  pickup_contact_phone: z.string().trim().min(8).max(30),
  recipient_name: z.string().trim().min(2).max(120),
  recipient_phone: z.string().trim().min(8).max(30),
  item_category: z.enum(['documents', 'keys', 'clothes', 'food_package', 'small_parcel', 'other']),
  item_size: z.enum(['small', 'medium', 'large']),
  weight_band: z.enum(['under_2kg', '2_to_5kg', '5_to_9kg']),
  declared_value_dh: z.number().min(0).max(500),
  existing_order_code: z.string().trim().max(120).optional().nullable(),
  existing_order_paid: z.boolean().optional().nullable(),
  instructions: z.string().trim().max(1000).optional().nullable(),
  scheduled_for: z.string().datetime().optional().nullable(),
  safety_confirmed: z.literal(true),
}).strict();

export const errandDraftSchema = errandDraftObject.superRefine((value, ctx) => {
  if (value.service_type === 'pickup_existing_order' && !value.existing_order_code) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['existing_order_code'], message: 'Order code is required' });
  }
});

export const errandDraftUpdateSchema = errandDraftObject.partial().strict();
export const errandQuoteSchema = z.object({}).strict();
export const errandSubmitSchema = z.object({ quote_id: z.string().uuid() }).strict();
export const errandIdParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const storeConflictSchema = z.object({
  mode: z.enum(['buy', 'pickup_existing_order']),
  store_name: z.string().trim().min(2).max(160),
  pickup_lat: z.number().min(-90).max(90).optional(),
  pickup_lng: z.number().min(-180).max(180).optional(),
}).strict();

export const adminErrandReviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_information']),
  reason: z.string().trim().min(3).max(500),
}).strict();
export const adminErrandDisputeSchema=z.object({reason:z.string().trim().min(3).max(1000)}).strict();
export const adminErrandQuoteSchema=z.object({total_dh:z.number().positive().max(500),reason:z.string().trim().min(3).max(500)}).strict();
export const errandQuoteParamsSchema=z.object({id:z.string().uuid(),quoteId:z.string().uuid()}).strict();
export const quoteIdParamsSchema=z.object({quoteId:z.string().uuid()}).strict();

export const errandProofSchema = z.object({
  proof_type: z.enum(['pickup','delivery']),
  mime_type: z.enum(['image/jpeg','image/png','image/webp']),
  file_base64: z.string().min(16).max(7_100_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
}).strict();

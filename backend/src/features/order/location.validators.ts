import { z } from 'zod';

export const driverLocationSchema = z.object({
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional(),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional(),
  accuracy: z.number().min(0).optional().nullable(),
  heading: z.number().min(0).max(360).optional().nullable(),
  speed: z.number().min(0).optional().nullable(),
  battery_level: z.number().min(0).max(100).optional().nullable(),
  app_active: z.boolean().optional().default(true),
  is_background: z.boolean().optional().nullable().default(false),
  client_recorded_at: z.string().datetime().optional().nullable(),
  is_mocked: z.boolean().optional().nullable(),
  continuity_valid: z.boolean().optional().nullable(),
}).strict({ message: 'Payload must not include unauthorized fields' }).refine(
  value => (value.latitude === undefined && value.longitude === undefined) ||
    (value.latitude !== undefined && value.longitude !== undefined),
  { message: 'Latitude and longitude must be provided together' }
);

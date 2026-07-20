import { z } from 'zod';
export const storeReadySchema = z.object({ request_id: z.string().trim().min(8).max(120) }).strict();

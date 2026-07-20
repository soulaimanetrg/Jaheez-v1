import { z } from 'zod';
export const overturnDelaySchema = z.object({ reason: z.string().trim().min(10).max(300), evidence: z.string().trim().min(5).max(1000) });

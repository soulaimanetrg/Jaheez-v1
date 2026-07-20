import { Router, Request, Response } from 'express';
import { logger } from '../../config/logger';

const router = Router();

router.post('/stripe/webhook', async (_req: Request, res: Response) => {
  logger.warn('[payments] Rejected legacy Stripe webhook because online card payments are paused');
  return res.status(410).json({
    error: 'Legacy Stripe webhook is disabled while JAHEEZ migrates to a Moroccan-compatible payment provider',
  });
});

router.all(['/stripe/checkout-session', '/stripe/session/*'], (_req: Request, res: Response) => {
  return res.status(410).json({
    error: 'Legacy Stripe routes are disabled while JAHEEZ migrates to a Moroccan-compatible payment provider',
  });
});

export default router;

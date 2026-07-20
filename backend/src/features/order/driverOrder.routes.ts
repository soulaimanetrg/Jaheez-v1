import { Router } from 'express';
import { CheckoutController } from './checkout.controller';
import { driverAuth } from '../../middleware/driver.middleware';

const router = Router();
const controller = new CheckoutController();

router.post(
  '/v1/orders/:id/accept',
  driverAuth,
  controller.acceptOrder
);

// The legacy /v1/orders/:id/pickup and /deliver routes were removed: they
// transitioned status without validating the pickup/delivery confirmation
// codes. Drivers must use POST /driver/orders/:id/stage, which enforces them.

export default router;

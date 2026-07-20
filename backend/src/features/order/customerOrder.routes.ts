import { Router } from 'express';
import { CheckoutController } from './checkout.controller';
import { verifySupabaseJwt } from '../../middleware/supabaseJwt.middleware';
import { validate } from '../../middleware/validate.middleware';
import { checkoutPreviewSchema, checkoutSchema, cancelOrderSchema } from './checkout.validators';

const router = Router();
const controller = new CheckoutController();

router.post(
  '/v1/checkout/preview',
  verifySupabaseJwt,
  validate(checkoutPreviewSchema),
  controller.previewCheckout
);

router.post(
  '/v1/checkout',
  verifySupabaseJwt,
  validate(checkoutSchema),
  controller.createOrder
);

router.post(
  '/v1/orders/:id/cancel',
  verifySupabaseJwt,
  validate(cancelOrderSchema),
  controller.cancelOrder
);

router.post(
  '/v1/payments/online/session',
  verifySupabaseJwt,
  controller.createOnlinePaymentSession
);

router.get(
  '/v1/payments/online/session/:sessionId',
  verifySupabaseJwt,
  controller.verifyOnlinePaymentSession
);

export default router;

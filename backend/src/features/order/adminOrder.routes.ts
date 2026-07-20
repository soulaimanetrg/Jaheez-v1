import { Router } from 'express';
import { adminAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/admin.middleware';
import { AdminOrderController } from './adminOrder.controller';
import { CheckoutController } from './checkout.controller';
import { validate } from '../../middleware/validate.middleware';
import { adminPatchOrderSchema } from './order.validators';

const router = Router();
const adminOrderController = new AdminOrderController();
const checkoutController = new CheckoutController();

router.get(
  '/orders',
  adminAuth,
  requireRole('super_admin', 'operations', 'finance'),
  adminOrderController.listOrders
);

router.get(
  '/orders/:id/items',
  adminAuth,
  requireRole('super_admin', 'operations', 'finance'),
  adminOrderController.getOrderItems
);

router.post(
  '/orders/dev-cleanup',
  adminAuth,
  requireRole('super_admin'),
  adminOrderController.cleanupDevelopmentDispatch
);

router.patch(
  '/orders/:id',
  adminAuth,
  requireRole('super_admin', 'operations', 'finance'),
  validate(adminPatchOrderSchema),
  adminOrderController.patchOrder
);

router.post(
  '/v1/orders/:id/complete',
  adminAuth,
  requireRole('super_admin', 'operations'),
  checkoutController.completeOrder
);

export default router;

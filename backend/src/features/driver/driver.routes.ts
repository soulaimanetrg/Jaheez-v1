import { Router } from 'express';
import { DriverController } from './driver.controller';
import { driverAuth } from '../../middleware/driver.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateStageSchema, cancelOrderSchema } from '../order/checkout.validators';
import { driverLocationSchema } from '../order/location.validators';
import { driverUpdateMeSchema, orderIssueSchema, declineOrderSchema, driverDocumentSchema } from './driver.validators';
import { driverChangePasswordSchema } from '../auth/driverAuth.validators';
import { confirmationLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();
const controller = new DriverController();

// Profile endpoints
router.get(
  '/driver/me',
  driverAuth,
  controller.getMe
);

router.patch(
  '/driver/me',
  driverAuth,
  validate(driverUpdateMeSchema),
  controller.updateMe
);

router.post(
  '/driver/me/change-password',
  driverAuth,
  validate(driverChangePasswordSchema),
  controller.changePassword
);

router.patch(
  '/driver/me/location',
  driverAuth,
  validate(driverLocationSchema),
  controller.updateLocation
);

router.post(
  '/driver/me/shift/start',
  driverAuth,
  controller.startShift
);

router.post(
  '/driver/me/shift/end',
  driverAuth,
  controller.endShift
);



// Payout endpoints
router.get(
  '/driver/payouts',
  driverAuth,
  controller.getPayouts
);

router.get('/driver/reliability-events', driverAuth, controller.getReliabilityEvents);

router.get(
  '/driver/documents',
  driverAuth,
  controller.getDocuments
);

router.post(
  '/driver/documents',
  driverAuth,
  validate(driverDocumentSchema),
  controller.uploadDocument
);

router.post(
  '/driver/payouts',
  driverAuth,
  (_req, res) => res.status(410).json({ error: 'Les demandes de payout chauffeur sont desactivees; les shifts sont soumis automatiquement.' })
);

// Order endpoints
router.get(
  '/driver/orders',
  driverAuth,
  controller.getOrders
);

router.get(
  '/driver/orders/:id/navigation',
  driverAuth,
  controller.getOrderNavigation
);

router.post(
  '/driver/orders/:id/claim',
  driverAuth,
  controller.claimOrder
);

router.post(
  '/driver/orders/:id/decline',
  driverAuth,
  validate(declineOrderSchema),
  controller.declineOrder
);

router.post(
  '/driver/orders/:id/stage',
  driverAuth,
  confirmationLimiter,
  validate(updateStageSchema),
  controller.updateStage
);

router.post(
  '/driver/orders/:id/cancel',
  driverAuth,
  validate(cancelOrderSchema),
  controller.cancelOrder
);

router.post(
  '/driver/orders/:id/issue',
  driverAuth,
  validate(orderIssueSchema),
  controller.reportIssue
);

export default router;

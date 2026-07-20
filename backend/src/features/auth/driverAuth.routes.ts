import { Router } from 'express';
import { DriverAuthController } from './driverAuth.controller';
import { authLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();
const controller = new DriverAuthController();

// Driver login routes
router.post(
  '/driver/login',
  authLimiter,
  controller.driverLogin
);
router.post('/driver/login/verify-otp', authLimiter, controller.verifyDriverOtp);
router.post('/driver/login/resend-otp', authLimiter, controller.resendDriverOtp);

export default router;

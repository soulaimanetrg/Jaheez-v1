import { Router } from 'express';
import { AdminAuthController } from './adminAuth.controller';
import { validate } from '../../middleware/validate.middleware';
import { adminLoginSchema } from './adminAuth.validators';
import { authLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();
const controller = new AdminAuthController();

// Admin login routes
router.post(
  '/login',
  authLimiter,
  validate(adminLoginSchema),
  controller.adminLogin
);

export default router;

import { Router } from 'express';
import adminAuthRouter from './adminAuth.routes';
import driverAuthRouter from './driverAuth.routes';
import customerAuthRouter from './customerAuth.routes';

const router = Router();

router.use(adminAuthRouter);
router.use(driverAuthRouter);
router.use(customerAuthRouter);

export default router;

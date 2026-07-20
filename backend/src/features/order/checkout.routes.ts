import { Router } from 'express';
import customerOrderRouter from './customerOrder.routes';
import adminOrderRouter from './adminOrder.routes';
import driverOrderRouter from './driverOrder.routes';

const router = Router();

router.use(customerOrderRouter);
router.use(adminOrderRouter);
router.use(driverOrderRouter);

export default router;

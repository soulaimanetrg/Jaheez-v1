import { Router } from 'express';
import { adminAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/admin.middleware';
import { validate } from '../../middleware/validate.middleware';
import { CommissionController } from './commission.controller';
import { commissionRateSchema, driverCommissionOverrideSchema } from './commission.validators';

const router = Router();
const controller = new CommissionController();
router.use(adminAuth, requireRole('super_admin'));
router.get('/commission/rates', controller.listRates);
router.post('/commission/rates', validate(commissionRateSchema), controller.createRate);
router.get('/commission/overrides', controller.listOverrides);
router.get('/commission/resolved/:driverId', controller.resolveRate);
router.post('/commission/overrides', validate(driverCommissionOverrideSchema), controller.createOverride);
export default router;

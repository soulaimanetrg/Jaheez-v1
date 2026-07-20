import { Router } from 'express';
import { PaymentsController } from './payments.controller';

const router = Router();
const controller = new PaymentsController();

router.get('/v1/payments/status', controller.getStatus);

export default router;

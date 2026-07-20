import { Router } from 'express';
import { CustomerAuthController } from './customerAuth.controller';
import { verifySupabaseJwtForCustomerBootstrap } from '../../middleware/supabaseJwt.middleware';
import { validate } from '../../middleware/validate.middleware';
import { authLimiter } from '../../middleware/rateLimit.middleware';
import { customerBootstrapSchema, customerLoginSchema, customerRegisterSchema } from './customerAuth.validators';

const router = Router();
const controller = new CustomerAuthController();

router.post('/auth/register', authLimiter, validate(customerRegisterSchema), controller.customerRegister);
router.post('/auth/login', authLimiter, validate(customerLoginSchema), controller.customerLogin);
router.post('/auth/customer/bootstrap', verifySupabaseJwtForCustomerBootstrap, authLimiter, validate(customerBootstrapSchema), controller.customerBootstrap);

export default router;

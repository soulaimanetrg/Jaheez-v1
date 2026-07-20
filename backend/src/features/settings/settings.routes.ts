import { Router } from 'express';
import adminSettingsRouter from './adminSettings.routes';
import publicSettingsRouter from './publicSettings.routes';

const router = Router();

router.use(adminSettingsRouter);
router.use(publicSettingsRouter);

export default router;

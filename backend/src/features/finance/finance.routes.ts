import { Router } from 'express';
import { FinanceController } from './finance.controller';
import { adminAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/admin.middleware';

const router = Router();
const controller = new FinanceController();

// All finance routes require adminAuth and super_admin or finance roles
router.use(adminAuth);
router.use(requireRole('super_admin', 'finance'));

// --- FINANCE OVERVIEW ---
router.get('/finance/stats', controller.getFinanceStats);

// --- WALLETS ---
router.get('/wallets', controller.listWallets);
router.get('/wallets/:user_id', controller.getWalletDetail);
router.post('/wallets/:user_id/adjust', controller.adjustWallet);
router.post('/wallets/:user_id/freeze', controller.freezeWallet);
router.post('/wallets/:user_id/unfreeze', controller.unfreezeWallet);

// --- REFUNDS ---
router.get('/refunds', controller.listRefunds);
router.get('/refunds/stats', controller.getRefundStats);
router.post('/refunds', controller.createRefund);
router.patch('/refunds/:id', controller.updateRefund);

// --- DRIVER PAYOUTS ---
router.get('/payouts', controller.listPayouts);
router.patch('/payouts/:id', controller.updatePayout);

// --- COD SETTLEMENTS ---
router.get('/cod-orders', controller.listCODOrders);
router.get('/cod-settlements', controller.listCODSettlements);
router.post('/cod-settlements', controller.createCODSettlement);

export default router;

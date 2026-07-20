import { Router } from 'express';
import { adminAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/admin.middleware';
import { RiskService } from './risk.service';
const router = Router(); const service = new RiskService();
router.get('/risk/reconciliation', adminAuth, requireRole('super_admin','finance'), async (_req,res,next) => {
  try { res.json(await service.listIssues()); } catch (e) { next(e); }
});
router.get('/risk/fraud-cases', adminAuth, requireRole('super_admin','operations','finance'), async (_req,res,next) => {
  try { res.json(await service.listFraud()); } catch (e) { next(e); }
});
router.patch('/risk/fraud-cases/:id', adminAuth, requireRole('super_admin','operations'), async (req,res,next) => {
  try { res.json(await service.resolveFraud(req.params.id, req.admin!.id, req.body.status, req.body.note || '')); } catch (e) { next(e); }
});
export default router;

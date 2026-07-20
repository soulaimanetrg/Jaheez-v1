import { Router } from 'express';
import { SupportController } from './support.controller';
import { adminAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/admin.middleware';

const router = Router();
const controller = new SupportController();

// All support/reviews endpoints require adminAuth and super_admin or support roles
router.use(adminAuth);
router.use(requireRole('super_admin', 'support'));

// --- SUPPORT TICKETS ---
router.get('/support', controller.getSupportTickets);
router.get('/support/tickets', controller.getSupportTickets);
router.patch('/support/:id', controller.updateSupportTicket);
router.patch('/support/tickets/:id', controller.updateSupportTicket);

// --- DRIVER ISSUES ---
router.get('/driver-issues', controller.getDriverIssues);
router.patch('/driver-issues/:id', controller.updateDriverIssue);

// --- STORE REVIEWS ---
router.get('/reviews', controller.getStoreReviews);
router.patch('/reviews/:id', controller.updateReviewVisibility);

export default router;

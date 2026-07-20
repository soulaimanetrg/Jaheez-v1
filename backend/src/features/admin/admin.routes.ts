import { Router } from 'express';
import { AdminController } from './admin.controller';
import { adminAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/admin.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createDriverSchema,
  updateDriverAdminSchema,
  resetDriverPasswordSchema,
  pauseDriverSchema,
  suspendDriverSchema,
  manualReassignSchema,
  driverCooldownSchema,
  dispatchModeSchema
} from './admin.validators';

const router = Router();
const controller = new AdminController();

// Admin driver creation
router.post(
  '/v1/admin/drivers',
  adminAuth,
  requireRole('super_admin', 'operations'),
  validate(createDriverSchema),
  controller.createDriver
);

// Admin driver details update / activation / deactivation
router.patch(
  '/v1/admin/drivers/:id',
  adminAuth,
  requireRole('super_admin', 'operations'),
  validate(updateDriverAdminSchema),
  controller.updateDriver
);

// Admin driver password reset
router.post(
  '/v1/admin/drivers/:id/reset-password',
  adminAuth,
  requireRole('super_admin', 'operations'),
  validate(resetDriverPasswordSchema),
  controller.resetDriverPassword
);

// General Admin accounts management
router.get('/me', adminAuth, controller.getMe);
router.get('/admins', adminAuth, requireRole('super_admin'), controller.listAdmins);
router.post('/admins', adminAuth, requireRole('super_admin'), controller.createAdmin);
router.patch('/admins/:id', adminAuth, requireRole('super_admin'), controller.updateAdmin);
router.delete('/admins/:id', adminAuth, requireRole('super_admin'), controller.deleteAdmin);
router.post('/admins/:id/reset-token', adminAuth, requireRole('super_admin'), controller.resetAdminToken);

// User accounts management (customers)
router.get('/users', adminAuth, requireRole('super_admin', 'operations', 'support'), controller.listUsers);
router.patch('/users/:id', adminAuth, requireRole('super_admin', 'operations'), controller.updateUser);

// Audit logs
router.get('/audit-logs', adminAuth, requireRole('super_admin'), controller.getAuditLogs);
router.get('/audit-logs/actions', adminAuth, requireRole('super_admin'), controller.getAuditActions);

// Dashboard & Analytics
router.get('/dashboard', adminAuth, requireRole('super_admin', 'operations', 'finance'), controller.getDashboard);
router.get('/analytics', adminAuth, requireRole('super_admin', 'operations', 'finance'), controller.getAnalytics);
router.get('/export/:type', adminAuth, requireRole('super_admin', 'operations', 'finance'), controller.exportCsv);

// Banners/Broadcast Notifications
router.get('/notifications', adminAuth, requireRole('super_admin', 'operations', 'content_manager'), controller.getNotifications);
router.post('/notifications/send', adminAuth, requireRole('super_admin', 'content_manager'), controller.sendNotification);
router.get('/notification-feed', adminAuth, requireRole('super_admin', 'operations', 'content_manager'), controller.getNotificationFeed);

// Admin-facing Driver management routes
router.get('/drivers', adminAuth, requireRole('super_admin', 'operations'), controller.listDrivers);
router.get('/drivers/:id', adminAuth, requireRole('super_admin', 'operations'), controller.getDriverDetails);
router.patch('/drivers/:id', adminAuth, requireRole('super_admin', 'operations'), controller.updateDriver);
router.delete('/drivers/:id', adminAuth, requireRole('super_admin', 'operations'), controller.deleteDriver);

// Admin driver controls
router.post(
  '/v1/admin/drivers/:id/pause',
  adminAuth,
  requireRole('super_admin', 'operations'),
  validate(pauseDriverSchema),
  controller.pauseDriver
);

router.post(
  '/v1/admin/drivers/:id/force-offline',
  adminAuth,
  requireRole('super_admin', 'operations'),
  controller.forceOffline
);

router.post(
  '/v1/admin/drivers/:id/suspend',
  adminAuth,
  requireRole('super_admin', 'operations'),
  validate(suspendDriverSchema),
  controller.suspendDriver
);

// Admin order manual reassignment
router.post(
  '/v1/admin/orders/:id/reassign',
  adminAuth,
  requireRole('super_admin', 'operations'),
  validate(manualReassignSchema),
  controller.manualReassignOrder
);

router.post(
  '/v1/admin/drivers/:id/cooldown',
  adminAuth,
  requireRole('super_admin', 'operations'),
  validate(driverCooldownSchema),
  controller.setDriverCooldown
);



router.post(
  '/v1/admin/stores/:id/dispatch-mode',
  adminAuth,
  requireRole('super_admin', 'operations'),
  validate(dispatchModeSchema),
  controller.setStoreDispatchMode
);

export default router;

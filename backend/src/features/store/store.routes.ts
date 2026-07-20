import { Router } from 'express';
import { StoreController } from './store.controller';
import { AdminStoreController } from './adminStore.controller';
import { adminAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/admin.middleware';
import { validate } from '../../middleware/validate.middleware';
import { StoreReadyController } from './storeReady.controller';
import { storeReadySchema } from './storeReady.validators';
import { storeReductionSchema } from './storeReduction.validators';
import { storeReadyLimiter } from '../../middleware/rateLimit.middleware';
import { storePartnerAuth } from '../../middleware/storePartner.middleware';
import { StoreCredentialService } from './storeCredential.service';

const router = Router();
const controller = new StoreController();
const adminController = new AdminStoreController();
const readyController = new StoreReadyController();
const credentialService = new StoreCredentialService();

// Customer public route
router.get('/v1/customer/stores', controller.listStores);
router.get('/v1/customer/stores/:storeId', controller.getStoreById);
router.get('/v1/customer/stores/:storeId/menu', controller.getStoreMenu);
router.get('/v1/customer/stores/:storeId/reviews', controller.getStoreReviews);

// Admin-facing store routes
router.get(
  '/stores',
  adminAuth,
  requireRole('super_admin', 'operations', 'content_manager'),
  adminController.getStores
);

router.post(
  '/stores',
  adminAuth,
  requireRole('super_admin', 'operations'),
  adminController.createStore
);

router.patch(
  '/stores/:id',
  adminAuth,
  requireRole('super_admin', 'operations'),
  adminController.updateStore
);

router.post(
  '/stores/:storeId/reduction',
  adminAuth,
  requireRole('super_admin', 'operations'),
  validate(storeReductionSchema),
  adminController.applyReduction
);

router.post(
  '/stores/:storeId/orders/:orderId/ready',
  adminAuth,
  requireRole('super_admin', 'operations'),
  validate(storeReadySchema),
  readyController.markReady
);

// The store identity is derived exclusively from the scoped credential.
router.post('/v1/store/orders/:orderId/ready', storeReadyLimiter, storePartnerAuth,
  validate(storeReadySchema), readyController.markReadyAsPartner);

router.post('/stores/:storeId/credentials', adminAuth, requireRole('super_admin'), async (req, res, next) => {
  try { res.status(201).json(await credentialService.create(req.params.storeId, req.body.name, req.admin!.id, req.body.expires_at)); }
  catch (error) { next(error); }
});
router.delete('/stores/credentials/:id', adminAuth, requireRole('super_admin'), async (req, res, next) => {
  try { res.json(await credentialService.revoke(req.params.id, req.admin!.id)); } catch (error) { next(error); }
});

// Admin-facing category/product routes
router.get(
  '/menu-categories',
  adminAuth,
  requireRole('super_admin', 'operations', 'content_manager'),
  adminController.getMenuCategories
);

router.post(
  '/menu-categories',
  adminAuth,
  requireRole('super_admin', 'operations'),
  adminController.createMenuCategory
);

router.patch(
  '/menu-categories/:id',
  adminAuth,
  requireRole('super_admin', 'operations'),
  adminController.updateMenuCategory
);

router.delete(
  '/menu-categories/:id',
  adminAuth,
  requireRole('super_admin', 'operations'),
  adminController.deleteMenuCategory
);

router.get(
  '/products',
  adminAuth,
  requireRole('super_admin', 'operations', 'content_manager'),
  adminController.getProducts
);

router.post(
  '/products',
  adminAuth,
  requireRole('super_admin', 'operations'),
  adminController.createProduct
);

router.patch(
  '/products/:id',
  adminAuth,
  requireRole('super_admin', 'operations'),
  adminController.updateProduct
);

router.delete(
  '/products/:id',
  adminAuth,
  requireRole('super_admin', 'operations'),
  adminController.deleteProduct
);

export default router;

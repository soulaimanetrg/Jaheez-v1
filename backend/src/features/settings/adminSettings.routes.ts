import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { adminAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/admin.middleware';

const router = Router();
const controller = new SettingsController();

// --- APP SETTINGS ---
router.get('/settings', adminAuth, requireRole('super_admin'), controller.getSettings);
router.post('/settings', adminAuth, requireRole('super_admin'), controller.updateSettings);
router.delete('/settings/:key', adminAuth, requireRole('super_admin'), controller.deleteSetting);

// --- CITIES ---
router.get('/cities', adminAuth, requireRole('super_admin', 'operations'), controller.getCities);
router.post('/cities', adminAuth, requireRole('super_admin'), controller.createCity);
router.patch('/cities/:id', adminAuth, requireRole('super_admin'), controller.updateCity);
router.delete('/cities/:id', adminAuth, requireRole('super_admin'), controller.deleteCity);

// --- SERVICE CATEGORIES ---
router.get('/service-categories', adminAuth, requireRole('super_admin', 'operations', 'content_manager'), controller.getCategories);
router.post('/service-categories', adminAuth, requireRole('super_admin', 'content_manager'), controller.createCategory);
router.patch('/service-categories/:id', adminAuth, requireRole('super_admin', 'content_manager'), controller.updateCategory);
router.delete('/service-categories/:id', adminAuth, requireRole('super_admin', 'content_manager'), controller.deleteCategory);

// --- DELIVERY ZONES ---
router.get('/zones', adminAuth, requireRole('super_admin', 'operations'), controller.getZones);
router.post('/zones', adminAuth, requireRole('super_admin', 'operations'), controller.createZone);
router.patch('/zones/:id', adminAuth, requireRole('super_admin', 'operations'), controller.updateZone);
router.delete('/zones/:id', adminAuth, requireRole('super_admin', 'operations'), controller.deleteZone);

// --- PROMOTIONS ---
router.get('/promotions', adminAuth, requireRole('super_admin', 'operations', 'content_manager'), controller.getPromotions);
router.post('/promotions', adminAuth, requireRole('super_admin', 'content_manager'), controller.createPromotion);
router.patch('/promotions/:id', adminAuth, requireRole('super_admin', 'content_manager'), controller.updatePromotion);
router.delete('/promotions/:id', adminAuth, requireRole('super_admin', 'content_manager'), controller.deletePromotion);

// --- BANNERS ---
router.get('/banners', adminAuth, requireRole('super_admin', 'operations', 'content_manager'), controller.getBanners);
router.post('/banners', adminAuth, requireRole('super_admin', 'content_manager'), controller.createBanner);
router.patch('/banners/:id', adminAuth, requireRole('super_admin', 'content_manager'), controller.updateBanner);
router.delete('/banners/:id', adminAuth, requireRole('super_admin', 'content_manager'), controller.deleteBanner);

// --- APP CONTENT ---
router.get('/content', adminAuth, requireRole('super_admin', 'content_manager', 'support'), controller.getContent);
router.post('/content', adminAuth, requireRole('super_admin', 'content_manager'), controller.createContent);
router.patch('/content/:slug', adminAuth, requireRole('super_admin', 'content_manager'), controller.updateContent);
router.delete('/content/:slug', adminAuth, requireRole('super_admin', 'content_manager'), controller.deleteContent);

// --- VEHICLE TYPES ---
router.get('/vehicle-types', adminAuth, requireRole('super_admin', 'operations'), controller.getVehicleTypes);
router.post('/vehicle-types', adminAuth, requireRole('super_admin'), controller.createVehicleType);
router.patch('/vehicle-types/:id', adminAuth, requireRole('super_admin'), controller.updateVehicleType);
router.delete('/vehicle-types/:id', adminAuth, requireRole('super_admin'), controller.deleteVehicleType);

export default router;

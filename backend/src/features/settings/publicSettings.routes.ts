import { Router } from 'express';
import { SettingsController } from './settings.controller';

const router = Router();
const controller = new SettingsController();

// --- APP SETTINGS ---
router.get('/app-settings/public', controller.getPublicSettings);
router.get('/notification-feed/public', controller.getPublicNotificationFeed);

// --- CITIES ---
router.get('/cities/public', controller.getPublicCities);

// --- SERVICE CATEGORIES ---
router.get('/service-categories/public', controller.getPublicCategories);

// --- PROMOTIONS ---
router.get('/active-promotions', controller.getActivePromotions);
router.post('/validate-promo', controller.validatePromo);

// --- BANNERS ---
router.get('/banners/public', controller.getPublicBanners);

// --- PUBLIC APP CONTENT (FAQ, TERMS, PRIVACY, ABOUT) ---
router.get('/content/public', controller.getContent);

export default router;

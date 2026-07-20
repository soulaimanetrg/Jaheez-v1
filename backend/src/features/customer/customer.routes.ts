import { NextFunction, Request, Response, Router } from 'express';
import { CustomerController } from './customer.controller';
import { verifySupabaseJwt } from '../../middleware/supabaseJwt.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  addressSchema, onboardingAddressSchema,
  chatMessageSchema,
  customerAnalyticsEventSchema,
  customerHomeFeedQuerySchema,
  favoriteSchema,
  favoriteProductSchema,
  pushTokenSchema,
  reviewSchema,
  supportTicketSchema,
  updateProfileSchema,
  upsertProfileSchema,
  locationReverseSchema,
  locationSearchSchema,
  translationSchema,
} from './customer.validators';
import { customerChangePasswordSchema } from '../auth/customerAuth.validators';

const router = Router();
const controller = new CustomerController();

function verifyCustomerJwt(req: Request, res: Response, next: NextFunction) {
  const isErrandRoute =
    req.path === '/errands' ||
    req.path.startsWith('/errands/') ||
    req.originalUrl.includes('/v1/customer/errands/');

  if (isErrandRoute) return next();

  return verifySupabaseJwt(req, res, next);
}

router.use('/v1/customer', verifyCustomerJwt);

router.get('/v1/customer/home-feed', validate({ query: customerHomeFeedQuerySchema }), controller.getHomeFeed);
router.post('/v1/customer/analytics/events', validate(customerAnalyticsEventSchema), controller.recordAnalyticsEvent);
router.get('/v1/customer/profile', controller.getProfile);
router.patch('/v1/customer/profile', validate(updateProfileSchema), controller.updateProfile);
router.post('/v1/customer/profile', validate(upsertProfileSchema), controller.upsertProfile);
router.post('/v1/customer/change-password', validate(customerChangePasswordSchema), controller.changePassword);
router.get('/v1/customer/wallet', controller.getWallet);
router.get('/v1/customer/wallet/transactions', controller.getWalletTransactions);

router.patch('/v1/customer/push-token', validate(pushTokenSchema), controller.updatePushToken);
router.get('/v1/customer/addresses', controller.listAddresses);
router.get('/v1/customer/location/config', controller.getLocationConfig);
router.get('/v1/customer/location/search', validate({ query: locationSearchSchema }), controller.searchLocation);
router.post('/v1/customer/location/reverse', validate(locationReverseSchema), controller.reverseLocation);
router.post('/v1/customer/translations', validate(translationSchema), controller.translateText);
router.post('/v1/customer/addresses', validate(addressSchema), controller.createAddress);
router.post('/v1/customer/onboarding/address', validate(onboardingAddressSchema), controller.saveOnboardingAddress);
router.patch('/v1/customer/addresses/:id', validate(addressSchema.partial()), controller.updateAddress);
router.delete('/v1/customer/addresses/:id', controller.deleteAddress);

// Favorites endpoints
router.post('/v1/customer/favorites/toggle', validate(favoriteSchema), controller.toggleFavorite);
router.post('/v1/customer/favorites/products/toggle', validate(favoriteProductSchema), controller.toggleFavoriteProduct);
router.get('/v1/customer/favorites/stores/:storeId', controller.checkFavorite);
router.get('/v1/customer/favorites/products/:menuItemId', controller.checkFavoriteProduct);
router.get('/v1/customer/favorites/products', controller.listFavoriteProducts);
router.get('/v1/customer/favorites/stores', controller.listFavoriteStores);

router.get('/v1/customer/support-tickets', controller.listSupportTickets);
router.post('/v1/customer/support-tickets', validate(supportTicketSchema), controller.createSupportTicket);
router.get('/v1/customer/orders/active', controller.getActiveOrder);
router.get('/v1/customer/orders', controller.listOrders);
router.get('/v1/customer/orders/:orderId', controller.getOrderById);
router.get('/v1/customer/orders/:orderId/chat', controller.listChatMessages);
router.post('/v1/customer/orders/:orderId/chat', validate(chatMessageSchema), controller.sendChatMessage);
router.post('/v1/customer/orders/:orderId/reviews', validate(reviewSchema), controller.submitReview);
router.post('/v1/customer/orders/:orderId/confirm-delivery', controller.confirmDelivery);

export default router;

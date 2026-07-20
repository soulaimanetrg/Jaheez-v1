import { Request, Response, NextFunction } from 'express';
import { CustomerService } from './customer.service';
import { CustomerAuthService } from '../auth/customerAuth.service';
import { BadRequestError } from '../../middleware/error.middleware';
import { CustomerLocationService } from './customerLocation.service';
import { CustomerTranslationService } from './customerTranslation.service';

export class CustomerController {
  private service = new CustomerService();
  private authService = new CustomerAuthService();
  private locationService = new CustomerLocationService();
  private translationService = new CustomerTranslationService();

  private userId(req: Request) {
    const userId = req.supabaseUser?.id;
    if (!userId) throw new BadRequestError('Utilisateur non identifie', 'user_not_identified');
    return userId;
  }

  getWallet = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.getWallet(this.userId(req))); } catch (error) { next(error); } };
  getWalletTransactions = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.getWalletTransactions(this.userId(req), req.query.type as string | undefined)); } catch (error) { next(error); } };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.getProfile(this.userId(req)));
    } catch (error) { next(error); }
  };

  getHomeFeed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.getHomeFeed(this.userId(req), req.query as { lat?: number; lng?: number }));
    } catch (error) { next(error); }
  };

  recordAnalyticsEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(202).json(await this.service.recordAnalyticsEvent(this.userId(req), req.body, {
        userAgent: req.headers['user-agent'] || null,
      }));
    } catch (error) { next(error); }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.updateProfile(this.userId(req), req.body));
    } catch (error) { next(error); }
  };

  upsertProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await this.service.upsertProfile(this.userId(req), req.body));
    } catch (error) { next(error); }
  };

  updatePushToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.updatePushToken(this.userId(req), req.body.push_token));
    } catch (error) { next(error); }
  };

  listAddresses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.listAddresses(this.userId(req)));
    } catch (error) { next(error); }
  };

  getLocationConfig = async (_req: Request, res: Response, next: NextFunction) => { try { res.json(this.locationService.config()); } catch (error) { next(error); } };
  translateText = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.translationService.translate(req.body)); } catch (error) { next(error); } };
  reverseLocation = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.locationService.reverse(Number(req.body.lat), Number(req.body.lng))); } catch (error) { next(error); } };
  searchLocation = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.locationService.search(String(req.query.q))); } catch (error) { next(error); } };

  createAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await this.service.createAddress(this.userId(req), req.body));
    } catch (error) { next(error); }
  };

  saveOnboardingAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.saveOnboardingAddress(this.userId(req), req.body);
      res.status(201).json(await this.authService.bootstrapCustomer(req.supabaseUser, {}));
    }
    catch (error) { next(error); }
  };

  updateAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.updateAddress(this.userId(req), req.params.id, req.body));
    } catch (error) { next(error); }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.deleteAddress(this.userId(req), req.params.id));
    } catch (error) { next(error); }
  };

  toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.toggleFavorite(this.userId(req), req.body.store_id));
    } catch (error) { next(error); }
  };

  checkFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.checkFavorite(this.userId(req), req.params.storeId));
    } catch (error) { next(error); }
  };

  createSupportTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await this.service.createSupportTicket(this.userId(req), req.body));
    } catch (error) { next(error); }
  };

  listSupportTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.listSupportTickets(this.userId(req)));
    } catch (error) { next(error); }
  };

  getActiveOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.getActiveOrder(this.userId(req)));
    } catch (error) { next(error); }
  };

  listOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;
      res.json(await this.service.listOrders(this.userId(req), page, pageSize));
    } catch (error) { next(error); }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.getOrderById(this.userId(req), req.params.orderId));
    } catch (error) { next(error); }
  };

  listChatMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.listChatMessages(this.userId(req), req.params.orderId));
    } catch (error) { next(error); }
  };

  sendChatMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await this.service.sendChatMessage(this.userId(req), req.params.orderId, req.body.content));
    } catch (error) { next(error); }
  };

  submitReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await this.service.submitReview(this.userId(req), req.params.orderId, req.body.rating, req.body.comment));
    } catch (error) { next(error); }
  };

  confirmDelivery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.confirmDelivery(this.userId(req), req.params.orderId));
    } catch (error) { next(error); }
  };

  toggleFavoriteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body.menu_item_id) throw new BadRequestError('menu_item_id is required', 'missing_menu_item_id');
      res.json(await this.service.toggleFavoriteProduct(this.userId(req), req.body.menu_item_id));
    } catch (error) { next(error); }
  };

  checkFavoriteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.checkFavoriteProduct(this.userId(req), req.params.menuItemId));
    } catch (error) { next(error); }
  };

  listFavoriteProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.listFavoriteProducts(this.userId(req)));
    } catch (error) { next(error); }
  };

  listFavoriteStores = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.listFavoriteStores(this.userId(req)));
    } catch (error) { next(error); }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await this.service.changePassword(this.userId(req), currentPassword, newPassword);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  };
}

import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';

export class SettingsController {
  private service = new SettingsService();

  private getAdminContext(req: Request) {
    return {
      adminId: req.admin?.id || null,
      adminEmail: req.admin?.email || null,
      ip: (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null,
    };
  }

  // --- APP SETTINGS ---
  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getSettings();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateSettings(req.body, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.deleteSetting(req.params.key, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getPublicSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getPublicSettings();
      // Cache for 60s at the edge
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getPublicNotificationFeed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getPublicNotificationFeed();
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // --- CITIES ---
  getCities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getCities();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getPublicCities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getPublicCities();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createCity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createCity(req.body, this.getAdminContext(req));
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateCity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.updateCity(id, req.body, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteCity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteCity(id, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // --- SERVICE CATEGORIES ---
  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.query.type as string;
      const result = await this.service.getCategories(type);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getPublicCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.query.type as string;
      const result = await this.service.getPublicCategories(type);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createCategory(req.body, this.getAdminContext(req));
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.updateCategory(id, req.body, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteCategory(id, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // --- DELIVERY ZONES ---
  getZones = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getZones();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createZone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createZone(req.body, this.getAdminContext(req));
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateZone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.updateZone(id, req.body, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteZone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteZone(id, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // --- PROMOTIONS ---
  getPromotions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getPromotions();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createPromotion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createPromotion(req.body, this.getAdminContext(req));
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updatePromotion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.updatePromotion(id, req.body, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deletePromotion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.deletePromotion(id, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getActivePromotions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getActivePromotions();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  validatePromo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.validatePromo(req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // --- BANNERS ---
  getBanners = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getBanners();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createBanner(req.body, this.getAdminContext(req));
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.updateBanner(id, req.body, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteBanner(id, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getPublicBanners = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getPublicBanners();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getContent(req.query.type as string | undefined);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createContent(req.body, this.getAdminContext(req));
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateContent(req.params.slug, req.body, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.deleteContent(req.params.slug, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getVehicleTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getVehicleTypes();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createVehicleType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createVehicleType(req.body, this.getAdminContext(req));
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateVehicleType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateVehicleType(req.params.id, req.body, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteVehicleType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.deleteVehicleType(req.params.id, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

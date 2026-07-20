import { Request, Response, NextFunction } from 'express';
import { AdminStoreService } from './adminStore.service';

export class AdminStoreController {
  private service = new AdminStoreService();

  getStores = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getStores();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createStore(req.body);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.updateStore(id, req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getMenuCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storeId = req.query.store_id as string;
      const result = await this.service.getMenuCategories(storeId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storeId = req.query.store_id as string;
      const result = await this.service.getProducts(storeId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createProduct(req.body);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.updateProduct(id, req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteProduct(id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createMenuCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createMenuCategory(req.body);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateMenuCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.updateMenuCategory(id, req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteMenuCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteMenuCategory(id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  applyReduction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { storeId } = req.params;
      const result = await this.service.applyReduction(storeId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  submitReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.submitReview(req.body);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };
}

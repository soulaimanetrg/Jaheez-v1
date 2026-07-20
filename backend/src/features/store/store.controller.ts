import { Request, Response, NextFunction } from 'express';
import { StoreService } from './store.service';

export class StoreController {
  private service = new StoreService();

  listStores = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = req.query.category as string | undefined;
      const query = req.query.query as string | undefined;
      const sub_category = req.query.sub_category as string | undefined;
      const sort = req.query.sort as string | undefined;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
      
      let is_featured: boolean | undefined = undefined;
      if (req.query.is_featured === 'true') {
        is_featured = true;
      } else if (req.query.is_featured === 'false') {
        is_featured = false;
      }

      const stores = await this.service.getStores({
        category,
        query,
        sub_category,
        sort,
        lat,
        lng,
        is_featured
      });

      res.json(stores);
    } catch (error) {
      next(error);
    }
  };

  getStoreById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.getStoreById(req.params.storeId));
    } catch (error) {
      next(error);
    }
  };

  getStoreMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.getStoreMenu(req.params.storeId));
    } catch (error) {
      next(error);
    }
  };

  getStoreReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
      res.json(await this.service.getStoreReviews(req.params.storeId, page, pageSize));
    } catch (error) {
      next(error);
    }
  };
}

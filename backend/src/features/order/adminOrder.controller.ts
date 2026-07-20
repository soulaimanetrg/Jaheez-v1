import { Request, Response, NextFunction } from 'express';
import { AdminOrderService } from './adminOrder.service';

export class AdminOrderController {
  private service = new AdminOrderService();

  listOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string;
      const result = await this.service.listOrders(status);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getOrderItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.getOrderItems(id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  cleanupDevelopmentDispatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = {
        id: req.admin?.id || null,
        email: req.admin?.email || null,
        role: req.admin?.role || 'operations',
      };
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.service.cleanupDevelopmentDispatch(req.body, actor, ip);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  patchOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const actor = {
        id: req.admin?.id || null,
        email: req.admin?.email || null,
        role: req.admin?.role || 'operations',
      };
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.service.patchOrder(id, req.body, actor, ip);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

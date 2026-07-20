import { Request, Response, NextFunction } from 'express';
import { StoreReadyService } from './storeReady.service';

export class StoreReadyController {
  private service = new StoreReadyService();
  markReady = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.markReady({ orderId: req.params.orderId, storeId: req.params.storeId,
        requestId: req.body.request_id, actorId: req.admin!.id });
      res.json({ order_id: result.id, store_id: result.store_id, store_ready_at: result.store_ready_at });
    } catch (error) { next(error); }
  };
  markReadyAsPartner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const partner = req.storePartner!;
      const result = await this.service.markReadyAsPartner({ orderId: req.params.orderId, storeId: partner.storeId,
        requestId: req.body.request_id, actorId: partner.credentialId });
      res.json({ order_id: result.id, store_id: result.store_id, store_ready_at: result.store_ready_at });
    } catch (error) { next(error); }
  };
}

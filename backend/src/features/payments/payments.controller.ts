import { Request, Response, NextFunction } from 'express';
import { PaymentProviderService } from './paymentProvider.service';

export class PaymentsController {
  private service = new PaymentProviderService();

  getStatus = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return res.status(200).json(this.service.getStatus());
    } catch (error) {
      next(error);
    }
  };
}

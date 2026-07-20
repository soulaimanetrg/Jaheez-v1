import { Request, Response, NextFunction } from 'express';
import { FinanceService } from './finance.service';

export class FinanceController {
  private service = new FinanceService();

  private getAdminContext(req: Request) {
    return {
      adminId: req.admin?.id || null,
      adminEmail: req.admin?.email || null,
      adminRole: req.admin?.role || null,
      ip: (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null,
    };
  }

  getFinanceStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getFinanceStats();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // --- WALLETS ---
  listWallets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query.q as string;
      const result = await this.service.listWallets(q);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getWalletDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.params;
      const result = await this.service.getWalletDetail(user_id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  adjustWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.params;
      const result = await this.service.adjustWallet(user_id, req.body, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  freezeWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.params;
      const { reason } = req.body;
      const result = await this.service.freezeWallet(user_id, reason, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  unfreezeWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.params;
      const { note } = req.body;
      const result = await this.service.unfreezeWallet(user_id, note, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // --- REFUNDS ---
  listRefunds = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string;
      const result = await this.service.listRefunds(status);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getRefundStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getRefundStats();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createRefund(req.body, this.getAdminContext(req));
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.updateRefund(id, req.body, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // --- DRIVER PAYOUTS ---
  listPayouts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string;
      const result = await this.service.listPayouts(status);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  updatePayout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.updatePayout(id, req.body, this.getAdminContext(req));
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // --- COD SETTLEMENTS ---
  listCODSettlements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.query.driver_id as string;
      const result = await this.service.listCODSettlements(driverId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  listCODOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.listCODOrders();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createCODSettlement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createCODSettlement(req.body, this.getAdminContext(req));
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };
}

import { Request, Response, NextFunction } from 'express';
import { SupportService } from './support.service';

export class SupportController {
  private service = new SupportService();

  // --- SUPPORT TICKETS ---
  getSupportTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getSupportTickets();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateSupportTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.updateSupportTicket(id, req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getDriverIssues = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string | undefined;
      const result = await this.service.getDriverIssues(status);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateDriverIssue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.updateDriverIssue(id, req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // --- STORE REVIEWS ---
  getStoreReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getStoreReviews();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateReviewVisibility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { is_visible } = req.body;
      const result = await this.service.updateReviewVisibility(id, is_visible);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

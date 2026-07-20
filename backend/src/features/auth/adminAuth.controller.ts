import { Request, Response, NextFunction } from 'express';
import { AdminAuthService } from './adminAuth.service';

export class AdminAuthController {
  private service = new AdminAuthService();

  /**
   * Post Admin Login endpoint
   */
  adminLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      const result = await this.service.adminLogin(req.body, ip);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

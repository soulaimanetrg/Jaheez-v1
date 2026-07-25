import { Request, Response, NextFunction } from 'express';
import { CustomerAuthService } from './customerAuth.service';
import { BadRequestError } from '../../middleware/error.middleware';

export class CustomerAuthController {
  private service = new CustomerAuthService();
  continueCustomerAuth = async (req: Request, res: Response, next: NextFunction) => { try { res.status(200).json(await this.service.continueCustomerAuth(req.body, { ip: req.ip || req.socket.remoteAddress || 'unknown' })); } catch (error) { next(error); } };
  verifyCustomerRegistration = async (req: Request, res: Response, next: NextFunction) => { try { res.status(200).json(await this.service.verifyCustomerRegistrationOtp(req.body)); } catch (error) { next(error); } };
  resendCustomerRegistration = async (req: Request, res: Response, next: NextFunction) => { try { res.status(202).json(await this.service.resendCustomerRegistrationOtp(req.body)); } catch (error) { next(error); } };
  customerRegister = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json(await this.service.customerRegister(req.body, { ip: req.ip || req.socket.remoteAddress || 'unknown' })); } catch (error) { next(error); } };
  customerLogin = async (req: Request, res: Response, next: NextFunction) => { try { res.status(200).json(await this.service.customerLogin(req.body)); } catch (error) { next(error); } };
  customerBootstrap = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) throw new BadRequestError('Authenticated customer required');
      res.status(200).json(await this.service.bootstrapCustomer(req.supabaseUser, req.body || {}));
    } catch (error) { next(error); }
  };
}

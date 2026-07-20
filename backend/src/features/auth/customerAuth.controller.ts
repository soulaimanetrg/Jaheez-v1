import { Request, Response, NextFunction } from 'express';
import { CustomerAuthService } from './customerAuth.service';
import { BadRequestError } from '../../middleware/error.middleware';

export class CustomerAuthController {
  private service = new CustomerAuthService();
  customerRegister = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json(await this.service.customerRegister(req.body)); } catch (error) { next(error); } };
  customerLogin = async (req: Request, res: Response, next: NextFunction) => { try { res.status(200).json(await this.service.customerLogin(req.body)); } catch (error) { next(error); } };
  verifyCustomerRegistration = async (req: Request, res: Response, next: NextFunction) => { try { res.status(200).json(await this.service.verifyCustomerRegistration(req.body)); } catch (error) { next(error); } };
  resendCustomerRegistration = async (req: Request, res: Response, next: NextFunction) => { try { res.status(202).json(await this.service.resendCustomerRegistration(req.body)); } catch (error) { next(error); } };
  requestCustomerRecovery = async (req: Request, res: Response, next: NextFunction) => { try { res.status(202).json(await this.service.requestCustomerRecovery(req.body)); } catch (error) { next(error); } };
  verifyCustomerRecovery = async (req: Request, res: Response, next: NextFunction) => { try { res.status(200).json(await this.service.verifyCustomerRecovery(req.body)); } catch (error) { next(error); } };
  customerBootstrap = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) throw new BadRequestError('Authenticated customer required');
      res.status(200).json(await this.service.bootstrapCustomer(req.supabaseUser, req.body || {}));
    } catch (error) { next(error); }
  };
}

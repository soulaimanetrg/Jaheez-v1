import { Request, Response, NextFunction } from 'express';
import { CheckoutService } from './checkout.service';
import { BadRequestError } from '../../middleware/error.middleware';

export class CheckoutController {
  private checkoutService = new CheckoutService();

  private publicOrigin(req: Request): string {
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').toString().split(',')[0].trim();
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().split(',')[0].trim();
    return `${proto}://${host}`;
  }

  previewLine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.supabaseUser?.id;
      if (!userId) throw new BadRequestError('Utilisateur non identifie', 'customer_required');
      const result = await this.checkoutService.previewLine(userId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Post Checkout Preview endpoint (customer)
   */
  previewCheckout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.supabaseUser?.id;
      if (!userId) {
        throw new BadRequestError('Utilisateur non identifie');
      }

      const result = await this.checkoutService.previewCheckout(userId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Post Checkout Order endpoint (customer)
   */
  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.supabaseUser?.id;
      if (!userId) {
        throw new BadRequestError('Utilisateur non identifié');
      }

      const idempotencyKey = req.headers['idempotency-key']
        ? String(req.headers['idempotency-key']).trim()
        : null;

      if (!idempotencyKey) {
        throw new BadRequestError('Idempotency-Key header is required', 'idempotency_key_required');
      }
      if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/.test(idempotencyKey)) {
        throw new BadRequestError('Idempotency-Key header is invalid', 'idempotency_key_invalid');
      }

      const result = await this.checkoutService.processCheckout(userId, req.body, idempotencyKey);
      const statusCode = result.idempotent ? 200 : 201;
      return res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Post Cancel Order endpoint (customer)
   */
  cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      const userId = req.supabaseUser?.id;
      if (!userId) {
        throw new BadRequestError('Utilisateur non identifié');
      }

      const { reason } = req.body;

      const result = await this.checkoutService.cancelOrder(orderId, userId, reason);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Post Admin/Operator Complete Order endpoint
   */
  completeOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      const adminEmail = req.admin?.email || 'unknown_admin';

      const result = await this.checkoutService.completeOrder(orderId, adminEmail);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createOnlinePaymentSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.supabaseUser?.id;
      if (!userId) {
        throw new BadRequestError('Utilisateur non identifiأ©');
      }

      const idempotencyKey = req.headers['idempotency-key']
        ? String(req.headers['idempotency-key']).trim()
        : null;

      const result = await this.checkoutService.createOnlinePaymentSession(
        userId,
        req.body,
        this.publicOrigin(req),
        idempotencyKey
      );
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  verifyOnlinePaymentSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.supabaseUser?.id;
      if (!userId) {
        throw new BadRequestError('Utilisateur non identifiأ©');
      }

      const result = await this.checkoutService.verifyOnlinePaymentSession(userId, req.params.sessionId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Post Driver Accept/Claim Order endpoint
   */
  acceptOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }

      const result = await this.checkoutService.acceptOrder(orderId, driverId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

}

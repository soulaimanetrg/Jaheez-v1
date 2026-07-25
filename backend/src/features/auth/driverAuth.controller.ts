import { Request, Response, NextFunction } from 'express';
import { DriverAuthService } from './driverAuth.service';
import { driverLoginSchema, driverOtpResendSchema, driverOtpVerifySchema } from './driverAuth.validators';

export class DriverAuthController {
  private service = new DriverAuthService();

  /**
   * Post Driver Login endpoint
   */
  driverLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && typeof req.body === 'object' && 'otp_proof' in req.body) {
        return res.status(410).json({
          error: 'Legacy driver OTP login is disabled. Use CIN and password provided by JAHEEZ administration.',
          error_code: 'legacy_driver_otp_login_disabled',
        });
      }
      const validated = driverLoginSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({
          error: validated.error.errors[0]?.message || "Validation error"
        });
      }

      const result = await this.service.driverLogin(req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  verifyDriverOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = driverOtpVerifySchema.safeParse(req.body);
      if (!validated.success) return res.status(400).json({ error: validated.error.errors[0]?.message || 'Validation error' });
      return res.status(200).json(await this.service.verifyDriverOtp(validated.data));
    } catch (error) { next(error); }
  };

  resendDriverOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = driverOtpResendSchema.safeParse(req.body);
      if (!validated.success) return res.status(400).json({ error: validated.error.errors[0]?.message || 'Validation error' });
      return res.status(200).json(await this.service.resendDriverOtp(validated.data));
    } catch (error) { next(error); }
  };
}

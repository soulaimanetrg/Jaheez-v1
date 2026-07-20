import { Request, Response, NextFunction } from 'express';
import { moneyDto } from '../../utils/money';
import { ReliabilityService } from '../reliability/reliability.service';
import { DriverService } from './driver.service';
import { BadRequestError } from '../../middleware/error.middleware';

export class DriverController {
  private reliabilityService = new ReliabilityService();
  private driverService = new DriverService();

  private shiftDto(shift: any) {
    if (!shift) return shift;
    const { gross_delivery_fee_centimes, gross_tip_centimes, driver_delivery_earnings_centimes,
      driver_tip_earnings_centimes, total_earnings_centimes, payable_centimes, held_centimes,
      cod_collected_centimes, cod_due_at_close_centimes, ...safe } = shift;
    return { ...safe,
      gross_delivery_fee_dh: moneyDto(gross_delivery_fee_centimes), gross_tip_dh: moneyDto(gross_tip_centimes),
      driver_delivery_earnings_dh: moneyDto(driver_delivery_earnings_centimes), driver_tip_earnings_dh: moneyDto(driver_tip_earnings_centimes),
      total_earnings_dh: moneyDto(total_earnings_centimes), payable_dh: moneyDto(payable_centimes), held_dh: moneyDto(held_centimes),
      cod_collected_dh: moneyDto(cod_collected_centimes), cod_due_dh: moneyDto(cod_due_at_close_centimes),
    };
  }

  /**
   * Get Driver profile endpoint
   */
  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }

      const result = await this.driverService.getProfile(driverId);
      const { cod_balance_centimes, earnings_centimes, ...safe } = result;
      return res.status(200).json({ ...safe, cod_due_dh: moneyDto(cod_balance_centimes), legacy_earnings_dh: moneyDto(earnings_centimes) });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Patch Driver profile & location updates endpoint
   */
  updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }

      const result = await this.driverService.updateProfile(driverId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Patch Driver GPS heartbeat location endpoint
   */
  updateLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }

      const result = await this.driverService.updateLocation(driverId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  startShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }

      const result = await this.driverService.startShift(driverId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  endShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }

      const result = await this.driverService.endShift(driverId);
      return res.status(200).json({ ...result, shift_summary: this.shiftDto(result.shift_summary) });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Driver Orders list endpoint
   */
  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }

      const scope = (req.query.scope as 'available' | 'mine' | 'history') || 'mine';
      const result = await this.driverService.getOrders(driverId, scope);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getOrderNavigation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifie');
      }

      const destination = req.query.destination === 'pickup' ? 'pickup' : 'dropoff';
      const result = await this.driverService.getOrderNavigation(orderId, driverId, destination);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Post Driver claim order endpoint
   */
  claimOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }

      const result = await this.driverService.claimOrder(orderId, driverId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Post Driver decline order endpoint
   */
  declineOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }

      const { reason, note } = req.body;
      const result = await this.driverService.declineOrder(orderId, driverId, reason, note);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Post Driver stage transition endpoint
   */
  updateStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }

      const { stage, code } = req.body;
      const result = await this.driverService.updateStage(orderId, driverId, stage, code);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }
      const { currentPassword, newPassword } = req.body;
      const result = await this.driverService.changePassword(driverId, currentPassword, newPassword);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Post Driver cancel order endpoint
   */
  cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }
      const { reason } = req.body;
      const result = await this.driverService.cancelOrder(orderId, driverId, reason);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };



  /**
   * Fetch driver payouts
   */
  getPayouts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }
      const result = await this.driverService.getPayouts(driverId);
      return res.status(200).json((result || []).map((shift: any) => this.shiftDto(shift)));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Request driver payout (Commission-model: disabled)
   */
  requestPayout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }
      const result = await this.driverService.requestPayout(driverId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getReliabilityEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.driver?.driver_id;
      if (!driverId) throw new BadRequestError('Livreur non identifie');
      return res.json(await this.reliabilityService.listDriverEvents(driverId));
    } catch (error) { next(error); }
  };

  getDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.driver?.driver_id;
      if (!driverId) throw new BadRequestError('Livreur non identifie');
      return res.status(200).json(await this.driverService.getDocuments(driverId));
    } catch (error) {
      next(error);
    }
  };

  uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driverId = req.driver?.driver_id;
      if (!driverId) throw new BadRequestError('Livreur non identifie');
      const { doc_type, url } = req.body;
      return res.status(201).json(await this.driverService.uploadDocument(driverId, doc_type, url));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Driver reports problem with active order
   */
  reportIssue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      const driverId = req.driver?.driver_id;
      if (!driverId) {
        throw new BadRequestError('Livreur non identifié');
      }
      const { reason, note } = req.body;
      const result = await this.driverService.reportIssue(orderId, driverId, reason, note);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

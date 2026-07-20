import { Request, Response, NextFunction } from 'express';
import { CommissionService } from './commission.service';

export class CommissionController {
  private service = new CommissionService();
  listRates = async (_req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.listRates()); } catch (e) { next(e); } };
  createRate = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json(await this.service.createRate(req.body, req.admin?.id || null)); } catch (e) { next(e); } };
  listOverrides = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.listOverrides(req.query.driver_id as string | undefined)); } catch (e) { next(e); } };
  createOverride = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json(await this.service.createOverride(req.body, req.admin?.id || null)); } catch (e) { next(e); } };
  resolveRate = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.resolveRate(req.params.driverId, req.query.at as string | undefined)); } catch (e) { next(e); } };
}

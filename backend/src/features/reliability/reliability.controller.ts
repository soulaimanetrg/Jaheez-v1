import { Request, Response, NextFunction } from 'express';
import { ReliabilityService } from './reliability.service';
export class ReliabilityController {
  private service = new ReliabilityService();
  list = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.listAssessments(req.query.status as string | undefined)); } catch (e) { next(e); } };
  overturn = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.overturn(req.params.id, req.body.reason, req.body.evidence, req.admin!.id)); } catch (e) { next(e); } };
}

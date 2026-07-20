import { BadRequestError } from '../../middleware/error.middleware';
import { RiskRepository } from './risk.repository';
export class RiskService {
  private repo = new RiskRepository();
  run() { return this.repo.scan(); }
  async listIssues() { const { data, error } = await this.repo.listIssues(); if (error) throw new Error(error.message); return data; }
  async listFraud() { const { data, error } = await this.repo.listFraud(); if (error) throw new Error(error.message); return data; }
  async resolveFraud(id: string, adminId: string, status: string, note: string) {
    if (!['reviewing','confirmed','dismissed','resolved'].includes(status) || note.trim().length < 10)
      throw new BadRequestError('Statut ou justification invalide');
    const { data, error } = await this.repo.resolveFraud(id, adminId, status, note.trim());
    if (error) throw new Error(error.message); return data;
  }
}

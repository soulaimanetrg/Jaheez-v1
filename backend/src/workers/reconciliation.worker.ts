import { logger } from '../config/logger';
import { RiskService } from '../features/risk/risk.service';
export function startReconciliationWorker() {
  const service = new RiskService(); let running = false;
  const run = async () => { if (running) return; running = true;
    try { logger.info('[reconciliation] completed', await service.run()); }
    catch (error) { logger.error('[reconciliation] failed', error); } finally { running = false; } };
  void run(); return setInterval(run, 5 * 60 * 1000);
}

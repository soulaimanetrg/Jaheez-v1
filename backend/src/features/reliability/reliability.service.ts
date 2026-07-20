import { DelayService } from '../delay/delay.service';
import type { DelayAssessmentInput } from '../delay/delay.types';
import { ReliabilityRepository } from './reliability.repository';
import { ConflictError, NotFoundError } from '../../middleware/error.middleware';

export class ReliabilityService {
  private delay = new DelayService();
  private repo = new ReliabilityRepository();

  async assessAndApply(params: {
    orderId: string; driverId?: string | null; storeId?: string | null;
    assessment: DelayAssessmentInput; version?: number; requestId: string;
  }) {
    const decision = this.delay.assess(params.assessment);
    const assessment = await this.repo.createAssessment({
      order_id: params.orderId,
      driver_id: params.driverId || null,
      store_id: params.storeId || null,
      segment: decision.segment,
      assessment_version: params.version || 1,
      responsible_party: decision.responsibleParty,
      late_minutes: decision.lateMinutes,
      points_delta: decision.pointsDelta,
      evidence: {
        evidence_complete: decision.evidenceComplete,
        confidence: decision.confidence,
        reasons: decision.evidenceReasons,
      },
    });

    if (decision.pointsDelta < 0 && (decision.responsibleParty === 'driver' || decision.responsibleParty === 'store')) {
      const subjectId = decision.responsibleParty === 'driver' ? params.driverId : params.storeId;
      if (subjectId) {
        await this.repo.applyPoints({
          p_subject_type: decision.responsibleParty,
          p_subject_id: subjectId,
          p_order_id: params.orderId,
          p_assessment_id: assessment.id,
          p_event_type: 'delay_penalty',
          p_points_delta: decision.pointsDelta,
          p_reason: `${decision.segment}:${decision.lateMinutes}m`,
          p_actor_type: 'system', p_actor_id: null,
          p_request_id: `delay:${params.requestId}`,
          p_metadata: { financial_effect: false },
        });
      }
    }
    if (decision.evidenceComplete && decision.lateMinutes < 5) {
      if (decision.segment === 'driver_to_customer' && params.driverId) {
        await this.repo.recordOnTime('driver', params.driverId, params.orderId, `on-time:driver:${params.orderId}`);
      }
      if (decision.segment === 'store_preparation' && params.storeId) {
        await this.repo.recordOnTime('store', params.storeId, params.orderId, `on-time:store:${params.orderId}`);
      }
    }
    return { assessment, decision };
  }

  listDriverEvents(driverId: string) { return this.repo.listDriverEvents(driverId); }
  listAssessments(status?: string) { return this.repo.listAssessments(status); }

  async overturn(id: string, reason: string, evidence: string, actorId: string) {
    const current = await this.repo.findAssessment(id);
    if (!current) throw new NotFoundError('Evaluation de retard introuvable');
    if (current.status !== 'active') throw new ConflictError('Evaluation deja corrigee');
    const updated = await this.repo.overturnAssessment(id);
    if (!updated) throw new ConflictError('Evaluation modifiee simultanement');
    if (Number(current.points_delta || 0) < 0 && ['driver', 'store'].includes(current.responsible_party)) {
      const subjectId = current.responsible_party === 'driver' ? current.driver_id : current.store_id;
      await this.repo.applyPoints({ p_subject_type: current.responsible_party, p_subject_id: subjectId,
        p_order_id: current.order_id, p_assessment_id: current.id, p_event_type: 'correction',
        p_points_delta: Math.abs(Number(current.points_delta)), p_reason: reason, p_actor_type: 'admin',
        p_actor_id: actorId, p_request_id: `correction:${current.id}`, p_metadata: { evidence } });
    }
    return updated;
  }
}

import type { DelayAssessmentInput, DelayDecision, DelayParty } from './delay.types';
import { DelayRepository } from './delay.repository';

export const DELAY_GRACE_MINUTES = 5;
export const MAX_DRIVER_FAULT_GPS_ACCURACY_METERS = 100;
export const MAX_DRIVER_FAULT_GPS_AGE_MINUTES = 5;

export function delayPoints(lateMinutes: number): number {
  if (lateMinutes < 5) return 0;
  if (lateMinutes < 15) return -2;
  if (lateMinutes < 30) return -5;
  return -10;
}

function minutesBetween(expected: string, actual: string, excluded = 0): number {
  const expectedMs = Date.parse(expected);
  const actualMs = Date.parse(actual);
  if (!Number.isFinite(expectedMs) || !Number.isFinite(actualMs)) return 0;
  return Math.max(0, Math.floor((actualMs - expectedMs) / 60_000) - Math.max(0, excluded));
}

function isFreshIso(value?: string | null, now = Date.now()): boolean {
  if (!value) return true;
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return false;
  return Math.abs(now - ts) <= MAX_DRIVER_FAULT_GPS_AGE_MINUTES * 60_000;
}

function evaluateGpsEvidence(input: DelayAssessmentInput) {
  const reasons: string[] = [];
  const accuracyValid = input.gpsAccuracyMeters != null &&
    input.gpsAccuracyMeters >= 0 &&
    input.gpsAccuracyMeters <= MAX_DRIVER_FAULT_GPS_ACCURACY_METERS;
  if (!accuracyValid) reasons.push('gps_accuracy_invalid_or_missing');
  if (input.gpsIsMocked === true) reasons.push('gps_mocked');
  if (!isFreshIso(input.gpsCapturedAt)) reasons.push('gps_stale_or_invalid_timestamp');
  if (input.gpsContinuityValid === false) reasons.push('gps_continuity_failed');
  return { valid: reasons.length === 0, reasons };
}

export class DelayService {
  private repo = new DelayRepository();

  recordTimeline(row: Record<string, unknown>) { return this.repo.recordTimeline(row); }
  getEvidence(orderId: string) { return this.repo.getEvidence(orderId); }
  ensureBaselines(orderId: string) { return this.repo.ensureBaselines(orderId); }
  setDeliveryBaseline(orderId: string, minutes: number) { return this.repo.setDeliveryBaseline(orderId, minutes); }
  assess(input: DelayAssessmentInput): DelayDecision {
    let party: DelayParty = 'unknown';
    let lateMinutes = 0;
    let complete = false;
    let confidence: DelayDecision['confidence'] = 'low';
    const evidenceReasons: string[] = [];

    if (input.segment === 'store_preparation') {
      // A server-owned ready event is mandatory before assigning store fault.
      if (input.expectedAt && input.storeReadyAt && input.driverArrivedAt) {
        lateMinutes = minutesBetween(input.expectedAt, input.storeReadyAt, input.excludedMinutes);
        party = lateMinutes >= DELAY_GRACE_MINUTES ? 'store' : 'unknown';
        complete = true;
        confidence = 'high';
      } else {
        evidenceReasons.push('missing_store_ready_evidence');
      }
    } else if (input.segment === 'driver_after_ready') {
      if (input.storeReadyAt && input.actualAt && input.driverArrivedAt) {
        const baseline = new Date(Math.max(Date.parse(input.storeReadyAt), Date.parse(input.driverArrivedAt))).toISOString();
        lateMinutes = minutesBetween(baseline, input.actualAt, input.excludedMinutes);
        party = lateMinutes >= DELAY_GRACE_MINUTES ? 'driver' : 'unknown';
        complete = true;
        confidence = 'high';
      } else {
        evidenceReasons.push('missing_store_ready_or_arrival_evidence');
      }
    } else if (input.segment === 'driver_to_pickup' || input.segment === 'driver_to_customer') {
      const gps = evaluateGpsEvidence(input);
      evidenceReasons.push(...gps.reasons);
      if (input.expectedAt && input.actualAt && gps.valid) {
        lateMinutes = minutesBetween(input.expectedAt, input.actualAt, input.excludedMinutes);
        party = lateMinutes >= DELAY_GRACE_MINUTES ? 'driver' : 'unknown';
        complete = true;
        confidence = 'high';
      } else if (!input.expectedAt || !input.actualAt) {
        evidenceReasons.push('missing_eta_or_stage_timestamp');
      }
    } else if (input.segment === 'customer_handoff') {
      party = 'customer'; complete = true;
      if (input.expectedAt && input.actualAt) lateMinutes = minutesBetween(input.expectedAt, input.actualAt, input.excludedMinutes);
      confidence = 'medium';
    } else if (input.segment === 'dispatch_platform') {
      party = 'platform'; complete = true;
      if (input.expectedAt && input.actualAt) lateMinutes = minutesBetween(input.expectedAt, input.actualAt, input.excludedMinutes);
      confidence = 'medium';
    }

    const penalizable = party === 'driver' || party === 'store';
    return {
      segment: input.segment,
      responsibleParty: party,
      lateMinutes,
      pointsDelta: penalizable ? delayPoints(lateMinutes) : 0,
      evidenceComplete: complete,
      confidence,
      evidenceReasons,
    };
  }
}

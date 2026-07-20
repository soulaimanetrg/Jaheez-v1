export type FraudSignal = {
  type:
    | 'collusion'
    | 'identity_overlap'
    | 'tip_abuse'
    | 'gps_spoofing'
    | 'account_sharing'
    | 'duplicate_reference'
    | 'forged_store_ready'
    | 'promo_abuse'
    | 'review_abuse'
    | 'confirmation_code_abuse'
    | 'stage_manipulation'
    | 'cod_refund_abuse';
  score: number;
  evidence: Record<string, unknown>;
};
export type FraudEvidence = {
  repeatedCombinationCount?: number; driverIdentity?: string|null; customerIdentity?: string|null;
  driverDevice?: string|null; customerDevice?: string|null; driverPayoutAccount?: string|null; customerPayoutAccount?: string|null;
  tipDh?: number; deliveryFeeDh?: number; gpsDistanceKm?: number; gpsElapsedSeconds?: number; gpsAccuracyMeters?: number;
  gpsMocked?: boolean; gpsStaleSeconds?: number; gpsContinuityValid?: boolean;
  concurrentSessionCount?: number; duplicateReferenceCount?: number; readyBeforeConfirmed?: boolean;
  readyAfterPickup?: boolean; readyToPickupSeconds?: number; historicalPreparationMedianSeconds?: number;
  failedPromoAttempts?: number; repeatedPromoAccounts?: number; duplicateReviewCount?: number;
  deliveryCodeAttempts?: number; impossibleStageTransition?: boolean; codDiscrepancyDh?: number;
  refundsAfterPaymentCount?: number; repeatedLateCancellations?: number;
};

export function evaluateFraudSignals(e: FraudEvidence): FraudSignal[] {
  const out: FraudSignal[] = [];
  if ((e.repeatedCombinationCount || 0) >= 3) out.push({ type:'collusion', score:70,
    evidence:{ repeated_combination_count:e.repeatedCombinationCount } });
  const identity = !!e.driverIdentity && e.driverIdentity === e.customerIdentity;
  const device = !!e.driverDevice && e.driverDevice === e.customerDevice;
  const payout = !!e.driverPayoutAccount && e.driverPayoutAccount === e.customerPayoutAccount;
  if (identity || payout) out.push({ type:'identity_overlap', score:95, evidence:{ identity_overlap:identity, payout_overlap:payout } });
  if (device) out.push({ type:'account_sharing', score:85, evidence:{ device_overlap:true } });
  if ((e.concurrentSessionCount || 0) > 1) out.push({ type:'account_sharing', score:80,
    evidence:{ concurrent_sessions:e.concurrentSessionCount } });
  if ((e.tipDh || 0) >= 50 && (e.tipDh || 0) > Math.max(0, e.deliveryFeeDh || 0) * 3)
    out.push({ type:'tip_abuse', score:70, evidence:{ tip_dh:e.tipDh, delivery_fee_dh:e.deliveryFeeDh } });
  if (e.gpsDistanceKm != null && e.gpsElapsedSeconds && (e.gpsAccuracyMeters ?? 999) <= 100) {
    const speed=(e.gpsDistanceKm/(e.gpsElapsedSeconds/3600));
    if (speed > 180) out.push({ type:'gps_spoofing', score:90, evidence:{ speed_kmh:Math.round(speed), accuracy_m:e.gpsAccuracyMeters } });
  }
  if (e.gpsMocked || (e.gpsStaleSeconds || 0) > 300 || e.gpsContinuityValid === false) out.push({ type:'gps_spoofing', score:75,
    evidence:{ mocked:!!e.gpsMocked, stale_seconds:e.gpsStaleSeconds || 0, continuity_valid:e.gpsContinuityValid !== false } });
  if ((e.duplicateReferenceCount || 0) > 1) out.push({ type:'duplicate_reference', score:100,
    evidence:{ count:e.duplicateReferenceCount } });
  const implausiblyFast = e.readyToPickupSeconds != null && e.historicalPreparationMedianSeconds != null &&
    e.readyToPickupSeconds < 30 && e.historicalPreparationMedianSeconds >= 600;
  if (e.readyBeforeConfirmed || e.readyAfterPickup || implausiblyFast) out.push({ type:'forged_store_ready', score:85,
    evidence:{ ready_before_confirmed:!!e.readyBeforeConfirmed, ready_after_pickup:!!e.readyAfterPickup, implausibly_fast_pickup:implausiblyFast } });
  if ((e.failedPromoAttempts || 0) >= 8 || (e.repeatedPromoAccounts || 0) >= 4) out.push({ type:'promo_abuse', score:65,
    evidence:{ failed_promo_attempts:e.failedPromoAttempts || 0, repeated_promo_accounts:e.repeatedPromoAccounts || 0 } });
  if ((e.duplicateReviewCount || 0) > 0) out.push({ type:'review_abuse', score:75,
    evidence:{ duplicate_review_count:e.duplicateReviewCount } });
  if ((e.deliveryCodeAttempts || 0) >= 5) out.push({ type:'confirmation_code_abuse', score:80,
    evidence:{ delivery_code_attempts:e.deliveryCodeAttempts } });
  if (e.impossibleStageTransition) out.push({ type:'stage_manipulation', score:90,
    evidence:{ impossible_stage_transition:true } });
  if ((e.codDiscrepancyDh || 0) >= 50 || (e.refundsAfterPaymentCount || 0) >= 2 || (e.repeatedLateCancellations || 0) >= 3)
    out.push({ type:'cod_refund_abuse', score:75, evidence:{
      cod_discrepancy_dh:e.codDiscrepancyDh || 0,
      refunds_after_payment_count:e.refundsAfterPaymentCount || 0,
      repeated_late_cancellations:e.repeatedLateCancellations || 0
    } });
  return out;
}

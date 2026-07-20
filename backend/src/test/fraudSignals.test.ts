import { describe,expect,it } from 'vitest';
import { evaluateFraudSignals } from '../features/risk/fraudSignals';
describe('deterministic fraud fixtures',()=>{
  it('detects repeated collusive combinations',()=>expect(evaluateFraudSignals({repeatedCombinationCount:3}).some(x=>x.type==='collusion')).toBe(true));
  it('detects identity and payout overlap',()=>expect(evaluateFraudSignals({driverIdentity:'cin',customerIdentity:'cin',driverPayoutAccount:'rib',customerPayoutAccount:'rib'}).some(x=>x.type==='identity_overlap')).toBe(true));
  it('detects device overlap and concurrent sessions',()=>expect(evaluateFraudSignals({driverDevice:'d',customerDevice:'d',concurrentSessionCount:2}).filter(x=>x.type==='account_sharing')).toHaveLength(2));
  it('detects abnormal tips',()=>expect(evaluateFraudSignals({tipDh:100,deliveryFeeDh:20}).some(x=>x.type==='tip_abuse')).toBe(true));
  it('detects impossible accurate GPS movement but ignores inaccurate GPS',()=>{
    expect(evaluateFraudSignals({gpsDistanceKm:20,gpsElapsedSeconds:60,gpsAccuracyMeters:10}).some(x=>x.type==='gps_spoofing')).toBe(true);
    expect(evaluateFraudSignals({gpsDistanceKm:20,gpsElapsedSeconds:60,gpsAccuracyMeters:250}).some(x=>x.type==='gps_spoofing')).toBe(false);
  });
  it('detects mocked, stale, or broken-continuity GPS as fraud signals',()=>{
    expect(evaluateFraudSignals({gpsMocked:true}).some(x=>x.type==='gps_spoofing')).toBe(true);
    expect(evaluateFraudSignals({gpsStaleSeconds:301}).some(x=>x.type==='gps_spoofing')).toBe(true);
    expect(evaluateFraudSignals({gpsContinuityValid:false}).some(x=>x.type==='gps_spoofing')).toBe(true);
  });
  it('detects replayed financial references',()=>expect(evaluateFraudSignals({duplicateReferenceCount:2})[0].score).toBe(100));
  it('detects forged readiness patterns',()=>{
    expect(evaluateFraudSignals({readyBeforeConfirmed:true,readyToPickupSeconds:10,historicalPreparationMedianSeconds:900}).some(x=>x.type==='forged_store_ready')).toBe(true);
    expect(evaluateFraudSignals({readyAfterPickup:true}).some(x=>x.type==='forged_store_ready')).toBe(true);
  });
  it('detects promo, review and confirmation-code abuse',()=>{
    const signals=evaluateFraudSignals({failedPromoAttempts:8,duplicateReviewCount:1,deliveryCodeAttempts:5});
    expect(signals.some(x=>x.type==='promo_abuse')).toBe(true);
    expect(signals.some(x=>x.type==='review_abuse')).toBe(true);
    expect(signals.some(x=>x.type==='confirmation_code_abuse')).toBe(true);
  });
  it('detects driver stage manipulation and COD/refund abuse',()=>{
    const signals=evaluateFraudSignals({impossibleStageTransition:true,codDiscrepancyDh:60,refundsAfterPaymentCount:2});
    expect(signals.some(x=>x.type==='stage_manipulation')).toBe(true);
    expect(signals.some(x=>x.type==='cod_refund_abuse')).toBe(true);
  });
  it('does not classify ordinary delay as fraud',()=>expect(evaluateFraudSignals({gpsDistanceKm:2,gpsElapsedSeconds:900,gpsAccuracyMeters:20})).toEqual([]));
});

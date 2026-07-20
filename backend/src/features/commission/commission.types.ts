export interface CommissionSettings {
  driverDeliveryCommissionPercent: number;
  driverTipCommissionPercent: number;
  driverMinDeliveryEarningCentimes: number;
  driverCommissionHoldUntilShiftEnd: boolean;
  driverCodPayoutRequiresSettlement: boolean;
  driverHighTipReviewThresholdCentimes: number;
}

export interface ResolvedCommissionRate {
  deliveryPercent: number;
  tipPercent: number;
  source: 'global' | 'driver_override';
  rateVersionId: string | null;
  overrideId: string | null;
}

export interface DeliveredOrderForCommission {
  id: string;
  driver_id: string | null;
  payment_method: string;
  delivery_fee: number;
  rider_tip: number;
  total_amount: number;
}

export interface ShiftSummary {
  shift_id: string;
  driver_id: string;
  orders_count: number;
  gross_delivery_fee_centimes: number;
  gross_tip_centimes: number;
  driver_delivery_earnings_centimes: number;
  driver_tip_earnings_centimes: number;
  total_earnings_centimes: number;
  payable_centimes: number;
  held_centimes: number;
  cod_collected_centimes: number;
  cod_due_at_close_centimes: number;
  payout_status: 'not_ready' | 'pending_review' | 'held' | 'approved' | 'paid' | 'rejected' | 'reversed';
  hold_reason: string | null;
}

export type DelaySegment =
  | 'driver_to_pickup'
  | 'store_preparation'
  | 'driver_after_ready'
  | 'driver_to_customer'
  | 'customer_handoff'
  | 'dispatch_platform'
  | 'unknown';

export type DelayParty = 'driver' | 'store' | 'customer' | 'platform' | 'unknown';

export interface DelayAssessmentInput {
  segment: DelaySegment;
  expectedAt?: string | null;
  actualAt?: string | null;
  storeReadyAt?: string | null;
  driverArrivedAt?: string | null;
  gpsAccuracyMeters?: number | null;
  gpsCapturedAt?: string | null;
  gpsIsMocked?: boolean | null;
  gpsContinuityValid?: boolean | null;
  excludedMinutes?: number;
}

export interface DelayDecision {
  segment: DelaySegment;
  responsibleParty: DelayParty;
  lateMinutes: number;
  pointsDelta: number;
  evidenceComplete: boolean;
  confidence: 'high' | 'medium' | 'low';
  evidenceReasons: string[];
}

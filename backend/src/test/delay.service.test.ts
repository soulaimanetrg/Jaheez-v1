import { describe, expect, it } from 'vitest';
import { DelayService, delayPoints } from '../features/delay/delay.service';

describe('DelayService evidence attribution', () => {
  const service = new DelayService();
  const at = (minutes: number) => new Date(Date.UTC(2026, 0, 1, 10, minutes)).toISOString();

  it.each([[4,0],[5,-2],[14,-2],[15,-5],[29,-5],[30,-10]])('applies tier at %i minutes', (minutes, points) => {
    expect(delayPoints(minutes)).toBe(points);
  });

  it('attributes verified late preparation to store only', () => {
    expect(service.assess({ segment:'store_preparation', expectedAt:at(0), storeReadyAt:at(20), driverArrivedAt:at(2) }))
      .toMatchObject({ responsibleParty:'store', lateMinutes:20, pointsDelta:-5 });
  });

  it('does not punish anyone without store ready evidence', () => {
    expect(service.assess({ segment:'store_preparation', expectedAt:at(0), driverArrivedAt:at(2) }))
      .toMatchObject({ responsibleParty:'unknown', pointsDelta:0, evidenceComplete:false });
  });

  it('attributes waiting after both arrival and ready to driver', () => {
    expect(service.assess({ segment:'driver_after_ready', storeReadyAt:at(2), driverArrivedAt:at(0), actualAt:at(17) }))
      .toMatchObject({ responsibleParty:'driver', lateMinutes:15, pointsDelta:-5 });
  });

  it('requires accurate GPS before assigning travel delay to driver', () => {
    expect(service.assess({ segment:'driver_to_customer', expectedAt:at(0), actualAt:at(30), gpsAccuracyMeters:250 }))
      .toMatchObject({ responsibleParty:'unknown', pointsDelta:0 });
  });

  it('does not punish driver with mocked, stale, or broken-continuity GPS', () => {
    expect(service.assess({ segment:'driver_to_pickup', expectedAt:at(0), actualAt:at(30), gpsAccuracyMeters:10, gpsIsMocked:true }))
      .toMatchObject({ responsibleParty:'unknown', pointsDelta:0, evidenceReasons: expect.arrayContaining(['gps_mocked']) });
    expect(service.assess({ segment:'driver_to_pickup', expectedAt:at(0), actualAt:at(30), gpsAccuracyMeters:10, gpsCapturedAt:'2026-01-01T00:00:00.000Z' }))
      .toMatchObject({ responsibleParty:'unknown', pointsDelta:0, evidenceReasons: expect.arrayContaining(['gps_stale_or_invalid_timestamp']) });
    expect(service.assess({ segment:'driver_to_customer', expectedAt:at(0), actualAt:at(30), gpsAccuracyMeters:10, gpsContinuityValid:false }))
      .toMatchObject({ responsibleParty:'unknown', pointsDelta:0, evidenceReasons: expect.arrayContaining(['gps_continuity_failed']) });
  });

  it('never punishes customer or platform delay', () => {
    expect(service.assess({ segment:'customer_handoff', expectedAt:at(0), actualAt:at(30) }).pointsDelta).toBe(0);
    expect(service.assess({ segment:'dispatch_platform', expectedAt:at(0), actualAt:at(30) }).pointsDelta).toBe(0);
  });
});

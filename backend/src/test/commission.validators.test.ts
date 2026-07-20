import { describe, expect, it } from 'vitest';
import { commissionRateSchema, driverCommissionOverrideSchema } from '../features/commission/commission.validators';

describe('commission admin validation', () => {
  it('accepts safe global rates', () => expect(commissionRateSchema.safeParse({ delivery_percent:70, tip_percent:100, reason:'Initial rate' }).success).toBe(true));
  it('rejects rates outside zero to one hundred', () => expect(commissionRateSchema.safeParse({ delivery_percent:101, tip_percent:10, reason:'Invalid rate' }).success).toBe(false));
  it('rejects an invalid driver id', () => expect(driverCommissionOverrideSchema.safeParse({ driver_id:'bad', delivery_percent:70, tip_percent:100, reason:'Driver override' }).success).toBe(false));
  it('rejects reversed effective intervals', () => expect(commissionRateSchema.safeParse({ delivery_percent:70, tip_percent:100, reason:'Bad dates', effective_from:'2026-06-20T10:00:00.000Z', effective_to:'2026-06-19T10:00:00.000Z' }).success).toBe(false));
});

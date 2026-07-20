import { describe, expect, it } from 'vitest';

const { BASELINE_FUNCTIONS, BASELINE_TABLES, REQUIRED_MIGRATIONS, validateSelection } = require('../../scripts/migration-manifest');

describe('required migration manifest', () => {
  it('includes the full post-baseline chain without the former 033-037 gap', () => {
    expect(REQUIRED_MIGRATIONS).toEqual(expect.arrayContaining([
      '042_legacy_baseline_contract_repair.sql',
      '043_admin_role_contract_repair.sql',
      '044_cod_settlement_idempotency_race.sql',
      '045_refund_contract_repair.sql',
      '046_wallet_ref_id_idempotency_index.sql',
      '047_driver_state_contract_repair.sql',
      '048_ledger_reversal_idempotency_index.sql',
      '033_delay_antifraud_evidence.sql',
      '034_user_address_coordinates.sql',
      '035_service_subcategories.sql',
      '036_store_reduction_percentage.sql',
      '037_customer_analytics_events.sql',
      '038_custom_errand_orders.sql',
      '039_guided_errands.sql',
      '040_migration_chain_security_hardening.sql',
      '041_legacy_errand_pricing_setting_cleanup.sql',
    ]));
  });

  it('rejects unknown, duplicate, and non-contiguous operator selections', () => {
    expect(() => validateSelection(['not-a-migration.sql'])).toThrow();
    expect(() => validateSelection(['039_guided_errands.sql', '039_guided_errands.sql'])).toThrow();
    expect(() => validateSelection(['038_custom_errand_orders.sql', '040_migration_chain_security_hardening.sql'])).toThrow();
  });

  it('allows a contiguous recovery segment only', () => {
    expect(validateSelection(['039_guided_errands.sql', '040_migration_chain_security_hardening.sql']))
      .toEqual(['039_guided_errands.sql', '040_migration_chain_security_hardening.sql']);
  });

  it('declares the schema baseline required before any migration writes', () => {
    expect(BASELINE_TABLES).toEqual(expect.arrayContaining(['orders', 'users', 'drivers', 'app_settings']));
    expect(BASELINE_FUNCTIONS).toEqual(expect.arrayContaining(['create_order_atomic', 'update_order_lifecycle']));
  });
});

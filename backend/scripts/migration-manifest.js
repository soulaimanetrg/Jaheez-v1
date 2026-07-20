'use strict';

// This is the ordered, checksum-tracked rollout chain for databases restored
// from the established Jaheez baseline. Earlier one-off baseline migrations
// are verified by migration 040 rather than replayed on an existing database.
const REQUIRED_MIGRATIONS = Object.freeze([
  // This late-numbered file is an append-only repair for older database
  // baselines, so it must execute before the historical 024–041 chain.
  '042_legacy_baseline_contract_repair.sql',
  '024_driver_dispatch_reliability.sql',
  '025_order_confirmation_codes.sql',
  '026_audit_refunds_indexes.sql',
  '027_driver_commission_ledger.sql',
  '028_commission_delay_dh_security.sql',
  '029_production_completion.sql',
  '030_staging_rollout_controls.sql',
  '031_product_promotions.sql',
  '032_security_connectivity_fraud_closure.sql',
  '033_delay_antifraud_evidence.sql',
  '034_user_address_coordinates.sql',
  '035_service_subcategories.sql',
  '036_store_reduction_percentage.sql',
  '037_customer_analytics_events.sql',
  '038_custom_errand_orders.sql',
  '039_guided_errands.sql',
  '040_migration_chain_security_hardening.sql',
  '041_legacy_errand_pricing_setting_cleanup.sql',
  '043_admin_role_contract_repair.sql',
  '044_cod_settlement_idempotency_race.sql',
  '045_refund_contract_repair.sql',
  '046_wallet_ref_id_idempotency_index.sql',
  '047_driver_state_contract_repair.sql',
  '048_ledger_reversal_idempotency_index.sql',
  '051_strict_customer_auth_onboarding.sql',
  '052_temporary_wasender_auth_hook.sql',
  '053_phone_password_customer_auth.sql',
  '054_customer_otp_demo_mode.sql',
  '055_atomic_promo_and_claim_offer.sql',
  '056_zone_neighbors_and_service_fee.sql',
]);

const BASELINE_TABLES = Object.freeze([
  'orders', 'users', 'drivers', 'stores', 'menu_items', 'user_addresses',
  'favorites', 'favorite_products', 'wallets', 'wallet_transactions',
  'cities', 'service_categories', 'delivery_zones', 'banners', 'app_settings',
  'promotions', 'idempotency_keys', 'order_status_history',
]);

const BASELINE_FUNCTIONS = Object.freeze([
  'create_order_atomic',
  'update_order_lifecycle',
]);

function validateSelection(selected) {
  if (!selected.length) return REQUIRED_MIGRATIONS;
  const indexes = selected.map((name) => REQUIRED_MIGRATIONS.indexOf(name));
  if (indexes.some((index) => index < 0) || new Set(selected).size !== selected.length) {
    throw new Error('Only unique migrations from the approved manifest may be selected.');
  }
  for (let index = 1; index < indexes.length; index += 1) {
    if (indexes[index] !== indexes[index - 1] + 1) {
      throw new Error('Selected migrations must be a contiguous ordered segment of the approved manifest.');
    }
  }
  return selected;
}

module.exports = { REQUIRED_MIGRATIONS, BASELINE_TABLES, BASELINE_FUNCTIONS, validateSelection };

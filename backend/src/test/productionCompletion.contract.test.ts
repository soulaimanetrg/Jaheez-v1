import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(resolve(__dirname, '../../../supabase_migrations/029_production_completion.sql'), 'utf8');
const rolloutSql = readFileSync(resolve(__dirname, '../../../supabase_migrations/030_staging_rollout_controls.sql'), 'utf8');
const closureSql = readFileSync(resolve(__dirname, '../../../supabase_migrations/032_security_connectivity_fraud_closure.sql'), 'utf8');

describe('migration 029 production security contract', () => {
  it('defines atomic money operations and locks their execution to service role', () => {
    expect(sql).toContain('FUNCTION public.settle_driver_cod_atomic');
    expect(sql).toContain('FUNCTION public.transition_refund_atomic');
    expect(sql).toContain('FOR UPDATE');
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.settle_driver_cod_atomic');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.settle_driver_cod_atomic');
  });
  it('prevents rate overlap and duplicate financial references', () => {
    expect(sql).toContain('commission_rate_versions_no_overlap');
    expect(sql).toContain('driver_commission_overrides_no_overlap');
    expect(sql).toContain('idx_cod_settlements_external_reference');
    expect(sql).toContain('idx_refunds_payment_reference');
    expect(sql).toContain('idx_ledger_single_reversal');
  });
  it('keeps risk tables service-only and provides an atomic shift hold', () => {
    expect(sql).toContain('REVOKE ALL ON public.store_partner_credentials,public.reconciliation_issues,public.fraud_cases FROM anon,authenticated');
    expect(sql).toContain('FUNCTION public.hold_shift_for_risk');
  });
});

describe('migration 030 rollout corrections', () => {
  it('fails payout rollout closed and supports an internal driver allowlist', () => {
    expect(rolloutSql).toContain("('commission_payouts_enabled','false')");
    expect(rolloutSql).toContain('commission_internal_driver_allowlist');
    expect(rolloutSql).toContain('commission_payout_allowed');
  });
  it('makes payout and refund transitions independently idempotent', () => {
    expect(rolloutSql).toContain('transition_driver_payout_idempotent');
    expect(rolloutSql).toContain('transition_request_id');
    expect(rolloutSql).toContain('idempotency key reused');
  });
});

describe('migration 032 security/fraud closure', () => {
  it('adds service-only audit and risk evidence tables', () => {
    expect(closureSql).toContain('CREATE TABLE IF NOT EXISTS public.upload_audit_events');
    expect(closureSql).toContain('CREATE TABLE IF NOT EXISTS public.risk_evidence_events');
    expect(closureSql).toContain('CREATE TABLE IF NOT EXISTS public.device_session_fingerprints');
    expect(closureSql).toContain('CREATE TABLE IF NOT EXISTS public.realtime_audit_events');
    expect(closureSql).toContain('REVOKE ALL ON public.upload_audit_events');
  });

  it('prevents duplicate store reviews per order and expands report-only fraud types', () => {
    expect(closureSql).toContain('idx_store_reviews_one_per_order');
    expect(closureSql).toContain('promo_abuse');
    expect(closureSql).toContain('confirmation_code_abuse');
    expect(closureSql).toContain('cod_refund_abuse');
  });
});

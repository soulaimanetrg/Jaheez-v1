#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { REQUIRED_MIGRATIONS } = require('../backend/scripts/migration-manifest');

const root = path.resolve(__dirname, '..');
const migrationsDir = path.join(root, 'supabase_migrations');

const requiredMigrations = REQUIRED_MIGRATIONS;

const finalSql = requiredMigrations
  .map((file) => {
    const full = path.join(migrationsDir, file);
    if (!fs.existsSync(full)) return null;
    return { file, text: fs.readFileSync(full, 'utf8') };
  });

const violations = [];

for (let i = 0; i < requiredMigrations.length; i += 1) {
  if (!finalSql[i]) violations.push(`missing migration: ${requiredMigrations[i]}`);
}

function checkForbidden(file, text, checks) {
  for (const { name, pattern, allow } of checks) {
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (allow?.some((rx) => rx.test(line))) return;
      if (pattern.test(line)) violations.push(`${file}:${index + 1}: ${name}: ${line.trim()}`);
    });
  }
}

for (const entry of finalSql.filter(Boolean)) {
  checkForbidden(entry.file, entry.text, [
    {
      name: 'destructive table/column drop is not allowed in production commission migrations',
      pattern: /\bDROP\s+(?:TABLE|COLUMN)\b/i,
    },
    {
      name: 'stored money must not use PostgreSQL floating/money types',
      pattern: /\b(?:DOUBLE\s+PRECISION|REAL|MONEY)\b/i,
    },
    {
      name: 'database schema must keep DH as API/UI boundary only',
      pattern: /\b[a-z0-9_]+_dh\b/i,
      allow: [/errand_base_fee_dh/i],
    },
  ]);
}

const combined = finalSql.filter(Boolean).map((e) => `-- ${e.file}\n${e.text}`).join('\n\n');

function requirePattern(name, pattern) {
  if (!pattern.test(combined)) violations.push(`missing invariant: ${name}`);
}

function requireRevokeForTable(table) {
  const statements = combined.split(';');
  const found = statements.some((statement) => {
    const compact = statement.replace(/\s+/g, ' ');
    return /REVOKE ALL ON/i.test(compact)
      && new RegExp(`public\\.${table}\\b`, 'i').test(compact)
      && /FROM anon\s*,\s*authenticated/i.test(compact);
  });
  if (!found) violations.push(`missing invariant: ${table} denies anon/authenticated direct access`);
}

function requireInFile(file, name, pattern) {
  const entry = finalSql.find((item) => item?.file === file);
  if (!entry || !pattern.test(entry.text)) violations.push(`${file}: missing invariant: ${name}`);
}

[
  'commission_rate_versions',
  'driver_commission_overrides',
  'driver_earnings_ledger',
  'order_timeline_events',
  'order_delay_assessments',
  'reliability_point_events',
  'store_partner_credentials',
  'reconciliation_issues',
  'fraud_cases',
  'payout_transition_requests',
  'upload_audit_events',
  'risk_evidence_events',
  'device_session_fingerprints',
  'realtime_audit_events',
].forEach((table) => {
  requirePattern(`${table} has RLS or existed before protected operations`, new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i'));
  if (table !== 'driver_earnings_ledger') requireRevokeForTable(table);
});

[
  'mark_order_store_ready',
  'apply_reliability_points',
  'record_on_time_reliability',
  'close_driver_shift_financial',
  'finalize_delivered_order_financial',
  'transition_driver_payout',
  'settle_driver_cod_atomic',
  'transition_refund_atomic',
  'commission_payout_allowed',
  'transition_driver_payout_idempotent',
  'submit_guided_errand',
  'adjust_guided_errand_quote',
].forEach((fn) => {
  requirePattern(`${fn} is SECURITY DEFINER`, new RegExp(`FUNCTION\\s+public\\.${fn}[\\s\\S]*?SECURITY\\s+DEFINER`, 'i'));
  requirePattern(`${fn} revoked from public clients`, new RegExp(`REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+public\\.${fn}[\\s\\S]*?FROM\\s+PUBLIC\\s*,\\s*anon\\s*,\\s*authenticated`, 'i'));
  requirePattern(`${fn} executable only by service_role`, new RegExp(`GRANT\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+public\\.${fn}[\\s\\S]*?TO\\s+service_role`, 'i'));
});

requireInFile(
  '029_production_completion.sql',
  'global commission rates prevent overlapping effective windows',
  /commission_rate_versions_no_overlap[\s\S]*?EXCLUDE\s+USING\s+gist/i
);
requireInFile(
  '029_production_completion.sql',
  'driver commission overrides prevent overlapping effective windows per driver',
  /driver_commission_overrides_no_overlap[\s\S]*?driver_id\s+WITH\s+=/i
);
requireInFile(
  '029_production_completion.sql',
  'COD settlements are idempotent',
  /idx_cod_settlements_request_id[\s\S]*?UNIQUE/i
);
requireInFile(
  '030_staging_rollout_controls.sql',
  'payout transitions are idempotent',
  /payout_transition_requests[\s\S]*?request_id\s+TEXT\s+PRIMARY\s+KEY/i
);
requireInFile(
  '030_staging_rollout_controls.sql',
  'commission payouts fail closed by default',
  /'commission_payouts_enabled'\s*,\s*'false'/i
);
requirePattern(
  'refund completion credits wallet only when transaction insert wins',
  /WITH\s+inserted\s+AS\s*\([\s\S]*?ON\s+CONFLICT\(ref_id\)\s+DO\s+NOTHING\s+RETURNING\s+1[\s\S]*?EXISTS\(SELECT\s+1\s+FROM\s+inserted\)/i
);
requirePattern(
  'delay never affects commission calculation',
  /financial_effect_of_delay'\s*,\s*false/i
);
requirePattern(
  'store-ready event is server timestamped',
  /mark_order_store_ready[\s\S]*?store_ready_at\s*=\s*NOW\(\)/i
);
requirePattern(
  'store-ready request id is unique',
  /idx_orders_store_ready_request[\s\S]*?UNIQUE/i
);
requireInFile(
  '040_migration_chain_security_hardening.sql',
  'legacy order RPCs revoke default direct-client execution',
  /REVOKE\s+ALL\s+ON\s+FUNCTION[\s\S]*?FROM\s+PUBLIC\s*,\s*anon\s*,\s*authenticated/i
);
requireInFile(
  '040_migration_chain_security_hardening.sql',
  'legacy order RPCs pin search_path',
  /ALTER\s+FUNCTION[\s\S]*?SET\s+search_path\s+TO\s+public\s*,\s*pg_temp/i
);
requireInFile(
  '040_migration_chain_security_hardening.sql',
  'direct promotion usage writes are removed',
  /DROP\s+POLICY\s+IF\s+EXISTS\s+"user_promo_usages_insert"/i
);
requireInFile(
  '041_legacy_errand_pricing_setting_cleanup.sql',
  'legacy DH-named errand setting is removed',
  /DELETE\s+FROM\s+public\.app_settings\s+WHERE\s+key\s*=\s*'errand_base_fee_dh'/i
);

for (const helper of [
  path.join(root, 'backend', 'scripts', 'apply-store-reduction-migration.js'),
  path.join(root, 'backend', 'scripts', 'apply-product-promotions-migration.js'),
]) {
  const helperText = fs.readFileSync(helper, 'utf8');
  if (!/Deprecated unsafe migration helper/.test(helperText)) {
    violations.push(`${path.relative(root, helper)}: legacy direct database migration helper must remain disabled`);
  }
  if (/PRODUCTION_DATABASE_URL|SUPABASE_DB_URL|DATABASE_URL/.test(helperText)) {
    violations.push(`${path.relative(root, helper)}: legacy direct database migration helper must not select a database URL`);
  }
}

if (violations.length > 0) {
  console.error('Migration safety lint failed.');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Migration safety lint passed.');

'use strict';

require('dotenv').config({ path: '.env.staging.local' });
require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');
const { REQUIRED_MIGRATIONS } = require('./migration-manifest');

const PROTECTED_TABLES = [
  'app_settings', 'promotions', 'user_promo_usages', 'order_status_history',
  'user_addresses', 'favorites', 'favorite_products', 'wallets',
  'wallet_transactions', 'customer_analytics_events', 'errand_drafts',
  'errand_quotes', 'errand_details', 'errand_events', 'errand_proofs',
  'errand_quote_adjustments', 'driver_earnings_ledger', 'driver_shift_records',
  'reliability_point_events', 'store_partner_credentials', 'reconciliation_issues',
  'fraud_cases', 'payout_transition_requests',
];

function guard() {
  const wrongTarget = process.env.JAHEEZ_TARGET_ENV!=='staging';
  const missingConfirmation = process.env.STAGING_CONFIRM_ISOLATED!=='true';
  if (wrongTarget || missingConfirmation || !process.env.STAGING_DATABASE_URL) {
    throw new Error('Isolated staging variables are required.');
  }
  if (process.env.DATABASE_URL === process.env.STAGING_DATABASE_URL) {
    throw new Error('Refusing production database.');
  }
}

function client() {
  return new Client({ connectionString: process.env.STAGING_DATABASE_URL, ssl: { rejectUnauthorized: false } });
}

async function migrations(connection) {
  const result = await connection.query('select migration_name, checksum from jaheez_manual_migrations where migration_name = any($1)', [REQUIRED_MIGRATIONS]);
  const tracked = new Map(result.rows.map((row) => [row.migration_name, row.checksum]));
  for (const name of REQUIRED_MIGRATIONS) {
    const sql = fs.readFileSync(path.resolve(__dirname, '../../supabase_migrations', name), 'utf8');
    const checksum = crypto.createHash('sha256').update(sql).digest('hex');
    if (tracked.get(name) !== checksum) throw new Error(`Migration checksum missing/mismatch: ${name}`);
  }
}

async function rlsAndRpcSecurity(connection) {
  const state = await connection.query('select relname, relrowsecurity from pg_class where relname = any($1)', [PROTECTED_TABLES]);
  for (const table of PROTECTED_TABLES) {
    if (!state.rows.find((row) => row.relname === table && row.relrowsecurity)) throw new Error(`RLS not enabled: ${table}`);
  }

  const policyResult = await connection.query(
    "select tablename, policyname, roles from pg_policies where schemaname = 'public' and tablename = any($1)",
    [PROTECTED_TABLES]
  );
  for (const policy of policyResult.rows) {
    const roles = Array.isArray(policy.roles)
      ? policy.roles
      : String(policy.roles || '').replace(/^\{|\}$/g, '').split(',').filter(Boolean);
    if (roles.some((role) => ['public', 'anon', 'authenticated'].includes(String(role)))) {
      throw new Error(`Direct-client policy remains on protected table ${policy.tablename}: ${policy.policyname}`);
    }
  }

  const functionResult = await connection.query(`
    select p.oid, p.proname, coalesce(array_to_string(p.proconfig, ','), '') as config,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
      has_function_privilege('service_role', p.oid, 'EXECUTE') as service_execute
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and p.proowner = (select oid from pg_roles where rolname=current_user)
      and not exists (
        select 1 from pg_depend d
        where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e'
      )
  `);
  for (const name of ['create_order_atomic', 'update_order_lifecycle']) {
    const rows = functionResult.rows.filter((row) => row.proname === name);
    if (!rows.length) throw new Error(`Required backend RPC missing: ${name}`);
  }
  for (const row of functionResult.rows) {
    if (row.anon_execute || row.authenticated_execute || !row.service_execute) throw new Error(`Unsafe SECURITY DEFINER RPC grants: ${row.proname}`);
    if (!/search_path=public,\s*pg_temp/.test(row.config)) throw new Error(`Unsafe SECURITY DEFINER RPC search path: ${row.proname}`);
  }
}

async function rlsMutationProbe(connection) {
  for (const role of ['anon', 'authenticated']) {
    await connection.query('begin');
    try {
      await connection.query(`set local role ${role}`);
      let denied = false;
      try {
        await connection.query("insert into fraud_cases(case_key,case_type,risk_score) values('rls-probe','financial_mismatch',1)");
      } catch {
        denied = true;
      }
      if (!denied) throw new Error(`${role} could mutate fraud_cases`);
    } finally {
      await connection.query('rollback');
    }
  }
}

async function codConcurrency(adminId, driverId) {
  const first = client();
  const second = client();
  const control = client();
  await Promise.all([first.connect(), second.connect(), control.connect()]);
  const requestId = `staging-cod-${crypto.randomUUID()}`;
  let original = null;
  try {
    const before = await control.query('select cod_balance_centimes from drivers where id=$1', [driverId]);
    if (!before.rowCount) throw new Error('Dedicated staging driver fixture is missing.');
    original = before.rows[0].cod_balance_centimes;
    await control.query('update drivers set cod_balance_centimes=2 where id=$1', [driverId]);
    const sql = "select (settle_driver_cod_atomic($1,1,'wallet','concurrency test',$2,$3,null)).id id";
    const [left, right] = await Promise.all([first.query(sql, [driverId, adminId, requestId]), second.query(sql, [driverId, adminId, requestId])]);
    if (left.rows[0].id !== right.rows[0].id) throw new Error('COD idempotency returned different settlements.');
    const after = await control.query('select cod_balance_centimes from drivers where id=$1', [driverId]);
    if (Number(after.rows[0].cod_balance_centimes) !== 1) throw new Error('Concurrent COD settlement changed debt more than once.');
  } finally {
    if (original !== null) {
      await control.query('begin');
      try {
        await control.query('delete from cod_settlements where request_id=$1', [requestId]);
        await control.query('update drivers set cod_balance_centimes=0 where id=$1', [driverId]);
        await control.query('commit');
      } catch (error) {
        await control.query('rollback');
        throw error;
      }
    }
    await Promise.all([first.end(), second.end(), control.end()]);
  }
}

async function main() {
  guard();
  const admin = process.env.STAGING_TEST_ADMIN_ID;
  const driver = process.env.STAGING_TEST_DRIVER_ID;
  if (!admin || !driver) throw new Error('STAGING_TEST_ADMIN_ID and STAGING_TEST_DRIVER_ID are required dedicated fixtures.');
  const connection = client();
  await connection.connect();
  try {
    await migrations(connection);
    await rlsAndRpcSecurity(connection);
    await rlsMutationProbe(connection);
  } finally {
    await connection.end();
  }
  await codConcurrency(admin, driver);
  console.log(JSON.stringify({ ok: true, migrations: REQUIRED_MIGRATIONS.length, rls: true, rpc_security: true, cod_concurrency: true }));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

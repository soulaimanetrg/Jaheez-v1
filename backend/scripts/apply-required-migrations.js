require('dotenv').config({ path: '.env.staging.local' });
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '../.env' });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');
const { REQUIRED_MIGRATIONS, BASELINE_TABLES, BASELINE_FUNCTIONS, validateSelection } = require('./migration-manifest');

const selected = process.argv.slice(2);
const migrations = validateSelection(selected);
const migrationsDir = path.resolve(__dirname, '../../supabase_migrations');

function getDatabaseUrl() {
  if (process.env.JAHEEZ_TARGET_ENV !== 'staging') throw new Error('Refusing migration: JAHEEZ_TARGET_ENV must equal staging.');
  if (process.env.STAGING_CONFIRM_ISOLATED !== 'true') throw new Error('Refusing migration: STAGING_CONFIRM_ISOLATED=true is required.');
  const databaseUrl = process.env.STAGING_DATABASE_URL;
  if (!databaseUrl) return null;
  if (process.env.DATABASE_URL && databaseUrl === process.env.DATABASE_URL) throw new Error('Staging and production database URLs must differ.');
  return databaseUrl;
}

function checksum(sql) {
  return crypto.createHash('sha256').update(sql).digest('hex');
}

async function ensureTrackingTable(client) {
  await client.query(`
    create table if not exists public.jaheez_manual_migrations (
      migration_name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `);
}

async function applyMigration(client, migrationName) {
  const filePath = path.join(migrationsDir, migrationName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration not found: ${filePath}`);
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  const hash = checksum(sql);
  const existing = await client.query(
    'select checksum from public.jaheez_manual_migrations where migration_name = $1',
    [migrationName]
  );

  if (existing.rowCount > 0) {
    if (existing.rows[0].checksum !== hash) {
      throw new Error(`Checksum mismatch for ${migrationName}. Refusing to re-apply changed migration.`);
    }
    console.log(`skip ${migrationName} (already applied)`);
    return;
  }

  console.log(`apply ${migrationName}`);
  await client.query('begin');
  try {
    await client.query(sql);
    await client.query(
      'insert into public.jaheez_manual_migrations (migration_name, checksum) values ($1, $2)',
      [migrationName, hash]
    );
    await client.query('commit');
    console.log(`done ${migrationName}`);
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}

async function assertSelectedDependencies(client, migrationList) {
  if (migrationList.length === REQUIRED_MIGRATIONS.length) return;
  const firstIndex = REQUIRED_MIGRATIONS.indexOf(migrationList[0]);
  if (firstIndex <= 0) return;
  const prerequisites = REQUIRED_MIGRATIONS.slice(0, firstIndex);
  const { rows } = await client.query(
    'select migration_name from public.jaheez_manual_migrations where migration_name = any($1::text[])',
    [prerequisites]
  );
  const applied = new Set(rows.map((row) => row.migration_name));
  const missing = prerequisites.filter((name) => !applied.has(name));
  if (missing.length) {
    throw new Error(`Refusing partial migration apply; prerequisite migrations are untracked: ${missing.join(', ')}`);
  }
}

async function assertBaseline(client) {
  const tableResult = await client.query('select unnest($1::text[]) as table_name', [BASELINE_TABLES]);
  const missingTables = [];
  for (const row of tableResult.rows) {
    const { rows } = await client.query('select to_regclass($1) as relation_name', [`public.${row.table_name}`]);
    if (!rows[0]?.relation_name) missingTables.push(row.table_name);
  }
  const functionResult = await client.query(
    "select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname = any($1::text[])",
    [BASELINE_FUNCTIONS]
  );
  const presentFunctions = new Set(functionResult.rows.map((row) => row.proname));
  const missingFunctions = BASELINE_FUNCTIONS.filter((name) => !presentFunctions.has(name));
  if (missingTables.length || missingFunctions.length) {
    throw new Error(`Refusing migration: staging database is not restored from the Jaheez baseline (missing tables: ${missingTables.join(', ') || 'none'}; missing functions: ${missingFunctions.join(', ') || 'none'}).`);
  }
}

async function main() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error('STAGING_DATABASE_URL is missing. Production DATABASE_URL is never accepted by this runner.');
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query("select pg_advisory_lock(hashtext('jaheez-required-migrations'))");
    await assertBaseline(client);
    await ensureTrackingTable(client);
    await assertSelectedDependencies(client, migrations);
    for (const migration of migrations) {
      await applyMigration(client, migration);
    }
  } finally {
    await client.query("select pg_advisory_unlock(hashtext('jaheez-required-migrations'))").catch(() => undefined);
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Migration apply failed: ${error.message}`);
  process.exit(1);
});

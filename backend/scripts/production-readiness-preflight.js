'use strict';

require('dotenv').config({ path: '.env.staging.local' });
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '../.env' });

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { resolveTool } = require('./tool-resolver');
const { REQUIRED_MIGRATIONS } = require('./migration-manifest');

const root = path.resolve(__dirname, '..', '..');
const backendRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(root, 'supabase_migrations');


const REQUIRED_ENV = [
  'JAHEEZ_TARGET_ENV',
  'STAGING_CONFIRM_ISOLATED',
  'OUTBOUND_INTEGRATIONS_DISABLED',
  'ONLINE_PAYMENTS_ENABLED',
  'PAYMENT_PROVIDER',
  'PRODUCTION_DATABASE_URL',
  'STAGING_DATABASE_URL',
  'STAGING_SUPABASE_URL',
  'STAGING_SERVICE_ROLE_KEY',
  'STAGING_ANON_KEY',
  'BACKUP_ENCRYPTION_KEY',
  'REPORT_SIGNING_KEY',
  'ADMIN_JWT_SECRET',
  'STAGING_API_BASE',
  'STAGING_TEST_ADMIN_ID',
  'STAGING_TEST_DRIVER_ID',
  'STAGING_TEST_DRIVER_CIN',
  'STAGING_TEST_ORDER_ID',
  'STAGING_PREPAY_REFUND_ORDER_ID',
  'STAGING_STORE_API_KEY',
  'STAGING_OTHER_STORE_ORDER_ID',
  'STAGING_CUSTOMER_ACCESS_TOKEN',
];

const PLACEHOLDER_ENV_RULES = [
  { key: 'PRODUCTION_DATABASE_URL', pattern: /production-host|user:password/i },
  { key: 'STAGING_DATABASE_URL', pattern: /staging-host|user:password/i },
  { key: 'STAGING_SUPABASE_URL', pattern: /your-staging-project|example/i },
  { key: 'STAGING_SERVICE_ROLE_KEY', pattern: /your-|replace|service-role-key/i },
  { key: 'STAGING_ANON_KEY', pattern: /your-|replace|anon-key/i },
  { key: 'BACKUP_ENCRYPTION_KEY', pattern: /replace-with|random-characters/i },
  { key: 'REPORT_SIGNING_KEY', pattern: /replace-with|random-characters/i },
  { key: 'ADMIN_JWT_SECRET', pattern: /change-this|change_me|replace|generate_with/i },
  { key: 'STAGING_API_BASE', pattern: /example\.com|localhost|127\.0\.0\.1/i },
  { key: 'STAGING_TEST_ADMIN_ID', pattern: /^0{8}-0{4}-0{4}-0{4}-0{12}$/ },
  { key: 'STAGING_TEST_DRIVER_ID', pattern: /^0{8}-0{4}-0{4}-0{4}-0{12}$/ },
  { key: 'STAGING_TEST_DRIVER_CIN', pattern: /TEST-CIN-ONLY|replace/i },
  { key: 'STAGING_TEST_ORDER_ID', pattern: /^0{8}-0{4}-0{4}-0{4}-0{12}$/ },
  { key: 'STAGING_PREPAY_REFUND_ORDER_ID', pattern: /^0{8}-0{4}-0{4}-0{4}-0{12}$/ },
  { key: 'STAGING_STORE_API_KEY', pattern: /replace|stg_store_key_replace_me/i },
  { key: 'STAGING_OTHER_STORE_ORDER_ID', pattern: /^0{8}-0{4}-0{4}-0{4}-0{12}$/ },
  { key: 'STAGING_CUSTOMER_ACCESS_TOKEN', pattern: /replace|staging-customer-jwt/i },
];

function hasValue(key) {
  return typeof process.env[key] === 'string' && process.env[key].trim().length > 0;
}

function parseUrl(key) {
  if (!hasValue(key)) return null;
  try {
    return new URL(process.env[key]);
  } catch {
    return null;
  }
}

function isLocalHost(hostname) {
  return ['localhost', '127.0.0.1', '::1'].includes(String(hostname || '').toLowerCase());
}

function isPostgresUrl(key) {
  const url = parseUrl(key);
  return Boolean(url && ['postgres:', 'postgresql:'].includes(url.protocol));
}

function isHttpsUrl(key) {
  const url = parseUrl(key);
  return Boolean(url && url.protocol === 'https:');
}

function toolVersion(name) {
  return resolveTool(name)?.version || null;
}

function adbStatus() {
  const adb = process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe')
    : 'adb';
  if (process.platform === 'win32' && !fs.existsSync(adb)) {
    return { available: false, devices: 0, unauthorized: 0, offline: 0, version: null };
  }
  const version = spawnSync(adb, ['version'], { encoding: 'utf8', windowsHide: true });
  if (version.status !== 0) return { available: false, devices: 0, unauthorized: 0, offline: 0, version: null };
  const result = spawnSync(adb, ['devices', '-l'], { encoding: 'utf8', windowsHide: true });
  const rows = (result.stdout || '').split(/\r?\n/).slice(1).map((line) => line.trim()).filter(Boolean);
  const devices = rows.filter((line) => /\sdevice\s/.test(line));
  const unauthorized = rows.filter((line) => /\sunauthorized\s?/.test(line));
  const offline = rows.filter((line) => /\soffline\s?/.test(line));
  return {
    available: true,
    devices: devices.length,
    unauthorized: unauthorized.length,
    offline: offline.length,
    version: (version.stdout || '').split(/\r?\n/)[0],
  };
}

function packageHasDependency(pkgPath, dep) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return Boolean((pkg.dependencies && pkg.dependencies[dep]) || (pkg.devDependencies && pkg.devDependencies[dep]));
}

function containsAny(file, needles) {
  if (!fs.existsSync(file)) return false;
  const text = fs.readFileSync(file, 'utf8');
  return needles.some((needle) => text.includes(needle));
}

function decodesTo32ByteBackupKey(raw) {
  if (!raw) return false;
  try {
    const value = raw.trim();
    const parsed = /^[0-9a-f]{64}$/i.test(value) ? Buffer.from(value, 'hex') : Buffer.from(value, 'base64');
    return parsed.length === 32;
  } catch {
    return false;
  }
}

function placeholderEnvKeys() {
  return PLACEHOLDER_ENV_RULES
    .filter(({ key, pattern }) => hasValue(key) && pattern.test(process.env[key].trim()))
    .map(({ key }) => key);
}

function evaluateReadiness() {
  const checks = [];
  function check(name, ok, details = {}) {
    checks.push({ name, ok: Boolean(ok), ...details });
  }

  const missingEnv = REQUIRED_ENV.filter((key) => !hasValue(key));
  check('required staging env present', missingEnv.length === 0, { missing: missingEnv });
  const placeholderKeys = placeholderEnvKeys();
  check('staging env values are not placeholders', placeholderKeys.length === 0, { placeholder_keys: placeholderKeys });
  check('target env is staging', process.env.JAHEEZ_TARGET_ENV === 'staging', { value: process.env.JAHEEZ_TARGET_ENV || null });
  check('staging isolation confirmed', process.env.STAGING_CONFIRM_ISOLATED === 'true');
  check('outbound integrations disabled', process.env.OUTBOUND_INTEGRATIONS_DISABLED === 'true');
  check('online payments fail-closed', process.env.ONLINE_PAYMENTS_ENABLED === 'false' && process.env.PAYMENT_PROVIDER === 'disabled', {
    online_payments_enabled: process.env.ONLINE_PAYMENTS_ENABLED || null,
    payment_provider: process.env.PAYMENT_PROVIDER || null,
  });
  check(
    'production and staging database URLs differ',
    hasValue('PRODUCTION_DATABASE_URL') &&
      hasValue('STAGING_DATABASE_URL') &&
      process.env.PRODUCTION_DATABASE_URL !== process.env.STAGING_DATABASE_URL
  );
  check('production database URL is PostgreSQL', !hasValue('PRODUCTION_DATABASE_URL') || isPostgresUrl('PRODUCTION_DATABASE_URL'));
  check('staging database URL is PostgreSQL', !hasValue('STAGING_DATABASE_URL') || isPostgresUrl('STAGING_DATABASE_URL'));
  check('production database URL is not localhost', !hasValue('PRODUCTION_DATABASE_URL') || !isLocalHost(parseUrl('PRODUCTION_DATABASE_URL')?.hostname));
  check('staging database URL is not localhost', !hasValue('STAGING_DATABASE_URL') || !isLocalHost(parseUrl('STAGING_DATABASE_URL')?.hostname));
  check('staging Supabase URL is HTTPS', !hasValue('STAGING_SUPABASE_URL') || isHttpsUrl('STAGING_SUPABASE_URL'));
  check(
    'staging service role and anon keys differ',
    !hasValue('STAGING_SERVICE_ROLE_KEY') ||
      !hasValue('STAGING_ANON_KEY') ||
      process.env.STAGING_SERVICE_ROLE_KEY !== process.env.STAGING_ANON_KEY
  );
  check('backup encryption key decodes to 32 bytes', !hasValue('BACKUP_ENCRYPTION_KEY') || decodesTo32ByteBackupKey(process.env.BACKUP_ENCRYPTION_KEY));
  check('report signing key strong enough', !hasValue('REPORT_SIGNING_KEY') || process.env.REPORT_SIGNING_KEY.length >= 32);
  check('staging JWT secret strong enough', !hasValue('ADMIN_JWT_SECRET') || process.env.ADMIN_JWT_SECRET.length >= 32);
  check(
    'Stripe live secrets absent while payments paused',
    !hasValue('STRIPE_SECRET_KEY') && !hasValue('STRIPE_WEBHOOK_SECRET') && !hasValue('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY')
  );

  const pgDump = toolVersion('pg_dump');
  const pgRestore = toolVersion('pg_restore');
  check('pg_dump available', Boolean(pgDump), { version: pgDump });
  check('pg_restore available', Boolean(pgRestore), { version: pgRestore });

  const adb = adbStatus();
  check('adb available', adb.available, { version: adb.version });
  check('two android devices authorized', adb.devices >= 2, {
    found: adb.devices,
    unauthorized: adb.unauthorized,
    offline: adb.offline,
  });

  const missingMigrations = REQUIRED_MIGRATIONS.filter((name) => !fs.existsSync(path.join(migrationsDir, name)));
  check('approved required migrations exist', missingMigrations.length === 0, { missing: missingMigrations });

  check('root package has no stripe dependency', !packageHasDependency(path.join(root, 'package.json'), 'stripe'));
  check('backend package has no stripe dependency', !packageHasDependency(path.join(backendRoot, 'package.json'), 'stripe'));
  check('customer stripe client removed', !fs.existsSync(path.join(root, 'frontend', 'user-app', 'lib', 'stripeClient.ts')));
  check('production env example does not request Stripe secrets', !containsAny(path.join(root, '.env.production.example'), ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']));
  check('root env example does not request Stripe secrets', !containsAny(path.join(root, '.env.example'), ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']));

  const passed = checks.filter((item) => item.ok).length;
  const failed = checks.length - passed;
  const generatedByInit = new Set([
    'JAHEEZ_TARGET_ENV',
    'STAGING_CONFIRM_ISOLATED',
    'OUTBOUND_INTEGRATIONS_DISABLED',
    'ONLINE_PAYMENTS_ENABLED',
    'PAYMENT_PROVIDER',
    'BACKUP_ENCRYPTION_KEY',
    'REPORT_SIGNING_KEY',
    'ADMIN_JWT_SECRET',
  ]);
  const missingExternalEnv = missingEnv.filter((key) => !generatedByInit.has(key));
  const nextActions = [];
  if (placeholderKeys.length > 0 || missingEnv.some((key) => generatedByInit.has(key))) {
    nextActions.push('Run npm run staging:init-env from the repository root to create or repair generated ignored staging values without printing secrets.');
  }
  if (missingExternalEnv.length > 0) {
    nextActions.push('Fill backend/.env.staging.local with production/staging Supabase credentials and staging fixture IDs/tokens.');
  }
  if (!hasValue('PRODUCTION_DATABASE_URL') || !hasValue('STAGING_DATABASE_URL') || process.env.PRODUCTION_DATABASE_URL === process.env.STAGING_DATABASE_URL) {
    nextActions.push('Verify PRODUCTION_DATABASE_URL and STAGING_DATABASE_URL are both set and point to different remote PostgreSQL databases.');
  }
  if (adb.devices < 2) {
    nextActions.push('Connect and authorize two Android devices for customer and driver real-device tests.');
  }
  if (failed > 0) {
    nextActions.push('Run npm run staging:full from the repository root after preflight passes.');
  }
  return {
    ok: failed === 0,
    passed,
    failed,
    checks,
    next_actions: nextActions,
  };
}

if (require.main === module) {
  const result = evaluateReadiness();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 2);
}

module.exports = { evaluateReadiness, REQUIRED_ENV, REQUIRED_MIGRATIONS, PLACEHOLDER_ENV_RULES };

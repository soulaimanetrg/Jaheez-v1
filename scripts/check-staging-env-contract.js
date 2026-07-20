#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backendScripts = path.join(root, 'backend', 'scripts');
const preflight = require(path.join(backendScripts, 'production-readiness-preflight.js'));

const stagingRuntimeScripts = [
  'apply-required-migrations.js',
  'device-readiness.js',
  'init-staging-env.js',
  'production-readiness-preflight.js',
  'reconcile-staging.js',
  'regression-finance-commission.js',
  'staging-access-pack.js',
  'staging-backup.js',
  'staging-full-validation.js',
  'staging-security-matrix.js',
  'validate-staging.js',
  'verify-staging-signoff.js',
];

const optionalOrSystemEnv = new Set([
  // Host/tooling environment.
  'CI',
  'LOCALAPPDATA',
  // Optional output locations.
  'JAHEEZ_BACKUP_DIR',
  'STAGING_BACKUP_DIR',
  'STAGING_SIGNOFF_DIR',
  'STAGING_RECONCILIATION_DIR',
  // Optional defensive comparisons / legacy checks.
  'DATABASE_URL',
  'SUPABASE_ANON_KEY',
  // Forbidden-payment checks; these must be absent, not required.
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
]);

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, error: message, ...details }, null, 2));
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail('Staging runtime script is missing.', { file: path.relative(root, file) });
  return fs.readFileSync(file, 'utf8');
}

function envKeysIn(text) {
  const keys = new Set();
  const dot = /process\.env\.([A-Z][A-Z0-9_]*)/g;
  const bracket = /process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g;
  for (const match of text.matchAll(dot)) keys.add(match[1]);
  for (const match of text.matchAll(bracket)) keys.add(match[1]);
  return [...keys].sort();
}

const required = new Set(preflight.REQUIRED_ENV);
const usage = [];

for (const script of stagingRuntimeScripts) {
  const file = path.join(backendScripts, script);
  for (const key of envKeysIn(read(file))) {
    usage.push({ script, key });
  }
}

const hardRequiredUsage = usage
  .filter(({ key }) => !optionalOrSystemEnv.has(key))
  .filter(({ key }) => !required.has(key));

const templatePath = path.join(root, 'backend', '.env.staging.local.example');
const template = read(templatePath);
const templateMissing = preflight.REQUIRED_ENV.filter((key) => !new RegExp(`^${key}=`, 'm').test(template));

const accessPackPath = path.join(backendScripts, 'staging-access-pack.js');
const accessPack = read(accessPackPath);
const accessPackMissingHelp = preflight.REQUIRED_ENV
  .filter((key) => ![
    'JAHEEZ_TARGET_ENV',
    'STAGING_CONFIRM_ISOLATED',
    'OUTBOUND_INTEGRATIONS_DISABLED',
    'ONLINE_PAYMENTS_ENABLED',
    'PAYMENT_PROVIDER',
    'BACKUP_ENCRYPTION_KEY',
    'REPORT_SIGNING_KEY',
  ].includes(key))
  .filter((key) => !accessPack.includes(`${key}:`));

if (hardRequiredUsage.length > 0 || templateMissing.length > 0 || accessPackMissingHelp.length > 0) {
  fail('Staging environment contract failed.', {
    env_used_without_preflight_requirement: hardRequiredUsage,
    template_missing_required_env: templateMissing,
    access_pack_missing_help: accessPackMissingHelp,
  });
}

console.log(JSON.stringify({
  ok: true,
  checked_scripts: stagingRuntimeScripts.length,
  required_env: preflight.REQUIRED_ENV.length,
}));

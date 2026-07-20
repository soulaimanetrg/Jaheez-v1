'use strict';

const path = require('path');
const { evaluateReadiness, REQUIRED_ENV, PLACEHOLDER_ENV_RULES } = require('./production-readiness-preflight');

const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');
const envFile = path.join(backendRoot, '.env.staging.local');

const SAFE_LOCAL_FIELDS = new Set([
  'JAHEEZ_TARGET_ENV',
  'STAGING_CONFIRM_ISOLATED',
  'OUTBOUND_INTEGRATIONS_DISABLED',
  'ONLINE_PAYMENTS_ENABLED',
  'PAYMENT_PROVIDER',
  'BACKUP_ENCRYPTION_KEY',
  'REPORT_SIGNING_KEY',
]);

const FIELD_HELP = {
  PRODUCTION_DATABASE_URL: {
    owner: 'Supabase production project owner',
    source: 'Supabase production project → Database → Connection string',
    purpose: 'Creates the encrypted production backup only.',
  },
  STAGING_DATABASE_URL: {
    owner: 'Supabase staging project owner',
    source: 'Isolated Supabase staging project → Database → Connection string',
    purpose: 'Restores the encrypted backup and runs migrations/tests.',
  },
  STAGING_SUPABASE_URL: {
    owner: 'Supabase staging project owner',
    source: 'Staging project → API → Project URL',
    purpose: 'Allows staging API/RLS/E2E checks to target staging only.',
  },
  STAGING_SERVICE_ROLE_KEY: {
    owner: 'Supabase staging project owner',
    source: 'Staging project → API → service_role key',
    purpose: 'Runs privileged staging validation. Never use production service role here.',
  },
  STAGING_ANON_KEY: {
    owner: 'Supabase staging project owner',
    source: 'Staging project → API → anon public key',
    purpose: 'Tests anonymous/customer/driver/partner RLS behavior.',
  },
  STAGING_API_BASE: {
    owner: 'Backend deploy operator',
    source: 'Public HTTPS URL of the staging backend deployment',
    purpose: 'Runs API security and finance E2E requests.',
  },
  ADMIN_JWT_SECRET: {
    owner: 'Backend deploy operator',
    source: 'The ADMIN_JWT_SECRET configured on the isolated staging backend',
    purpose: 'Signs short-lived staging admin/driver tokens for security and E2E tests. Must not be the production secret.',
  },
  STAGING_TEST_ADMIN_ID: {
    owner: 'Operations/admin test account owner',
    source: 'UUID of a dedicated staging operations/super-admin account',
    purpose: 'Validates admin-only actions and role separation.',
  },
  STAGING_TEST_DRIVER_ID: {
    owner: 'Driver test account owner',
    source: 'UUID of a dedicated staging driver account',
    purpose: 'Runs shift, commission, reliability, and COD scenarios.',
  },
  STAGING_TEST_DRIVER_CIN: {
    owner: 'Driver test account owner',
    source: 'CIN configured for the dedicated staging driver',
    purpose: 'Tests driver login-only authentication.',
  },
  STAGING_TEST_ORDER_ID: {
    owner: 'Staging fixture preparer',
    source: 'Order UUID in staging reserved for delivery/commission/refund E2E',
    purpose: 'Runs customer → store-ready → driver → delivery → payout scenario.',
  },
  STAGING_PREPAY_REFUND_ORDER_ID: {
    owner: 'Staging fixture preparer',
    source: 'Unpaid order UUID in staging reserved for pre-payment refund verification',
    purpose: 'Verifies refund holds unpaid commission without rewriting history.',
  },
  STAGING_STORE_API_KEY: {
    owner: 'Store-partner credential owner',
    source: 'Hashed/rotatable scoped API credential generated for one staging store',
    purpose: 'Tests store-ready signing and prevents cross-store forging.',
  },
  STAGING_OTHER_STORE_ORDER_ID: {
    owner: 'Staging fixture preparer',
    source: 'Order UUID belonging to a different staging store',
    purpose: 'Proves a store credential cannot mark another store’s order ready.',
  },
  STAGING_CUSTOMER_ACCESS_TOKEN: {
    owner: 'Customer test account owner',
    source: 'Fresh access token for a dedicated staging customer account',
    purpose: 'Runs customer API/RLS and E2E validation.',
  },
};

function hasValue(key) {
  return typeof process.env[key] === 'string' && process.env[key].trim().length > 0;
}

function isPlaceholder(key) {
  const value = process.env[key];
  const rule = PLACEHOLDER_ENV_RULES.find((item) => item.key === key);
  return Boolean(value && rule && rule.pattern.test(String(value).trim()));
}

function fieldStatus(key) {
  if (!hasValue(key)) return 'missing';
  if (isPlaceholder(key)) return 'placeholder';
  return 'present';
}

function requiredExternalFields() {
  return REQUIRED_ENV
    .filter((key) => !SAFE_LOCAL_FIELDS.has(key))
    .map((key) => ({
      key,
      status: fieldStatus(key),
      ...(FIELD_HELP[key] || {
        owner: 'Project operator',
        source: 'Project configuration',
        purpose: 'Required by staging validation.',
      }),
    }));
}

function readinessBlockers(readiness) {
  return readiness.checks
    .filter((check) => !check.ok)
    .map((check) => {
      const details = { ...check };
      delete details.name;
      delete details.ok;
      return { name: check.name, details };
    });
}

function markdown(report) {
  const pendingFields = report.external_fields.filter((field) => field.status !== 'present');
  const readyFields = report.external_fields.filter((field) => field.status === 'present').length;
  const rows = pendingFields.map((field) => (
    `| \`${field.key}\` | ${field.status} | ${field.owner} | ${field.source} | ${field.purpose} |`
  ));

  return [
    '# JAHEEZ staging access pack',
    '',
    'This report does not print secret values. It only says what is present or missing.',
    '',
    `- Repository: \`${report.repo_root}\``,
    `- Private env file: \`${report.env_file}\``,
    `- Online payments: ${report.online_payments_expected}`,
    `- Production deployment authorized: ${report.production_deployment_authorized}`,
    `- External fields ready: ${readyFields}/${report.external_fields.length}`,
    `- Staging preflight: ${report.preflight_ok ? 'ready' : 'not ready'}`,
    '',
    '## What you still need to provide locally',
    '',
    pendingFields.length === 0
      ? 'All external staging fields are present. Run `npm run staging:preflight` next.'
      : [
          '| Field | Status | Who provides it | Where it comes from | Why it is needed |',
          '| --- | --- | --- | --- | --- |',
          ...rows,
        ].join('\n'),
    '',
    '## Device requirement',
    '',
    `- Authorized Android devices found: ${report.android_devices.found}`,
    `- Unauthorized devices: ${report.android_devices.unauthorized}`,
    `- Offline devices: ${report.android_devices.offline}`,
    '- Required: 2 distinct authorized Android devices, one customer device and one driver device.',
    '',
    '## Safe command order',
    '',
    '```powershell',
    'cd C:\\Users\\user\\Desktop\\jaheeez\\Jaheez-v1',
    'npm run staging:init-env',
    'notepad backend\\.env.staging.local',
    'npm run staging:preflight',
    'npm run staging:full',
    '```',
    '',
    '## Safety rules',
    '',
    '- Do not paste database URLs, service role keys, or access tokens into chat.',
    '- Put secrets only inside `backend\\.env.staging.local` on this machine or a secure secret manager.',
    '- Keep `ONLINE_PAYMENTS_ENABLED=false` and `PAYMENT_PROVIDER=disabled` until a Moroccan-compatible provider passes staging.',
    '- Production deployment remains outside this validation run.',
    '',
    '## Current blocking checks',
    '',
    report.blocking_checks.length === 0
      ? 'None.'
      : report.blocking_checks.map((item) => `- ${item.name}`).join('\n'),
    '',
  ].join('\n');
}

function main() {
  const readiness = evaluateReadiness();
  const androidCheck = readiness.checks.find((check) => check.name === 'two android devices authorized') || {};
  const report = {
    ok: readiness.ok,
    repo_root: repoRoot,
    env_file: envFile,
    production_deployment_authorized: false,
    online_payments_expected: 'disabled',
    preflight_ok: readiness.ok,
    external_fields: requiredExternalFields(),
    android_devices: {
      found: androidCheck.found || 0,
      unauthorized: androidCheck.unauthorized || 0,
      offline: androidCheck.offline || 0,
    },
    blocking_checks: readinessBlockers(readiness),
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(markdown(report));
}

main();

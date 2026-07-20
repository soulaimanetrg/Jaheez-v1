'use strict';

const fs = require('fs');
const path = require('path');
const { PLACEHOLDER_ENV_RULES, REQUIRED_ENV } = require('./production-readiness-preflight');

const backendRoot = path.resolve(__dirname, '..');
const accessPath = path.join(backendRoot, 'staging-access.private.json');

const GENERATED_OR_SAFE_FIELDS = new Set([
  'JAHEEZ_TARGET_ENV',
  'STAGING_CONFIRM_ISOLATED',
  'OUTBOUND_INTEGRATIONS_DISABLED',
  'ONLINE_PAYMENTS_ENABLED',
  'PAYMENT_PROVIDER',
  'BACKUP_ENCRYPTION_KEY',
  'REPORT_SIGNING_KEY',
  'ADMIN_JWT_SECRET',
]);

function isPlaceholder(key, value) {
  if (!value) return true;
  const rule = PLACEHOLDER_ENV_RULES.find((item) => item.key === key);
  return Boolean(rule && rule.pattern.test(String(value).trim()));
}

function main() {
  if (!fs.existsSync(accessPath)) {
    console.log(JSON.stringify({
      ok: false,
      access_file: path.relative(process.cwd(), accessPath),
      missing_file: true,
      next_action: 'Copy backend/staging-access.private.json.example to backend/staging-access.private.json and fill real staging values.',
    }, null, 2));
    process.exit(2);
  }

  let values;
  try {
    values = JSON.parse(fs.readFileSync(accessPath, 'utf8'));
  } catch (error) {
    console.log(JSON.stringify({
      ok: false,
      access_file: path.relative(process.cwd(), accessPath),
      invalid_json: true,
      error: error.message,
    }, null, 2));
    process.exit(2);
  }

  const requiredExternal = REQUIRED_ENV.filter((key) => !GENERATED_OR_SAFE_FIELDS.has(key));
  const missing = [];
  const placeholders = [];
  const ready = [];

  for (const key of requiredExternal) {
    const value = typeof values[key] === 'string' ? values[key].trim() : values[key];
    if (!value) missing.push(key);
    else if (isPlaceholder(key, value)) placeholders.push(key);
    else ready.push(key);
  }

  const ok = missing.length === 0 && placeholders.length === 0;
  console.log(JSON.stringify({
    ok,
    access_file: path.relative(process.cwd(), accessPath),
    ready_count: ready.length,
    required_count: requiredExternal.length,
    missing,
    placeholders,
    next_action: ok
      ? 'Run npm run staging:import-access, then npm run staging:full.'
      : 'Replace placeholder values in backend/staging-access.private.json. Secret values are not printed by this command.',
  }, null, 2));

  process.exit(ok ? 0 : 2);
}

main();

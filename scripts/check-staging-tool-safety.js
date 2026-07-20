#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backupScript = path.join(root, 'backend', 'scripts', 'staging-backup.js');
const preflightScript = path.join(root, 'backend', 'scripts', 'production-readiness-preflight.js');
const initEnvScript = path.join(root, 'backend', 'scripts', 'init-staging-env.js');
const importAccessScript = path.join(root, 'backend', 'scripts', 'import-staging-access.js');
const accessStatusScript = path.join(root, 'backend', 'scripts', 'staging-access-status.js');
const toolResolverScript = path.join(root, 'backend', 'scripts', 'tool-resolver.js');
const fullValidationScript = path.join(root, 'backend', 'scripts', 'staging-full-validation.js');
const signoffVerifierScript = path.join(root, 'backend', 'scripts', 'verify-staging-signoff.js');
const stagingValidationScript = path.join(root, 'backend', 'scripts', 'validate-staging.js');
const stagingSecurityScript = path.join(root, 'backend', 'scripts', 'staging-security-matrix.js');
const stagingE2eScript = path.join(root, 'backend', 'scripts', 'regression-finance-commission.js');
const stagingReconcileScript = path.join(root, 'backend', 'scripts', 'reconcile-staging.js');
const deviceScript = path.join(root, 'backend', 'scripts', 'device-readiness.js');
const accessPackScript = path.join(root, 'backend', 'scripts', 'staging-access-pack.js');
const emulatorHelperScript = path.join(root, 'scripts', 'start-jaheez-emulators.js');

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, error: message, ...details }, null, 2));
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail('Required staging script is missing.', { file: path.relative(root, file) });
  return fs.readFileSync(file, 'utf8');
}

const backup = read(backupScript);
const preflight = read(preflightScript);
const initEnv = read(initEnvScript);
const importAccess = read(importAccessScript);
const accessStatus = read(accessStatusScript);
const toolResolver = read(toolResolverScript);
const fullValidation = read(fullValidationScript);
const signoffVerifier = read(signoffVerifierScript);
const stagingValidation = read(stagingValidationScript);
const stagingSecurity = read(stagingSecurityScript);
const stagingE2e = read(stagingE2eScript);
const stagingReconcile = read(stagingReconcileScript);
const device = read(deviceScript);
const accessPack = read(accessPackScript);
const emulatorHelper = read(emulatorHelperScript);

const required = [
  {
    file: 'backend/scripts/staging-backup.js',
    text: backup,
    name: 'backup key is exactly 32 bytes',
    pattern: /parsed\.length\s*!==\s*32/,
  },
  {
    file: 'backend/scripts/staging-backup.js',
    text: backup,
    name: 'backup refuses same production and staging URLs',
    pattern: /Production and staging URLs must differ/,
  },
  {
    file: 'backend/scripts/staging-backup.js',
    text: backup,
    name: 'backup validates PostgreSQL URL protocol',
    pattern: /postgres:\s*',\s*'postgresql:/,
  },
  {
    file: 'backend/scripts/staging-backup.js',
    text: backup,
    name: 'backup child process receives minimal environment only',
    pattern: /minimalEnv\(\{\s*PGPASSWORD:/,
  },
  {
    file: 'backend/scripts/staging-backup.js',
    text: backup,
    name: 'backup directory is private',
    pattern: /mode:\s*0o700/,
  },
  {
    file: 'backend/scripts/staging-backup.js',
    text: backup,
    name: 'backup output file is private',
    pattern: /mode:\s*0o600/,
  },
  {
    file: 'backend/scripts/staging-backup.js',
    text: backup,
    name: 'prune only removes JAHEEZ encrypted backup artifacts',
    pattern: /\^jaheez-\.\+\\\.dump\\\.enc/,
  },
  {
    file: 'backend/scripts/staging-backup.js',
    text: backup,
    name: 'restore rejects symlink backup inputs',
    pattern: /isSymbolicLink\(\)/,
  },
  {
    file: 'backend/scripts/staging-backup.js',
    text: backup,
    name: 'restore verifies sha256 sidecar when present',
    pattern: /checksum verification failed/,
  },
  {
    file: 'backend/scripts/production-readiness-preflight.js',
    text: preflight,
    name: 'preflight reports Android unauthorized/offline counts',
    pattern: /unauthorized[\s\S]*offline/,
  },
  {
    file: 'backend/scripts/production-readiness-preflight.js',
    text: preflight,
    name: 'preflight rejects copied placeholder staging env values',
    pattern: /staging env values are not placeholders[\s\S]*placeholder_keys/,
  },
  {
    file: 'backend/scripts/production-readiness-preflight.js',
    text: preflight,
    name: 'preflight validates backup key decodes to 32 bytes',
    pattern: /decodesTo32ByteBackupKey[\s\S]*backup encryption key decodes to 32 bytes/,
  },
  {
    file: 'backend/scripts/production-readiness-preflight.js',
    text: preflight,
    name: 'preflight requires staging JWT secret before security matrix',
    pattern: /'ADMIN_JWT_SECRET'[\s\S]*staging JWT secret strong enough/,
  },
  {
    file: 'backend/scripts/init-staging-env.js',
    text: initEnv,
    name: 'staging env initializer generates a 32-byte backup key',
    pattern: /crypto\.randomBytes\(32\)\.toString\('hex'\)/,
  },
  {
    file: 'backend/scripts/init-staging-env.js',
    text: initEnv,
    name: 'staging env initializer keeps payments disabled',
    pattern: /ONLINE_PAYMENTS_ENABLED:\s*'false'[\s\S]*PAYMENT_PROVIDER:\s*'disabled'/,
  },
  {
    file: 'backend/scripts/init-staging-env.js',
    text: initEnv,
    name: 'staging env initializer writes private env file',
    pattern: /fs\.writeFileSync\(envPath,[\s\S]*?\{\s*mode:\s*0o600\s*\}/,
  },
  {
    file: 'backend/scripts/init-staging-env.js',
    text: initEnv,
    name: 'staging env initializer reports missing field names only',
    pattern: /missing_external_fields[\s\S]*Secret values were written locally but not printed/,
  },
  {
    file: 'backend/scripts/import-staging-access.js',
    text: importAccess,
    name: 'staging access importer uses preflight contract as source of truth',
    pattern: /evaluateReadiness[\s\S]*PLACEHOLDER_ENV_RULES[\s\S]*REQUIRED_ENV/,
  },
  {
    file: 'backend/scripts/import-staging-access.js',
    text: importAccess,
    name: 'staging access importer rejects placeholder values',
    pattern: /skippedPlaceholders[\s\S]*isPlaceholder\(key, candidate\)/,
  },
  {
    file: 'backend/scripts/import-staging-access.js',
    text: importAccess,
    name: 'staging access importer writes private env file',
    pattern: /fs\.writeFileSync\(envPath,[\s\S]*?\{\s*mode:\s*0o600\s*\}/,
  },
  {
    file: 'backend/scripts/import-staging-access.js',
    text: importAccess,
    name: 'staging access importer does not print secret values',
    pattern: /Secret values were written locally but not printed/,
  },
  {
    file: 'backend/scripts/staging-access-status.js',
    text: accessStatus,
    name: 'staging access status derives required fields from preflight contract',
    pattern: /PLACEHOLDER_ENV_RULES[\s\S]*REQUIRED_ENV/,
  },
  {
    file: 'backend/scripts/staging-access-status.js',
    text: accessStatus,
    name: 'staging access status reports placeholder field names only',
    pattern: /placeholders\.push\(key\)[\s\S]*JSON\.stringify\(\{[\s\S]*placeholders/,
  },
  {
    file: 'backend/scripts/staging-access-status.js',
    text: accessStatus,
    name: 'staging access status tells operator secrets are not printed',
    pattern: /Secret values are not printed by this command/,
  },
  {
    file: 'backend/scripts/tool-resolver.js',
    text: toolResolver,
    name: 'tool resolver supports explicit safe path overrides',
    pattern: /JAHEEZ_\$\{normalized\}_PATH[\s\S]*\$\{normalized\}_PATH/,
  },
  {
    file: 'backend/scripts/tool-resolver.js',
    text: toolResolver,
    name: 'tool resolver discovers installed Windows PostgreSQL tools',
    pattern: /ProgramFiles[\s\S]*PostgreSQL[\s\S]*pgAdmin 4[\s\S]*runtime/,
  },
  {
    file: 'backend/scripts/tool-resolver.js',
    text: toolResolver,
    name: 'tool resolver verifies tools by version probe',
    pattern: /spawnSync\(candidate,\s*\['--version'\]/,
  },
  {
    file: 'backend/scripts/staging-full-validation.js',
    text: fullValidation,
    name: 'full staging runner executes preflight before backup',
    pattern: /run\('preflight'[\s\S]*?run\('encrypted production backup'/,
  },
  {
    file: 'backend/scripts/staging-full-validation.js',
    text: fullValidation,
    name: 'full staging signoff directory is private',
    pattern: /fs\.mkdirSync\(signoffDir,\s*\{\s*recursive:\s*true,\s*mode:\s*0o700\s*\}/,
  },
  {
    file: 'backend/scripts/staging-full-validation.js',
    text: fullValidation,
    name: 'full staging signoff report is private',
    pattern: /fs\.writeFileSync\(file,[\s\S]*?\{\s*mode:\s*0o600\s*\}/,
  },
  {
    file: 'backend/scripts/verify-staging-signoff.js',
    text: signoffVerifier,
    name: 'signoff verifier requires HMAC signature',
    pattern: /Signoff report is missing signature[\s\S]*timingSafeEqual/,
  },
  {
    file: 'backend/scripts/verify-staging-signoff.js',
    text: signoffVerifier,
    name: 'signoff verifier rejects production deployment reports',
    pattern: /Signoff report claims production deployment/,
  },
  {
    file: 'backend/scripts/verify-staging-signoff.js',
    text: signoffVerifier,
    name: 'signoff verifier requires online payments disabled',
    pattern: /online payments stayed disabled/,
  },
  {
    file: 'backend/scripts/verify-staging-signoff.js',
    text: signoffVerifier,
    name: 'signoff verifier requires exact gate set',
    pattern: /EXPECTED_GATE_LABELS[\s\S]*exact required gate set/,
  },
  {
    file: 'backend/scripts/validate-staging.js',
    text: stagingValidation,
    name: 'staging DB validation refuses non-isolated staging',
    pattern: /JAHEEZ_TARGET_ENV!==?'staging'[\s\S]*STAGING_CONFIRM_ISOLATED!==?'true'/,
  },
  {
    file: 'backend/scripts/validate-staging.js',
    text: stagingValidation,
    name: 'staging DB validation refuses production database',
    pattern: /Refusing production database/,
  },
  {
    file: 'backend/scripts/staging-security-matrix.js',
    text: stagingSecurity,
    name: 'staging security matrix requires isolated staging',
    pattern: /JAHEEZ_TARGET_ENV==='staging'[\s\S]*STAGING_CONFIRM_ISOLATED==='true'/,
  },
  {
    file: 'backend/scripts/staging-security-matrix.js',
    text: stagingSecurity,
    name: 'staging security matrix requires store credential fixture',
    pattern: /STAGING_STORE_API_KEY/,
  },
  {
    file: 'backend/scripts/regression-finance-commission.js',
    text: stagingE2e,
    name: 'finance E2E keeps online payments disabled',
    pattern: /ONLINE_PAYMENTS_ENABLED !== 'false'[\s\S]*PAYMENT_PROVIDER !== 'disabled'/,
  },
  {
    file: 'backend/scripts/regression-finance-commission.js',
    text: stagingE2e,
    name: 'finance E2E requires real staging anon key',
    pattern: /STAGING_ANON_KEY:process\.env\.STAGING_ANON_KEY[\s\S]*createClient\(process\.env\.STAGING_SUPABASE_URL, process\.env\.STAGING_ANON_KEY/,
  },
  {
    file: 'backend/scripts/reconcile-staging.js',
    text: stagingReconcile,
    name: 'reconciliation requires signed report key',
    pattern: /REPORT_SIGNING_KEY must contain at least 32 characters/,
  },
  {
    file: 'backend/scripts/reconcile-staging.js',
    text: stagingReconcile,
    name: 'reconciliation report directory is private',
    pattern: /fs\.mkdirSync\(dir,\{recursive:true,mode:0o700\}\)/,
  },
  {
    file: 'backend/scripts/device-readiness.js',
    text: device,
    name: 'device readiness hashes serial numbers',
    pattern: /serial_hash/,
  },
  {
    file: 'backend/scripts/device-readiness.js',
    text: device,
    name: 'device readiness requires confirmed isolated staging',
    pattern: /Device readiness must run only for confirmed isolated staging/,
  },
  {
    file: 'backend/scripts/device-readiness.js',
    text: device,
    name: 'device readiness requires distinct authorized devices',
    pattern: /uniqueAuthorizedHashes[\s\S]*Two distinct authorized Android devices required/,
  },
  {
    file: 'backend/scripts/staging-access-pack.js',
    text: accessPack,
    name: 'access pack derives required fields from preflight contract',
    pattern: /REQUIRED_ENV[\s\S]*SAFE_LOCAL_FIELDS[\s\S]*requiredExternalFields/,
  },
  {
    file: 'backend/scripts/staging-access-pack.js',
    text: accessPack,
    name: 'access pack reports statuses instead of values',
    pattern: /fieldStatus[\s\S]*missing[\s\S]*placeholder[\s\S]*present/,
  },
  {
    file: 'backend/scripts/staging-access-pack.js',
    text: accessPack,
    name: 'access pack tells operators not to paste secrets into chat',
    pattern: /Do not paste database URLs, service role keys, or access tokens into chat/,
  },
  {
    file: 'backend/scripts/staging-access-pack.js',
    text: accessPack,
    name: 'access pack keeps online payments disabled',
    pattern: /online_payments_expected:\s*'disabled'/,
  },
  {
    file: 'backend/scripts/staging-access-pack.js',
    text: accessPack,
    name: 'access pack supports machine-readable JSON without secret values',
    pattern: /process\.argv\.includes\('--json'\)[\s\S]*JSON\.stringify\(report/,
  },
  {
    file: 'scripts/start-jaheez-emulators.js',
    text: emulatorHelper,
    name: 'emulator helper launches read-only instances',
    pattern: /'-read-only'/,
  },
  {
    file: 'scripts/start-jaheez-emulators.js',
    text: emulatorHelper,
    name: 'emulator helper launches headless quiet devices',
    pattern: /'-no-window'[\s\S]*'-no-audio'[\s\S]*'-no-boot-anim'/,
  },
  {
    file: 'scripts/start-jaheez-emulators.js',
    text: emulatorHelper,
    name: 'emulator helper verifies two existing ADB devices first',
    pattern: /adbDevices\(\)[\s\S]*current\.length\s*>=\s*2/,
  },
  {
    file: 'scripts/start-jaheez-emulators.js',
    text: emulatorHelper,
    name: 'emulator helper creates a small data partition for low-disk machines',
    pattern: /disk\.dataPartition\.size=2G/,
  },
];

const forbidden = [
  {
    file: 'backend/scripts/staging-backup.js',
    text: backup,
    name: 'backup child processes must not inherit full process.env',
    pattern: /env:\s*\{\s*\.\.\.process\.env/,
  },
  {
    file: 'backend/scripts/device-readiness.js',
    text: device,
    name: 'device readiness must not print raw serials',
    pattern: /devices:\s*devices\.map\(x=>x\.split/,
  },
  {
    file: 'backend/scripts/regression-finance-commission.js',
    text: stagingE2e,
    name: 'finance E2E must not use fake anon key fallback',
    pattern: /missing-anon-key/,
  },
  {
    file: 'backend/scripts/staging-access-pack.js',
    text: accessPack,
    name: 'access pack must not print process.env directly',
    pattern: /console\.log\([^)]*process\.env/,
  },
  {
    file: 'backend/scripts/staging-access-pack.js',
    text: accessPack,
    name: 'access pack must not include database URL values in report',
    pattern: /database_url:\s*process\.env|PRODUCTION_DATABASE_URL:\s*process\.env|STAGING_DATABASE_URL:\s*process\.env/i,
  },
  {
    file: 'backend/scripts/import-staging-access.js',
    text: importAccess,
    name: 'staging access importer must not print parsed access object',
    pattern: /console\.log\([^)]*access/,
  },
  {
    file: 'backend/scripts/staging-access-status.js',
    text: accessStatus,
    name: 'staging access status must not print raw access values object',
    pattern: /console\.log\([^)]*values/,
  },
  {
    file: 'scripts/start-jaheez-emulators.js',
    text: emulatorHelper,
    name: 'emulator helper must not print raw adb output',
    pattern: /console\.log\([^)]*adbDevices/,
  },
];

const missing = required
  .filter((check) => !check.pattern.test(check.text))
  .map((check) => `${check.file}: ${check.name}`);
const present = forbidden
  .filter((check) => check.pattern.test(check.text))
  .map((check) => `${check.file}: ${check.name}`);

if (missing.length > 0 || present.length > 0) {
  fail('Staging tool safety contract failed.', { missing, forbidden_present: present });
}

console.log('Staging tool safety lint passed.');

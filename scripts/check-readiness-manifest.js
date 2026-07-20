#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'docs', 'PRODUCTION_READINESS_MANIFEST.json');
const preflight = require(path.join(root, 'backend', 'scripts', 'production-readiness-preflight.js'));

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`${path.relative(root, file)} is missing`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

function readJson(file) {
  try {
    return JSON.parse(read(file));
  } catch (error) {
    fail(`${path.relative(root, file)} is invalid JSON: ${error.message}`);
    return null;
  }
}

function sameArray(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) fail(`${name} does not match authoritative implementation`);
}

function extractLocalGateNames() {
  const text = read(path.join(root, 'scripts', 'local-release-gates.js'));
  return [...text.matchAll(/name:\s*'([^']+)'/g)].map((match) => match[1]);
}

function extractExpectedSignoffGates() {
  const text = read(path.join(root, 'backend', 'scripts', 'verify-staging-signoff.js'));
  const match = text.match(/const EXPECTED_GATE_LABELS = \[([\s\S]*?)\];/);
  if (!match) {
    fail('verify-staging-signoff.js does not expose EXPECTED_GATE_LABELS');
    return [];
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

const manifest = readJson(manifestPath);
const rootPackage = readJson(path.join(root, 'package.json'));

if (manifest) {
  if (manifest.production_deployment_authorized !== false) fail('Manifest must keep production_deployment_authorized=false');
  if (manifest.online_payments_expected !== 'disabled') fail('Manifest must keep online_payments_expected=disabled');
  if (manifest.visible_currency !== 'DH') fail('Manifest must declare DH as visible currency');
  if (manifest.internal_money_storage !== 'integer_centimes') fail('Manifest must declare integer_centimes as internal money storage');

  sameArray('required_staging_env', manifest.required_staging_env, preflight.REQUIRED_ENV);
  sameArray('required_migrations', manifest.required_migrations, preflight.REQUIRED_MIGRATIONS);
  sameArray('required_staging_gates', manifest.required_staging_gates, extractExpectedSignoffGates());
  sameArray('required_local_gates', manifest.required_local_gates, extractLocalGateNames());

  const operatorCommands = manifest.operator_commands || {};
  const expectedOperatorCommands = {
    local_status: 'npm run readiness:status',
    access_pack: 'npm run staging:access-pack',
    initialize_private_staging_env: 'npm run staging:init-env',
    staging_preflight: 'npm run staging:preflight',
    full_staging_validation: 'npm run staging:full',
  };
  for (const [name, command] of Object.entries(expectedOperatorCommands)) {
    if (operatorCommands[name] !== command) fail(`Manifest operator command ${name} must be "${command}"`);
  }
  for (const command of Object.values(expectedOperatorCommands)) {
    const scriptName = command.replace(/^npm run /, '');
    if (!rootPackage?.scripts?.[scriptName]) fail(`Manifest references missing root script: ${scriptName}`);
  }

  const invariants = manifest.non_negotiable_invariants || [];
  for (const required of [
    'production is never modified by staging validation',
    'online payments remain disabled until a Moroccan-compatible provider passes staging',
    'driver self-registration remains disabled',
    'customer self-registration remains enabled',
    'delay penalties never reduce commission',
    'unknown delay attribution penalizes nobody automatically',
    'successful signoff requires zero failed gates and a signed report',
  ]) {
    if (!invariants.includes(required)) fail(`Manifest missing invariant: ${required}`);
  }

  const blockers = manifest.external_blockers_before_staging_signoff || [];
  for (const blocker of [
    'production database backup access',
    'isolated staging Supabase project',
    'isolated staging backend ADMIN_JWT_SECRET',
    'staging API and fixture identities',
    'two distinct authorized Android devices',
  ]) {
    if (!blockers.includes(blocker)) fail(`Manifest missing external blocker: ${blocker}`);
  }
}

if (failures.length > 0) {
  console.error('Readiness manifest check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Readiness manifest check passed.');

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const statusScript = path.join(root, 'scripts', 'readiness-status.js');
const pkgPath = path.join(root, 'package.json');
const preflightPath = path.join(root, 'backend', 'scripts', 'production-readiness-preflight.js');

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, error: message, ...details }, null, 2));
  process.exit(1);
}

for (const file of [statusScript, pkgPath, preflightPath]) {
  if (!fs.existsSync(file)) fail('Required readiness status file is missing.', { file: path.relative(root, file) });
}

const script = fs.readFileSync(statusScript, 'utf8');
const preflight = fs.readFileSync(preflightPath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const required = [
  {
    name: 'root package exposes readiness:status',
    ok: pkg.scripts && pkg.scripts['readiness:status'] === 'node scripts/readiness-status.js',
  },
  {
    name: 'status runs full local release gates',
    ok: /verify:local/.test(script),
  },
  {
    name: 'status runs staging preflight',
    ok: /readiness:preflight/.test(script),
  },
  {
    name: 'status says production deployment is not authorized',
    ok: /production_deployment_authorized:\s*false/.test(script),
  },
  {
    name: 'status says online payments are disabled',
    ok: /online_payments_expected:\s*'disabled'/.test(script),
  },
  {
    name: 'status summarizes blocking checks instead of dumping env values',
    ok: /blocking_checks/.test(script) && /missing: check\.missing/.test(script),
  },
  {
    name: 'preflight exports evaluateReadiness for status reuse',
    ok: /module\.exports\s*=\s*\{[^}]*evaluateReadiness[^}]*\}/s.test(preflight),
  },
];

const forbidden = [
  {
    name: 'status must not print raw stdout/stderr from preflight',
    pattern: /console\.log\(.*(?:stdout|stderr)/,
  },
  {
    name: 'status must not include known secret env names in report body',
    pattern: /STAGING_SERVICE_ROLE_KEY|STAGING_ANON_KEY|PRODUCTION_DATABASE_URL|STAGING_DATABASE_URL|STAGING_CUSTOMER_ACCESS_TOKEN/,
  },
];

const missing = required.filter((check) => !check.ok).map((check) => check.name);
const present = forbidden.filter((check) => check.pattern.test(script)).map((check) => check.name);

if (missing.length > 0 || present.length > 0) {
  fail('Readiness status contract failed.', { missing, forbidden_present: present });
}

console.log('Readiness status lint passed.');

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backendRoot = path.join(root, 'backend');
const templatePath = path.join(backendRoot, '.env.staging.local.example');
const preflight = require(path.join(backendRoot, 'scripts', 'production-readiness-preflight.js'));

const failures = [];

function fail(message) {
  failures.push(message);
}

function parseEnvKeys(text) {
  const keys = new Map();
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)\s*=/);
    if (!match) continue;
    if (keys.has(match[1])) {
      fail(`Duplicate key ${match[1]} in ${path.relative(root, templatePath)}:${index + 1}`);
    }
    keys.set(match[1], index + 1);
  }
  return keys;
}

function looksLikeRealSecret(value) {
  const trimmed = value.trim();
  if (/^eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}$/.test(trimmed)) return true;
  if (/^(sk|pk|rk)_(live|test)_[A-Za-z0-9_]{12,}/.test(trimmed)) return true;
  if (/supabase\.co\/auth\/v1/i.test(trimmed)) return true;
  return false;
}

if (!fs.existsSync(templatePath)) {
  fail('Missing backend/.env.staging.local.example');
} else {
  const text = fs.readFileSync(templatePath, 'utf8');
  const keys = parseEnvKeys(text);

  for (const key of preflight.REQUIRED_ENV) {
    if (!keys.has(key)) fail(`Template is missing required preflight key ${key}`);
  }

  for (const key of keys.keys()) {
    if (!preflight.REQUIRED_ENV.includes(key)) {
      fail(`Template contains non-preflight key ${key}; keep staging validation credentials minimal`);
    }
  }

  const forbidden = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'PROD_SUPABASE_SERVICE_ROLE_KEY',
  ];
  for (const key of forbidden) {
    if (keys.has(key) || text.includes(`${key}=`)) {
      fail(`Template must not request ${key}`);
    }
  }

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [, key, rawValue = ''] = trimmed.match(/^([A-Z0-9_]+)\s*=(.*)$/) || [];
    if (!key) continue;
    if (!rawValue.trim()) fail(`${key} must have an obvious placeholder in the example file`);
    if (looksLikeRealSecret(rawValue)) {
      fail(`${key} at backend/.env.staging.local.example:${index + 1} looks like a real secret/token`);
    }
  }

  if (!/ONLINE_PAYMENTS_ENABLED=false/.test(text) || !/PAYMENT_PROVIDER=disabled/.test(text)) {
    fail('Template must keep online payments fail-closed with ONLINE_PAYMENTS_ENABLED=false and PAYMENT_PROVIDER=disabled');
  }
}

if (failures.length > 0) {
  console.error('Staging environment template check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Staging environment template matches readiness preflight requirements.');

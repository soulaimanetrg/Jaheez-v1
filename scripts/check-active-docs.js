#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const activeDocs = [
  'README.md',
  'RUN_APP.md',
  'DEPLOY.md',
  'docs/ACTIVE_OPERATOR_DOCS.md',
  'docs/COMMISSION_PRODUCTION_RUNBOOK.md',
  'docs/PRODUCTION_READINESS_PLAN.md',
  'docs/PRODUCTION_READINESS_MANIFEST.json',
  '.env.example',
  '.env.production.example',
  'backend/.env.staging.local.example',
  'frontend/user-app/.env.example',
  'frontend/driver-app/.env.example',
  'frontend/admin/.env.example',
];

const requiredPatterns = [
  {
    file: 'README.md',
    name: 'README points to active operator docs',
    pattern: /ACTIVE_OPERATOR_DOCS\.md/,
  },
  {
    file: 'README.md',
    name: 'README points to readiness manifest',
    pattern: /PRODUCTION_READINESS_MANIFEST\.json/,
  },
  {
    file: 'docs/ACTIVE_OPERATOR_DOCS.md',
    name: 'active docs declare online payments paused',
    pattern: /Online card payments are paused/i,
  },
  {
    file: 'docs/ACTIVE_OPERATOR_DOCS.md',
    name: 'active docs list readiness manifest',
    pattern: /PRODUCTION_READINESS_MANIFEST\.json/,
  },
  {
    file: 'docs/PRODUCTION_READINESS_MANIFEST.json',
    name: 'readiness manifest keeps production unauthorized',
    pattern: /"production_deployment_authorized": false/,
  },
  {
    file: 'docs/PRODUCTION_READINESS_MANIFEST.json',
    name: 'readiness manifest keeps payments disabled',
    pattern: /"online_payments_expected": "disabled"/,
  },
  {
    file: 'docs/PRODUCTION_READINESS_MANIFEST.json',
    name: 'readiness manifest records DH visible currency',
    pattern: /"visible_currency": "DH"/,
  },
  {
    file: 'docs/COMMISSION_PRODUCTION_RUNBOOK.md',
    name: 'commission runbook requires staging signoff before production',
    pattern: /staging signoff/i,
  },
  {
    file: '.env.production.example',
    name: 'production env keeps online payments fail-closed',
    pattern: /ONLINE_PAYMENTS_ENABLED=false[\s\S]*PAYMENT_PROVIDER=disabled/i,
  },
];

const forbidden = [
  {
    name: 'active docs must not request Stripe secret configuration',
    pattern: /\b(?:STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY)\b/,
  },
  {
    name: 'active docs must not tell operators to set up Stripe payments',
    pattern: /\b(?:set up|configure|enable|test with|required for)\s+Stripe\b/i,
  },
  {
    name: 'active docs must not reference removed stripeClient runtime file',
    pattern: /\bstripeClient\.ts\b/,
  },
  {
    name: 'active docs must not describe Stripe as current payment processor',
    pattern: /\bStripe\s+(?:payment processing|checkout sessions|SDK|webhook)\b/i,
  },
];

const allowed = [
  /Legacy Stripe routes are disabled/i,
  /returning `410 Gone`/i,
  /do not add Stripe secrets/i,
  /must not request Stripe secrets/i,
  /no stripe dependency/i,
  /Stripe secrets and Stripe runtime dependencies stay absent from active code/i,
];

const violations = [];

for (const rel of activeDocs) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    violations.push(`${rel}: active document/env template is missing`);
    continue;
  }

  const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (allowed.some((rx) => rx.test(line))) return;
    for (const rule of forbidden) {
      if (rule.pattern.test(line)) violations.push(`${rel}:${index + 1}: ${rule.name}: ${line.trim()}`);
    }
  });
}

for (const rule of requiredPatterns) {
  const full = path.join(root, rule.file);
  const text = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  if (!rule.pattern.test(text)) violations.push(`${rule.file}: missing invariant: ${rule.name}`);
}

if (violations.length > 0) {
  console.error('Active documentation lint failed.');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Active documentation lint passed.');

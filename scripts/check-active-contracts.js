#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const activeRoots = [
  'frontend/user-app/app',
  'frontend/user-app/features',
  'frontend/user-app/hooks',
  'frontend/user-app/lib',
  'frontend/user-app/constants',
  'frontend/driver-app/app',
  'frontend/driver-app/features',
  'frontend/driver-app/lib',
  'frontend/admin/src',
  'shared',
];

const fileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

const forbidden = [
  {
    name: 'visible non-DH Arabic currency label',
    pattern: /د\.م\.?/,
  },
  {
    name: 'visible MAD currency label',
    pattern: /\bMAD\b/,
  },
  {
    name: 'Stripe dependency/import/client reference in active app code',
    pattern: /\b(?:Stripe|stripeClient|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET)\b/,
  },
  {
    name: 'app-facing centime DTO name',
    pattern: /(?:amount|balance|cod_balance|earnings|total|delivery_fee|tip|commission|payable|held|refund|wallet|payout)_centimes\b/,
  },
];

const allowedMatches = [
  // Admin settings must know these legacy DB keys so it can convert them to DH for operators.
  /frontend[\\/]admin[\\/]src[\\/]features[\\/]settings[\\/]views[\\/]settings\.tsx::.*driver_(?:min_delivery_earning|high_tip_review_threshold)_centimes/,
  // Admin helper name is internal/technical; app screens display DH.
  /frontend[\\/]admin[\\/]src[\\/]lib[\\/]money\.ts::.*formatCentimesAsDh/,
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (fileExtensions.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function isAllowed(rel, line) {
  const normalized = `${rel.replace(/\\/g, '/')}::${line}`;
  return allowedMatches.some((rx) => rx.test(normalized));
}

const violations = [];

for (const rootDir of activeRoots) {
  const abs = path.join(root, rootDir);
  for (const file of walk(abs)) {
    const rel = path.relative(root, file).replace(/\\/g, '/');
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of forbidden) {
        if (rule.pattern.test(line) && !isAllowed(rel, line)) {
          violations.push(`${rel}:${index + 1}: ${rule.name}: ${line.trim()}`);
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error('Active contract lint failed. Keep app-facing money in DH and online payments provider-neutral.');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Active contract lint passed.');

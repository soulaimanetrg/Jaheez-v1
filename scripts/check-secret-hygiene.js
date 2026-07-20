#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const scannedRoots = [
  'backend/src',
  'backend/scripts',
  'frontend/admin/src',
  'frontend/user-app',
  'frontend/driver-app',
  'scripts',
  'shared',
  '.env.example',
  '.env.production.example',
];

const fileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.env', '.example', '.json']);

const forbidden = [
  {
    name: 'hardcoded concrete Supabase project URL',
    pattern: /https:\/\/(?!your-project\.supabase\.co|test\.supabase\.co)[a-z0-9]{20}\.supabase\.co/i,
  },
  {
    name: 'hardcoded Supabase publishable/anon key',
    pattern: /\bsb_publishable_[A-Za-z0-9_-]{20,}\b/,
  },
  {
    name: 'frontend env example must not request backend SMS provider secret',
    pattern: /INFOBIP_API_KEY/,
    frontendExampleOnly: true,
  },
];

function walk(target, out = []) {
  const abs = path.join(root, target);
  if (!fs.existsSync(abs)) return out;
  const stat = fs.statSync(abs);
  if (stat.isFile()) {
    out.push(abs);
    return out;
  }
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage' || entry.name === '.expo') continue;
    const full = path.join(abs, entry.name);
    if (entry.isDirectory()) walk(path.relative(root, full), out);
    else if (fileExtensions.has(path.extname(entry.name)) || entry.name.endsWith('.env.example')) out.push(full);
  }
  return out;
}

const files = [...new Set(scannedRoots.flatMap((target) => walk(target)))];
const violations = [];

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of forbidden) {
      if (rule.frontendExampleOnly && !/^frontend\/(?:admin|user-app|driver-app)\/\.env\.example$/.test(rel)) continue;
      if (rule.pattern.test(line)) {
        violations.push(`${rel}:${index + 1}: ${rule.name}: ${line.trim()}`);
      }
    }
  });
}

if (violations.length > 0) {
  console.error('Secret hygiene lint failed. Remove hardcoded project credentials and backend-only provider secrets from frontend/app code.');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Secret hygiene lint passed.');

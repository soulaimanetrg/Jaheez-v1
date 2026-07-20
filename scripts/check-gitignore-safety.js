#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const gitignorePath = path.join(root, '.gitignore');

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, error: message, ...details }, null, 2));
  process.exit(1);
}

if (!fs.existsSync(gitignorePath)) {
  fail('.gitignore is missing.');
}

const text = fs.readFileSync(gitignorePath, 'utf8');

const requiredPatterns = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.staging',
  '*.env.local',
  '*.staging.local',
  '.npm-cache/',
  'backend/.env',
  'backend/.env.staging.local',
  'backend/staging-access.private.json',
  'frontend/user-app/.env',
  'frontend/driver-app/.env',
  'frontend/admin/.env',
  'jaheez-encrypted-backups/',
  'jaheez-staging-signoff/',
  'backend/jaheez-encrypted-backups/',
  'backend/jaheez-staging-signoff/',
  '*.dump.enc',
  '*.dump.enc.sha256',
  'staging-full-*.json',
  'reconciliation-*.json',
  'readiness-status*.json',
  '.tmp-readiness-status.json',
];

const requiredUnignore = [
  '!.env.example',
  '!.env.production.example',
  '!backend/.env.staging.local.example',
  '!backend/staging-access.private.json.example',
  '!frontend/user-app/.env.example',
  '!frontend/driver-app/.env.example',
  '!frontend/admin/.env.example',
];

const missing = [];
for (const pattern of [...requiredPatterns, ...requiredUnignore]) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`^${escaped}$`, 'm');
  if (!rx.test(text)) missing.push(pattern);
}

if (missing.length > 0) {
  fail('Git ignore safety contract failed.', { missing });
}

console.log('Git ignore safety lint passed.');

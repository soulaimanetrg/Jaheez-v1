#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const failures = [];

const expectedScripts = {
  'staging:init-env': 'npm run staging:init-env --prefix backend',
  'staging:import-access': 'npm run staging:import-access --prefix backend',
  'staging:access-status': 'npm run staging:access-status --prefix backend',
  'staging:preflight': 'npm run readiness:preflight --prefix backend',
  'staging:full': 'npm run staging:full --prefix backend',
  'staging:devices': 'npm run staging:devices --prefix backend',
  'staging:verify-signoff': 'npm run staging:verify-signoff --prefix backend --',
  'staging:access-pack': 'npm run staging:access-pack --prefix backend --',
  'verify:staging': 'npm run staging:full --prefix backend',
};

for (const [name, command] of Object.entries(expectedScripts)) {
  if (pkg.scripts?.[name] !== command) {
    failures.push(`${name} must equal "${command}"`);
  }
}

const forbiddenInline = Object.keys(expectedScripts).filter((name) => {
  const command = pkg.scripts?.[name] || '';
  return /node\s+backend[\\/]scripts|node\s+scripts[\\/](?:staging|production-readiness|device|verify-staging)/.test(command);
});

for (const name of forbiddenInline) {
  failures.push(`${name} must delegate through npm --prefix backend instead of bypassing backend package scripts`);
}

if (failures.length > 0) {
  console.error('Root staging script check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Root staging script check passed.');

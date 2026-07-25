#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

const gates = [
  {
    name: 'Backend unit/integration tests',
    cwd: path.join(root, 'backend'),
    command: 'npm test',
  },
  {
    name: 'Backend production build',
    cwd: path.join(root, 'backend'),
    command: 'npm run build',
  },
  {
    name: 'Admin production build',
    cwd: path.join(root, 'frontend', 'admin'),
    command: 'npm run build',
  },
  {
    name: 'Customer app cart/UI tests',
    cwd: path.join(root, 'frontend', 'user-app'),
    command: 'npm run test:ci',
  },
  {
    name: 'Customer app TypeScript check',
    cwd: path.join(root, 'frontend', 'user-app'),
    command: 'npx tsc --noEmit',
  },
  {
    name: 'Driver app TypeScript check',
    cwd: path.join(root, 'frontend', 'driver-app'),
    command: 'npx tsc --noEmit',
  },
  {
    name: 'Staging tool syntax checks',
    cwd: path.join(root, 'backend'),
    command: [
      'node --check scripts/production-readiness-preflight.js',
      'node --check scripts/init-staging-env.js',
      'node --check scripts/import-staging-access.js',
      'node --check scripts/staging-access-status.js',
      'node --check scripts/tool-resolver.js',
      'node --check scripts/staging-access-pack.js',
      'node --check scripts/staging-full-validation.js',
      'node --check scripts/apply-required-migrations.js',
      'node --check scripts/staging-backup.js',
      'node --check scripts/staging-security-matrix.js',
      'node --check scripts/reconcile-staging.js',
      'node --check scripts/device-readiness.js',
      'node --check scripts/verify-staging-signoff.js',
    ].join(' && '),
  },
  {
    name: 'Root staging helper syntax checks',
    cwd: root,
    command: 'node --check scripts/start-jaheez-emulators.js',
  },
  {
    name: 'Active app contract lint',
    cwd: root,
    command: 'node scripts/check-active-contracts.js',
  },
  {
    name: 'Strict frontend boundary lint',
    cwd: root,
    command: 'node scripts/check-strict-frontend-boundary.js',
  },
  {
    name: 'Route security contract lint',
    cwd: root,
    command: 'node scripts/check-route-security.js',
  },
  {
    name: 'Payment provider safety lint',
    cwd: root,
    command: 'node scripts/check-payment-provider-safety.js',
  },
  {
    name: 'Sensitive logging lint',
    cwd: root,
    command: 'node scripts/check-sensitive-logging.js',
  },
  {
    name: 'Secret hygiene lint',
    cwd: root,
    command: 'node scripts/check-secret-hygiene.js',
  },
  {
    name: 'Migration safety lint',
    cwd: root,
    command: 'node scripts/check-migration-safety.js',
  },
  {
    name: 'Active documentation lint',
    cwd: root,
    command: 'node scripts/check-active-docs.js',
  },
  {
    name: 'CI workflow lint',
    cwd: root,
    command: 'node scripts/check-ci-workflow.js',
  },
  {
    name: 'Root staging scripts lint',
    cwd: root,
    command: 'node scripts/check-root-staging-scripts.js',
  },
  {
    name: 'NPM audit policy lint',
    cwd: root,
    command: 'node scripts/check-npm-audit-policy.js',
  },
  {
    name: 'Package lock consistency lint',
    cwd: root,
    command: 'node scripts/check-package-locks.js',
  },
  {
    name: 'Git ignore safety lint',
    cwd: root,
    command: 'node scripts/check-gitignore-safety.js',
  },
  {
    name: 'Staging tool safety lint',
    cwd: root,
    command: 'node scripts/check-staging-tool-safety.js',
  },
  {
    name: 'Staging environment template lint',
    cwd: root,
    command: 'node scripts/check-staging-env-template.js',
  },
  {
    name: 'Staging environment contract lint',
    cwd: root,
    command: 'node scripts/check-staging-env-contract.js',
  },
  {
    name: 'Readiness status lint',
    cwd: root,
    command: 'node scripts/check-readiness-status.js',
  },
  {
    name: 'Readiness manifest lint',
    cwd: root,
    command: 'node scripts/check-readiness-manifest.js',
  },
];

function runGate(gate) {
  console.log(`\n[gate] ${gate.name}`);
  console.log(`[cmd] ${gate.command}`);

  const result = spawnSync(gate.command, {
    cwd: gate.cwd,
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: process.env.CI || 'true',
      ONLINE_PAYMENTS_ENABLED: process.env.ONLINE_PAYMENTS_ENABLED || 'false',
      PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'disabled',
    },
  });

  if (result.error) {
    console.error(`[fail] ${gate.name}: ${result.error.message}`);
    return false;
  }

  if (result.status !== 0) {
    console.error(`[fail] ${gate.name}: exited with ${result.status}`);
    return false;
  }

  console.log(`[pass] ${gate.name}`);
  return true;
}

console.log('JAHEEZ local release gates');
console.log('These checks do not touch production or staging databases.');

const startedAt = Date.now();
const failed = [];

for (const gate of gates) {
  if (!runGate(gate)) failed.push(gate.name);
}

const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

if (failed.length > 0) {
  console.error(`\nLocal release gates failed after ${seconds}s:`);
  for (const name of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`\nAll local release gates passed in ${seconds}s.`);
console.log('Run `npm run staging:full` only after staging credentials and Android devices are ready.');

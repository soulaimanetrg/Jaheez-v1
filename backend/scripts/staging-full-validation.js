'use strict';

require('dotenv').config({ path: '.env.staging.local' });
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '../.env' });

const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const backend = path.resolve(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const signoffDir = process.env.STAGING_SIGNOFF_DIR || path.join(os.tmpdir(), 'jaheez-staging-signoff');

const report = {
  ok: false,
  mode: 'staging-full-validation',
  started_at: new Date().toISOString(),
  completed_at: null,
  production_deployment: false,
  online_payments_expected: 'disabled',
  backup_path: null,
  gates: [],
  failed_gate: null,
  error: null,
};

function signReport(body) {
  const key = process.env.REPORT_SIGNING_KEY || '';
  if (key.length < 32) return null;
  const canonical = JSON.stringify(body);
  return crypto.createHmac('sha256', key).update(canonical).digest('hex');
}

function writeSignoff() {
  fs.mkdirSync(signoffDir, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(signoffDir, 0o700); } catch { /* Best effort on Windows. */ }
  const body = {
    ...report,
    completed_at: report.completed_at || new Date().toISOString(),
  };
  const signature = signReport(body);
  const signed = signature ? { ...body, signature } : body;
  const file = path.join(signoffDir, `staging-full-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(signed, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ staging_signoff_report: file, signed: Boolean(signature), ok: signed.ok }));
  return file;
}

function run(label, command, args, cwd, options = {}) {
  console.log(`\n=== ${label} ===`);
  const started = Date.now();
  const maxAttempts = 1 + Number(options.transientRetries || 0);
  let attempts = 0;
  let result;
  do {
    attempts += 1;
    result = spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      env: process.env,
      shell: process.platform === 'win32' && /\.(cmd|bat)$/i.test(command),
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    const transient = /ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT/i.test(`${result.stdout || ''}\n${result.stderr || ''}`);
    if ((result.error || result.status !== 0) && transient && attempts < maxAttempts) {
      console.warn(`[retry] ${label}: transient network failure (${attempts}/${maxAttempts})`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);
      continue;
    }
    break;
  } while (attempts < maxAttempts);

  const gate = {
    label,
    command: [command, ...args].join(' '),
    cwd: path.relative(root, cwd) || '.',
    status: result.status,
    signal: result.signal || null,
    duration_ms: Date.now() - started,
    attempts,
    ok: !result.error && (result.status === 0 || options.allowFailure),
  };
  if (result.error) gate.error = result.error.message;
  report.gates.push(gate);

  if (result.error && !options.allowFailure) {
    report.failed_gate = label;
    throw new Error(`${label} failed to start: ${result.error.message}`);
  }

  if (result.status !== 0 && !options.allowFailure) {
    const code = result.status === null ? `signal ${result.signal || 'unknown'}` : `exit code ${result.status}`;
    report.failed_gate = label;
    throw new Error(`${label} failed with ${code}`);
  }

  return result;
}

function parseBackupPath(stdout) {
  const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed && parsed.encrypted_backup) return parsed.encrypted_backup;
    } catch {
      // Continue scanning; npm may print non-JSON banners.
    }
  }
  throw new Error('Could not parse encrypted backup path from staging:backup output.');
}

function main() {
  console.log(JSON.stringify({
    ok: true,
    mode: 'staging-full-validation',
    started_at: report.started_at,
    production_deployment: false,
    online_payments_expected: 'disabled',
    signoff_dir: signoffDir,
  }, null, 2));

  run('preflight', npm, ['run', 'readiness:preflight'], backend);

  const backup = run('encrypted production backup', npm, ['run', 'staging:backup'], backend);
  const backupPath = parseBackupPath(backup.stdout || '');
  report.backup_path = backupPath;

  run('restore encrypted backup to isolated staging', npm, ['run', 'staging:restore', '--', backupPath], backend);
  run('apply approved migration manifest first pass', npm, ['run', 'migrate:required'], backend);
  run('apply approved migration manifest second pass', npm, ['run', 'migrate:required'], backend);
  run('prepare isolated staging fixtures', npm, ['run', 'staging:fixtures'], backend);
  require('dotenv').config({ path: path.join(backend, '.env.staging.local'), override: true });

  run('backend unit tests', npm, ['test'], backend);
  run('backend production build', npm, ['run', 'build'], backend);
  run('admin production build', npm, ['run', 'build'], path.join(root, 'frontend', 'admin'));
  run('customer app TypeScript', npx, ['tsc', '--noEmit'], path.join(root, 'frontend', 'user-app'));
  run('driver app TypeScript', npx, ['tsc', '--noEmit'], path.join(root, 'frontend', 'driver-app'));

  run('staging database/concurrency validation', npm, ['run', 'staging:validate'], backend, { transientRetries: 2 });
  run('staging authorization/security matrix', npm, ['run', 'staging:security'], backend, { transientRetries: 2 });
  run('staging finance/commission E2E', npm, ['run', 'staging:e2e'], backend, { transientRetries: 2 });
  run('staging historical reconciliation', npm, ['run', 'staging:reconcile'], backend, { transientRetries: 2 });
  run('android real-device readiness', npm, ['run', 'staging:devices'], backend);

  report.ok = true;
  report.completed_at = new Date().toISOString();
  writeSignoff();
}

try {
  main();
} catch (error) {
  report.ok = false;
  report.error = error.message;
  report.completed_at = new Date().toISOString();
  let signoff = null;
  try {
    signoff = writeSignoff();
  } catch (writeError) {
    console.error(`Failed to write staging signoff report: ${writeError.message}`);
  }
  console.error(JSON.stringify({
    ok: false,
    failed_at: new Date().toISOString(),
    error: error.message,
    production_deployment: false,
    staging_signoff_report: signoff,
    next_action: 'Resolve the failed gate, then rerun npm run staging:full.',
  }, null, 2));
  process.exit(1);
}

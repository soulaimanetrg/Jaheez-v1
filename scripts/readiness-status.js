#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backend = path.join(root, 'backend');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    shell: process.platform === 'win32' && /\.(cmd|bat)$/i.test(command),
    env: {
      ...process.env,
      CI: process.env.CI || 'true',
      ONLINE_PAYMENTS_ENABLED: process.env.ONLINE_PAYMENTS_ENABLED || 'false',
      PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'disabled',
    },
  });
  return {
    status: result.status,
    ok: !result.error && result.status === 0,
    error: result.error ? result.error.message : null,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function parseJsonFromOutput(output) {
  const trimmed = output.trim();
  if (!trimmed) return null;
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function redactedPreflight() {
  const result = run(npm, ['run', 'readiness:preflight'], backend);
  const parsed = parseJsonFromOutput(result.stdout) || parseJsonFromOutput(result.stderr);
  if (!parsed) {
    return {
      ok: false,
      failed_to_parse: true,
      status: result.status,
      error: result.error || 'Could not parse preflight JSON output.',
    };
  }
  return parsed;
}

const localGate = run(npm, ['run', 'verify:local'], root);
const preflight = redactedPreflight();

const blockingChecks = (preflight.checks || [])
  .filter((check) => !check.ok)
  .map((check) => ({
    name: check.name,
    missing: check.missing || undefined,
    found: check.found,
    unauthorized: check.unauthorized,
    offline: check.offline,
  }));

const status = {
  generated_at: new Date().toISOString(),
  production_deployment_authorized: false,
  online_payments_expected: 'disabled',
  local_release_gates: {
    ok: localGate.ok,
    exit_status: localGate.status,
  },
  staging_preflight: {
    ok: preflight.ok,
    passed: preflight.passed,
    failed: preflight.failed,
    blocking_checks: blockingChecks,
  },
  next_actions: preflight.next_actions || [],
};

const outPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
const json = JSON.stringify(status, null, 2);
if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, json, { mode: 0o600 });
  console.log(JSON.stringify({ ok: true, readiness_status_report: outPath }));
} else {
  console.log(json);
}

process.exit(localGate.ok ? 0 : 1);

'use strict';

require('dotenv').config({ path: '.env.staging.local' });
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '../.env' });

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const EXPECTED_GATE_LABELS = [
  'preflight',
  'encrypted production backup',
  'restore encrypted backup to isolated staging',
  'apply approved migration manifest first pass',
  'apply approved migration manifest second pass',
  'prepare isolated staging fixtures',
  'backend unit tests',
  'backend production build',
  'admin production build',
  'customer app TypeScript',
  'driver app TypeScript',
  'staging database/concurrency validation',
  'staging authorization/security matrix',
  'staging finance/commission E2E',
  'staging historical reconciliation',
  'android real-device readiness',
];

function usage() {
  console.error('Usage: npm run staging:verify-signoff -- <path-to-staging-full-report.json>');
}

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, error: message, ...details }, null, 2));
  process.exit(1);
}

function verifySignature(report) {
  const key = process.env.REPORT_SIGNING_KEY || '';
  if (key.length < 32) {
    fail('REPORT_SIGNING_KEY must contain at least 32 characters to verify signoff signatures.');
  }
  const { signature, ...body } = report;
  if (!signature) {
    fail('Signoff report is missing signature.');
  }
  const expected = crypto.createHmac('sha256', key).update(JSON.stringify(body)).digest('hex');
  const actual = String(signature);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(actual, 'hex');
  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    fail('Signoff signature mismatch.');
  }
}

function main() {
  const file = process.argv[2];
  if (!file) {
    usage();
    process.exit(2);
  }

  const resolved = path.resolve(file);
  if (!fs.existsSync(resolved)) {
    fail('Signoff report not found.', { file: resolved });
  }

  let report;
  try {
    report = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  } catch (error) {
    fail(`Invalid JSON signoff report: ${error.message}`, { file: resolved });
  }

  verifySignature(report);

  const gates = Array.isArray(report.gates) ? report.gates : [];
  const failedGates = gates.filter((gate) => gate.ok === false || gate.status !== 0);
  const gateLabels = gates.map((gate) => gate.label);
  const missingGates = EXPECTED_GATE_LABELS.filter((label) => !gateLabels.includes(label));
  const unexpectedGates = gateLabels.filter((label) => !EXPECTED_GATE_LABELS.includes(label));

  const result = {
    ok: Boolean(report.ok) && failedGates.length === 0,
    file: resolved,
    mode: report.mode || null,
    started_at: report.started_at || null,
    completed_at: report.completed_at || null,
    production_deployment: report.production_deployment === true,
    online_payments_expected: report.online_payments_expected || null,
    backup_path: report.backup_path || null,
    gates_count: gates.length,
    failed_gate: report.failed_gate || null,
    failed_gates: failedGates.map((gate) => ({
      label: gate.label,
      status: gate.status,
      signal: gate.signal || null,
    })),
    missing_gates: missingGates,
    unexpected_gates: unexpectedGates,
  };

  if (result.mode !== 'staging-full-validation') {
    fail('Signoff report is not a staging-full-validation report.', result);
  }

  if (!result.completed_at) {
    fail('Signoff report is missing completed_at.', result);
  }

  if (result.production_deployment) {
    fail('Signoff report claims production deployment; staging signoff must never mutate production.', result);
  }

  if (result.online_payments_expected !== 'disabled') {
    fail('Signoff report does not prove online payments stayed disabled during validation.', result);
  }

  if (!result.ok) {
    fail('Staging signoff is validly signed but not production-ready.', result);
  }

  if (report.error || result.failed_gate) {
    fail('Successful staging signoff must not contain runner error or failed_gate.', result);
  }

  if (!result.backup_path) {
    fail('Successful staging signoff is missing backup_path.', result);
  }

  if (missingGates.length > 0 || unexpectedGates.length > 0 || gates.length !== EXPECTED_GATE_LABELS.length) {
    fail('Successful staging signoff does not contain the exact required gate set.', result);
  }

  console.log(JSON.stringify(result, null, 2));
}

main();

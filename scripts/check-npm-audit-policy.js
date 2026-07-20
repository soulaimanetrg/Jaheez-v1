#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const cacheDir = path.join(root, '.npm-cache');

const targets = [
  { name: 'root', dir: root, requireZero: true },
  { name: 'backend', dir: path.join(root, 'backend'), requireZero: true },
  { name: 'admin', dir: path.join(root, 'frontend', 'admin'), requireZero: true },
  { name: 'customer app', dir: path.join(root, 'frontend', 'user-app'), requireZero: false },
  { name: 'driver app', dir: path.join(root, 'frontend', 'driver-app'), requireZero: false },
];

function parseAuditOutput(output) {
  const text = String(output || '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('npm audit did not return JSON');
  return JSON.parse(text.slice(start, end + 1));
}

function severityCount(report, severity) {
  return Number(report.metadata?.vulnerabilities?.[severity] || 0);
}

const failures = [];
const summary = [];

fs.mkdirSync(cacheDir, { recursive: true });

for (const target of targets) {
  const result = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', `${npm} audit --json --cache "${cacheDir}"`], {
      cwd: target.dir,
      encoding: 'utf8',
      windowsHide: true,
    })
    : spawnSync(npm, ['audit', '--json', '--cache', cacheDir], {
    cwd: target.dir,
    encoding: 'utf8',
    windowsHide: true,
    });

  let report;
  try {
    report = parseAuditOutput(`${result.stdout || ''}\n${result.stderr || ''}`);
  } catch (error) {
    failures.push(`${target.name}: ${error.message}`);
    continue;
  }

  const counts = {
    critical: severityCount(report, 'critical'),
    high: severityCount(report, 'high'),
    moderate: severityCount(report, 'moderate'),
    low: severityCount(report, 'low'),
    total: severityCount(report, 'total'),
  };
  summary.push({ target: target.name, ...counts });

  if (counts.critical > 0 || counts.high > 0) {
    failures.push(`${target.name}: high/critical npm audit findings are not allowed`);
  }

  if (target.requireZero && counts.total > 0) {
    failures.push(`${target.name}: expected zero npm audit findings, found ${counts.total}`);
  }
}

if (failures.length > 0) {
  console.error('NPM audit policy failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(JSON.stringify({ summary }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  policy: 'zero findings for root/backend/admin; no high or critical findings anywhere',
  summary,
}, null, 2));

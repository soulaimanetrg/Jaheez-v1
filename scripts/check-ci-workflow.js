#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'ci.yml');

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, error: message, ...details }, null, 2));
  process.exit(1);
}

if (!fs.existsSync(workflowPath)) {
  fail('CI workflow is missing.', { file: '.github/workflows/ci.yml' });
}

const text = fs.readFileSync(workflowPath, 'utf8');

const required = [
  { name: 'CI uses Node 20', pattern: /node-version:\s*20/ },
  { name: 'CI has local release gate job', pattern: /local-release-gates:/ },
  { name: 'CI installs root dependencies', pattern: /Install root dependencies[\s\S]*?npm ci/ },
  { name: 'CI installs backend dependencies', pattern: /Install backend dependencies[\s\S]*?working-directory:\s*backend/ },
  { name: 'CI installs admin dependencies', pattern: /Install admin dependencies[\s\S]*?working-directory:\s*frontend\/admin/ },
  { name: 'CI installs customer app dependencies', pattern: /Install customer app dependencies[\s\S]*?working-directory:\s*frontend\/user-app/ },
  { name: 'CI installs driver app dependencies', pattern: /Install driver app dependencies[\s\S]*?working-directory:\s*frontend\/driver-app/ },
  { name: 'CI runs full local release gates', pattern: /npm\s+run\s+verify:local/ },
];

const missing = required.filter((check) => !check.pattern.test(text)).map((check) => check.name);
if (missing.length > 0) fail('CI workflow contract failed.', { missing });

console.log('CI workflow lint passed.');

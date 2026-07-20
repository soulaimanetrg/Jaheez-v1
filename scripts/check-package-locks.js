#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const packageRoots = [
  '.',
  'backend',
  'frontend/admin',
  'frontend/user-app',
  'frontend/driver-app',
];

const failures = [];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    failures.push(`${path.relative(root, file)} is not valid JSON: ${error.message}`);
    return null;
  }
}

function sortedObject(value) {
  return Object.fromEntries(Object.entries(value || {}).sort(([a], [b]) => a.localeCompare(b)));
}

function compareDependencyBlock(scope, packageDeps, lockDeps) {
  const expected = sortedObject(packageDeps);
  const actual = sortedObject(lockDeps);
  const expectedText = JSON.stringify(expected);
  const actualText = JSON.stringify(actual);
  if (expectedText !== actualText) {
    failures.push(`${scope} dependency block is out of sync with package-lock.json`);
  }
}

for (const packageRoot of packageRoots) {
  const absoluteRoot = path.join(root, packageRoot);
  const displayRoot = packageRoot === '.' ? 'root' : packageRoot;
  const packagePath = path.join(absoluteRoot, 'package.json');
  const lockPath = path.join(absoluteRoot, 'package-lock.json');

  if (!fs.existsSync(packagePath)) {
    failures.push(`${displayRoot} is missing package.json`);
    continue;
  }

  if (!fs.existsSync(lockPath)) {
    failures.push(`${displayRoot} is missing package-lock.json`);
    continue;
  }

  const pkg = readJson(packagePath);
  const lock = readJson(lockPath);
  if (!pkg || !lock) continue;

  if (!lock.lockfileVersion || Number(lock.lockfileVersion) < 3) {
    failures.push(`${displayRoot} package-lock.json must use npm lockfileVersion 3 or newer`);
  }

  const rootPackage = lock.packages && lock.packages[''];
  if (!rootPackage) {
    failures.push(`${displayRoot} package-lock.json is missing packages[""] root metadata`);
    continue;
  }

  compareDependencyBlock(`${displayRoot} dependencies`, pkg.dependencies, rootPackage.dependencies);
  compareDependencyBlock(`${displayRoot} devDependencies`, pkg.devDependencies, rootPackage.devDependencies);

  if (pkg.name && rootPackage.name && pkg.name !== rootPackage.name) {
    failures.push(`${displayRoot} package name differs between package.json and package-lock.json`);
  }

  if (pkg.version && rootPackage.version && pkg.version !== rootPackage.version) {
    failures.push(`${displayRoot} package version differs between package.json and package-lock.json`);
  }
}

if (failures.length > 0) {
  console.error('Package lock consistency check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Package lock consistency check passed.');

'use strict';

require('dotenv').config({ path: '.env.staging.local' });
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '../.env' });

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function adbPath() {
  if (process.platform !== 'win32') return 'adb';
  return path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe');
}

function hashId(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

function fail(message, details = {}) {
  console.error(JSON.stringify({
    ok: false,
    error: message,
    ...details,
    next_actions: [
      'Install Android platform-tools if adb is missing.',
      'Connect two Android devices by USB or authorized wireless debugging.',
      'Accept the RSA authorization prompt on each device.',
      'Run `adb devices -l` locally to confirm both show the `device` state.',
    ],
  }, null, 2));
  process.exit(1);
}

const adb = adbPath();

if (process.env.JAHEEZ_TARGET_ENV !== 'staging' || process.env.STAGING_CONFIRM_ISOLATED !== 'true') {
  fail('Device readiness must run only for confirmed isolated staging.', {
    target_env: process.env.JAHEEZ_TARGET_ENV || null,
    staging_confirm_isolated: process.env.STAGING_CONFIRM_ISOLATED || null,
  });
}

if (process.platform === 'win32' && !fs.existsSync(adb)) {
  fail('ADB unavailable.', { adb_path_checked: adb });
}

const version = spawnSync(adb, ['version'], { encoding: 'utf8', windowsHide: true });
if (version.error || version.status !== 0) {
  fail('ADB failed to start.', {
    status: version.status,
    stderr: (version.stderr || '').trim().slice(0, 500) || null,
  });
}

const result = spawnSync(adb, ['devices', '-l'], { encoding: 'utf8', windowsHide: true });
if (result.error || result.status !== 0) {
  fail('ADB device listing failed.', {
    status: result.status,
    stderr: (result.stderr || '').trim().slice(0, 500) || null,
  });
}

const rows = (result.stdout || '')
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [serial, state = 'unknown'] = line.split(/\s+/);
    return { serial_hash: hashId(serial), state };
  });

const authorized = rows.filter((row) => row.state === 'device');
const unauthorized = rows.filter((row) => row.state === 'unauthorized');
const offline = rows.filter((row) => row.state === 'offline');
const uniqueAuthorizedHashes = new Set(authorized.map((row) => row.serial_hash));

if (authorized.length < 2 || uniqueAuthorizedHashes.size < 2) {
  fail(`Two distinct authorized Android devices required; found ${authorized.length}.`, {
    adb: (version.stdout || '').split(/\r?\n/)[0],
    authorized_count: authorized.length,
    distinct_authorized_count: uniqueAuthorizedHashes.size,
    unauthorized_count: unauthorized.length,
    offline_count: offline.length,
    detected_devices: rows,
  });
}

console.log(JSON.stringify({
  ok: true,
  adb: (version.stdout || '').split(/\r?\n/)[0],
  authorized_count: authorized.length,
  distinct_authorized_count: uniqueAuthorizedHashes.size,
  devices: authorized.map((device) => ({ serial_hash: device.serial_hash, state: device.state })),
}, null, 2));

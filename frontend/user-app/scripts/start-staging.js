'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

const appRoot = path.resolve(__dirname, '..');
const stagingEnvPath = path.resolve(appRoot, '../../backend/.env.staging.local');

if (!fs.existsSync(stagingEnvPath)) {
  throw new Error('Missing backend/.env.staging.local. Refusing to fall back to production.');
}

const staging = dotenv.parse(fs.readFileSync(stagingEnvPath, 'utf8'));
if (staging.JAHEEZ_TARGET_ENV !== 'staging' || staging.STAGING_CONFIRM_ISOLATED !== 'true') {
  throw new Error('Isolated staging confirmation is required.');
}

for (const key of ['STAGING_SUPABASE_URL', 'STAGING_ANON_KEY']) {
  if (!staging[key]) throw new Error(`${key} is required for the staging customer app.`);
}

const command = process.argv[2];
const expoArgs = command === 'android'
  ? ['expo', 'run:android']
  : ['expo', 'start', '--clear', '--port', '8082'];
const expoCli = require.resolve('expo/bin/cli');
const child = spawn(process.execPath, [expoCli, ...expoArgs.slice(1)], {
  cwd: appRoot,
  stdio: 'inherit',
  windowsHide: false,
  env: {
    ...process.env,
    EXPO_PUBLIC_SUPABASE_URL: staging.STAGING_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: staging.STAGING_ANON_KEY,
    EXPO_PUBLIC_ADMIN_API_BASE: process.env.EXPO_PUBLIC_ADMIN_API_BASE || 'http://10.0.2.2:3002',
    JAHEEZ_TARGET_ENV: 'staging',
  },
});

child.once('error', (error) => {
  console.error(`Unable to start staging Expo: ${error.message}`);
  process.exit(1);
});
child.once('exit', (code) => process.exit(code ?? 1));

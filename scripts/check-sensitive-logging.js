#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const activeRoots = [
  'backend/src',
  'frontend/admin/src',
  'frontend/user-app/app',
  'frontend/user-app/features',
  'frontend/user-app/hooks',
  'frontend/user-app/lib',
  'frontend/driver-app/app',
  'frontend/driver-app/features',
  'frontend/driver-app/hooks',
  'frontend/driver-app/lib',
];

const fileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

const logCall = /\b(?:console\.(?:log|warn|error)|logger\.(?:debug|info|warn|error))\b/;

const forbiddenLogPatterns = [
  {
    name: 'token/authorization/secret material in logs',
    pattern: /\b(?:access_token|refresh_token|authorization|bearer|admin_jwt_secret|service_role|anon_key|api_key|webhook_secret|stripe_secret|tokenStore|getToken|saveToken)\b/i,
  },
  {
    name: 'password/OTP/confirmation material in logs',
    pattern: /\b(?:password|otp_proof|confirmation_code|delivery_confirmation_code|verification code|otp code)\b/i,
  },
  {
    name: 'raw coordinate fields in logs',
    pattern: /\b(?:current_lat|current_lng|delivery_lat|delivery_lng|latitude|longitude|lat=|lng=)\b/i,
  },
  {
    name: 'raw idempotency key in logs',
    pattern: /\b(?:idempotencyKey|idempotency_key|Idempotency-Key)\b/,
  },
  {
    name: 'raw phone value in logs',
    pattern: /\b(?:normalized|phone)\s*[:}]|\$\{[^}]*phone[^}]*\}/i,
  },
  {
    name: 'raw provider response/body in logs',
    pattern: /\b(?:JSON\.stringify\(resp\.body\)|resp\.body|response\.body)\b/i,
  },
  {
    name: 'Supabase URL/project endpoint in logs',
    pattern: /\bSupabase\b.*\b(?:SUPABASE_URL|url)\b/i,
  },
];

const allowed = [
  /phone_hash/,
  /Phone provider disabled/i,
  /Invalid Expo push token rejected/,
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (fileExtensions.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function isAllowed(line) {
  return allowed.some((rx) => rx.test(line));
}

const violations = [];

for (const rootDir of activeRoots) {
  const abs = path.join(root, rootDir);
  for (const file of walk(abs)) {
    const rel = path.relative(root, file).replace(/\\/g, '/');
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!logCall.test(line) || isAllowed(line)) return;
      for (const rule of forbiddenLogPatterns) {
        if (rule.pattern.test(line)) {
          violations.push(`${rel}:${index + 1}: ${rule.name}: ${line.trim()}`);
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error('Sensitive logging lint failed. Redact secrets, credentials, OTPs, phone numbers, payment references, and precise coordinates.');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Sensitive logging lint passed.');

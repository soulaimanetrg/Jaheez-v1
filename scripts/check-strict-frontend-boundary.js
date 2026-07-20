#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const activeRoots = [
  'frontend/user-app/app',
  'frontend/user-app/features',
  'frontend/user-app/hooks',
  'frontend/user-app/lib',
  'frontend/user-app/constants',
  'frontend/driver-app/app',
  'frontend/driver-app/features',
  'frontend/driver-app/hooks',
  'frontend/driver-app/lib',
  'frontend/admin/src',
];

const fileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

function normalize(file) {
  return file.replace(/\\/g, '/');
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'build', '.expo', 'coverage', 'android', 'ios'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (fileExtensions.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function isApiClient(rel) {
  const file = normalize(rel);
  return (
    /frontend\/user-app\/lib\/(?:adminApi|api|authApi|backendApi|infobipOtp|notificationInbox|orderApi|storeApi|supportApi|walletApi)\.ts$/.test(file) ||
    /frontend\/user-app\/features\/[^/]+\/services\/[^/]+\.(ts|tsx)$/.test(file) ||
    /frontend\/driver-app\/lib\/api\.ts$/.test(file) ||
    /frontend\/driver-app\/features\/[^/]+\/services\/[^/]+\.(ts|tsx)$/.test(file) ||
    /frontend\/admin\/src\/features\/[^/]+\/services\/[^/]+\.(ts|tsx)$/.test(file) ||
    /frontend\/admin\/src\/lib\/(?:adminApi|api|token|money)\.ts$/.test(file)
  );
}

function isScreenOrComponent(rel) {
  const file = normalize(rel);
  return (
    /\/app\/.*\.(tsx|jsx)$/.test(file) ||
    /\/views\/.*\.(tsx|jsx)$/.test(file) ||
    /\/components\/.*\.(tsx|jsx)$/.test(file)
  );
}

function allowedSupabaseClientFile(rel) {
  // Existing files may temporarily define clients during migration, but production UI
  // must not import or use them for business table access.
  return /frontend\/(?:user-app|admin)\/src?\/?lib\/supabase\.ts$/.test(normalize(rel)) ||
    /frontend\/user-app\/lib\/supabase\.ts$/.test(normalize(rel));
}

const rules = [
  {
    name: 'frontend direct Supabase table access is forbidden',
    pattern: /\bsupabase\s*\.\s*from\s*\(/,
    applies: () => true,
  },
  {
    name: 'frontend Supabase client creation is forbidden outside approved migration shim',
    pattern: /\bcreateClient\s*\(/,
    applies: (rel) => !allowedSupabaseClientFile(rel),
  },
  {
    name: 'frontend Supabase JS import is forbidden outside approved migration shim',
    pattern: /@supabase\/supabase-js/,
    applies: (rel) => !allowedSupabaseClientFile(rel),
  },
  {
    name: 'frontend direct fetch is allowed only in approved API client/service files',
    pattern: /\bfetch\s*\(/,
    applies: (rel) => !isApiClient(rel),
  },
  {
    name: 'production frontend mock/fallback data path is forbidden',
    pattern: /\b(?:mockData|fallbackApi)\b/,
    applies: () => true,
  },
  {
    name: 'screen-level checkout/pricing calculation is forbidden',
    pattern: /\b(?:SERVICE_FEE|promoDiscount|finalTotal|subtotal\s*[+\-*/]|delivery_fee\s*[+\-*/]|riderTip\s*[+\-*/]|discount\s*[+\-*/])\b/,
    applies: (rel) => isScreenOrComponent(rel),
  },
  {
    name: 'raw centime/internal finance field exposed in frontend',
    pattern: /\b(?:amount|balance|cod_balance|earnings|total|delivery_fee|tip|commission|payable|held|refund|wallet|payout)_centimes\b/,
    applies: () => true,
  },
  {
    name: 'frontend must not reference service-role or fraud internals',
    pattern: /\b(?:service_role|SERVICE_ROLE|fraud_threshold|ledger_internal|driver_earnings_ledger|reliability_point_events)\b/,
    applies: () => true,
  },
  {
    name: 'legacy/paused online payment provider reference in frontend',
    pattern: /\b(?:Stripe|stripe|STRIPE_)\b/,
    applies: () => true,
  },
  {
    name: 'hardcoded demo/test business data in production frontend',
    pattern: /(?:\b(?:Pizza Palace|Ocean Restaurant|admin123|testpassword|demo order|demo store|fake order)\b|مطعم المحيط)/i,
    applies: () => true,
  },
  {
    name: 'frontend console logging must not be in production paths',
    pattern: /\bconsole\.(?:log|warn|error)\s*\(/,
    applies: (rel, line) => !/\b__DEV__\b/.test(line),
  },
];

const violations = [];

const preExistingExceptions = new Set([
  'frontend/user-app/app/(flows)/order/[id].tsx',
  'frontend/user-app/app/(flows)/store/[id].tsx',
  'frontend/user-app/features/auth/services/authApi.ts',
  'frontend/user-app/features/stores/services/storeApi.ts',
  'frontend/user-app/features/stores/store/platformStore.ts',
  'frontend/user-app/hooks/useNetworkStatus.ts',
  'frontend/user-app/hooks/usePushNotifications.ts',
  'frontend/user-app/lib/fallbackApi.ts',
  'frontend/user-app/lib/maps.ts',
  'frontend/user-app/lib/modernmt.ts',
  'frontend/user-app/lib/supabase.ts',
  'frontend/driver-app/features/delivery/views/DriverDashboardScreen.tsx',
  'frontend/driver-app/hooks/useDriverHeartbeat.ts',
  'frontend/driver-app/hooks/useDriverRealtime.ts',
  'frontend/admin/src/context/LanguageContext.tsx',
  'frontend/admin/src/features/auth/views/login.tsx',
  'frontend/admin/src/features/content/views/app-content.tsx',
  'frontend/admin/src/features/settings/views/cities.tsx',
  'frontend/admin/src/features/settings/views/service-categories.tsx',
  'frontend/admin/src/features/settings/views/settings.tsx',
  'frontend/admin/src/features/settings/views/vehicle-types.tsx',
  'frontend/admin/src/lib/supabase.ts',
  'frontend/user-app/app/(auth)/register.tsx',
  'frontend/user-app/app/(auth)/splash.tsx',
  'frontend/user-app/app/(auth)/welcome.tsx',
  'frontend/user-app/app/(flows)/delete-account.tsx',
]);

for (const rootDir of activeRoots) {
  const absRoot = path.join(root, rootDir);
  for (const file of walk(absRoot)) {
    const rel = normalize(path.relative(root, file));
    if (preExistingExceptions.has(rel)) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of rules) {
        if (!rule.applies(rel, line)) continue;
        if (rule.pattern.test(line)) {
          violations.push({
            file: rel,
            line: index + 1,
            rule: rule.name,
            code: line.trim().slice(0, 220),
          });
        }
      }
    });
  }
}


if (violations.length > 0) {
  const maxPrint = Number(process.env.STRICT_FRONTEND_BOUNDARY_MAX || 120);
  console.error('Strict frontend boundary lint failed.');
  console.error('Frontend must be display-only. Move data access, pricing, promos, permissions, fraud, finance, dispatch, and DB access to backend MVC.');
  console.error(`Violations: ${violations.length}`);
  for (const violation of violations.slice(0, maxPrint)) {
    console.error(`- ${violation.file}:${violation.line}: ${violation.rule}: ${violation.code}`);
  }
  if (violations.length > maxPrint) {
    console.error(`... ${violations.length - maxPrint} more violation(s). Set STRICT_FRONTEND_BOUNDARY_MAX to print more.`);
  }
  process.exit(1);
}

console.log('Strict frontend boundary lint passed.');

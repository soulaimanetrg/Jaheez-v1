#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, error: message, ...details }, null, 2));
  process.exit(1);
}

function requireIncludes(file, snippets) {
  const text = read(file);
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  if (missing.length > 0) fail('Route security contract failed.', { file, missing });
}

function requireRegex(file, checks) {
  const text = read(file);
  const missing = checks.filter(({ pattern }) => !pattern.test(text)).map(({ name }) => name);
  if (missing.length > 0) fail('Route security contract failed.', { file, missing });
}

function forbidRegex(file, checks) {
  const text = read(file);
  const present = checks.filter(({ pattern }) => pattern.test(text)).map(({ name }) => name);
  if (present.length > 0) fail('Forbidden route/security pattern found.', { file, present });
}

requireIncludes('backend/src/features/auth/customerAuth.routes.ts', [
  "router.post('/auth/register', authLimiter, validate(customerRegisterSchema), controller.customerRegister);",
  "router.post('/auth/login', authLimiter, validate(customerLoginSchema), controller.customerLogin);",
]);

requireIncludes('backend/src/features/auth/driverAuth.routes.ts', [
  "router.post(",
  "'/driver/login'",
  'authLimiter',
  'controller.driverLogin',
]);

forbidRegex('backend/src/features/auth/driverAuth.routes.ts', [
  {
    name: 'driver self-registration route must stay absent',
    pattern: /register|signup|sign-up/i,
  },
]);

requireRegex('backend/src/features/auth/driverAuth.controller.ts', [
  {
    name: 'legacy driver OTP login fails closed',
    pattern: /otp_proof[\s\S]*?status\(410\)[\s\S]*?CIN and password provided by JAHEEZ administration/,
  },
]);

requireIncludes('backend/src/features/finance/finance.routes.ts', [
  'router.use(adminAuth);',
  "router.use(requireRole('super_admin', 'finance'));",
  "router.patch('/payouts/:id', controller.updatePayout);",
  "router.post('/cod-settlements', controller.createCODSettlement);",
]);

requireIncludes('backend/src/features/commission/commission.routes.ts', [
  "router.use(adminAuth, requireRole('super_admin'));",
  "router.post('/commission/rates', validate(commissionRateSchema), controller.createRate);",
  "router.post('/commission/overrides', validate(driverCommissionOverrideSchema), controller.createOverride);",
]);

requireIncludes('backend/src/features/reliability/reliability.routes.ts', [
  "router.use(adminAuth, requireRole('super_admin', 'operations'));",
  "router.post('/reliability/delays/:id/overturn', validate(overturnDelaySchema), controller.overturn);",
]);

requireRegex('backend/src/features/admin/admin.routes.ts', [
  {
    name: 'driver creation limited to super_admin/operations',
    pattern: /\/v1\/admin\/drivers[\s\S]*?requireRole\('super_admin', 'operations'\)[\s\S]*?controller\.createDriver/,
  },
  {
    name: 'driver password reset limited to super_admin/operations',
    pattern: /\/v1\/admin\/drivers\/:id\/reset-password[\s\S]*?requireRole\('super_admin', 'operations'\)[\s\S]*?controller\.resetDriverPassword/,
  },
]);

requireRegex('backend/src/features/driver/driver.routes.ts', [
  {
    name: 'driver self payout stays disabled',
    pattern: /router\.post\([\s\S]*?['"]\/driver\/payouts['"][\s\S]*?driverAuth[\s\S]*?status\(410\)/,
  },
]);

requireRegex('backend/src/features/order/customerOrder.routes.ts', [
  {
    name: 'checkout requires customer JWT',
    pattern: /\/v1\/checkout[\s\S]*?verifySupabaseJwt[\s\S]*?validate\(checkoutSchema\)[\s\S]*?controller\.createOrder/,
  },
  {
    name: 'online payment session creation requires customer JWT while provider is paused',
    pattern: /\/v1\/payments\/online\/session[\s\S]*?verifySupabaseJwt[\s\S]*?controller\.createOnlinePaymentSession/,
  },
  {
    name: 'online payment session verification requires customer JWT while provider is paused',
    pattern: /\/v1\/payments\/online\/session\/:sessionId[\s\S]*?verifySupabaseJwt[\s\S]*?controller\.verifyOnlinePaymentSession/,
  },
]);

requireRegex('backend/src/features/order/legacyPayment.routes.ts', [
  {
    name: 'legacy Stripe webhook is gone/410',
    pattern: /\/stripe\/webhook[\s\S]*?status\(410\)/,
  },
  {
    name: 'legacy Stripe checkout/session routes are gone/410',
    pattern: /\/stripe\/checkout-session[\s\S]*?\/stripe\/session\/\*[\s\S]*?status\(410\)/,
  },
]);

requireIncludes('backend/src/features/payments/paymentProvider.factory.ts', [
  'return new DisabledPaymentProviderAdapter(provider);',
]);

requireRegex('backend/src/features/store/store.routes.ts', [
  {
    name: 'partner store-ready identity comes from credential middleware',
    pattern: /\/v1\/store\/orders\/:orderId\/ready[\s\S]*?storeReadyLimiter[\s\S]*?storePartnerAuth[\s\S]*?validate\(storeReadySchema\)[\s\S]*?markReadyAsPartner/,
  },
  {
    name: 'admin store-ready is operations/super_admin only',
    pattern: /\/stores\/:storeId\/orders\/:orderId\/ready[\s\S]*?adminAuth[\s\S]*?requireRole\('super_admin', 'operations'\)[\s\S]*?validate\(storeReadySchema\)/,
  },
]);

console.log('Route security contract lint passed.');

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];

function read(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    failures.push(`${rel} is missing`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
}

function requirePattern(rel, name, pattern) {
  const text = read(rel);
  if (!pattern.test(text)) failures.push(`${rel}: missing invariant: ${name}`);
}

function forbidPattern(rel, name, pattern) {
  const text = read(rel);
  if (pattern.test(text)) failures.push(`${rel}: forbidden while payments are paused: ${name}`);
}

const env = read('backend/src/config/env.ts');
const factory = read('backend/src/features/payments/paymentProvider.factory.ts');
const service = read('backend/src/features/payments/paymentProvider.service.ts');
const disabledAdapter = read('backend/src/features/payments/disabledPaymentProvider.adapter.ts');
const types = read('backend/src/features/payments/paymentProvider.types.ts');
const routes = read('backend/src/features/order/legacyPayment.routes.ts');

if (!/PAYMENT_PROVIDER:\s*z\.enum\(\['disabled', 'manual', 'cmi', 'payzone', 'cashplus'\]\)\.default\('disabled'\)/.test(env)) {
  failures.push('backend/src/config/env.ts: PAYMENT_PROVIDER must stay disabled-by-default and Moroccan-provider-only');
}

requirePattern(
  'backend/src/config/env.ts',
  'ONLINE_PAYMENTS_ENABLED defaults false',
  /ONLINE_PAYMENTS_ENABLED:[\s\S]*?default\(false\)/
);
requirePattern(
  'backend/src/config/env.ts',
  'provider must be disabled when online payments are false',
  /PAYMENT_PROVIDER must be disabled while ONLINE_PAYMENTS_ENABLED=false/
);
requirePattern(
  'backend/src/config/env.ts',
  'production online payments require explicit provider',
  /Production online payments require an explicit Moroccan-compatible PAYMENT_PROVIDER/
);

if (!/if\s*\(!env\.ONLINE_PAYMENTS_ENABLED\s*\|\|\s*provider\s*===\s*'disabled'\)[\s\S]*?return new DisabledPaymentProviderAdapter\(provider\)/.test(factory)) {
  failures.push('paymentProvider.factory.ts: paused or disabled payments must return DisabledPaymentProviderAdapter');
}

if (!/return new DisabledPaymentProviderAdapter\(provider\);\s*$/m.test(factory)) {
  failures.push('paymentProvider.factory.ts: unknown/unimplemented providers must fail closed through DisabledPaymentProviderAdapter');
}

forbidPattern(
  'backend/src/features/payments/paymentProvider.factory.ts',
  'live provider adapter construction',
  /new\s+(?!DisabledPaymentProviderAdapter\b)[A-Z][A-Za-z0-9]*PaymentProviderAdapter\s*\(/
);

for (const rel of [
  'backend/src/features/payments/paymentProvider.factory.ts',
  'backend/src/features/payments/paymentProvider.service.ts',
  'backend/src/features/payments/paymentProvider.types.ts',
  'backend/src/features/payments/disabledPaymentProvider.adapter.ts',
  'backend/src/features/order/checkout.service.ts',
  'backend/src/features/order/checkout.controller.ts',
]) {
  forbidPattern(rel, 'Stripe/import/secret dependency', /\b(?:Stripe|stripeClient|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|stripe\.)\b/);
}

if (!/return false;/.test(disabledAdapter) || !/Online payment checkout is paused/.test(disabledAdapter) || !/Online payment verification is paused/.test(disabledAdapter)) {
  failures.push('disabledPaymentProvider.adapter.ts: disabled adapter must report not ready and reject checkout/verification');
}

if (!/online_payments_enabled:\s*onlineEnabled/.test(service) || !/card_checkout_enabled:\s*onlineEnabled/.test(service)) {
  failures.push('paymentProvider.service.ts: public status must derive online/card enabled from adapter readiness');
}

if (!/supported_future_providers:\s*\['cmi', 'payzone', 'cashplus', 'manual'\]/.test(service)) {
  failures.push('paymentProvider.service.ts: future provider list must be Moroccan-compatible and provider-neutral');
}

if (!/PaymentProviderId\s*=\s*'disabled'\s*\|\s*'manual'\s*\|\s*'cmi'\s*\|\s*'payzone'\s*\|\s*'cashplus'/.test(types)) {
  failures.push('paymentProvider.types.ts: provider ids must stay limited to disabled/manual/cmi/payzone/cashplus');
}

if (!/\/stripe\/webhook[\s\S]*?status\(410\)/.test(routes) || !/\/stripe\/checkout-session[\s\S]*?status\(410\)/.test(routes)) {
  failures.push('legacyPayment.routes.ts: legacy Stripe routes must remain 410 Gone while paused');
}

if (failures.length > 0) {
  console.error('Payment provider safety check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Payment provider safety check passed.');

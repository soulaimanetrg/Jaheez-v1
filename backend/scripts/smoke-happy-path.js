'use strict';

// JAHEEZ end-to-end happy-path smoke test (2026-07 hardening contract).
//
// Drives the full lifecycle over HTTP against a running backend:
//   register customer -> checkout (idempotent) -> offer -> claim ->
//   pickup (confirmation code REQUIRED) -> deliver (confirmation code
//   REQUIRED) -> assert commission ledger + COD + financial_finalized_at.
//
// Also asserts today's security invariants hold live:
//   - legacy /pickup and /deliver bypass routes are gone (404)
//   - stage transitions without the confirmation code are rejected
//   - a second driver cannot claim an order offered to the first
//   - a deactivated driver loses API access (token revocation)
//
// Usage:
//   node scripts/smoke-happy-path.js            (backend .env / staging env)
//   SMOKE_API_BASE=http://localhost:3002 node scripts/smoke-happy-path.js
//
// Requires service-role DB access for fixture setup/teardown; everything the
// apps would do goes through the HTTP API. Never run against production.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.staging.local') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const BASE_URL = (process.env.SMOKE_API_BASE || process.env.STAGING_API_BASE || `http://localhost:${process.env.PORT || 3002}`).replace(/\/$/, '');

if (process.env.JAHEEZ_TARGET_ENV === 'production') {
  console.error('[FATAL] Refusing to run the smoke test against a production target.');
  process.exit(1);
}
for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'ADMIN_JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing ${key} in environment.`);
    process.exit(1);
  }
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const DRIVER_JWT_SECRET = process.env.DRIVER_JWT_SECRET || process.env.ADMIN_JWT_SECRET;

let passed = 0;
let failed = 0;
const cleanup = { userIds: [], driverIds: [], driverUserIds: [], orderIds: [] };

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS ${name}`);
    passed += 1;
  } else {
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  }
}

async function req(path, { method = 'POST', body, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = {};
  try { json = await res.json(); } catch { /* non-JSON responses keep {} */ }
  return { status: res.status, body: json };
}

function randomPhone() {
  return `+2126${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function signDriverToken(driverId, userId, phone) {
  return jwt.sign(
    { driver_id: driverId, user_id: userId, phone, kind: 'driver', actor: 'driver', sub: driverId },
    DRIVER_JWT_SECRET,
    { expiresIn: '1h' },
  );
}

async function createDriverFixture(label) {
  const phone = randomPhone();
  const email = `smoke-${label}-${phone.replace(/\D/g, '')}@jaheez.app`;
  const { data: { user }, error: userErr } = await sb.auth.admin.createUser({ email, password: crypto.randomBytes(18).toString('hex'), email_confirm: true });
  if (userErr || !user) throw new Error(`driver auth user creation failed: ${userErr?.message}`);
  cleanup.driverUserIds.push(user.id);
  await sb.from('users').update({ role: 'driver', phone }).eq('id', user.id);
  const { data: drv, error: drvErr } = await sb.from('drivers').insert({
    user_id: user.id,
    full_name: `Smoke Driver ${label}`,
    phone,
    is_verified: true,
    is_online: true,
    is_active: true,
    kyc_status: 'verified',
  }).select('id').single();
  if (drvErr || !drv) throw new Error(`driver insert failed: ${drvErr?.message}`);
  cleanup.driverIds.push(drv.id);
  return { driverId: drv.id, userId: user.id, phone, token: signDriverToken(drv.id, user.id, phone) };
}

async function run() {
  console.log(`\nJAHEEZ happy-path smoke test — ${BASE_URL}\n`);

  // ── 0. Backend reachable ─────────────────────────────────────────────
  const health = await req('/health', { method: 'GET' });
  assert('backend /health responds', health.status === 200 || health.status === 503, `status ${health.status}`);
  if (health.status !== 200) {
    throw new Error('Backend unhealthy (Redis required but missing?) — aborting.');
  }

  // ── 1. Store + menu fixture ──────────────────────────────────────────
  const { data: store } = await sb.from('stores')
    .select('id, delivery_fee').eq('is_open', true).not('delivery_fee', 'is', null).limit(1).maybeSingle();
  if (!store) throw new Error('No open store with a delivery fee found; seed staging first.');
  const { data: menuItem } = await sb.from('menu_items')
    .select('id, price, promo_price, promo_until').eq('store_id', store.id).eq('is_available', true).eq('options', '[]').limit(1).maybeSingle();
  if (!menuItem) throw new Error(`No optionless available menu item in store ${store.id}.`);
  console.log(`Using store ${store.id}, item ${menuItem.id}`);

  // ── 2. Customer registration + bootstrap (mirrors the app flow) ──────
  const customerPhone = randomPhone();
  const customerPassword = crypto.randomBytes(18).toString('hex');
  const register = await req('/admin-api/auth/register', {
    body: { phone: customerPhone, password: customerPassword, full_name: 'Smoke Customer', city: 'آسفي' },
  });
  assert('customer registration succeeds', register.status === 200 || register.status === 201, `status ${register.status}: ${JSON.stringify(register.body)}`);
  const customerToken = register.body.session?.access_token;
  if (!customerToken) throw new Error(`Registration returned no session token: ${JSON.stringify(register.body).slice(0, 300)}`);

  // Bootstrap creates the public.users profile row, exactly as the app does
  // on first launch after registration.
  const bootstrap = await req('/admin-api/auth/customer/bootstrap', {
    headers: { Authorization: `Bearer ${customerToken}` },
    body: { full_name: 'Smoke Customer', city: 'آسفي', language: 'fr' },
  });
  assert('customer bootstrap succeeds', bootstrap.status === 200, `status ${bootstrap.status}: ${JSON.stringify(bootstrap.body)}`);
  const customerId = jwt.decode(customerToken)?.sub;
  if (!customerId) throw new Error('Could not extract customer id from access token.');
  cleanup.userIds.push(customerId);

  // Order-readiness prerequisites the app would normally complete.
  await sb.from('users').update({ profile_completed_at: new Date().toISOString(), phone_e164: customerPhone }).eq('id', customerId);
  await sb.from('user_addresses').insert({
    user_id: customerId, label: 'Domicile', address: '123 Rue Smoke, Safi',
    lat: 32.2994, lng: -9.2372, is_default: true,
  });

  // ── 3. Checkout preview + idempotent checkout ────────────────────────
  const checkoutPayload = {
    store_id: store.id,
    items: [{ menu_item_id: menuItem.id, quantity: 2 }],
    delivery_address: '123 Rue Smoke, Safi',
    delivery_lat: 32.2994,
    delivery_lng: -9.2372,
    payment_method: 'cash',
    rider_tip: 5,
  };

  const preview = await req('/admin-api/v1/checkout/preview', {
    headers: { Authorization: `Bearer ${customerToken}` },
    body: { store_id: store.id, items: checkoutPayload.items, payment_method: 'cash', rider_tip: 5 },
  });
  assert('checkout preview responds 200', preview.status === 200, `status ${preview.status}: ${JSON.stringify(preview.body)}`);
  assert('preview totals are server-computed', typeof preview.body.total_dh === 'number' && preview.body.total_dh > 0, JSON.stringify(preview.body));

  const idempotencyKey = `smoke-${crypto.randomUUID()}`;
  const checkout = await req('/admin-api/v1/checkout', {
    headers: { Authorization: `Bearer ${customerToken}`, 'Idempotency-Key': idempotencyKey },
    body: checkoutPayload,
  });
  assert('checkout responds 200/201', checkout.status === 200 || checkout.status === 201, `status ${checkout.status}: ${JSON.stringify(checkout.body)}`);
  const orderId = checkout.body.order_id;
  if (!orderId) throw new Error('Checkout returned no order_id.');
  cleanup.orderIds.push(orderId);
  assert('order auto-confirmed for cash', checkout.body.status === 'confirmed', `got ${checkout.body.status}`);

  const replay = await req('/admin-api/v1/checkout', {
    headers: { Authorization: `Bearer ${customerToken}`, 'Idempotency-Key': idempotencyKey },
    body: checkoutPayload,
  });
  assert('idempotent replay returns same order', replay.body.order_id === orderId && replay.body.idempotent === true, JSON.stringify(replay.body));
  const { count: orderCount } = await sb.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', customerId);
  assert('exactly one order exists in DB', orderCount === 1, `count ${orderCount}`);

  // ── 4. Legacy bypass routes must be gone ─────────────────────────────
  const driverA = await createDriverFixture('a');
  const legacyPickup = await req(`/admin-api/v1/orders/${orderId}/pickup`, { headers: { Authorization: `Bearer ${driverA.token}` } });
  const legacyDeliver = await req(`/admin-api/v1/orders/${orderId}/deliver`, { headers: { Authorization: `Bearer ${driverA.token}` } });
  assert('legacy /pickup bypass route removed (404)', legacyPickup.status === 404, `status ${legacyPickup.status}`);
  assert('legacy /deliver bypass route removed (404)', legacyDeliver.status === 404, `status ${legacyDeliver.status}`);

  // ── 5. Offer + claim (incl. wrong-driver rejection) ──────────────────
  // The dispatch worker normally writes the offer; the smoke test plays
  // dispatcher so the run does not depend on worker timing.
  await sb.from('orders').update({
    offered_driver_id: driverA.driverId,
    offer_expires_at: new Date(Date.now() + 60_000).toISOString(),
  }).eq('id', orderId);

  const driverB = await createDriverFixture('b');
  const stolenClaim = await req(`/admin-api/v1/orders/${orderId}/accept`, { headers: { Authorization: `Bearer ${driverB.token}` } });
  assert('non-offered driver cannot claim', stolenClaim.status === 403 || stolenClaim.status === 409, `status ${stolenClaim.status}`);

  // Driver needs an active shift for financial finalization at delivery.
  const shiftStart = await req('/admin-api/driver/me/shift/start', { headers: { Authorization: `Bearer ${driverA.token}` } });
  assert('driver A starts a shift', shiftStart.status >= 200 && shiftStart.status < 300, `status ${shiftStart.status}: ${JSON.stringify(shiftStart.body)}`);

  const claim = await req(`/admin-api/v1/orders/${orderId}/accept`, { headers: { Authorization: `Bearer ${driverA.token}` } });
  assert('offered driver claims order', claim.status === 200, `status ${claim.status}: ${JSON.stringify(claim.body)}`);
  assert('claim assigns driver A', claim.body.driver_id === driverA.driverId, `got ${claim.body.driver_id}`);

  const { data: afterClaim } = await sb.from('orders')
    .select('offered_driver_id, offer_expires_at, pickup_confirmation_code, delivery_confirmation_code, status')
    .eq('id', orderId).single();
  assert('offer fields cleared after claim', !afterClaim.offered_driver_id && !afterClaim.offer_expires_at, JSON.stringify(afterClaim));
  assert('confirmation codes generated on claim', !!afterClaim.pickup_confirmation_code && !!afterClaim.delivery_confirmation_code, JSON.stringify(afterClaim));

  // ── 6. Pickup requires the confirmation code ─────────────────────────
  const badPickup = await req(`/admin-api/driver/orders/${orderId}/stage`, {
    headers: { Authorization: `Bearer ${driverA.token}` },
    body: { stage: 'picked_up', code: '0000' === afterClaim.pickup_confirmation_code ? '9999' : '0000' },
  });
  assert('pickup with wrong code rejected', badPickup.status === 400, `status ${badPickup.status}: ${JSON.stringify(badPickup.body)}`);

  const pickup = await req(`/admin-api/driver/orders/${orderId}/stage`, {
    headers: { Authorization: `Bearer ${driverA.token}` },
    body: { stage: 'picked_up', code: afterClaim.pickup_confirmation_code },
  });
  assert('pickup with correct code succeeds', pickup.status === 200, `status ${pickup.status}: ${JSON.stringify(pickup.body)}`);

  // ── 7. Deliver requires the confirmation code ────────────────────────
  const badDeliver = await req(`/admin-api/driver/orders/${orderId}/stage`, {
    headers: { Authorization: `Bearer ${driverA.token}` },
    body: { stage: 'delivered', code: '0000' === afterClaim.delivery_confirmation_code ? '9999' : '0000' },
  });
  assert('deliver with wrong code rejected', badDeliver.status === 400, `status ${badDeliver.status}: ${JSON.stringify(badDeliver.body)}`);

  const deliver = await req(`/admin-api/driver/orders/${orderId}/stage`, {
    headers: { Authorization: `Bearer ${driverA.token}` },
    body: { stage: 'delivered', code: afterClaim.delivery_confirmation_code },
  });
  assert('deliver with correct code succeeds', deliver.status === 200, `status ${deliver.status}: ${JSON.stringify(deliver.body)}`);

  // ── 8. Financial finalization ────────────────────────────────────────
  const { data: finalOrder } = await sb.from('orders')
    .select('status, financial_finalized_at, total_amount').eq('id', orderId).single();
  assert('order delivered', finalOrder.status === 'delivered', `got ${finalOrder.status}`);
  assert('financial_finalized_at recorded', !!finalOrder.financial_finalized_at, 'commission finalization missing — check finalize_delivered_order_financial / retry worker');

  const { data: ledgerRows } = await sb.from('driver_earnings_ledger')
    .select('source_type, amount_centimes, is_cod_order, cod_amount_centimes').eq('order_id', orderId);
  assert('delivery commission ledger row exists', (ledgerRows || []).some((r) => r.source_type === 'delivery_commission'), JSON.stringify(ledgerRows));
  assert('tip commission ledger row exists (5 DH tip)', (ledgerRows || []).some((r) => r.source_type === 'tip_commission'), JSON.stringify(ledgerRows));

  const { data: driverRow } = await sb.from('drivers')
    .select('cod_balance_centimes, jobs_completed').eq('id', driverA.driverId).single();
  const expectedCod = Math.round(Number(finalOrder.total_amount) * 100);
  assert('driver COD balance carries the cash total', Number(driverRow.cod_balance_centimes) === expectedCod, `cod ${driverRow.cod_balance_centimes}, expected ${expectedCod}`);
  assert('driver jobs_completed incremented', Number(driverRow.jobs_completed) === 1, `got ${driverRow.jobs_completed}`);

  // ── 9. Driver token revocation ───────────────────────────────────────
  await sb.from('drivers').update({ is_active: false }).eq('id', driverB.driverId);
  // The status cache holds for up to 60s; poll briefly for the lockout.
  let revoked = false;
  for (let attempt = 0; attempt < 14 && !revoked; attempt += 1) {
    const probe = await req('/admin-api/driver/me', { method: 'GET', headers: { Authorization: `Bearer ${driverB.token}` } });
    if (probe.status === 403 || probe.status === 401) revoked = true;
    else await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  assert('deactivated driver loses API access within cache TTL', revoked, 'still authorized after ~65s');

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

async function teardown() {
  // Remove smoke fixtures so repeated runs stay clean. Order matters for FKs.
  try {
    if (cleanup.orderIds.length) {
      await sb.from('driver_earnings_ledger').delete().in('order_id', cleanup.orderIds);
      await sb.from('order_status_history').delete().in('order_id', cleanup.orderIds);
      await sb.from('order_items').delete().in('order_id', cleanup.orderIds);
      await sb.from('orders').delete().in('id', cleanup.orderIds);
    }
    if (cleanup.driverIds.length) {
      await sb.from('driver_shift_records').delete().in('driver_id', cleanup.driverIds);
      await sb.from('drivers').delete().in('id', cleanup.driverIds);
    }
    for (const id of [...cleanup.driverUserIds]) {
      await sb.auth.admin.deleteUser(id).catch(() => {});
    }
    if (cleanup.userIds.length) {
      await sb.from('user_addresses').delete().in('user_id', cleanup.userIds);
      for (const id of cleanup.userIds) {
        await sb.auth.admin.deleteUser(id).catch(() => {});
      }
      await sb.from('users').delete().in('id', cleanup.userIds);
    }
    console.log('Teardown complete.');
  } catch (err) {
    console.error(`Teardown incomplete (manual cleanup may be needed): ${err.message}`);
  }
}

run()
  .catch((err) => {
    console.error(`\n[FATAL] ${err.message}`);
    process.exitCode = 1;
  })
  .finally(teardown);

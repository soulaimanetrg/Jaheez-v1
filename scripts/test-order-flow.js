'use strict';
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[FATAL] Missing Supabase config in env. Check .env file.');
  process.exit(1);
}

if (!process.env.ADMIN_JWT_SECRET) {
  console.error('[FATAL] Missing ADMIN_JWT_SECRET in env.');
  process.exit(1);
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const userSb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

let passed = 0;
let failed = 0;

async function req(path, { method = 'POST', body, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = {};
  try { json = await res.json(); } catch {}
  return { status: res.status, body: json };
}

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  JAHEEZ Order Flow E2E Integration Test`);
  console.log(`  Server: ${BASE_URL}`);
  console.log(`${'═'.repeat(60)}\n`);

  let testUserId = null;
  let testUserEmail = null;
  let testDriverId = null;
  let testDriverUserId = null;
  let testDriverId2 = null;
  let testDriverUserId2 = null;
  let testOrderId = null;
  let testUserToken = null;
  let testDriverToken = null;
  let testAdminToken = null;

  try {
    console.log('STEP 1: Fetching valid store and menu item from DB...');
    const { data: store, error: storeErr } = await sb
      .from('stores')
      .select('id, delivery_fee')
      .eq('is_open', true)
      .limit(1)
      .single();

    if (storeErr || !store) {
      throw new Error(`Could not find an open store in DB: ${storeErr?.message}`);
    }

    const { data: menuItem, error: itemErr } = await sb
      .from('menu_items')
      .select('id, price')
      .eq('store_id', store.id)
      .eq('is_available', true)
      .eq('options', '[]')
      .limit(1)
      .single();

    if (itemErr || !menuItem) {
      throw new Error(`Could not find an available menu item in store ${store.id} with no options: ${itemErr?.message}`);
    }

    console.log(`  Using Store: ${store.id}, Menu Item: ${menuItem.id} (Price: ${menuItem.price})`);

    // ── STEP 2: Create and login a Test User ──────────────────────────────
    console.log('\nSTEP 2: Creating and logging in test user...');
    const userPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    testUserEmail = `u${userPhone.replace(/\D/g, '')}@jaheez.app`;

    const registerUser = await req('/admin-api/auth/register', {
      body: { phone: userPhone, password: 'testpassword123', full_name: 'Test User E2E', city: 'آسفي' }
    });

    if (registerUser.status !== 200) {
      throw new Error(`User registration failed: ${JSON.stringify(registerUser.body)}`);
    }
    testUserId = registerUser.body.id;

    // Login user to get JWT from Supabase Auth
    const { data: authData, error: authErr } = await userSb.auth.signInWithPassword({
      email: testUserEmail,
      password: 'testpassword123'
    });

    if (authErr || !authData.session) {
      throw new Error(`User auth login failed: ${authErr?.message}`);
    }
    testUserToken = authData.session.access_token;
    console.log(`  Test User authenticated successfully.`);

    // ── STEP 3: Create, verify, and login a Test Driver ───────────────────
    console.log('\nSTEP 3: Creating and verifying test driver...');

    const driverPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const driverPassword = 'driverpassword123';
    const driverEmail = `d-${driverPhone.replace(/\D/g, '')}@jaheez.app`;

    // Create Supabase Auth driver account directly to avoid proxy auth/SMS path differences in dev
    const { data: { user: driverUser }, error: driverUserErr } = await sb.auth.admin.createUser({
      email: driverEmail,
      password: driverPassword,
      email_confirm: true
    });

    if (driverUserErr || !driverUser) {
      throw new Error(`Driver auth user creation failed: ${driverUserErr?.message}`);
    }
    testDriverUserId = driverUser.id;

    // Update role in public.users
    await sb.from('users').update({ role: 'driver', phone: driverPhone }).eq('id', driverUser.id);

    // Create the driver entry directly in drivers table
    const { data: drv, error: drvInsertErr } = await sb.from('drivers').insert({
      user_id: driverUser.id,
      full_name: 'Test Driver E2E',
      phone: driverPhone,
      is_verified: true,
      is_online: true,
      kyc_status: 'verified'
    }).select('id').single();

    if (drvInsertErr || !drv) {
      throw new Error(`Driver insert failed: ${drvInsertErr?.message}`);
    }
    testDriverId = drv.id;

    testDriverToken = jwt.sign(
      { driver_id: testDriverId, user_id: driverUser.id, phone: driverPhone, kind: 'driver', actor: 'driver' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '30d' }
    );

    const now = Math.floor(Date.now() / 1000);
    testAdminToken = jwt.sign(
      {
        id: 'bf5e793e-0d19-4d5b-809b-bbc09371976f', // Real admin ID
        email: 'admin@jaheez.ma',
        role: 'super_admin',
        kind: 'admin',
        last_seen: now,
        abs_exp: now + 24 * 3600,
        remember_me: true
      },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`  Test Driver registered, KYC verified, and online.`);

    console.log('\nSTEP 4: Testing server-authoritative checkout...');
    const idempotencyKey = `idem-e2e-${Date.now()}`;
    const checkoutPayload = {
      store_id: store.id,
      items: [{ menu_item_id: menuItem.id, quantity: 2 }],
      delivery_address: '123 Test Street, Safi',
      payment_method: 'cash',
      rider_tip: 20,
      notes: 'Test order notes.'
    };

    const checkout1 = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${testUserToken}`, 'Idempotency-Key': idempotencyKey },
      body: checkoutPayload
    });

    assert('Checkout responds 201 Created', checkout1.status === 201, `Status is ${checkout1.status}`);
    assert('Checkout payload has order_id', !!checkout1.body.order_id, `Response: ${JSON.stringify(checkout1.body)}`);
    testOrderId = checkout1.body.order_id;

    const expectedSubtotal = Number(menuItem.price) * 2;// 0 delivery fee for first 3 orders (free delivery rule)
    assert('Authoritative subtotal calculation matches', checkout1.body.subtotal === expectedSubtotal, `got ${checkout1.body.subtotal}, expected ${expectedSubtotal}`);
    assert('Authoritative total amount matches', checkout1.body.total_amount === expectedTotal, `got ${checkout1.body.total_amount}, expected ${expectedTotal}`);

    console.log('\nSTEP 5: Testing checkout idempotency...');
    const checkout2 = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${testUserToken}`, 'Idempotency-Key': idempotencyKey },
      body: checkoutPayload
    });

    assert('Idempotent retry responds 200 OK', checkout2.status === 200, `Status is ${checkout2.status}`);
    assert('Idempotent retry returns identical order_id', checkout2.body.order_id === testOrderId, `first: ${testOrderId}, second: ${checkout2.body.order_id}`);
    assert('Idempotent response has idempotent = true flag', checkout2.body.idempotent === true, `Response: ${JSON.stringify(checkout2.body)}`);

    // Verify DB has only one order
    const { count } = await sb
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', testUserId);
    assert('DB contains exactly one order for user', count === 1, `count is ${count}`);

    // ── STEP 6: Driver Accept Order ──────────────────────────────────────
    console.log('\nSTEP 6: Driver accepting order...');
    
    // Manually offer the order to the test driver in the database to satisfy dispatch validation
    await sb.from('orders').update({
      offered_driver_id: testDriverId,
      offer_expires_at: new Date(Date.now() + 60000).toISOString()
    }).eq('id', testOrderId);

    const accept1 = await req(`/admin-api/v1/orders/${testOrderId}/accept`, {
      headers: { Authorization: `Bearer ${testDriverToken}` }
    });

    assert('Accept order responds 200 OK', accept1.status === 200, `Status is ${accept1.status}`);
    assert('Accept returns full order data', !!accept1.body.driver_id, `Response: ${JSON.stringify(accept1.body)}`);
    assert('Order driver_id updated in return payload', accept1.body.driver_id === testDriverId, `got ${accept1.body.driver_id}`);
    assert('Order status transitioned to confirmed', accept1.body.status === 'confirmed', `got ${accept1.body.status}`);

    // Verify double-accept collision protection
    const anotherDriverPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const anotherPassword = 'anotherpassword123';
    const anotherDriverEmail = `d2-${anotherDriverPhone.replace(/\D/g, '')}@jaheez.app`;

    // Create Supabase Auth driver 2 account directly
    const { data: { user: driverUser2 }, error: driverUserErr2 } = await sb.auth.admin.createUser({
      email: anotherDriverEmail,
      password: anotherPassword,
      email_confirm: true
    });

    if (driverUserErr2 || !driverUser2) {
      throw new Error(`Driver 2 auth user creation failed: ${driverUserErr2?.message}`);
    }
    testDriverUserId2 = driverUser2.id;

    // Update role in public.users
    await sb.from('users').update({ role: 'driver', phone: anotherDriverPhone }).eq('id', driverUser2.id);

    // Create the driver entry directly in drivers table
    const { data: drv2, error: drvInsertErr2 } = await sb.from('drivers').insert({
      user_id: driverUser2.id,
      full_name: 'Driver 2 E2E',
      phone: anotherDriverPhone,
      is_verified: true,
      is_online: true,
      kyc_status: 'verified'
    }).select('id').single();

    if (drvInsertErr2 || !drv2) {
      throw new Error(`Driver 2 insert failed: ${drvInsertErr2?.message}`);
    }
    testDriverId2 = drv2.id;

    // Generate driver 2 JWT directly using ADMIN_JWT_SECRET
    const testDriverToken2 = jwt.sign(
      { driver_id: testDriverId2, user_id: driverUser2.id, phone: anotherDriverPhone, kind: 'driver', actor: 'driver' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '30d' }
    );

    const accept2 = await req(`/admin-api/v1/orders/${testOrderId}/accept`, {
      headers: { Authorization: `Bearer ${testDriverToken2}` }
    });
    assert('Collision accept is rejected with 409 Conflict', accept2.status === 409, `Status is ${accept2.status}`);

    // ── STEP 7: Driver Pickup Order ──────────────────────────────────────
    console.log('\nSTEP 7: Driver picking up order...');
    const pickup1 = await req(`/admin-api/v1/orders/${testOrderId}/pickup`, {
      headers: { Authorization: `Bearer ${testDriverToken}` }
    });

    assert('Pickup order responds 200 OK', pickup1.status === 200, `Status is ${pickup1.status}`);
    assert('Order status transitioned to picked_up', pickup1.body.status === 'picked_up', `got ${pickup1.body.status}`);
    assert('picked_up_at timestamp is set', !!pickup1.body.picked_up_at, `got ${pickup1.body.picked_up_at}`);

    // ── STEP 8: Driver Deliver Order ──────────────────────────────────────
    console.log('\nSTEP 8: Driver delivering order...');
    const { data: driverBefore } = await sb.from('drivers').select('jobs_completed, earnings_centimes, cod_balance_centimes').eq('id', testDriverId).single();

    const deliver1 = await req(`/admin-api/v1/orders/${testOrderId}/deliver`, {
      headers: { Authorization: `Bearer ${testDriverToken}` }
    });

    assert('Deliver order responds 200 OK', deliver1.status === 200, `Status is ${deliver1.status}`);
    assert('Order status transitioned to delivered', deliver1.body.status === 'delivered', `got ${deliver1.body.status}`);

    // Verify driver metrics calculation under Salary Model
    const { data: driverAfter } = await sb.from('drivers').select('jobs_completed, earnings_centimes, cod_balance_centimes').eq('id', testDriverId).single();

    const expectedEarningsDelta = 20 * 100 * 0.25; // Salary model: driver gets exactly 25% of tips (500 centimes).
    const expectedCodDelta = (checkoutPayload.payment_method === 'cash') ? (expectedTotal * 100) : 0; // Salary model: COD tracks full cash.

    assert('Driver jobs_completed incremented by 1', driverAfter.jobs_completed === driverBefore.jobs_completed + 1, `before: ${driverBefore.jobs_completed}, after: ${driverAfter.jobs_completed}`);
    assert('Driver earnings credited with exactly 25% of tip', driverAfter.earnings_centimes === driverBefore.earnings_centimes + expectedEarningsDelta, `before: ${driverBefore.earnings_centimes}, after: ${driverAfter.earnings_centimes}, delta: ${driverAfter.earnings_centimes - driverBefore.earnings_centimes}, expected delta: ${expectedEarningsDelta}`);
    assert('Driver COD balance updated correctly with full total including tip', driverAfter.cod_balance_centimes === driverBefore.cod_balance_centimes + expectedCodDelta, `before: ${driverBefore.cod_balance_centimes}, after: ${driverAfter.cod_balance_centimes}, delta: ${driverAfter.cod_balance_centimes - driverBefore.cod_balance_centimes}, expected delta: ${expectedCodDelta}`);

    // ── STEP 9: Admin Complete Order ──────────────────────────────────────
    console.log('\nSTEP 9: Admin completing order...');
    
    // admin token is already logged in and stored in testAdminToken

    const complete1 = await req(`/admin-api/v1/orders/${testOrderId}/complete`, {
      headers: { Authorization: `Bearer ${testAdminToken}` }
    });

    assert('Complete order responds 200 OK', complete1.status === 200, `Status is ${complete1.status}`);
    assert('Order status transitioned to completed', complete1.body.status === 'completed', `got ${complete1.body.status}`);

    // ── STEP 10: Security Check — Direct DB mutations restricted by RLS ───
    console.log('\nSTEP 10: Verifying direct database RLS constraints (user auth)...');
    
    const directInsert = await userSb
      .from('orders')
      .insert({
        user_id: testUserId,
        store_id: store.id,
        delivery_address: 'RLS hack address',
        total_amount: 10,
        status: 'pending'
      });

    assert('Direct orders insert is blocked by RLS', directInsert.error && [403, 401, '42501'].includes(directInsert.error.code || directInsert.status), `got error ${JSON.stringify(directInsert.error)}`);

  } catch (error) {
    console.error('\n❌ TEST RUNNER FATAL ERROR:', error.message);
    failed++;
  } finally {
    // ── CLEANUP ──────────────────────────────────────────────────────────
    console.log('\nCleaning up E2E test records from DB...');
    if (testOrderId) {
      await sb.from('order_items').delete().eq('order_id', testOrderId);
      await sb.from('orders').delete().eq('id', testOrderId);
    }
    if (testUserId) {
      await sb.from('users').delete().eq('id', testUserId);
      await sb.auth.admin.deleteUser(testUserId).catch(() => {});
    }
    if (testDriverId) {
      await sb.from('driver_documents').delete().eq('driver_id', testDriverId);
      await sb.from('drivers').delete().eq('id', testDriverId);
    }
    if (testDriverUserId) {
      await sb.from('users').delete().eq('id', testDriverUserId);
      await sb.auth.admin.deleteUser(testDriverUserId).catch(() => {});
    }
    if (testDriverId2) {
      await sb.from('driver_documents').delete().eq('driver_id', testDriverId2);
      await sb.from('drivers').delete().eq('id', testDriverId2);
    }
    if (testDriverUserId2) {
      await sb.from('users').delete().eq('id', testDriverUserId2);
      await sb.auth.admin.deleteUser(testDriverUserId2).catch(() => {});
    }
    console.log('Cleanup completed.\n');

    console.log(`═`.repeat(60));
    console.log(`E2E TEST RESULT: ${passed} passed, ${failed} failed`);
    console.log(`═`.repeat(60) + `\n`);

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

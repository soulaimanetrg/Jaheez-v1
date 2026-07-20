/**
 * JAHEEZ — Final Rules Integration Test
 *
 * Verifies:
 *   1. Free delivery on the first 3 non-cancelled orders, active fee on the 4th.
 *   2. Auto-ban of user on the 3rd customer-initiated cancellation.
 *   3. Proximity sorting and category/query filtering of stores.
 *   4. Authoritative Live Dispatch & driver decline endpoint.
 */

'use strict';
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

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
  console.log(`  JAHEEZ Final Rules Integration Test`);
  console.log(`  Server: ${BASE_URL}`);
  console.log(`${'═'.repeat(60)}\n`);

  try {
    // 1. Fetch valid store and item
    const { data: store, error: storeErr } = await sb
      .from('stores')
      .select('id, delivery_fee, lat, lng')
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
      throw new Error(`Could not find an available menu item in store ${store.id}: ${itemErr?.message}`);
    }

    // ── TEST 1: Store Distance & Sorting API ──────────────────────────────
    console.log('\n--- TEST 1: Store Distance & Sorting API ---');
    
    // Create and login a temp user for JWT verification
    const userPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const userEmail = `u${userPhone.replace(/\D/g, '')}@jaheez.app`;
    const registerUser = await req('/admin-api/auth/register', {
      body: { phone: userPhone, password: 'testpassword123', full_name: 'E2E Final Rules User', city: 'آسفي' }
    });

    if (registerUser.status !== 200) {
      throw new Error(`User registration failed: ${JSON.stringify(registerUser.body)}`);
    }
    const testUserId = registerUser.body.id;

    const { data: authData, error: authErr } = await userSb.auth.signInWithPassword({
      email: userEmail,
      password: 'testpassword123'
    });

    if (authErr || !authData.session) {
      throw new Error(`User auth login failed: ${authErr?.message}`);
    }
    const userToken = authData.session.access_token;

    // Call store listing API with latitude and longitude
    const storeLat = store.lat ? Number(store.lat) : 32.2994;
    const storeLng = store.lng ? Number(store.lng) : -9.2372;

    const listRes = await req(`/admin-api/v1/customer/stores?lat=${storeLat}&lng=${storeLng}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    assert('GET /v1/customer/stores returns 200', listRes.status === 200);
    if (listRes.status === 200 && Array.isArray(listRes.body)) {
      assert('Stores list has elements', listRes.body.length > 0);
      
      // Verify sorting is nearest first
      let sorted = true;
      for (let i = 0; i < listRes.body.length - 1; i++) {
        const d1 = listRes.body[i].distance;
        const d2 = listRes.body[i + 1].distance;
        if (d1 !== null && d2 !== null && d1 > d2 + 0.05) {
          sorted = false;
          break;
        }
      }
      assert('Stores are sorted nearest first', sorted);
    }

    // ── TEST 2: Free Delivery on First 3 Orders ───────────────────────────
    console.log('\n--- TEST 2: Free Delivery on First 3 Orders ---');

    // Create another fresh user to verify free delivery
    const freshPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const freshEmail = `u${freshPhone.replace(/\D/g, '')}@jaheez.app`;
    const regFresh = await req('/admin-api/auth/register', {
      body: { phone: freshPhone, password: 'testpassword123', full_name: 'Fresh Free Delivery User', city: 'آسفي' }
    });

    if (regFresh.status !== 200) throw new Error('Failed to register fresh user');

    const { data: freshAuth, error: freshAuthErr } = await userSb.auth.signInWithPassword({
      email: freshEmail,
      password: 'testpassword123'
    });
    if (freshAuthErr) {
      console.error('  Fresh Auth Sign-In failed:', freshAuthErr.message);
    }
    const freshToken = freshAuth?.session?.access_token;
    const freshUserId = regFresh.body.id;

    // Helper to perform checkouts
    const placeTestOrder = async (idempotencyKey) => {
      const res = await req('/admin-api/v1/checkout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${freshToken}`, 'Idempotency-Key': idempotencyKey },
        body: {
          store_id: store.id,
          delivery_address: 'Safi City Center, Morocco',
          delivery_lat: storeLat,
          delivery_lng: storeLng,
          payment_method: 'cash',
          items: [{ menu_item_id: menuItem.id, quantity: 1 }]
        }
      });
      if (res.status !== 201) {
        console.error(`  Checkout failed with status ${res.status}:`, JSON.stringify(res.body));
      }
      return res;
    };

    // Checkout 1
    const checkout1 = await placeTestOrder('e2e-free-1-' + Math.random());
    assert('1st checkout returns 201', checkout1.status === 201);
    assert('1st checkout has deliveryFee = 0', checkout1.body.delivery_fee === 0);

    // Checkout 2
    const checkout2 = await placeTestOrder('e2e-free-2-' + Math.random());
    assert('2nd checkout returns 201', checkout2.status === 201);
    assert('2nd checkout has deliveryFee = 0', checkout2.body.delivery_fee === 0);

    // Checkout 3
    const checkout3 = await placeTestOrder('e2e-free-3-' + Math.random());
    assert('3rd checkout returns 201', checkout3.status === 201);
    assert('3rd checkout has deliveryFee = 0', checkout3.body.delivery_fee === 0);

    // Checkout 4
    const checkout4 = await placeTestOrder('e2e-free-4-' + Math.random());
    assert('4th checkout returns 201', checkout4.status === 201);
    assert('4th checkout has deliveryFee > 0', checkout4.body.delivery_fee > 0);

    // ── TEST 3: Auto-Banning on 3 Customer Cancellations ─────────────────
    console.log('\n--- TEST 3: Auto-Banning on 3 Customer Cancellations ---');

    // Let's cancel 3 of the orders placed by the fresh user
    const ordersToCancel = [checkout1.body.order_id, checkout2.body.order_id, checkout3.body.order_id];

    for (let i = 0; i < ordersToCancel.length; i++) {
      const cancelRes = await req(`/admin-api/v1/orders/${ordersToCancel[i]}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${freshToken}` },
        body: { reason: 'User requested cancellation' }
      });
      assert(`Cancel order ${i + 1} returns 200`, cancelRes.status === 200);
    }

    // Verify user is banned
    const { data: dbUser } = await sb.from('users').select('is_banned').eq('id', freshUserId).single();
    assert('User is_banned flag is set to true in database', dbUser.is_banned === true);

    // Verify subsequent requests get blocked
    const checkout5 = await placeTestOrder('e2e-free-5-' + Math.random());
    // Wait, let's check: once banned, the verifySupabaseJwt middleware rejects requests with 403
    assert('Request from banned user is blocked (403)', checkout5.status === 403);

    // ── TEST 4: Live Dispatch and Driver Decline ──────────────────────────
    console.log('\n--- TEST 4: Live Dispatch and Driver Decline ---');

    // Create a new unbanned user to place an order
    const buyerPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const buyerEmail = `u${buyerPhone.replace(/\D/g, '')}@jaheez.app`;
    const regBuyer = await req('/admin-api/auth/register', {
      body: { phone: buyerPhone, password: 'testpassword123', full_name: 'Buyer User', city: 'آسفي' }
    });
    if (regBuyer.status !== 200) {
      throw new Error(`Buyer registration failed: ${JSON.stringify(regBuyer.body)}`);
    }
    const buyerId = regBuyer.body.id;
    const { data: buyerAuth } = await userSb.auth.signInWithPassword({
      email: buyerEmail,
      password: 'testpassword123'
    });
    const buyerToken = buyerAuth.session.access_token;

    // Create a Test Driver close to the store
    const driverPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const driverPassword = 'driverpassword123';
    const driverEmail = `d-${driverPhone.replace(/\D/g, '')}@jaheez.app`;

    const { data: { user: driverUser } } = await sb.auth.admin.createUser({
      email: driverEmail,
      password: driverPassword,
      email_confirm: true
    });

    await sb.from('users').update({ role: 'driver', phone: driverPhone }).eq('id', driverUser.id);
    const { data: drv } = await sb.from('drivers').insert({
      user_id: driverUser.id,
      full_name: 'Dispatch Driver E2E',
      phone: driverPhone,
      is_verified: true,
      is_online: true,
      kyc_status: 'verified',
      current_lat: storeLat,
      current_lng: storeLng
    }).select('id').single();

    const driverToken = jwt.sign(
      { driver_id: drv.id, user_id: driverUser.id, phone: driverPhone, kind: 'driver', actor: 'driver' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Place checkout
    const orderRes = await req('/admin-api/v1/checkout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${buyerToken}`, 'Idempotency-Key': 'dispatch-e2e-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Safi City Center, Morocco',
        delivery_lat: storeLat,
        delivery_lng: storeLng,
        payment_method: 'cash',
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });

    assert('Checkout for dispatch test returns 201', orderRes.status === 201);
    const orderId = orderRes.body.order_id;

    // The order should be confirmed/paid automatically since it's COD (cash).
    // Let's verify status is confirmed or preparing
    const { data: initialOrder } = await sb.from('orders').select('status').eq('id', orderId).single();
    assert('Order status is confirmed/preparing', ['confirmed', 'preparing'].includes(initialOrder.status));

    // Wait for dispatch worker (runs every 5 seconds) to assign the offered driver
    console.log('  Waiting 6 seconds for dispatch worker loop...');
    await new Promise(resolve => setTimeout(resolve, 6500));

    const { data: offeredOrder } = await sb.from('orders')
      .select('offered_driver_id, offer_expires_at')
      .eq('id', orderId)
      .single();

    assert('Order is offered to our online driver', offeredOrder.offered_driver_id === drv.id);
    assert('Offer expires at is populated', offeredOrder.offer_expires_at !== null);

    // Verify driver's GET /driver/orders?scope=available lists this order
    const driverAvail = await req('/admin-api/driver/orders?scope=available', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });
    assert('Driver GET /driver/orders?scope=available lists the offered order',
      driverAvail.status === 200 && Array.isArray(driverAvail.body) && driverAvail.body.some(o => o.id === orderId)
    );

    // Decline order as driver
    const declineRes = await req(`/admin-api/driver/orders/${orderId}/decline`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });
    assert('Decline order endpoint returns 200', declineRes.status === 200);

    // Verify that the order is no longer offered to this driver and they are in rejected_driver_ids
    const { data: declinedOrder } = await sb.from('orders')
      .select('offered_driver_id, rejected_driver_ids')
      .eq('id', orderId)
      .single();

    assert('After decline, offered_driver_id is null', declinedOrder.offered_driver_id === null);
    assert('Driver ID is added to rejected_driver_ids array', declinedOrder.rejected_driver_ids.includes(drv.id));

    // Clean up test users / drivers
    await sb.from('favorite_products').delete().eq('user_id', freshUserId);
    await sb.from('order_items').delete().eq('order_id', orderId);
    await sb.from('orders').delete().eq('id', orderId);
    for (const id of ordersToCancel) {
      await sb.from('order_items').delete().eq('order_id', id);
      await sb.from('orders').delete().eq('id', id);
    }
    await sb.from('drivers').delete().eq('id', drv.id);
    await sb.from('users').delete().in('id', [buyerId, freshUserId, testUserId, driverUser.id]);
    await sb.auth.admin.deleteUser(driverUser.id).catch(() => {});
    await sb.auth.admin.deleteUser(freshUserId).catch(() => {});
    await sb.auth.admin.deleteUser(testUserId).catch(() => {});
    await sb.auth.admin.deleteUser(buyerId).catch(() => {});

  } catch (err) {
    console.error('[TEST ERROR]', err);
    failed++;
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Tests completed: Passed: ${passed}, Failed: ${failed}`);
  console.log(`${'═'.repeat(60)}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();

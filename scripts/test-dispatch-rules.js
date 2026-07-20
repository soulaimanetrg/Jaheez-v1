require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

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

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getAdminToken() {
  const nowSec = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      id: 'bf5e793e-0d19-4d5b-809b-bbc09371976f',
      email: 'admin@jaheez.ma',
      role: 'super_admin',
      kind: 'admin',
      last_seen: nowSec,
      abs_exp: nowSec + 24 * 3600,
      remember_me: true
    },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function registerDriver(phone, cin, name, adminToken) {
  const createDriver = await req('/admin-api/v1/admin/drivers', {
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { cin, password: 'driverpassword123', full_name: name, phone, vehicle_type: 'motorcycle', city: 'آسفي' }
  });
  if (createDriver.status !== 201) {
    throw new Error(`Driver registration failed: ${JSON.stringify(createDriver.body)}`);
  }
  const driverId = createDriver.body.id;

  const loginDriver = await req('/admin-api/driver/login', {
    body: { cin, password: 'driverpassword123' }
  });
  const driverToken = loginDriver.body.token;

  return { id: driverId, token: driverToken };
}

async function cleanUpOrder(orderId) {
  await sb.from('orders').update({
    status: 'cancelled',
    cancelled_reason: 'Dispatch rules test cleanup'
  }).eq('id', orderId);
}

async function run() {
  console.log('--- STARTING DISPATCH PRIORITY RULES INTEGRATION TESTS ---');
  try {
    // Put all existing drivers offline and set coordinates to null to avoid dispatch interference
    console.log('Cleaning up existing drivers...');
    await sb.from('drivers').update({
      is_online: false,
      state: 'OFFLINE',
      current_lat: null,
      current_lng: null
    }).neq('id', '00000000-0000-0000-0000-000000000000');

    // Cancel all old unassigned orders
    console.log('Cleaning up old unassigned orders...');
    await sb.from('orders').update({
      status: 'cancelled',
      cancelled_reason: 'Dispatch rules test cleanup'
    }).is('driver_id', null).in('status', ['pending', 'confirmed', 'preparing']).neq('id', '00000000-0000-0000-0000-000000000000');

    // 1. Fetch store and menu item
    console.log('1. Fetching store and menu item...');
    const { data: menuItem } = await sb.from('menu_items').select('id, price, store_id').eq('is_available', true).eq('options', '[]').limit(1).single();
    if (!menuItem) throw new Error('No available menu items found in DB');

    let { data: store } = await sb.from('stores').select('id, lat, lng').eq('id', menuItem.store_id).single();
    if (!store.lat || !store.lng) {
      await sb.from('stores').update({ lat: 32.2994, lng: -9.2372 }).eq('id', store.id);
      store.lat = 32.2994;
      store.lng = -9.2372;
    }

    // 2. Register/Login Customer
    console.log('2. Registering and logging in customer...');
    const userPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const registerUser = await req('/admin-api/auth/register', {
      body: { phone: userPhone, password: 'testpassword123', full_name: 'Dispatch Rules Customer', city: 'آسفي' }
    });
    const customerId = registerUser.body.id;
    const syntheticEmail = `u${userPhone.replace(/\D/g, '')}@jaheez.app`;
    
    const userSb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    const { data: authData } = await userSb.auth.signInWithPassword({
      email: syntheticEmail,
      password: 'testpassword123'
    });
    const customerToken = authData.session.access_token;

    // 3. Register Driver A and Driver B
    console.log('3. Registering Driver A and Driver B...');
    const adminToken = getAdminToken();
    const phoneA = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const cinA = `CIN` + Math.floor(100000 + Math.random() * 900000);
    const driverA = await registerDriver(phoneA, cinA, 'Driver Rule A', adminToken);

    const phoneB = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const cinB = `CIN` + Math.floor(100000 + Math.random() * 900000);
    const driverB = await registerDriver(phoneB, cinB, 'Driver Rule B', adminToken);

    // ==========================================
    // TEST 1: AVAILABLE status gating only
    // ==========================================
    console.log('\n--- TEST 1: AVAILABLE status gating ---');
    // Set Driver A online but keeping state as OFFLINE
    console.log('Setting Driver A online but state=OFFLINE...');
    await sb.from('drivers').update({
      is_online: true,
      state: 'OFFLINE',
      current_lat: Number(store.lat),
      current_lng: Number(store.lng)
    }).eq('id', driverA.id);

    // Set Driver B online and state=AVAILABLE
    console.log('Setting Driver B online and state=AVAILABLE...');
    await sb.from('drivers').update({
      is_online: true,
      state: 'AVAILABLE',
      current_lat: Number(store.lat),
      current_lng: Number(store.lng)
    }).eq('id', driverB.id);

    console.log('Creating Test Order 1...');
    const o1Res = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Safi Rules Test',
        delivery_lat: Number(store.lat),
        delivery_lng: Number(store.lng),
        payment_method: 'cash',
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });
    const o1Id = o1Res.body.order_id;

    console.log('Waiting for dispatch matching...');
    let o1MatchedDriver = null;
    for (let i = 0; i < 8; i++) {
      await wait(1000);
      const { data: o } = await sb.from('orders').select('offered_driver_id').eq('id', o1Id).single();
      if (o.offered_driver_id) {
        o1MatchedDriver = o.offered_driver_id;
        break;
      }
    }
    console.log(`Order 1 offered to: ${o1MatchedDriver === driverB.id ? 'Driver B (AVAILABLE)' : o1MatchedDriver === driverA.id ? 'Driver A (OFFLINE)' : 'Nobody'}`);
    if (o1MatchedDriver !== driverB.id) {
      throw new Error(`Expected order to be matched to Driver B (AVAILABLE), got ${o1MatchedDriver}`);
    }

    // Cancel Order 1 to clean up
    await cleanUpOrder(o1Id);
    await sb.from('drivers').update({ state: 'AVAILABLE' }).in('id', [driverA.id, driverB.id]);
    await wait(3000); // Wait for dispatch loop to clear driver states if necessary

    // ==========================================
    // TEST 2: Active load gating (Delivering driver excluded)
    // ==========================================
    console.log('\n--- TEST 2: Active load gating (Delivering driver excluded) ---');
    // Set both Driver A and Driver B AVAILABLE
    await sb.from('drivers').update({
      is_online: true,
      state: 'AVAILABLE',
      current_lat: Number(store.lat),
      current_lng: Number(store.lng)
    }).in('id', [driverA.id, driverB.id]);

    // Assign an active order (preparing) to Driver A manually in DB
    console.log('Manually assigning active order to Driver A in DB to simulate delivering status...');
    const activeOrderRes = await sb.from('orders').insert({
      user_id: customerId,
      store_id: store.id,
      delivery_address: 'Active Order Safi',
      delivery_lat: Number(store.lat),
      delivery_lng: Number(store.lng),
      payment_method: 'cash',
      status: 'preparing',
      driver_id: driverA.id,
      subtotal: 10,
      delivery_fee: 15,
      total_amount: 25
    }).select('id').single();
    const activeOrderId = activeOrderRes.data.id;

    // Verify Driver A has active load = 1
    const { data: activeCheck } = await sb.from('orders').select('id').eq('driver_id', driverA.id).not('status', 'in', '(completed,cancelled,delivered)');
    console.log(`Driver A active orders count: ${activeCheck.length}`);
    if (activeCheck.length !== 1) throw new Error('Failed to set active order on Driver A');

    console.log('Creating Test Order 2...');
    const o2Res = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Safi Rules Test',
        delivery_lat: Number(store.lat),
        delivery_lng: Number(store.lng),
        payment_method: 'cash',
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });
    const o2Id = o2Res.body.order_id;

    console.log('Waiting for dispatch matching...');
    let o2MatchedDriver = null;
    for (let i = 0; i < 8; i++) {
      await wait(1000);
      const { data: o } = await sb.from('orders').select('offered_driver_id').eq('id', o2Id).single();
      if (o.offered_driver_id) {
        o2MatchedDriver = o.offered_driver_id;
        break;
      }
    }
    console.log(`Order 2 offered to: ${o2MatchedDriver === driverB.id ? 'Driver B (0 active load)' : o2MatchedDriver === driverA.id ? 'Driver A (1 active load)' : 'Nobody'}`);
    if (o2MatchedDriver !== driverB.id) {
      throw new Error(`Expected order to be offered to Driver B because Driver A is busy delivering, got ${o2MatchedDriver}`);
    }

    // Clean up active order and Order 2
    await cleanUpOrder(o2Id);
    await cleanUpOrder(activeOrderId);
    await sb.from('drivers').update({ state: 'AVAILABLE' }).in('id', [driverA.id, driverB.id]);
    await wait(3000);

    // ==========================================
    // TEST 3: Best response rate sorting
    // ==========================================
    console.log('\n--- TEST 3: Best response rate (acceptance rate) sorting ---');
    // Set metrics: both online at same location. Driver A acceptance rate = 95%, Driver B = 80%.
    console.log('Setting Driver A acceptance rate to 95% and Driver B to 80%...');
    await sb.from('drivers').update({
      is_online: true,
      state: 'AVAILABLE',
      current_lat: Number(store.lat),
      current_lng: Number(store.lng),
      driver_acceptance_rate: 95.00
    }).eq('id', driverA.id);

    await sb.from('drivers').update({
      is_online: true,
      state: 'AVAILABLE',
      current_lat: Number(store.lat),
      current_lng: Number(store.lng),
      driver_acceptance_rate: 80.00
    }).eq('id', driverB.id);

    console.log('Creating Test Order 3...');
    const o3Res = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Safi Rules Test',
        delivery_lat: Number(store.lat),
        delivery_lng: Number(store.lng),
        payment_method: 'cash',
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });
    const o3Id = o3Res.body.order_id;

    console.log('Waiting for dispatch matching...');
    let o3MatchedDriver = null;
    for (let i = 0; i < 8; i++) {
      await wait(1000);
      const { data: o } = await sb.from('orders').select('offered_driver_id').eq('id', o3Id).single();
      if (o.offered_driver_id) {
        o3MatchedDriver = o.offered_driver_id;
        break;
      }
    }
    console.log(`Order 3 offered to: ${o3MatchedDriver === driverA.id ? 'Driver A (95% rate)' : o3MatchedDriver === driverB.id ? 'Driver B (80% rate)' : 'Nobody'}`);
    if (o3MatchedDriver !== driverA.id) {
      throw new Error(`Expected order to be matched to Driver A (higher acceptance rate), got ${o3MatchedDriver}`);
    }

    // Clean up
    await cleanUpOrder(o3Id);
    await sb.from('drivers').update({ state: 'AVAILABLE' }).in('id', [driverA.id, driverB.id]);
    await wait(3000);

    // ==========================================
    // TEST 4: Distance secondary priority (tie-breaker)
    // ==========================================
    console.log('\n--- TEST 4: Distance secondary priority (tie-breaker) ---');
    // Set equal acceptance rates. Set Driver A closer (at store) and Driver B further away.
    console.log('Setting identical acceptance rates (90%). Placing Driver A at store and Driver B 2km away...');
    await sb.from('drivers').update({
      is_online: true,
      state: 'AVAILABLE',
      current_lat: Number(store.lat),
      current_lng: Number(store.lng),
      driver_acceptance_rate: 90.00
    }).eq('id', driverA.id);

    // Lat offset for ~2.2km: ~0.02 degrees latitude
    await sb.from('drivers').update({
      is_online: true,
      state: 'AVAILABLE',
      current_lat: Number(store.lat) + 0.02,
      current_lng: Number(store.lng),
      driver_acceptance_rate: 90.00
    }).eq('id', driverB.id);

    console.log('Creating Test Order 4...');
    const o4Res = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Safi Rules Test',
        delivery_lat: Number(store.lat),
        delivery_lng: Number(store.lng),
        payment_method: 'cash',
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });
    const o4Id = o4Res.body.order_id;

    console.log('Waiting for dispatch matching...');
    let o4MatchedDriver = null;
    for (let i = 0; i < 8; i++) {
      await wait(1000);
      const { data: o } = await sb.from('orders').select('offered_driver_id').eq('id', o4Id).single();
      if (o.offered_driver_id) {
        o4MatchedDriver = o.offered_driver_id;
        break;
      }
    }
    console.log(`Order 4 offered to: ${o4MatchedDriver === driverA.id ? 'Driver A (Closer)' : o4MatchedDriver === driverB.id ? 'Driver B (Further)' : 'Nobody'}`);
    if (o4MatchedDriver !== driverA.id) {
      throw new Error(`Expected order to be matched to Driver A (closer, same acceptance rate), got ${o4MatchedDriver}`);
    }

    // Clean up
    await cleanUpOrder(o4Id);
    await sb.from('drivers').update({
      is_online: false,
      state: 'OFFLINE',
      current_lat: null,
      current_lng: null
    }).in('id', [driverA.id, driverB.id]);

    console.log('\n--- ALL DISPATCH RULE TESTS PASSED SUCCESSFULLY! ---');

  } catch (err) {
    console.error('Test Failed:', err.message);
    process.exit(1);
  }
}

run();

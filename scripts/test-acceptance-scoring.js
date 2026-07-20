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

// Generate admin JWT
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

async function run() {
  console.log('--- TESTING DRIVER ACCEPTANCE SCORING & DISPATCH PENALTIES ---');
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
      cancelled_reason: 'Scoring test cleanup'
    }).is('driver_id', null).in('status', ['pending', 'confirmed', 'preparing']).neq('id', '00000000-0000-0000-0000-000000000000');

    // 1. Fetch store and menu item
    console.log('1. Fetching store and menu item...');
    let { data: store } = await sb.from('stores').select('id, lat, lng').eq('is_open', true).limit(1).single();
    if (!store.lat || !store.lng) {
      await sb.from('stores').update({ lat: 32.2994, lng: -9.2372 }).eq('id', store.id);
      store.lat = 32.2994;
      store.lng = -9.2372;
    }

    const { data: menuItem } = await sb.from('menu_items').select('id, price').eq('store_id', store.id).eq('is_available', true).eq('options', '[]').limit(1).single();

    // 2. Register/Login Customer
    console.log('2. Registering and logging in customer...');
    const userPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const registerUser = await req('/admin-api/auth/register', {
      body: { phone: userPhone, password: 'testpassword123', full_name: 'Scoring Test Customer', city: 'آسفي' }
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
    const driverA = await registerDriver(phoneA, cinA, 'Driver Scoring A', adminToken);

    const phoneB = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const cinB = `CIN` + Math.floor(100000 + Math.random() * 900000);
    const driverB = await registerDriver(phoneB, cinB, 'Driver Scoring B', adminToken);

    // Set metrics manually: Driver A is better than Driver B
    // Driver A: 90% acceptance, 1 timeout
    // Driver B: 50% acceptance, 4 timeouts
    console.log('Manually setting initial scoring metrics in DB...');
    await sb.from('drivers').update({
      driver_acceptance_rate: 90.0,
      driver_timeout_count: 1,
      total_offers: 10,
      accepted_offers: 9,
      consecutive_timeouts: 0
    }).eq('id', driverA.id);

    await sb.from('drivers').update({
      driver_acceptance_rate: 50.0,
      driver_timeout_count: 4,
      total_offers: 10,
      accepted_offers: 5,
      consecutive_timeouts: 0
    }).eq('id', driverB.id);

    // 4. Set both online at the same location (Store location)
    console.log('4. Putting both drivers online...');
    await req('/admin-api/driver/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverA.token}` },
      body: { is_online: true }
    });
    await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverA.token}` },
      body: { latitude: Number(store.lat), longitude: Number(store.lng), accuracy: 10 }
    });

    await req('/admin-api/driver/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverB.token}` },
      body: { is_online: true }
    });
    await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverB.token}` },
      body: { latitude: Number(store.lat), longitude: Number(store.lng), accuracy: 10 }
    });

    // 5. Create Order 1 and verify it goes to Driver A (better score)
    console.log('5. Creating Order 1 (with 20.00 Centimes tip) to test priority dispatch...');
    const order1Res = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Safi Test Scoring',
        delivery_lat: Number(store.lat),
        delivery_lng: Number(store.lng),
        payment_method: 'cash',
        rider_tip: 20.00,
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });
    const order1Id = order1Res.body.order_id;

    console.log('Waiting for dispatch loop to offer Order 1...');
    let order1OfferedDriver = null;
    for (let i = 0; i < 7; i++) {
      await wait(1000);
      const { data: o } = await sb.from('orders').select('offered_driver_id').eq('id', order1Id).single();
      if (o.offered_driver_id) {
        order1OfferedDriver = o.offered_driver_id;
        break;
      }
    }
    console.log(`Order 1 offered to: ${order1OfferedDriver === driverA.id ? 'Driver A (Good Score)' : order1OfferedDriver === driverB.id ? 'Driver B (Bad Score)' : 'Nobody'}`);
    if (order1OfferedDriver !== driverA.id) {
      throw new Error(`Expected order to be offered to Driver A (Good Score), but got ${order1OfferedDriver}`);
    }

    // 6. Test Tip Farming Protection: Verify tip is hidden in 'available' orders query
    console.log('6. Querying available orders for Driver A to verify tip masking...');
    const availableOrdersRes = await req('/admin-api/driver/orders?scope=available', {
      method: 'GET',
      headers: { Authorization: `Bearer ${driverA.token}` }
    });
    const offeredOrder = (availableOrdersRes.body || []).find(o => o.id === order1Id);
    if (!offeredOrder) throw new Error('Order 1 not found in available orders list');
    console.log(`Offered Order Tip amount returned to driver: ${offeredOrder.rider_tip}`);
    if (Number(offeredOrder.rider_tip) !== 0) {
      throw new Error(`Expected rider_tip to be masked (0), but got ${offeredOrder.rider_tip}`);
    }

    // Helper function to wait for order to be offered and then force timeout
    async function forceTimeout(orderId, expectedDriverId, expectedConsecutive) {
      console.log(`Waiting for order ${orderId} to be offered to driver ${expectedDriverId}...`);
      let offered = false;
      for (let i = 0; i < 15; i++) {
        const { data: o } = await sb.from('orders').select('offered_driver_id').eq('id', orderId).single();
        if (o && o.offered_driver_id === expectedDriverId) {
          offered = true;
          break;
        }
        await wait(1000);
      }
      if (!offered) {
        throw new Error(`Order ${orderId} was not offered to driver ${expectedDriverId} in time`);
      }

      console.log(`Order ${orderId} offered to driver. Forcing timeout...`);
      // Mark Driver B as rejected to prevent dispatch worker from auto-offering the order to Driver B in the same loop pass
      await sb.from('orders').update({
        rejected_driver_ids: [driverB.id],
        offer_expires_at: new Date(Date.now() - 10000).toISOString()
      }).eq('id', orderId);

      console.log(`Waiting for dispatch loop to process timeout for order ${orderId}...`);
      let timedOut = false;
      for (let i = 0; i < 15; i++) {
        const { data: drv } = await sb.from('drivers').select('consecutive_timeouts').eq('id', expectedDriverId).single();
        if (drv && drv.consecutive_timeouts === expectedConsecutive) {
          timedOut = true;
          break;
        }
        await wait(1000);
      }
      if (!timedOut) {
        const { data: drv } = await sb.from('drivers').select('consecutive_timeouts, driver_timeout_count, paused_until').eq('id', expectedDriverId).single();
        const { data: o } = await sb.from('orders').select('offered_driver_id, offer_expires_at').eq('id', orderId).single();
        throw new Error(`Timeout was not processed for driver ${expectedDriverId}. consecutive_timeouts=${drv?.consecutive_timeouts} (expected ${expectedConsecutive}). Order offered_driver_id=${o?.offered_driver_id}, offer_expires_at=${o?.offer_expires_at}`);
      }

      // Cancel the order so it doesn't get processed anymore
      await sb.from('orders').update({ status: 'cancelled', cancelled_reason: 'Scoring test timeout processed' }).eq('id', orderId);
    }

    // 7. Simulate 3 consecutive timeouts for Driver A to verify pause penalty & admin alert
    console.log('7. Simulating 3 consecutive timeouts for Driver A...');
    // Timeout 1
    console.log('Forcing timeout 1...');
    await forceTimeout(order1Id, driverA.id, 1);

    // Timeout 2: Create a new order to offer to Driver A again
    console.log('Forcing timeout 2 (Creating Order 2)...');
    const order2Res = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Safi Test Scoring',
        delivery_lat: Number(store.lat),
        delivery_lng: Number(store.lng),
        payment_method: 'cash',
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });
    const order2Id = order2Res.body.order_id;
    await forceTimeout(order2Id, driverA.id, 2);

    // Timeout 3: Create another order to offer to Driver A
    console.log('Forcing timeout 3 (Creating Order 3)...');
    const order3Res = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Safi Test Scoring',
        delivery_lat: Number(store.lat),
        delivery_lng: Number(store.lng),
        payment_method: 'cash',
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });
    const order3Id = order3Res.body.order_id;
    await forceTimeout(order3Id, driverA.id, 0);

    let { data: drvA } = await sb.from('drivers').select('consecutive_timeouts, paused_until, driver_timeout_count').eq('id', driverA.id).single();
    console.log(`Driver A final: consecutive_timeouts=${drvA.consecutive_timeouts}, timeout_count=${drvA.driver_timeout_count}, paused_until=${drvA.paused_until}`);
    if (drvA.consecutive_timeouts !== 0) throw new Error(`Expected consecutive_timeouts to reset to 0, got ${drvA.consecutive_timeouts}`);
    if (!drvA.paused_until) throw new Error('Expected paused_until to be set');
    const pauseExpiry = new Date(drvA.paused_until);
    if (pauseExpiry < new Date(Date.now() + 10 * 60000)) throw new Error('Expected paused_until to be 15 minutes in the future');

    // Check admin support alert ticket
    console.log('Checking for admin alert ticket in support_requests...');
    const { data: alerts } = await sb.from('support_requests').select('*').eq('subject', 'Alerte Livreur: Refus excessifs').order('created_at', { ascending: false });
    if (!alerts || alerts.length === 0) throw new Error('Expected admin alert support request to be created');
    console.log(`Alert found: Message: "${alerts[0].message}"`);

    // Ensure Driver B is AVAILABLE in case of any overlaps
    await sb.from('drivers').update({ state: 'AVAILABLE' }).eq('id', driverB.id);

    // 8. Create Order 4: verify it is offered to Driver B because Driver A is paused
    console.log('8. Creating Order 4 to verify Driver A is bypassed while paused...');
    const order4Res = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Safi Test Scoring',
        delivery_lat: Number(store.lat),
        delivery_lng: Number(store.lng),
        payment_method: 'cash',
        rider_tip: 15.00,
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });
    const order4Id = order4Res.body.order_id;

    console.log('Waiting for dispatch loop to offer Order 4...');
    let order4OfferedDriver = null;
    for (let i = 0; i < 7; i++) {
      await wait(1000);
      const { data: o } = await sb.from('orders').select('offered_driver_id').eq('id', order4Id).single();
      if (o.offered_driver_id) {
        order4OfferedDriver = o.offered_driver_id;
        break;
      }
    }
    console.log(`Order 4 offered to: ${order4OfferedDriver === driverA.id ? 'Driver A (Good Score, Paused)' : order4OfferedDriver === driverB.id ? 'Driver B (Bad Score, Active)' : 'Nobody'}`);
    if (order4OfferedDriver !== driverB.id) {
      throw new Error(`Expected order to be offered to Driver B (since A is paused), but got ${order4OfferedDriver}`);
    }

    // Claim order as Driver B
    console.log('Driver B claiming Order 4...');
    const claimRes = await req(`/admin-api/driver/orders/${order4Id}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverB.token}` }
    });
    if (claimRes.status !== 200) throw new Error('Driver B claim failed');

    // Verify Driver B can see the tip once claimed (scope = 'mine')
    console.log('Querying active orders for Driver B to verify tip visibility...');
    const mineOrdersRes = await req('/admin-api/driver/orders?scope=mine', {
      method: 'GET',
      headers: { Authorization: `Bearer ${driverB.token}` }
    });
    const claimedOrder = (mineOrdersRes.body || []).find(o => o.id === order4Id);
    if (!claimedOrder) throw new Error('Claimed order not found in mine scope');
    console.log(`Claimed Order Tip amount returned: ${claimedOrder.rider_tip}`);
    if (Number(claimedOrder.rider_tip) !== 15.00) {
      throw new Error(`Expected rider_tip to be visible (15.00), but got ${claimedOrder.rider_tip}`);
    }

    // Set Driver B offline
    await req('/admin-api/driver/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverB.token}` },
      body: { is_online: false }
    });

    console.log('--- ALL ACCEPTANCE SCORING & DISPATCH PENALTY TESTS PASSED SUCCESSFULLY! ---');

  } catch (err) {
    console.error('Test Failed:', err.message);
    process.exit(1);
  }
}

run();

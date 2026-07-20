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

// Haversine formula for assertions
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function run() {
  console.log('--- TESTING STRICT DRIVER STATES & TELEMETRY ---');
  try {
    // Put all existing drivers offline and set coordinates to null to avoid dispatch interference
    console.log('Making sure all existing drivers are offline to avoid interference...');
    const { error: cleanErr } = await sb.from('drivers').update({
      is_online: false,
      state: 'OFFLINE',
      current_lat: null,
      current_lng: null
    }).neq('id', '00000000-0000-0000-0000-000000000000');
    if (cleanErr) throw new Error('Failed to clean up existing drivers: ' + cleanErr.message);

    // Cancel all old unassigned orders
    console.log('Cleaning up old unassigned orders...');
    const { error: cleanOrdersErr } = await sb.from('orders').update({
      status: 'cancelled',
      cancelled_reason: 'Test suite cleanup'
    }).is('driver_id', null).in('status', ['pending', 'confirmed', 'preparing']).neq('id', '00000000-0000-0000-0000-000000000000');
    if (cleanOrdersErr) throw new Error('Failed to clean up old orders: ' + cleanOrdersErr.message);

    // 1. Fetch store and item
    console.log('1. Fetching store and menu item...');
    let { data: store, error: storeErr } = await sb.from('stores').select('id, lat, lng').eq('is_open', true).limit(1).single();
    if (storeErr || !store) throw new Error('Could not fetch open store: ' + storeErr?.message);

    // Ensure store has valid coords (Safi center coords)
    if (!store.lat || !store.lng) {
      console.log('Store coords are null. Setting them in DB to Safi Center...');
      await sb.from('stores').update({ lat: 32.2994, lng: -9.2372 }).eq('id', store.id);
      store.lat = 32.2994;
      store.lng = -9.2372;
    }
    console.log(`Store coords: lat=${store.lat}, lng=${store.lng}`);

    const { data: menuItem, error: itemErr } = await sb.from('menu_items').select('id, price').eq('store_id', store.id).eq('is_available', true).eq('options', '[]').limit(1).single();
    if (itemErr || !menuItem) throw new Error('Could not fetch menu item: ' + itemErr?.message);

    // 2. Register/Login Customer
    console.log('2. Registering and logging in customer...');
    const userPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const registerUser = await req('/admin-api/auth/register', {
      body: { phone: userPhone, password: 'testpassword123', full_name: 'Driver States Customer', city: 'آسفي' }
    });
    if (registerUser.status !== 200) {
      throw new Error(`Customer register failed: ${JSON.stringify(registerUser.body)}`);
    }
    const customerId = registerUser.body.id;
    const syntheticEmail = `u${userPhone.replace(/\D/g, '')}@jaheez.app`;
    
    const userSb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    const { data: authData, error: authErr } = await userSb.auth.signInWithPassword({
      email: syntheticEmail,
      password: 'testpassword123'
    });
    if (authErr || !authData.session) {
      throw new Error(`Customer login failed: ${authErr?.message}`);
    }
    const customerToken = authData.session.access_token;

    // 3. Register/Login Driver
    console.log('3. Registering and logging in driver...');
    const driverPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const driverCin = `CIN` + Math.floor(100000 + Math.random() * 900000);
    const nowSec = Math.floor(Date.now() / 1000);
    const adminToken = jwt.sign(
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
    const createDriver = await req('/admin-api/v1/admin/drivers', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { cin: driverCin, password: 'driverpassword123', full_name: 'Driver States Test Driver', phone: driverPhone, vehicle_type: 'motorcycle', city: 'آسفي' }
    });
    if (createDriver.status !== 201) {
      throw new Error(`Driver creation failed: ${JSON.stringify(createDriver.body)}`);
    }
    const driverId = createDriver.body.id;

    const loginDriver = await req('/admin-api/driver/login', {
      body: { cin: driverCin, password: 'driverpassword123' }
    });
    if (loginDriver.status !== 200) {
      throw new Error(`Driver login failed: ${JSON.stringify(loginDriver.body)}`);
    }
    const driverToken = loginDriver.body.token;

    // Verify initial state is OFFLINE
    let { data: drv } = await sb.from('drivers').select('state, total_offers, accepted_offers, driver_timeout_count, driver_suspicious_count').eq('id', driverId).single();
    console.log(`Initial driver state: ${drv.state}`);
    if (drv.state !== 'OFFLINE') throw new Error(`Expected state OFFLINE, got ${drv.state}`);

    // 4. Go Online
    console.log('4. Going online...');
    await req('/admin-api/driver/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { is_online: true }
    });
    // Telemetry location to be dispatchable
    await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { latitude: Number(store.lat), longitude: Number(store.lng), accuracy: 10 }
    });

    ({ data: drv } = await sb.from('drivers').select('state').eq('id', driverId).single());
    console.log(`State after going online: ${drv.state}`);
    if (drv.state !== 'AVAILABLE') throw new Error(`Expected AVAILABLE, got ${drv.state}`);

    // 5. Create Order 1 to test dispatch & offer timeout
    console.log('5. Testing Offer creation & timeout...');
    const order1Response = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Safi Test 1',
        delivery_lat: Number(store.lat),
        delivery_lng: Number(store.lng),
        payment_method: 'cash',
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });
    if (order1Response.status !== 201) {
      throw new Error(`Checkout 1 failed: ${JSON.stringify(order1Response.body)}`);
    }
    const order1Id = order1Response.body.order_id;
    console.log(`Created Order 1: ${order1Id}`);

    // Wait for dispatch loop (max 7s)
    console.log('Waiting for dispatch loop to offer Order 1 to driver...');
    let order1Offered = false;
    for (let i = 0; i < 7; i++) {
      await wait(1000);
      const { data: o } = await sb.from('orders').select('offered_driver_id').eq('id', order1Id).single();
      if (o.offered_driver_id === driverId) {
        order1Offered = true;
        break;
      }
    }
    if (!order1Offered) throw new Error('Order 1 was not offered to the driver.');

    ({ data: drv } = await sb.from('drivers').select('state, total_offers, driver_acceptance_rate').eq('id', driverId).single());
    console.log(`Driver state when offered: ${drv.state}, total_offers=${drv.total_offers}, acceptance_rate=${drv.driver_acceptance_rate}`);
    if (drv.state !== 'OFFERED') throw new Error(`Expected OFFERED state, got ${drv.state}`);
    if (drv.total_offers !== 1) throw new Error(`Expected total_offers=1, got ${drv.total_offers}`);

    // Force offer timeout by setting offer_expires_at in the past
    console.log('Forcing offer timeout in DB...');
    await sb.from('orders').update({
      offer_expires_at: new Date(Date.now() - 10000).toISOString()
    }).eq('id', order1Id);

    // Wait for dispatch loop to expire the offer
    console.log('Waiting for dispatch loop to expire the offer...');
    let offerExpired = false;
    for (let i = 0; i < 7; i++) {
      await wait(1000);
      const { data: o } = await sb.from('orders').select('offered_driver_id').eq('id', order1Id).single();
      if (o.offered_driver_id === null) {
        offerExpired = true;
        break;
      }
    }
    if (!offerExpired) throw new Error('Offer did not expire.');

    ({ data: drv } = await sb.from('drivers').select('state, total_offers, accepted_offers, driver_timeout_count, driver_acceptance_rate').eq('id', driverId).single());
    console.log(`Driver after timeout: state=${drv.state}, timeout_count=${drv.driver_timeout_count}, acceptance_rate=${drv.driver_acceptance_rate}%`);
    if (drv.state !== 'AVAILABLE') throw new Error(`Expected state AVAILABLE, got ${drv.state}`);
    if (drv.driver_timeout_count !== 1) throw new Error(`Expected timeout_count=1, got ${drv.driver_timeout_count}`);
    if (Number(drv.driver_acceptance_rate) !== 0) throw new Error(`Expected acceptance_rate=0%, got ${drv.driver_acceptance_rate}%`);

    // 6. Create Order 2 to test Claim flow and Telemetry tracking
    console.log('6. Testing Order 2 claim flow...');
    const order2Response = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Safi Test 2',
        delivery_lat: Number(store.lat),
        delivery_lng: Number(store.lng),
        payment_method: 'cash',
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });
    if (order2Response.status !== 201) {
      throw new Error(`Checkout 2 failed: ${JSON.stringify(order2Response.body)}`);
    }
    const order2Id = order2Response.body.order_id;
    console.log(`Created Order 2: ${order2Id}`);

    // Wait for dispatch loop (max 7s)
    console.log('Waiting for dispatch loop to offer Order 2...');
    let order2Offered = false;
    for (let i = 0; i < 7; i++) {
      await wait(1000);
      const { data: o } = await sb.from('orders').select('offered_driver_id').eq('id', order2Id).single();
      if (o.offered_driver_id === driverId) {
        order2Offered = true;
        break;
      }
    }
    if (!order2Offered) throw new Error('Order 2 was not offered to the driver.');

    // Claim the order
    console.log('Driver claiming Order 2...');
    const claimRes = await req(`/admin-api/driver/orders/${order2Id}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    if (claimRes.status !== 200) {
      throw new Error(`Claim failed: ${JSON.stringify(claimRes.body)}`);
    }

    ({ data: drv } = await sb.from('drivers').select('state, total_offers, accepted_offers, driver_acceptance_rate, last_moved_at, last_movement_lat, last_movement_lng').eq('id', driverId).single());
    console.log(`Driver after claim: state=${drv.state}, total_offers=${drv.total_offers}, accepted_offers=${drv.accepted_offers}, acceptance_rate=${drv.driver_acceptance_rate}%, last_moved_at=${drv.last_moved_at}`);
    if (drv.state !== 'ACCEPTED') throw new Error(`Expected state ACCEPTED, got ${drv.state}`);
    if (drv.accepted_offers !== 1) throw new Error(`Expected accepted_offers=1, got ${drv.accepted_offers}`);
    if (Number(drv.driver_acceptance_rate) !== 50) throw new Error(`Expected acceptance_rate=50%, got ${drv.driver_acceptance_rate}%`);
    if (!drv.last_moved_at) throw new Error('Expected last_moved_at to be set');
    if (Number(drv.last_movement_lat) !== Number(store.lat)) throw new Error('Expected last_movement_lat to equal store.lat');

    // 7. Test Telemetry: No movement warning
    console.log('7. Testing Telemetry: No movement warning...');
    // Force last_moved_at to be 4 minutes ago
    const forceLastMoved1 = await sb.from('drivers').update({
      last_moved_at: new Date(Date.now() - 4 * 60000).toISOString()
    }).eq('id', driverId).select('id, last_moved_at').single();
    console.log(`Forced last_moved_at (Accepted state): ${forceLastMoved1.data.last_moved_at}`);

    // Send location update without moving (same coordinates)
    await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { latitude: Number(store.lat), longitude: Number(store.lng), accuracy: 10 }
    });

    // Check order warning flag
    let { data: order2 } = await sb.from('orders').select('is_movement_warning, is_progress_flagged, is_suspicious').eq('id', order2Id).single();
    console.log(`Order 2 movement warning: ${order2.is_movement_warning}`);
    if (!order2.is_movement_warning) throw new Error('Expected is_movement_warning to be true');

    // 8. Driver stage update: picked_up
    console.log('8. Stage update: picked_up...');
    const stageRes = await req(`/admin-api/driver/orders/${order2Id}/stage`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { stage: 'picked_up' }
    });
    if (stageRes.status !== 200) {
      throw new Error(`Stage update failed: ${JSON.stringify(stageRes.body)}`);
    }

    ({ data: drv } = await sb.from('drivers').select('state, last_moved_at').eq('id', driverId).single());
    console.log(`Driver after pickup: state=${drv.state}, last_moved_at=${drv.last_moved_at}`);
    if (drv.state !== 'PICKED_UP') throw new Error(`Expected state PICKED_UP, got ${drv.state}`);

    // 9. Test Telemetry: No progress at store warning
    console.log('9. Testing Telemetry: No progress at store warning...');
    // Force last_moved_at to be 4 minutes ago
    const forceLastMoved2 = await sb.from('drivers').update({
      last_moved_at: new Date(Date.now() - 4 * 60000).toISOString()
    }).eq('id', driverId).select('id, last_moved_at').single();
    console.log(`Forced last_moved_at (Picked Up state): ${forceLastMoved2.data.last_moved_at}`);

    // Send location update (still at store)
    await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { latitude: Number(store.lat), longitude: Number(store.lng), accuracy: 10 }
    });

    ({ data: order2 } = await sb.from('orders').select('is_progress_flagged, is_suspicious').eq('id', order2Id).single());
    ({ data: drv } = await sb.from('drivers').select('driver_suspicious_count').eq('id', driverId).single());
    console.log(`Order 2 progress flagged: ${order2.is_progress_flagged}, suspicious: ${order2.is_suspicious}, driver suspicious count: ${drv.driver_suspicious_count}`);
    if (!order2.is_progress_flagged) throw new Error('Expected is_progress_flagged to be true');
    if (!order2.is_suspicious) throw new Error('Expected is_suspicious to be true');
    if (drv.driver_suspicious_count !== 1) throw new Error(`Expected driver_suspicious_count=1, got ${drv.driver_suspicious_count}`);

    // 10. Test Telemetry: Transition from PICKED_UP to DELIVERING when moving away
    console.log('10. Testing Telemetry: Transition to DELIVERING...');
    // Send location update 500m away (lat + 0.005, lng + 0.005)
    await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { latitude: Number(store.lat) + 0.005, longitude: Number(store.lng) + 0.005, accuracy: 10 }
    });

    ({ data: drv } = await sb.from('drivers').select('state').eq('id', driverId).single());
    console.log(`Driver state after moving away: ${drv.state}`);
    if (drv.state !== 'DELIVERING') throw new Error(`Expected state DELIVERING, got ${drv.state}`);

    // 11. Test Telemetry: ETA delay safety flagging
    console.log('11. Testing Telemetry: ETA delay safety flagging...');
    // Set picked_up_at to be 50 minutes ago and eta to be "15" in order 2, reset suspicious status for testing
    await sb.from('orders').update({
      picked_up_at: new Date(Date.now() - 50 * 60000).toISOString(),
      eta: '15 mins',
      is_suspicious: false
    }).eq('id', order2Id);

    // Send location update
    await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { latitude: Number(store.lat) + 0.005, longitude: Number(store.lng) + 0.005, accuracy: 10 }
    });

    ({ data: order2 } = await sb.from('orders').select('is_suspicious').eq('id', order2Id).single());
    ({ data: drv } = await sb.from('drivers').select('driver_suspicious_count').eq('id', driverId).single());
    console.log(`Order 2 suspicious: ${order2.is_suspicious}, driver suspicious count: ${drv.driver_suspicious_count}`);
    if (!order2.is_suspicious) throw new Error('Expected is_suspicious to be true due to ETA delay');
    if (drv.driver_suspicious_count !== 2) throw new Error(`Expected driver_suspicious_count=2, got ${drv.driver_suspicious_count}`);

    // 12. Test order completion: resets driver to AVAILABLE (if online)
    console.log('12. Completing order...');
    const completeRes = await req(`/admin-api/driver/orders/${order2Id}/stage`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { stage: 'delivered' }
    });
    if (completeRes.status !== 200) {
      throw new Error(`Order complete failed: ${JSON.stringify(completeRes.body)}`);
    }

    ({ data: drv } = await sb.from('drivers').select('state').eq('id', driverId).single());
    console.log(`Driver state after order completion: ${drv.state}`);
    if (drv.state !== 'AVAILABLE') throw new Error(`Expected AVAILABLE, got ${drv.state}`);

    // 13. Test going offline: resets driver to OFFLINE
    console.log('13. Going offline...');
    await req('/admin-api/driver/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { is_online: false }
    });

    ({ data: drv } = await sb.from('drivers').select('state').eq('id', driverId).single());
    console.log(`Driver state after going offline: ${drv.state}`);
    if (drv.state !== 'OFFLINE') throw new Error(`Expected OFFLINE, got ${drv.state}`);

    console.log('--- ALL STRICT DRIVER STATE & TELEMETRY TESTS PASSED SUCCESSFULLY! ---');

  } catch (err) {
    console.error('Test Failed:', err.message);
    process.exit(1);
  }
}

run();

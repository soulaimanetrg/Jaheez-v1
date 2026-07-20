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
    body: { cin, password: 'driverpassword123', full_name: name, phone, vehicle_type: 'motorcycle', city: 'Safi' }
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
  console.log('=== STARTING AUTOMATED ADMIN CONTROLS & METRICS TESTS ===');
  try {
    const adminToken = getAdminToken();

    // 1. Clean up drivers
    console.log('Cleaning up existing drivers...');
    await sb.from('drivers').update({
      is_online: false,
      state: 'OFFLINE',
      current_lat: null,
      current_lng: null,
      paused_until: null,
      suspension_until: null
    }).neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Fetch active store and item
    console.log('Fetching active store and menu item...');
    let { data: store } = await sb.from('stores').select('id, lat, lng').eq('is_open', true).limit(1).single();
    if (!store.lat || !store.lng) {
      await sb.from('stores').update({ lat: 32.2994, lng: -9.2372 }).eq('id', store.id);
      store.lat = 32.2994;
      store.lng = -9.2372;
    }
    const { data: menuItem } = await sb.from('menu_items').select('id, price').eq('store_id', store.id).eq('is_available', true).eq('options', '[]').limit(1).single();

    // 3. Register Customer
    console.log('Registering test customer...');
    const userPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const registerUser = await req('/admin-api/auth/register', {
      body: { phone: userPhone, password: 'testpassword123', full_name: 'Admin Test Customer', city: 'Safi' }
    });
    
    // Auth Customer properly using Supabase Auth signInWithPassword
    const syntheticEmail = `u${userPhone.replace(/\D/g, '')}@jaheez.app`;
    const userSb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    const { data: authData, error: authErr } = await userSb.auth.signInWithPassword({
      email: syntheticEmail,
      password: 'testpassword123'
    });
    if (authErr || !authData.session) {
      throw new Error(`Customer auth failed: ${authErr ? authErr.message : 'No session'}`);
    }
    const customerToken = authData.session.access_token;

    // 4. Register two drivers: Driver A and Driver B
    console.log('Registering test drivers...');
    const phoneA = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const cinA = 'CIN' + Math.floor(100000 + Math.random() * 900000);
    const driverA = await registerDriver(phoneA, cinA, 'Driver Alpha', adminToken);

    const phoneB = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const cinB = 'CIN' + Math.floor(100000 + Math.random() * 900000);
    const driverB = await registerDriver(phoneB, cinB, 'Driver Beta', adminToken);

    console.log(`Driver A: id=${driverA.id}`);
    console.log(`Driver B: id=${driverB.id}`);

    // Bring Driver A online
    console.log('Bringing Driver A online...');
    const goOnlineA = await req('/admin-api/driver/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverA.token}` },
      body: { is_online: true, current_lat: 32.2994, current_lng: -9.2372 }
    });
    if (goOnlineA.status !== 200) {
      throw new Error(`Failed to bring Driver A online: ${JSON.stringify(goOnlineA.body)}`);
    }

    // --- TEST 2: Pause Driver ---
    console.log('\n--- TEST 2: Pause Driver ---');
    const pauseRes = await req(`/admin-api/v1/admin/drivers/${driverA.id}/pause`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { duration_minutes: 15 }
    });
    console.log('Pause status:', pauseRes.status);
    if (pauseRes.status !== 200) {
      throw new Error(`Pause driver endpoint failed: ${JSON.stringify(pauseRes.body)}`);
    }

    const { data: dbDriverAAfterPause } = await sb.from('drivers').select('paused_until').eq('id', driverA.id).single();
    console.log('paused_until in DB:', dbDriverAAfterPause.paused_until);
    if (!dbDriverAAfterPause.paused_until || new Date(dbDriverAAfterPause.paused_until) <= new Date()) {
      throw new Error('paused_until was not correctly updated in DB');
    }
    console.log('Pause Driver verification successful.');

    // --- TEST 3: Force Offline ---
    console.log('\n--- TEST 3: Force Offline ---');
    // Ensure coordinates are set in telemetry / location
    await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverA.token}` },
      body: { latitude: 32.2994, longitude: -9.2372 }
    });

    const forceOfflineRes = await req(`/admin-api/v1/admin/drivers/${driverA.id}/force-offline`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Force offline status:', forceOfflineRes.status);
    if (forceOfflineRes.status !== 200) {
      throw new Error(`Force offline endpoint failed: ${JSON.stringify(forceOfflineRes.body)}`);
    }

    // Verify DB offline
    const { data: dbDriverAAfterOffline } = await sb.from('drivers').select('is_online, state').eq('id', driverA.id).single();
    console.log('DB status after offline: is_online =', dbDriverAAfterOffline.is_online, 'state =', dbDriverAAfterOffline.state);
    if (dbDriverAAfterOffline.is_online !== false || dbDriverAAfterOffline.state !== 'OFFLINE') {
      throw new Error('Driver was not marked offline in DB');
    }
    console.log('Force Offline verification successful.');

    // --- TEST 4: Temporary Suspension ---
    console.log('\n--- TEST 4: Temporary Suspension ---');
    // Bring Driver A online again
    await req('/admin-api/driver/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverA.token}` },
      body: { is_online: true, current_lat: 32.2994, current_lng: -9.2372 }
    });
    await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverA.token}` },
      body: { latitude: 32.2994, longitude: -9.2372 }
    });

    const suspendRes = await req(`/admin-api/v1/admin/drivers/${driverA.id}/suspend`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { duration_hours: 2 }
    });
    console.log('Suspend status:', suspendRes.status);
    if (suspendRes.status !== 200) {
      throw new Error(`Suspend driver endpoint failed: ${JSON.stringify(suspendRes.body)}`);
    }

    // Verify DB suspension and offline state
    const { data: dbDriverAAfterSuspend } = await sb.from('drivers').select('is_online, state, suspension_until').eq('id', driverA.id).single();
    console.log('DB status after suspend: is_online =', dbDriverAAfterSuspend.is_online, 'state =', dbDriverAAfterSuspend.state, 'suspension_until =', dbDriverAAfterSuspend.suspension_until);
    if (dbDriverAAfterSuspend.is_online !== false || dbDriverAAfterSuspend.state !== 'OFFLINE' || !dbDriverAAfterSuspend.suspension_until) {
      throw new Error('Driver was not correctly suspended in DB');
    }
    console.log('Temporary Suspension verification successful.');

    // Clear suspension for reassignment tests
    await sb.from('drivers').update({ suspension_until: null, paused_until: null }).eq('id', driverA.id);

    // --- TEST 5: Manual Reassignment ---
    console.log('\n--- TEST 5: Manual Reassignment ---');
    // Bring both drivers online and available
    console.log('Setting Driver A and Driver B to AVAILABLE...');
    await sb.from('drivers').update({ is_online: true, state: 'AVAILABLE', current_lat: 32.2994, current_lng: -9.2372 }).in('id', [driverA.id, driverB.id]);

    // Checkout order
    console.log('Checking out order...');
    const checkoutRes = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Admin Controls Test Address',
        delivery_lat: Number(store.lat),
        delivery_lng: Number(store.lng),
        payment_method: 'cash',
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });
    if (checkoutRes.status !== 201) {
      throw new Error(`Checkout failed: ${JSON.stringify(checkoutRes.body)}`);
    }
    const orderId = checkoutRes.body.order_id;
    console.log(`Created order: id=${orderId}`);

    // Wait until offered to a driver
    console.log('Waiting for dispatch matching...');
    let offeredDriverId = null;
    for (let i = 0; i < 15; i++) {
      await wait(1000);
      const { data: o } = await sb.from('orders').select('offered_driver_id').eq('id', orderId).single();
      if (o && o.offered_driver_id) {
        offeredDriverId = o.offered_driver_id;
        break;
      }
    }
    console.log(`Order offered to driver: ${offeredDriverId}`);
    if (!offeredDriverId) {
      throw new Error('Order was not offered to any driver in time');
    }

    // Claim order as the offered driver
    const claimDriverToken = offeredDriverId === driverA.id ? driverA.token : driverB.token;
    const idleDriverId = offeredDriverId === driverA.id ? driverB.id : driverA.id;
    console.log(`Claiming order as driver: ${offeredDriverId}`);
    const claimRes = await req(`/admin-api/driver/orders/${orderId}/claim`, {
      headers: { Authorization: `Bearer ${claimDriverToken}` }
    });
    if (claimRes.status !== 200) {
      throw new Error(`Claim failed: ${JSON.stringify(claimRes.body)}`);
    }

    // Now order has driver assigned
    const { data: orderAfterClaim } = await sb.from('orders').select('driver_id, status, reassignment_count').eq('id', orderId).single();
    console.log('Order state after claim: driver_id =', orderAfterClaim.driver_id, 'status =', orderAfterClaim.status);

    // Test reassignment back to pool
    console.log('Reassigning order back to pool (unassigning)...');
    const reassignPoolRes = await req(`/admin-api/v1/admin/orders/${orderId}/reassign`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Reassign pool status:', reassignPoolRes.status);
    if (reassignPoolRes.status !== 200) {
      throw new Error(`Reassign pool failed: ${JSON.stringify(reassignPoolRes.body)}`);
    }

    // Verify order fields and unassigned driver
    const { data: orderAfterPool } = await sb.from('orders').select('driver_id, status, reassignment_count, driver_fault, is_refund_eligible').eq('id', orderId).single();
    console.log('Order after pool: driver_id =', orderAfterPool.driver_id, 'status =', orderAfterPool.status, 'reassignment_count =', orderAfterPool.reassignment_count, 'driver_fault =', orderAfterPool.driver_fault, 'is_refund_eligible =', orderAfterPool.is_refund_eligible);
    if (orderAfterPool.driver_id !== null || orderAfterPool.status !== 'confirmed' || orderAfterPool.reassignment_count !== 1 || !orderAfterPool.driver_fault || !orderAfterPool.is_refund_eligible) {
      throw new Error('Order unassignment fields are invalid');
    }

    // Verify old driver state reset
    const { data: oldDriverAfterPool } = await sb.from('drivers').select('state').eq('id', offeredDriverId).single();
    console.log('Old driver state after unassign:', oldDriverAfterPool.state);
    if (oldDriverAfterPool.state !== 'AVAILABLE') {
      throw new Error('Old driver state was not reset to AVAILABLE');
    }

    // Test reassignment directly to Driver A (or whichever is the target)
    const targetDriverId = idleDriverId;
    console.log(`Reassigning order directly to driver: ${targetDriverId}...`);
    const reassignTargetRes = await req(`/admin-api/v1/admin/orders/${orderId}/reassign`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { target_driver_id: targetDriverId }
    });
    console.log('Reassign target status:', reassignTargetRes.status);
    if (reassignTargetRes.status !== 200) {
      throw new Error(`Reassign to target failed: ${JSON.stringify(reassignTargetRes.body)}`);
    }

    // Verify order fields and assigned driver
    const { data: orderAfterTarget } = await sb.from('orders').select('driver_id, status, reassignment_count, driver_fault, is_refund_eligible, eta').eq('id', orderId).single();
    console.log('Order after target: driver_id =', orderAfterTarget.driver_id, 'status =', orderAfterTarget.status, 'reassignment_count =', orderAfterTarget.reassignment_count, 'eta =', orderAfterTarget.eta);
    if (orderAfterTarget.driver_id !== targetDriverId || orderAfterTarget.status !== 'confirmed' || orderAfterTarget.reassignment_count !== 2) {
      throw new Error('Order assignment to target driver failed');
    }

    // Verify target driver state is ACCEPTED
    const { data: targetDriverAfterReassign } = await sb.from('drivers').select('state').eq('id', targetDriverId).single();
    console.log('Target driver state after assignment:', targetDriverAfterReassign.state);
    if (targetDriverAfterReassign.state !== 'ACCEPTED') {
      throw new Error('Target driver state was not set to ACCEPTED');
    }
    console.log('Manual Reassignment verification successful.');

    // --- TEST 6: Operational Metrics ---
    console.log('\n--- TEST 6: Operational Metrics ---');
    const metricsRes = await req('/admin-api/analytics?days=30', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Metrics status:', metricsRes.status);
    if (metricsRes.status !== 200) {
      throw new Error(`Analytics metrics failed: ${JSON.stringify(metricsRes.body)}`);
    }

    const metrics = metricsRes.body.operationalMetrics;
    console.log('Returned Operational Metrics:', metrics);
    if (!metrics) {
      throw new Error('operationalMetrics field is missing from analytics response');
    }

    const requiredKeys = [
      'acceptance_rate',
      'ignored_offers',
      'average_pickup_delay_minutes',
      'average_delivery_duration_minutes',
      'suspicious_drivers',
      'reassignment_frequency'
    ];

    requiredKeys.forEach(k => {
      if (metrics[k] === undefined || metrics[k] === null) {
        throw new Error(`Required metric key "${k}" is missing`);
      }
    });

    console.log('Operational Metrics verification successful.');

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('\n!!! TEST FAILED !!!');
    console.error(err);
    process.exit(1);
  }
}

run();

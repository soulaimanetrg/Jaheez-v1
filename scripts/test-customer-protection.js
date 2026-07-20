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

async function createAndOfferOrder(customerToken, store, menuItem, driverId) {
  const res = await req('/admin-api/v1/checkout', {
    headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
    body: {
      store_id: store.id,
      delivery_address: 'Customer Protection Test Address',
      delivery_lat: Number(store.lat),
      delivery_lng: Number(store.lng),
      payment_method: 'cash',
      items: [{ menu_item_id: menuItem.id, quantity: 1 }]
    }
  });
  if (res.status !== 201) throw new Error('Order checkout failed');
  const orderId = res.body.order_id;

  // Poll until order is offered to driver
  let offered = false;
  for (let i = 0; i < 10; i++) {
    await wait(1000);
    const { data: o } = await sb.from('orders').select('offered_driver_id').eq('id', orderId).single();
    if (o && o.offered_driver_id === driverId) {
      offered = true;
      break;
    }
  }
  if (!offered) throw new Error(`Order ${orderId} was not offered to driver`);
  return orderId;
}

async function run() {
  console.log('--- STARTING AUTOMATED CUSTOMER PROTECTION TESTS ---');
  try {
    // Put all existing drivers offline and set coordinates to null to avoid dispatch interference
    console.log('Cleaning up existing drivers...');
    await sb.from('drivers').update({
      is_online: false,
      state: 'OFFLINE',
      current_lat: null,
      current_lng: null
    }).neq('id', '00000000-0000-0000-0000-000000000000');

    // Fetch store and menu item
    let { data: store } = await sb.from('stores').select('id, lat, lng').eq('is_open', true).limit(1).single();
    if (!store.lat || !store.lng) {
      await sb.from('stores').update({ lat: 32.2994, lng: -9.2372 }).eq('id', store.id);
      store.lat = 32.2994;
      store.lng = -9.2372;
    }
    const { data: menuItem } = await sb.from('menu_items').select('id, price, store_id').eq('is_available', true).eq('options', '[]').limit(1).single();

    // Register Customer
    const userPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const registerUser = await req('/admin-api/auth/register', {
      body: { phone: userPhone, password: 'testpassword123', full_name: 'Customer Protect Tester', city: 'آسفي' }
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

    // Register Driver
    console.log('Registering driver...');
    const adminToken = getAdminToken();
    const phone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const cin = `CIN` + Math.floor(100000 + Math.random() * 900000);
    const driver = await registerDriver(phone, cin, 'Driver Protect Tester', adminToken);

    // Put online and available
    await sb.from('drivers').update({ is_online: true, state: 'AVAILABLE', current_lat: Number(store.lat), current_lng: Number(store.lng) }).eq('id', driver.id);

    // ==========================================
    // TEST 1: Cancellation reason mandatory
    // ==========================================
    console.log('\n--- TEST 1: Cancellation reason validation ---');
    const order1Id = await createAndOfferOrder(customerToken, store, menuItem, driver.id);
    await req(`/admin-api/driver/orders/${order1Id}/claim`, { method: 'POST', headers: { Authorization: `Bearer ${driver.token}` } });

    // Cancel order as driver without reason
    let cancelRes = await req(`/admin-api/driver/orders/${order1Id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driver.token}` },
      body: { reason: '' } // Empty reason
    });
    console.log(`Cancel order with empty reason: Status: ${cancelRes.status}, Message: "${cancelRes.body.message || JSON.stringify(cancelRes.body)}"`);
    if (cancelRes.status !== 400) throw new Error('Expected 400 Bad Request for empty cancellation reason');

    // Cancel with proper reason
    cancelRes = await req(`/admin-api/driver/orders/${order1Id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driver.token}` },
      body: { reason: 'Accident' }
    });
    console.log(`Cancel order with proper reason: Status: ${cancelRes.status}`);
    if (cancelRes.status !== 200) throw new Error('Expected 200 OK');

    // Verify driver_fault = true and is_refund_eligible = true
    let { data: o1 } = await sb.from('orders').select('driver_fault, is_refund_eligible').eq('id', order1Id).single();
    console.log(`Order 1 driver_fault: ${o1.driver_fault}, is_refund_eligible: ${o1.is_refund_eligible}`);
    if (!o1.driver_fault || !o1.is_refund_eligible) throw new Error('Expected driver_fault and is_refund_eligible to be true after driver manual cancellation');

    // ==========================================
    // TEST 2: Offer timeout reassignment and driver_fault
    // ==========================================
    console.log('\n--- TEST 2: Offer timeout reassignment metrics ---');
    await sb.from('drivers').update({ state: 'AVAILABLE' }).eq('id', driver.id);
    const order2Id = await createAndOfferOrder(customerToken, store, menuItem, driver.id);

    // Force offer timeout by setting expiration in past
    console.log('Forcing offer timeout in DB...');
    await sb.from('orders').update({ offer_expires_at: new Date(Date.now() - 1000).toISOString() }).eq('id', order2Id);
    
    // Wait for worker check (worker ticks every 1s, timeout checked every 2s)
    console.log('Waiting for timeout worker to process...');
    await wait(3000);

    // Verify order reassignment metrics
    let { data: o2 } = await sb.from('orders').select('reassignment_count, driver_fault, offered_driver_id').eq('id', order2Id).single();
    console.log(`Order 2 reassignment_count: ${o2.reassignment_count}, driver_fault: ${o2.driver_fault}, offered_driver_id: ${o2.offered_driver_id}`);
    if (o2.reassignment_count !== 1 || !o2.driver_fault || o2.offered_driver_id !== null) {
      throw new Error('Expected reassignment_count = 1, driver_fault = true, and offered_driver_id = null');
    }

    // Cancel order 2 to clean up
    await sb.from('orders').update({ status: 'cancelled', cancelled_reason: 'Test cleanup' }).eq('id', order2Id);

    // ==========================================
    // TEST 3: Stalled acceptance auto-reassignment (> 5 mins)
    // ==========================================
    console.log('\n--- TEST 3: Stalled acceptance auto-reassignment (> 5 mins) ---');
    await sb.from('drivers').update({ state: 'AVAILABLE', last_moved_at: new Date().toISOString() }).eq('id', driver.id);
    const order3Id = await createAndOfferOrder(customerToken, store, menuItem, driver.id);
    await req(`/admin-api/driver/orders/${order3Id}/claim`, { method: 'POST', headers: { Authorization: `Bearer ${driver.token}` } });

    // Force stationary delay in ACCEPTED state
    console.log('Forcing stationary duration > 5 minutes...');
    const stalledMovedAt = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    await sb.from('drivers').update({ last_moved_at: stalledMovedAt }).eq('id', driver.id);

    // Send a location heartbeat to trigger telemetry evaluation
    console.log('Sending location heartbeat...');
    const heartbeat1 = await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driver.token}` },
      body: { latitude: Number(store.lat), longitude: Number(store.lng) }
    });
    console.log(`Telemetry heartbeat result status: ${heartbeat1.status}`);

    // Verify auto-reassignment metrics
    let { data: o3 } = await sb.from('orders').select('driver_id, reassignment_count, driver_fault, is_refund_eligible, eta, delivery_delay_minutes').eq('id', order3Id).single();
    let { data: drvState } = await sb.from('drivers').select('state').eq('id', driver.id).single();
    console.log(`Order 3 driver_id: ${o3.driver_id}, reassignment_count: ${o3.reassignment_count}, driver_fault: ${o3.driver_fault}, refund eligible: ${o3.is_refund_eligible}, delay: ${o3.delivery_delay_minutes} mins, Recalculated ETA: "${o3.eta}"`);
    console.log(`Driver state: ${drvState.state}`);

    if (o3.driver_id !== null || o3.reassignment_count !== 1 || !o3.driver_fault || !o3.is_refund_eligible || drvState.state !== 'AVAILABLE') {
      throw new Error('Stalled acceptance auto-reassignment assertion failed');
    }

    // Cancel order 3 to clean up
    await sb.from('orders').update({ status: 'cancelled', cancelled_reason: 'Test cleanup' }).eq('id', order3Id);

    // ==========================================
    // TEST 4: Stalled restaurant dwell (> 12 mins)
    // ==========================================
    console.log('\n--- TEST 4: Stalled restaurant dwell auto-reassignment (> 12 mins) ---');
    await sb.from('drivers').update({ state: 'AVAILABLE' }).eq('id', driver.id);
    const order4Id = await createAndOfferOrder(customerToken, store, menuItem, driver.id);
    await req(`/admin-api/driver/orders/${order4Id}/claim`, { method: 'POST', headers: { Authorization: `Bearer ${driver.token}` } });

    // Set arrived pickup timestamp to 13 minutes ago
    console.log('Setting arrived_pickup_at to 13 minutes ago...');
    const stalledArrivedAt = new Date(Date.now() - 14 * 60 * 1000).toISOString();
    await sb.from('orders').update({ arrived_pickup_at: stalledArrivedAt }).eq('id', order4Id);

    // Send location heartbeat
    console.log('Sending location heartbeat...');
    const heartbeat2 = await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driver.token}` },
      body: { latitude: Number(store.lat), longitude: Number(store.lng) }
    });

    // Verify auto-reassignment
    let { data: o4 } = await sb.from('orders').select('driver_id, reassignment_count, driver_fault, is_refund_eligible, eta').eq('id', order4Id).single();
    let { data: drvState4 } = await sb.from('drivers').select('state').eq('id', driver.id).single();
    console.log(`Order 4 driver_id: ${o4.driver_id}, reassignment_count: ${o4.reassignment_count}, driver_fault: ${o4.driver_fault}, refund eligible: ${o4.is_refund_eligible}, Recalculated ETA: "${o4.eta}"`);
    console.log(`Driver state: ${drvState4.state}`);

    if (o4.driver_id !== null || o4.reassignment_count !== 1 || !o4.driver_fault || !o4.is_refund_eligible || drvState4.state !== 'AVAILABLE') {
      throw new Error('Stalled restaurant dwell auto-reassignment assertion failed');
    }

    // Cancel order 4
    await sb.from('orders').update({ status: 'cancelled', cancelled_reason: 'Test cleanup' }).eq('id', order4Id);

    // ==========================================
    // TEST 5: Delayed transit (> ETA + 15 mins)
    // ==========================================
    console.log('\n--- TEST 5: Delayed delivery transit (> ETA + 15 mins) ---');
    await sb.from('drivers').update({ state: 'AVAILABLE' }).eq('id', driver.id);
    const order5Id = await createAndOfferOrder(customerToken, store, menuItem, driver.id);
    await req(`/admin-api/driver/orders/${order5Id}/claim`, { method: 'POST', headers: { Authorization: `Bearer ${driver.token}` } });
    await req(`/admin-api/driver/orders/${order5Id}/stage`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driver.token}` },
      body: { stage: 'picked_up' }
    });

    // Set picked_up_at to 40 minutes ago (with ETA = 10 min, so delay is 30 mins)
    console.log('Setting picked_up_at and eta in DB...');
    const delayedPickedUpAt = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    await sb.from('orders').update({ picked_up_at: delayedPickedUpAt, eta: '10 min' }).eq('id', order5Id);

    // Set driver state to DELIVERING and set last_moved_at
    await sb.from('drivers').update({ state: 'DELIVERING', last_moved_at: new Date().toISOString() }).eq('id', driver.id);

    // Send location heartbeat to trigger delivery delay evaluation
    console.log('Sending location heartbeat...');
    await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driver.token}` },
      body: { latitude: Number(store.lat) + 0.05, longitude: Number(store.lng) + 0.05 }
    });

    // Verify delay tracking
    let { data: o5 } = await sb.from('orders').select('delivery_delay_minutes, driver_fault, is_refund_eligible, is_suspicious').eq('id', order5Id).single();
    console.log(`Order 5 delay: ${o5.delivery_delay_minutes} mins, driver_fault: ${o5.driver_fault}, refund eligible: ${o5.is_refund_eligible}, is_suspicious: ${o5.is_suspicious}`);
    if (o5.delivery_delay_minutes < 25 || !o5.driver_fault || !o5.is_refund_eligible || !o5.is_suspicious) {
      throw new Error('Delayed transit metrics assertion failed');
    }

    // Cancel order 5
    await sb.from('orders').update({ status: 'cancelled', cancelled_reason: 'Test cleanup' }).eq('id', order5Id);

    // Clean up driver
    await sb.from('drivers').delete().eq('id', driver.id);

    console.log('\n--- ALL AUTOMATED CUSTOMER PROTECTION TESTS PASSED SUCCESSFULLY! ---');

  } catch (err) {
    console.error('Test Failed:', err.message);
    process.exit(1);
  }
}

run();

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
      delivery_address: 'Abuse Test Delivery',
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
  console.log('--- STARTING AUTOMATED ABUSE DETECTION TESTS ---');
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
      body: { phone: userPhone, password: 'testpassword123', full_name: 'Abuse Test Customer', city: 'آسفي' }
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
    const driver = await registerDriver(phone, cin, 'Driver Abuse Tester', adminToken);

    // Initial check: warning_count should be 0
    let { data: drv } = await sb.from('drivers').select('warning_count, suspension_until, last_suspicious_activity').eq('id', driver.id).single();
    console.log(`Initial warning count: ${drv.warning_count}`);
    if (drv.warning_count !== 0) throw new Error('Expected 0 warnings initially');

    // ==========================================
    // WARNING 1: Driver manual cancellation
    // ==========================================
    console.log('\n--- SCENARIO 1: First driver manual cancellation (Warning 1) ---');
    // Put online and available
    await sb.from('drivers').update({ is_online: true, state: 'AVAILABLE', current_lat: Number(store.lat), current_lng: Number(store.lng) }).eq('id', driver.id);
    
    const order1Id = await createAndOfferOrder(customerToken, store, menuItem, driver.id);
    
    // Claim the order
    console.log('Claiming Order 1...');
    let claimRes = await req(`/admin-api/driver/orders/${order1Id}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driver.token}` }
    });
    if (claimRes.status !== 200) throw new Error('Claim failed');

    // Cancel order as driver
    console.log('Driver cancelling Order 1...');
    let cancelRes = await req(`/admin-api/driver/orders/${order1Id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driver.token}` },
      body: { reason: 'Vehicle broke down' }
    });
    if (cancelRes.status !== 200) throw new Error('Cancellation failed');

    // Assert Warning 1 recorded
    ({ data: drv } = await sb.from('drivers').select('warning_count, last_suspicious_activity').eq('id', driver.id).single());
    console.log(`Driver warnings count: ${drv.warning_count}, Activity: "${drv.last_suspicious_activity}"`);
    if (drv.warning_count !== 1) throw new Error(`Expected warning_count = 1, got ${drv.warning_count}`);
    if (!drv.last_suspicious_activity.includes('excessive_cancellations')) throw new Error('Expected violation activity type in text');

    // ==========================================
    // WARNING 2: Driver manual cancellation
    // ==========================================
    console.log('\n--- SCENARIO 2: Second driver manual cancellation (Warning 2) ---');
    await sb.from('drivers').update({ state: 'AVAILABLE' }).eq('id', driver.id);
    
    const order2Id = await createAndOfferOrder(customerToken, store, menuItem, driver.id);
    await req(`/admin-api/driver/orders/${order2Id}/claim`, { method: 'POST', headers: { Authorization: `Bearer ${driver.token}` } });
    await req(`/admin-api/driver/orders/${order2Id}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${driver.token}` }, body: { reason: 'Traffic jam' } });

    ({ data: drv } = await sb.from('drivers').select('warning_count').eq('id', driver.id).single());
    console.log(`Driver warnings count: ${drv.warning_count}`);
    if (drv.warning_count !== 2) throw new Error(`Expected warning_count = 2, got ${drv.warning_count}`);

    // ==========================================
    // WARNING 3: Driver manual cancellation (Suspension 1 hour)
    // ==========================================
    console.log('\n--- SCENARIO 3: Third driver manual cancellation (Warning 3: 1-hour Block) ---');
    await sb.from('drivers').update({ state: 'AVAILABLE' }).eq('id', driver.id);
    
    const order3Id = await createAndOfferOrder(customerToken, store, menuItem, driver.id);
    await req(`/admin-api/driver/orders/${order3Id}/claim`, { method: 'POST', headers: { Authorization: `Bearer ${driver.token}` } });
    await req(`/admin-api/driver/orders/${order3Id}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${driver.token}` }, body: { reason: 'Tyre puncture' } });

    ({ data: drv } = await sb.from('drivers').select('warning_count, suspension_until, state, is_online').eq('id', driver.id).single());
    console.log(`Driver warnings count: ${drv.warning_count}, State: ${drv.state}, Online: ${drv.is_online}, Suspension until: ${drv.suspension_until}`);
    if (drv.warning_count !== 3) throw new Error(`Expected warning_count = 3, got ${drv.warning_count}`);
    if (drv.state !== 'OFFLINE' || drv.is_online !== false) throw new Error('Expected driver to be forced OFFLINE');
    if (!drv.suspension_until) throw new Error('Expected 1-hour block suspension_until timestamp');
    
    const blockTime = new Date(drv.suspension_until);
    if (blockTime < new Date(Date.now() + 50 * 60 * 1000)) throw new Error('Expected suspension duration to be approximately 1 hour');

    // ==========================================
    // WARNING 4: Driver manual cancellation (Permanent suspension)
    // ==========================================
    console.log('\n--- SCENARIO 4: Fourth driver manual cancellation (Warning 4: Permanent Block) ---');
    // Force reset state to online/available to bypass 1-hour block for testing
    await sb.from('drivers').update({ is_online: true, state: 'AVAILABLE', suspension_until: null }).eq('id', driver.id);
    
    const order4Id = await createAndOfferOrder(customerToken, store, menuItem, driver.id);
    await req(`/admin-api/driver/orders/${order4Id}/claim`, { method: 'POST', headers: { Authorization: `Bearer ${driver.token}` } });
    await req(`/admin-api/driver/orders/${order4Id}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${driver.token}` }, body: { reason: 'Emergency' } });

    ({ data: drv } = await sb.from('drivers').select('warning_count, suspension_until, state, is_online, is_active').eq('id', driver.id).single());
    console.log(`Driver warnings count: ${drv.warning_count}, State: ${drv.state}, Online: ${drv.is_online}, Active: ${drv.is_active}, Suspension until: ${drv.suspension_until}`);
    if (drv.warning_count !== 4) throw new Error(`Expected warning_count = 4, got ${drv.warning_count}`);
    if (drv.state !== 'OFFLINE' || drv.is_online !== false || drv.is_active !== false) throw new Error('Expected driver to be deactivated permanently');
    
    const permDate = new Date(drv.suspension_until);
    if (permDate.getFullYear() < 9000) throw new Error('Expected permanent suspension date (year 9999)');

    // Verify support request was created for admin review
    console.log('Checking for admin review support ticket...');
    const { data: tickets } = await sb.from('support_requests').select('*').eq('subject', 'Alerte Abus Livreur: Examen Admin requis').order('created_at', { ascending: false });
    if (!tickets || tickets.length === 0) throw new Error('Expected admin review ticket to be created in support_requests table');
    console.log(`Admin ticket found: Ref: "${tickets[0].ref_number}", Message: "${tickets[0].message}"`);

    // Clean up driver
    await sb.from('drivers').delete().eq('id', driver.id);

    console.log('\n--- ALL AUTOMATED ABUSE DETECTION TESTS PASSED SUCCESSFULLY! ---');

  } catch (err) {
    console.error('Test Failed:', err.message);
    process.exit(1);
  }
}

run();

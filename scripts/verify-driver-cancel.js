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

async function run() {
  console.log('--- TESTING DRIVER CANCELLATION ---');
  try {
    // 1. Fetch store and item
    const { data: store } = await sb.from('stores').select('id').eq('is_open', true).limit(1).single();
    const { data: menuItem } = await sb.from('menu_items').select('id, price').eq('store_id', store.id).eq('is_available', true).eq('options', '[]').limit(1).single();
    
    // 2. Register/Login Customer
    const userPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const registerUser = await req('/admin-api/auth/register', {
      body: { phone: userPhone, password: 'testpassword123', full_name: 'Driver Cancel Test User', city: 'آسفي' }
    });
    if (registerUser.status !== 200) {
      throw new Error(`Customer register failed: ${JSON.stringify(registerUser.body)}`);
    }
    const customerId = registerUser.body.id;
    const syntheticEmail = `u${userPhone.replace(/\D/g, '')}@jaheez.app`;
    
    // Auth login via Supabase client to get the actual JWT
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
    const driverPhone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
    const driverCin = `CIN` + Math.floor(100000 + Math.random() * 900000);
    // Create driver via admin API
    const nowSec = Math.floor(Date.now() / 1000);
    const adminToken = jwt.sign(
      {
        id: 'bf5e793e-0d19-4d5b-809b-bbc09371976f', // Real admin ID
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
      body: { cin: driverCin, password: 'driverpassword123', full_name: 'Driver Cancel Test Driver', phone: driverPhone, vehicle_type: 'motorcycle', city: 'آسفي' }
    });
    
    const driverId = createDriver.body.id;
    // Login driver to get token
    const loginDriver = await req('/admin-api/driver/login', {
      body: { cin: driverCin, password: 'driverpassword123' }
    });
    const driverToken = loginDriver.body.token;

    // Make driver online and set location
    await req('/admin-api/driver/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { is_online: true }
    });
    await req('/admin-api/driver/me/location', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { latitude: 32.2994, longitude: -9.2372, accuracy: 10 }
    });

    // 4. Customer Checkouts
    const checkout = await req('/admin-api/v1/checkout', {
      headers: { Authorization: `Bearer ${customerToken}`, 'idempotency-key': 'idemp-' + Math.random() },
      body: {
        store_id: store.id,
        delivery_address: 'Safi Center',
        delivery_lat: 32.2994,
        delivery_lng: -9.2372,
        payment_method: 'cash',
        items: [{ menu_item_id: menuItem.id, quantity: 1 }]
      }
    });
    if (checkout.status !== 201) {
      throw new Error(`Checkout failed: ${JSON.stringify(checkout.body)}`);
    }
    const orderId = checkout.body.order_id;
    console.log(`Order created: ${orderId}`);

    // Set offered_driver_id to driverId
    await sb.from('orders').update({
      offered_driver_id: driverId,
      offer_expires_at: new Date(Date.now() + 60000).toISOString()
    }).eq('id', orderId);

    // Claim order as driver
    const claim = await req(`/admin-api/driver/orders/${orderId}/claim`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log(`Order claimed status: ${claim.status}`);

    // Call cancel order as driver
    const cancel = await req(`/admin-api/driver/orders/${orderId}/cancel`, {
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { reason: 'Magasin fermé par le livreur' }
    });
    console.log(`Order cancelled status: ${cancel.status}`);
    console.log('Cancel body:', cancel.body);

    if (cancel.status === 200 && cancel.body.status === 'cancelled') {
      console.log('✅ SUCCESS: Driver cancellation works!');
    } else {
      console.error('❌ FAILURE: Driver cancellation failed');
      process.exit(1);
    }

    // Clean up
    await sb.from('order_status_history').delete().eq('order_id', orderId);
    await sb.from('orders').delete().eq('id', orderId);
    await sb.from('drivers').delete().eq('id', driverId);
    await sb.from('users').delete().eq('id', customerId);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

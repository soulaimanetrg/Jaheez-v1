const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

async function run() {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  const { data: store } = await sb.from('stores').select('id').eq('is_open', true).limit(1).single();
  let { data: menuItem } = await sb.from('menu_items').select('id').eq('store_id', store.id).eq('is_available', true).eq('options', '[]').limit(1).maybeSingle();
  if (!menuItem) {
    const fallbackRes = await sb.from('menu_items').select('id').eq('store_id', store.id).limit(1).single();
    menuItem = fallbackRes.data;
  }

  // Create a temp user
  const phone = `+2126` + Math.floor(10000000 + Math.random() * 90000000);
  const email = `u${phone.replace(/\D/g, '')}@jaheez.app`;
  
  const regRes = await fetch(`${BASE_URL}/admin-api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password: 'testpassword123', full_name: 'Diag User', city: 'آسفي' })
  });
  const user = await regRes.json();

  const userSb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });
  const { data: auth } = await userSb.auth.signInWithPassword({ email, password: 'testpassword123' });
  const token = auth.session.access_token;

  console.log('--- TEST 1: Sending correct payload ---');
  const res1 = await fetch(`${BASE_URL}/admin-api/v1/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': 'diag-key-1-' + Math.random()
    },
    body: JSON.stringify({
      store_id: store.id,
      delivery_address: 'Safi City Center, Morocco',
      delivery_lat: null,
      delivery_lng: null,
      notes: null,
      payment_method: 'cash',
      rider_tip: 0,
      items: [{ menu_item_id: menuItem.id, quantity: 1, options: [] }]
    })
  });
  console.log('Res 1 Status:', res1.status);
  console.log('Res 1 Body:', await res1.json());

  console.log('--- TEST 2: Sending coordinates as empty strings / strings ---');
  const res2 = await fetch(`${BASE_URL}/admin-api/v1/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': 'diag-key-2-' + Math.random()
    },
    body: JSON.stringify({
      store_id: store.id,
      delivery_address: 'Safi City Center, Morocco',
      delivery_lat: '',
      delivery_lng: '',
      notes: null,
      payment_method: 'cash',
      rider_tip: 0,
      items: [{ menu_item_id: menuItem.id, quantity: 1, options: [] }]
    })
  });
  console.log('Res 2 Status:', res2.status);
  console.log('Res 2 Body:', await res2.json());

  console.log('--- TEST 3: Sending extra fields in items ---');
  const res3 = await fetch(`${BASE_URL}/admin-api/v1/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': 'diag-key-3-' + Math.random()
    },
    body: JSON.stringify({
      store_id: store.id,
      delivery_address: 'Safi City Center, Morocco',
      delivery_lat: null,
      delivery_lng: null,
      notes: null,
      payment_method: 'cash',
      rider_tip: 0,
      items: [{ menu_item_id: menuItem.id, quantity: 1, unit_price: 2500, options: [] }]
    })
  });
  console.log('Res 3 Status:', res3.status);
  console.log('Res 3 Body:', await res3.json());

  // Clean up
  await sb.from('users').delete().eq('id', user.id);
}

run().catch(console.error);

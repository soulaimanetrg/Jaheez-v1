require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log('Seeding sample users and orders...');

  // 1. Create a sample user
  const { data: uAuth, error: auErr } = await sb.auth.admin.createUser({
    phone: '+212600000001',
    phone_confirm: true,
    user_metadata: { full_name: 'Test User' }
  });
  if (auErr && !auErr.message.includes('already exists')) { console.error('Auth User error:', auErr.message); return; }
  const userId = uAuth?.user?.id || (await sb.from('users').select('id').eq('phone', '+212600000001').single()).data?.id;

  const { data: user, error: uErr } = await sb.from('users').upsert({
    id: userId,
    phone: '+212600000001',
    full_name: 'Test User',
    role: 'user',
    city: 'آسفي',
  }).select().single();

  if (uErr) { console.error('User error:', uErr.message); return; }
  console.log('User created:', user.id);

  // 2. Create a sample driver
  const { data: dAuth, error: adErr } = await sb.auth.admin.createUser({
    phone: '+212600000002',
    phone_confirm: true,
    user_metadata: { full_name: 'Test Driver' }
  });
  if (adErr && !adErr.message.includes('already exists')) { console.error('Auth Driver error:', adErr.message); return; }
  const driverUserId = dAuth?.user?.id || (await sb.from('users').select('id').eq('phone', '+212600000002').single()).data?.id;

  const { data: driverUser, error: duErr } = await sb.from('users').upsert({
    id: driverUserId,
    phone: '+212600000002',
    full_name: 'Test Driver',
    role: 'driver',
    city: 'آسفي',
  }).select().single();

  if (duErr) { console.error('Driver user error:', duErr.message); return; }
  
  const { data: driver, error: dErr } = await sb.from('drivers').upsert({
    user_id: driverUser.id,
    full_name: 'Test Driver',
    phone: '+212600000002',
    vehicle_type: 'motorcycle',
    is_online: true,
    is_verified: true,
  }).select().single();

  if (dErr) { console.error('Driver error:', dErr.message); return; }
  console.log('Driver created:', driver.id);

  // 3. Create some sample orders
  const { data: stores } = await sb.from('stores').select('id').limit(1);
  if (!stores?.length) { console.error('No stores found. Run seed-stores.js first.'); return; }
  const store_id = stores[0].id;

  const orders = [
    { user_id: user.id, store_id, total_amount: 150, status: 'delivered', payment_status: 'paid', delivery_address: 'Safi Street 1' },
    { user_id: user.id, store_id, total_amount: 85, status: 'pending', payment_status: 'pending', delivery_address: 'Safi Street 2' },
    { user_id: user.id, store_id, total_amount: 210, status: 'confirmed', payment_status: 'paid', delivery_address: 'Safi Street 3' },
  ];

  const { error: oErr } = await sb.from('orders').insert(orders);
  if (oErr) { console.error('Orders error:', oErr.message); return; }
  console.log('Sample orders created.');
}

seed();

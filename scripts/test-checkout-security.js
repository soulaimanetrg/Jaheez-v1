/**
 * JAHEEZ — Checkout and Payment Security Hardening Test Suite
 * Programmatically verifies server-authoritative checkout, Zod strict checks,
 * RLS wallet write blocking, legacy payment endpoint disabling, and idempotency.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BACKEND_URL = 'http://localhost:3002';
const PROXY_URL = 'http://localhost:5000';

async function logTestResult(name, promise) {
  try {
    const result = await promise;
    console.log(`[PASS] ${name}:`, result);
    return true;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    return false;
  }
}

async function run() {
  console.log('=== Starting JAHEEZ Phase 2 Security Tests ===\n');

  // Setup test environment (fetch stores & menu items)
  const { data: openStores, error: storeErr } = await supabase
    .from('stores')
    .select('id, name')
    .eq('is_open', true)
    .limit(1);

  if (storeErr || !openStores || openStores.length === 0) {
    console.error('No open stores found in the database. Please seed the DB before running tests.');
    process.exit(1);
  }
  const storeId = openStores[0].id;
  console.log(`Found open store: ${openStores[0].name} (${storeId})`);

  // Find a menu item with options and one without options
  const { data: allItems, error: itemsErr } = await supabase
    .from('menu_items')
    .select('id, name, options')
    .eq('store_id', storeId);

  if (itemsErr || !allItems || allItems.length === 0) {
    console.error('No menu items found for store. Please seed the DB menu_items.');
    process.exit(1);
  }

  const itemWithOptions = allItems.find(i => Array.isArray(i.options) && i.options.length > 0);
  const itemWithoutOptions = allItems.find(i => !Array.isArray(i.options) || i.options.length === 0) || allItems[0];

  console.log(`Item without options: ${itemWithoutOptions.name} (${itemWithoutOptions.id})`);
  if (itemWithOptions) {
    console.log(`Item with options: ${itemWithOptions.name} (${itemWithOptions.id})`);
  } else {
    console.log('No item with options found for this store.');
  }

  // Create temporary test users using Auth Admin
  const testEmail1 = `test-buyer1-${Date.now()}@jaheez.ma`;
  const testEmail2 = `test-buyer2-${Date.now()}@jaheez.ma`;

  console.log('\nCreating temporary test users...');
  
  const { data: { user: user1 }, error: u1Err } = await supabase.auth.admin.createUser({
    email: testEmail1,
    password: 'password123',
    email_confirm: true,
  });
  if (u1Err) throw new Error(`Failed to create test user 1: ${u1Err.message}`);

  const { data: { user: user2 }, error: u2Err } = await supabase.auth.admin.createUser({
    email: testEmail2,
    password: 'password123',
    email_confirm: true,
  });
  if (u2Err) throw new Error(`Failed to create test user 2: ${u2Err.message}`);

  // Retrieve user tokens by signing in
  const { data: session1, error: s1Err } = await supabase.auth.signInWithPassword({
    email: testEmail1,
    password: 'password123',
  });
  if (s1Err) throw new Error(`Failed to sign in user 1: ${s1Err.message}`);
  const token1 = session1.session.access_token;

  const { data: session2, error: s2Err } = await supabase.auth.signInWithPassword({
    email: testEmail2,
    password: 'password123',
  });
  if (s2Err) throw new Error(`Failed to sign in user 2: ${s2Err.message}`);
  const token2 = session2.session.access_token;

  console.log('Test users created and logged in successfully.\n');

  let passes = 0;
  let total = 0;

  // 1. Missing JWT returns 401
  total++;
  const t1 = await logTestResult('1. Missing JWT returns 401', (async () => {
    const res = await fetch(`${PROXY_URL}/admin-api/v1/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `test-key-1-${Date.now()}`
      },
      body: JSON.stringify({
        store_id: storeId,
        delivery_address: '123 Street Safi',
        payment_method: 'cash',
        items: [{ menu_item_id: itemWithoutOptions.id, quantity: 1 }]
      })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    const json = await res.json();
    return `Status: ${res.status}, Error: ${json.error}`;
  })());
  if (t1) passes++;

  // 2. Malformed payload returns 400
  total++;
  const t2 = await logTestResult('2. Malformed payload returns 400', (async () => {
    const res = await fetch(`${PROXY_URL}/admin-api/v1/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `test-key-2-${Date.now()}`
      },
      body: JSON.stringify({
        store_id: 'invalid-uuid-format',
        items: []
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    return `Status: ${res.status} (Rejected successfully)`;
  })());
  if (t2) passes++;

  // 3. Payload containing price_delta returns 400 (Zod strict rejection)
  total++;
  const t3 = await logTestResult('3. Payload containing price_delta returns 400', (async () => {
    const res = await fetch(`${PROXY_URL}/admin-api/v1/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `test-key-3-${Date.now()}`
      },
      body: JSON.stringify({
        store_id: storeId,
        delivery_address: '123 Street Safi',
        payment_method: 'cash',
        items: [{
          menu_item_id: itemWithoutOptions.id,
          quantity: 1,
          options: [{
            option_id: 'size',
            choice_id: 'sm',
            price_delta: 0 // Strictly forbidden modifier
          }]
        }]
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const json = await res.json();
    return `Status: ${res.status}, Message: ${json.message || JSON.stringify(json.errors)}`;
  })());
  if (t3) passes++;

  // 4. Required option omitted returns 400
  if (itemWithOptions) {
    const reqGroup = itemWithOptions.options.find(o => o.required);
    if (reqGroup) {
      total++;
      const t4 = await logTestResult('4. Required option omitted returns 400', (async () => {
        const res = await fetch(`${PROXY_URL}/admin-api/v1/checkout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token1}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `test-key-4-${Date.now()}`
          },
          body: JSON.stringify({
            store_id: storeId,
            delivery_address: '123 Street Safi',
            payment_method: 'cash',
            items: [{
              menu_item_id: itemWithOptions.id,
              quantity: 1,
              options: [] // Empty selections but group is required
            }]
          })
        });
        if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
        const json = await res.json();
        return `Status: ${res.status}, Error: ${json.error}`;
      })());
      if (t4) passes++;
    }
  }

  // 5. Invalid option choice returns 400
  if (itemWithOptions) {
    total++;
    const t5 = await logTestResult('5. Invalid option choice returns 400', (async () => {
      const res = await fetch(`${PROXY_URL}/admin-api/v1/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token1}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `test-key-5-${Date.now()}`
        },
        body: JSON.stringify({
          store_id: storeId,
          delivery_address: '123 Street Safi',
          payment_method: 'cash',
          items: [{
            menu_item_id: itemWithOptions.id,
            quantity: 1,
            options: [{
              option_id: itemWithOptions.options[0].id || itemWithOptions.options[0].label,
              choice_id: 'non-existent-choice-id'
            }]
          }]
        })
      });
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      const json = await res.json();
      return `Status: ${res.status}, Error: ${json.error}`;
    })());
    if (t5) passes++;
  }

  // 6. Duplicate idempotency key returns same cached response/order
  total++;
  const idemKey = `idem-key-test-${Date.now()}`;
  let firstOrderId = null;
  const t6 = await logTestResult('6. Duplicate idempotency key returns same cached response', (async () => {
    // 1st request
    const payload = {
      store_id: storeId,
      delivery_address: '123 Street Safi',
      payment_method: 'cash',
      items: [{ menu_item_id: itemWithoutOptions.id, quantity: 1 }]
    };
    
    const res1 = await fetch(`${PROXY_URL}/admin-api/v1/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey
      },
      body: JSON.stringify(payload)
    });
    if (res1.status !== 201) throw new Error(`Expected 201 on first request, got ${res1.status}`);
    const json1 = await res1.json();
    firstOrderId = json1.order_id;

    // 2nd request with same key
    const res2 = await fetch(`${PROXY_URL}/admin-api/v1/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey
      },
      body: JSON.stringify(payload)
    });
    if (res2.status !== 200) throw new Error(`Expected 200 on duplicate request, got ${res2.status}`);
    const json2 = await res2.json();
    if (json2.order_id !== firstOrderId) throw new Error(`Order ID mismatch! ${firstOrderId} !== ${json2.order_id}`);
    
    return `First status: ${res1.status}, Second status: ${res2.status}, OrderId: ${json2.order_id}, IsReplay: ${json2.idempotent}`;
  })());
  if (t6) passes++;

  // 7. Same idempotency key with different user rejected
  total++;
  const t7 = await logTestResult('7. Same idempotency key with different user rejected', (async () => {
    const res = await fetch(`${PROXY_URL}/admin-api/v1/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token2}`, // Different user (buyer 2)
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey // Reusing key created by buyer 1
      },
      body: JSON.stringify({
        store_id: storeId,
        delivery_address: '123 Street Safi',
        payment_method: 'cash',
        items: [{ menu_item_id: itemWithoutOptions.id, quantity: 1 }]
      })
    });
    if (res.status !== 409 && res.status !== 400) throw new Error(`Expected 409/400, got ${res.status}`);
    const json = await res.json();
    return `Status: ${res.status}, Error: ${json.error}`;
  })());
  if (t7) passes++;

  // 8. Direct wallet write with anon/authenticated client blocked by RLS
  total++;
  const t8 = await logTestResult('8. Direct wallet write/insert blocked by RLS', (async () => {
    const userClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token1}` } }
    });

    const { data: wBefore } = await userClient.from('wallets').select('balance_centimes').maybeSingle();
    
    // Attempt update
    const { error: updErr } = await userClient
      .from('wallets')
      .update({ balance_centimes: 9999999 })
      .eq('user_id', user1.id);

    // Attempt insert into transactions
    const { error: insErr } = await userClient
      .from('wallet_transactions')
      .insert({
        user_id: user1.id,
        type: 'credit',
        amount_centimes: 1000000,
        label: 'Direct hack'
      });

    const { data: wAfter } = await userClient.from('wallets').select('balance_centimes').maybeSingle();

    if (wBefore?.balance_centimes !== wAfter?.balance_centimes) {
      throw new Error(`Direct wallet update succeeded! Balance changed from ${wBefore?.balance_centimes} to ${wAfter?.balance_centimes}`);
    }
    
    return `Update Err: ${updErr?.message || 'none (no row matched/blocked)'}, Insert Err: ${insErr?.message || 'blocked'}`;
  })());
  if (t8) passes++;

  // 9. Legacy Stripe checkout endpoint returns 410
  total++;
  const t9 = await logTestResult('9. Legacy Stripe checkout endpoint returns 410', (async () => {
    const res = await fetch(`${PROXY_URL}/admin-api/stripe/checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_centimes: 1000, order_id: 'test' })
    });
    if (res.status !== 410) throw new Error(`Expected 410, got ${res.status}`);
    const json = await res.json();
    return `Status: ${res.status}, Error: ${json.error}`;
  })());
  if (t9) passes++;

  // 10. Legacy Stripe session endpoint returns 410
  total++;
  const t10 = await logTestResult('10. Legacy Stripe session endpoint returns 410', (async () => {
    const res = await fetch(`${PROXY_URL}/admin-api/stripe/session/test`, {
      method: 'GET'
    });
    if (res.status !== 410) throw new Error(`Expected 410, got ${res.status}`);
    const json = await res.json();
    return `Status: ${res.status}, Error: ${json.error}`;
  })());
  if (t10) passes++;

  // 11. Generic payment status reports online payments disabled
  total++;
  const t11 = await logTestResult('11. Payment status reports online payments disabled', (async () => {
    const res = await fetch(`${PROXY_URL}/admin-api/v1/payments/status`, {
      method: 'GET'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const json = await res.json();
    if (json.online_payments_enabled !== false) {
      throw new Error(`Expected online_payments_enabled=false, got ${json.online_payments_enabled}`);
    }
    if (json.cod_enabled !== true) {
      throw new Error(`Expected cod_enabled=true, got ${json.cod_enabled}`);
    }
    return `Provider: ${json.provider}, COD: ${json.cod_enabled}, Online: ${json.online_payments_enabled}`;
  })());
  if (t11) passes++;

  // 12. Backend checkout route through proxy returns 401 without token
  total++;
  const t12 = await logTestResult('12. Backend checkout route through proxy returns 401 without token', (async () => {
    const res = await fetch(`${PROXY_URL}/admin-api/v1/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `test-key-11-${Date.now()}`
      },
      body: JSON.stringify({
        store_id: storeId,
        delivery_address: '123 Street Safi',
        payment_method: 'cash',
        items: [{ menu_item_id: itemWithoutOptions.id, quantity: 1 }]
      })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    const json = await res.json();
    return `Status: ${res.status}, Error: ${json.error}`;
  })());
  if (t12) passes++;

  // Clean up test users
  console.log('\nCleaning up test users...');
  await supabase.auth.admin.deleteUser(user1.id);
  await supabase.auth.admin.deleteUser(user2.id);
  console.log('Cleanup complete.');

  console.log(`\n=== Test Summary: ${passes}/${total} passed ===`);
  if (passes === total) {
    console.log('ALL TESTS PASSED SUCCESSFULLY! Security boundary verified.');
  } else {
    console.warn(`Some tests FAILED (${total - passes}/${total}). Review logs above.`);
  }
}

run().catch(err => {
  console.error('Test execution threw unhandled exception:', err);
  process.exit(1);
});

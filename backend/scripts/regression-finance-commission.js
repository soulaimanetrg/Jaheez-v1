require('dotenv').config({ path: '.env.staging.local' });
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');
const { signAdminAccessToken, signDriverToken } = require('../dist/utils/jwt');

if (process.env.JAHEEZ_TARGET_ENV !== 'staging' || process.env.STAGING_CONFIRM_ISOLATED !== 'true') throw new Error('Isolated staging required.');
if (process.env.ONLINE_PAYMENTS_ENABLED !== 'false' || process.env.PAYMENT_PROVIDER !== 'disabled') throw new Error('Online payments must stay disabled during staging regression.');
const API_BASE = process.env.STAGING_API_BASE;
const TEST_DRIVER_ID = process.env.STAGING_TEST_DRIVER_ID;
const TEST_DRIVER_CIN = process.env.STAGING_TEST_DRIVER_CIN;
const TEST_ORDER_ID = process.env.STAGING_TEST_ORDER_ID;
const PREPAY_REFUND_ORDER_ID = process.env.STAGING_PREPAY_REFUND_ORDER_ID;
for (const [key,value] of Object.entries({STAGING_SUPABASE_URL:process.env.STAGING_SUPABASE_URL,STAGING_SERVICE_ROLE_KEY:process.env.STAGING_SERVICE_ROLE_KEY,STAGING_ANON_KEY:process.env.STAGING_ANON_KEY,STAGING_STORE_API_KEY:process.env.STAGING_STORE_API_KEY,STAGING_API_BASE:API_BASE,STAGING_TEST_DRIVER_ID:TEST_DRIVER_ID,STAGING_TEST_DRIVER_CIN:TEST_DRIVER_CIN,STAGING_TEST_ORDER_ID:TEST_ORDER_ID,STAGING_PREPAY_REFUND_ORDER_ID:PREPAY_REFUND_ORDER_ID})) if(!value) throw new Error(`${key} required`);

const supabase = createClient(process.env.STAGING_SUPABASE_URL, process.env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const publicSupabase = createClient(process.env.STAGING_SUPABASE_URL, process.env.STAGING_ANON_KEY, {
  auth: { persistSession: false },
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}/admin-api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { res, body };
}

async function requireOk(path, options = {}) {
  const result = await request(path, options);
  assert(result.res.ok, `${path} failed: ${result.res.status} ${JSON.stringify(result.body)}`);
  return result.body;
}

async function getAdminToken(role) {
  const { data: admin, error } = await supabase
    .from('admins')
    .select('id,email,role')
    .eq('is_active', true)
    .eq('role', role)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!admin) return null;
  return signAdminAccessToken({ id: admin.id, email: admin.email, role: admin.role, remember_me: false });
}

async function getDriverToken() {
  const { data: driver, error } = await supabase
    .from('drivers')
    .select('id, phone, cin')
    .eq('id', TEST_DRIVER_ID)
    .maybeSingle();

  assert(!error && driver, `Missing regression driver ${TEST_DRIVER_ID}`);
  return signDriverToken({ driver_id: driver.id, phone: driver.phone || '', cin: driver.cin || TEST_DRIVER_CIN });
}

async function assertSchemaReady() {
  const checks = [
    supabase.from('driver_shift_records').select('id,status,payout_status,total_earnings_centimes').limit(1),
    supabase.from('driver_earnings_ledger').select('id,driver_id,order_id,shift_id,status,amount_centimes').limit(1),
    supabase.from('driver_payout_holds').select('id,driver_id,shift_id,status').limit(1),
    supabase.from('app_settings').select('key,value').in('key', [
      'driver_delivery_commission_percent',
      'driver_tip_commission_percent',
      'driver_min_delivery_earning_centimes',
      'driver_cod_payout_requires_settlement',
    ]),
  ];
  const results = await Promise.all(checks);
  const failed = results.find((result) => result.error);
  if (failed) {
    throw new Error(`Commission schema is not ready. Apply migrations 024-027 first. DB error: ${failed.error.message}`);
  }
  assert((results[3].data || []).length >= 4, 'Commission settings are missing. Apply migration 027.');
}

async function resetControlledScenario() {
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();

  await supabase.from('driver_earnings_ledger').delete().eq('order_id', TEST_ORDER_ID);
  await supabase.from('driver_shift_records').delete().eq('driver_id', TEST_DRIVER_ID).eq('status', 'active');

  const orderUpdate = await supabase.from('orders').update({
    status: 'confirmed',
    driver_id: null,
    offered_driver_id: TEST_DRIVER_ID,
    offer_expires_at: future,
    rejected_driver_ids: [],
    payment_method: 'cash',
    payment_status: 'pending',
    rider_tip: 10,
    heading_to_pickup_at: null,
    arrived_pickup_at: null,
    picked_up_at: null,
    arrived_customer_at: null,
    delivered_at: null,
    pickup_confirmed_at: null,
    delivery_confirmed_at: null,
    financial_finalized_at: null,
    pickup_confirmation_code: null,
    delivery_confirmation_code: null,
    updated_at: now,
  }).eq('id', TEST_ORDER_ID);

  if (orderUpdate.error) throw new Error(`Failed to reset order. Apply migration 025 if code columns are missing: ${orderUpdate.error.message}`);

  const driverUpdate = await supabase.from('drivers').update({
    state: 'OFFLINE',
    is_online: false,
    shift_active: false,
    cod_balance_centimes: 0,
    updated_at: now,
  }).eq('id', TEST_DRIVER_ID);

  if (driverUpdate.error) throw new Error(`Failed to reset driver. Apply migration 024 if shift columns are missing: ${driverUpdate.error.message}`);
}

async function getCodes() {
  const { data, error } = await supabase
    .from('orders')
    .select('pickup_confirmation_code,delivery_confirmation_code')
    .eq('id', TEST_ORDER_ID)
    .maybeSingle();
  if (error) throw error;
  return data || {};
}

async function deliverOrder(driverToken) {
  await requireOk(`/v1/store/orders/${TEST_ORDER_ID}/ready`, { method: 'POST', headers: { 'X-Store-Key': process.env.STAGING_STORE_API_KEY }, body: { request_id: `ready-${Date.now()}` } });
  await requireOk(`/driver/orders/${TEST_ORDER_ID}/claim`, { method: 'POST', token: driverToken });
  await requireOk(`/driver/orders/${TEST_ORDER_ID}/stage`, { method: 'POST', token: driverToken, body: { stage: 'arrived_pickup' } });
  const codes = await getCodes();
  await requireOk(`/driver/orders/${TEST_ORDER_ID}/stage`, {
    method: 'POST',
    token: driverToken,
    body: { stage: 'picked_up', code: codes.pickup_confirmation_code },
  });
  await requireOk(`/driver/orders/${TEST_ORDER_ID}/stage`, { method: 'POST', token: driverToken, body: { stage: 'arrived_customer' } });
  await requireOk(`/driver/orders/${TEST_ORDER_ID}/stage`, {
    method: 'POST',
    token: driverToken,
    body: { stage: 'delivered', code: codes.delivery_confirmation_code },
  });
}

async function assertLedgerCreated() {
  const { data: rows, error } = await supabase
    .from('driver_earnings_ledger')
    .select('*')
    .eq('order_id', TEST_ORDER_ID)
    .order('source_type');

  assert(!error, `Ledger query failed: ${error?.message}`);
  assert((rows || []).some((row) => row.source_type === 'delivery_commission'), 'Missing delivery commission ledger row');
  assert((rows || []).some((row) => row.source_type === 'tip_commission'), 'Missing tip commission ledger row');
  assert(rows.every((row) => row.driver_id === TEST_DRIVER_ID), 'Ledger row assigned to wrong driver');
  assert(rows.reduce((sum, row) => sum + Number(row.amount_centimes || 0), 0) > 0, 'Ledger total is not positive');
}

async function assertCodHoldAndRelease(driverToken, adminToken) {
  const endShift = await requireOk('/driver/me/shift/end', { method: 'POST', token: driverToken });
  assert(endShift.shift_summary, 'Shift end did not return shift_summary');
  const closedShiftId = endShift.shift_summary.id || endShift.shift_summary.shift_id;
  assert(closedShiftId, 'Shift summary did not expose its identifier');
  assert(endShift.shift_summary.payout_status === 'held', `Expected COD-held payout, got ${endShift.shift_summary.payout_status}`);
  assert(endShift.shift_summary.hold_reason === 'cod_due', `Expected cod_due hold, got ${endShift.shift_summary.hold_reason}`);

  const payouts = await requireOk('/payouts?status=held', { token: adminToken });
  const heldShift = payouts.find((shift) => shift.id === closedShiftId);
  assert(heldShift, 'Held payout shift not visible to admin finance endpoint');

  const { data: driver } = await supabase
    .from('drivers')
    .select('cod_balance_centimes')
    .eq('id', TEST_DRIVER_ID)
    .maybeSingle();
  assert(Number(driver?.cod_balance_centimes || 0) > 0, 'COD balance was not increased by cash delivery');

  await requireOk('/cod-settlements', {
    method: 'POST',
    token: adminToken,
    body: { driver_id: TEST_DRIVER_ID, amount_dh: Number(driver.cod_balance_centimes) / 100, method: 'cash_window', note: 'Regression COD settlement', request_id: `cod-${Date.now()}` },
  });

  await wait(500);
  const pendingReview = await requireOk('/payouts?status=pending_review', { token: adminToken });
  assert(pendingReview.some((shift) => shift.id === closedShiftId), 'COD settlement did not release held payout to pending review');
  return closedShiftId;
}

async function approvePayAndRefund(shiftId, adminToken) {
  await supabase.from('app_settings').upsert({ key:'commission_internal_driver_allowlist', value:JSON.stringify([TEST_DRIVER_ID]) });
  await requireOk(`/payouts/${shiftId}`, { method:'PATCH', token:adminToken, body:{ action:'approve', request_id:`approve-${Date.now()}` } });
  await requireOk(`/payouts/${shiftId}`, { method:'PATCH', token:adminToken, body:{ action:'mark_paid', payment_reference:`STAGING-${Date.now()}`, request_id:`paid-${Date.now()}` } });
  const refund=await requireOk('/refunds',{method:'POST',token:adminToken,body:{order_id:TEST_ORDER_ID,amount_dh:'1.00',method:'wallet',reason:'Staging post-payment refund verification',request_id:`refund-create-${Date.now()}`}});
  await requireOk(`/refunds/${refund.id}`,{method:'PATCH',token:adminToken,body:{status:'completed',decision_note:'Staging E2E',request_id:`refund-complete-${Date.now()}`}});
  const {data:reversals}=await supabase.from('driver_earnings_ledger').select('id').eq('order_id',TEST_ORDER_ID).eq('source_type','reversal');
  assert((reversals||[]).length>0,'Post-payment refund did not create a compensating reversal');
}

async function assertPrePaymentRefund(adminToken) {
  const {data:before}=await supabase.from('driver_earnings_ledger').select('id,status,shift_id').eq('order_id',PREPAY_REFUND_ORDER_ID);
  assert((before||[]).length>0 && before.every(x=>!['paid','reversed'].includes(x.status)),'Pre-payment refund fixture must have unpaid ledger rows');
  const refund=await requireOk('/refunds',{method:'POST',token:adminToken,body:{order_id:PREPAY_REFUND_ORDER_ID,amount_dh:'1.00',method:'wallet',reason:'Staging pre-payment refund verification',request_id:`pre-refund-create-${Date.now()}`}});
  await requireOk(`/refunds/${refund.id}`,{method:'PATCH',token:adminToken,body:{status:'completed',decision_note:'Staging pre-payment E2E',request_id:`pre-refund-complete-${Date.now()}`}});
  const {data:after}=await supabase.from('driver_earnings_ledger').select('status,hold_reason').eq('order_id',PREPAY_REFUND_ORDER_ID);
  assert((after||[]).every(x=>x.status==='held'&&x.hold_reason==='refund_completed'),'Pre-payment refund did not hold unpaid commission');
}

async function assertSecurity(adminToken) {
  if (process.env.SUPABASE_ANON_KEY) {
    const publicRead = await publicSupabase
      .from('app_settings')
      .select('key,value')
      .eq('key', 'driver_delivery_commission_percent');
    assert(!publicRead.data || publicRead.data.length === 0, 'Public anon client can read financial app_settings');
  }

  const operationsToken = await getAdminToken('operations');
  if (operationsToken) {
    const denied = await request('/payouts', { token: operationsToken });
    assert(denied.res.status === 403, `Operations admin accessed finance payouts: ${denied.res.status}`);
  }

  const financeToken = await getAdminToken('finance');
  if (financeToken) {
    const payoutRead = await request('/payouts', { token: financeToken });
    assert(payoutRead.res.ok, `Finance admin cannot access payout review: ${payoutRead.res.status}`);

    const walletMutation = await request(`/wallets/${TEST_DRIVER_ID}/adjust`, {
      method: 'POST',
      token: financeToken,
      body: { type: 'credit', amount_centimes: 100, reason: 'Regression forbidden wallet mutation' },
    });
    assert(walletMutation.res.status === 403, `Finance admin mutated wallet: ${walletMutation.res.status}`);
  }

  const badSettings = await request('/settings', {
    method: 'POST',
    token: adminToken,
    body: { driver_delivery_commission_percent: '150' },
  });
  assert(badSettings.res.status === 400, 'Invalid commission percent was accepted');
}

async function main() {
  await assertSchemaReady();
  const adminToken = await getAdminToken('super_admin');
  assert(adminToken, 'No active super_admin found');
  const driverToken = await getDriverToken();

  await assertSecurity(adminToken);
  await assertPrePaymentRefund(adminToken);
  await resetControlledScenario();
  await requireOk('/driver/me/shift/start', { method: 'POST', token: driverToken });
  await deliverOrder(driverToken);
  await assertLedgerCreated();
  const shiftId = await assertCodHoldAndRelease(driverToken, adminToken);
  await approvePayAndRefund(shiftId, adminToken);

  console.log('Finance commission regression passed');
}

main().catch((error) => {
  console.error('Finance commission regression failed:', error.message);
  process.exitCode = 1;
});

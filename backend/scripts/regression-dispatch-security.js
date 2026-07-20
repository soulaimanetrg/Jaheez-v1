require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');
const { signAdminAccessToken, signDriverToken } = require('../src/utils/jwt');
const { io } = require('../../frontend/driver-app/node_modules/socket.io-client');

const API_BASE = process.env.REGRESSION_API_BASE || 'http://localhost:3002/admin-api';
const SOCKET_BASE = process.env.REGRESSION_SOCKET_BASE || 'http://localhost:3002';
const TEST_DRIVER_ID = process.env.REGRESSION_DRIVER_ID || 'ee84cdcc-d700-4838-96c0-665b8b82dec0';
const TEST_DRIVER_CIN = process.env.REGRESSION_DRIVER_CIN || 'HH194692';
const TEST_ORDER_ID = process.env.REGRESSION_ORDER_ID || '87065c2b-063a-4215-bc9d-7977df2746b1';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
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

async function getAdminToken() {
  const { data: admin, error } = await supabase
    .from('admins')
    .select('id,email,role')
    .eq('is_active', true)
    .in('role', ['super_admin', 'operations'])
    .limit(1)
    .maybeSingle();

  assert(!error && admin, 'No active super_admin/operations admin found for regression');
  return signAdminAccessToken({ id: admin.id, email: admin.email, role: admin.role, remember_me: false });
}

async function resetOrderForOffer() {
  const now = new Date().toISOString();
  await supabase.from('orders').update({
    status: 'confirmed',
    driver_id: null,
    offered_driver_id: null,
    offer_expires_at: null,
    rejected_driver_ids: [],
    arrived_pickup_at: null,
    picked_up_at: null,
    arrived_customer_at: null,
    delivered_at: null,
    updated_at: now,
  }).eq('id', TEST_ORDER_ID);

  await supabase.from('drivers').update({
    state: 'AVAILABLE',
    is_online: true,
    updated_at: now,
  }).eq('id', TEST_DRIVER_ID);
}

async function waitForAvailableOrder(driverToken) {
  for (let i = 0; i < 12; i++) {
    await wait(2500);
    const orders = await requireOk('/driver/orders?scope=available', { token: driverToken });
    const found = orders.find(order => order.id === TEST_ORDER_ID);
    if (found) return found;
  }
  throw new Error('Timed out waiting for available test order');
}

async function deliverAssignedOrder(driverToken) {
  for (const stage of ['arrived_pickup', 'picked_up', 'arrived_customer', 'delivered']) {
    await requireOk(`/driver/orders/${TEST_ORDER_ID}/stage`, {
      method: 'POST',
      token: driverToken,
      body: { stage },
    });
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id,status,offered_driver_id,offer_expires_at')
    .eq('id', TEST_ORDER_ID)
    .maybeSingle();
  const { data: driver } = await supabase
    .from('drivers')
    .select('id,state,is_online')
    .eq('id', TEST_DRIVER_ID)
    .maybeSingle();

  assert(order?.status === 'delivered', 'Order did not finish delivered');
  assert(order.offered_driver_id === null && order.offer_expires_at === null, 'Offer fields were not cleared');
  assert(driver?.state === 'AVAILABLE', 'Driver was not released after delivery');
}

function connectSocket(auth) {
  return io(SOCKET_BASE, {
    path: '/socket.io',
    transports: ['polling'],
    auth,
    reconnection: false,
    timeout: 8000,
    forceNew: true,
  });
}

function waitSocketConnect(socket) {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve({ type: 'timeout' }), 9000);
    socket.once('connect', () => { clearTimeout(timer); resolve({ type: 'connect' }); });
    socket.once('connect_error', error => { clearTimeout(timer); resolve({ type: 'error', message: error.message }); });
  });
}

function joinRoom(socket, room) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Join timed out: ${room}`)), 5000);
    socket.emit('join_room', room, result => { clearTimeout(timer); resolve(result); });
  });
}

async function closeSocket(socket) {
  socket.disconnect();
  await wait(200);
}

async function testAuthBoundaries(adminToken, driverToken) {
  const adminRoute = await request(`/v1/admin/orders/${TEST_ORDER_ID}/reassign`, {
    method: 'POST',
    token: driverToken,
    body: { target_driver_id: null },
  });
  assert(adminRoute.res.status === 401, 'Driver token was accepted on admin route');

  const driverRoute = await request('/driver/me', { token: adminToken });
  assert(driverRoute.res.status === 401, 'Admin token was accepted on driver route');
}

async function testShiftResponses(driverToken) {
  const endShift = await requireOk('/driver/me/shift/end', { method: 'POST', token: driverToken });
  assert(!JSON.stringify(endShift).includes('password_hash'), 'end shift leaked password_hash');

  const startShift = await requireOk('/driver/me/shift/start', { method: 'POST', token: driverToken });
  assert(!JSON.stringify(startShift).includes('password_hash'), 'start shift leaked password_hash');

  const me = await requireOk('/driver/me', { token: driverToken });
  assert(!JSON.stringify(me).includes('password_hash'), 'profile leaked password_hash');
}

async function testSocketSecurityAndOffer(driverToken, adminToken) {
  let socket = connectSocket({ actor: 'driver' });
  let result = await waitSocketConnect(socket);
  await closeSocket(socket);
  assert(result.type === 'error', 'Socket accepted missing token');

  socket = connectSocket({ token: adminToken, actor: 'driver' });
  result = await waitSocketConnect(socket);
  await closeSocket(socket);
  assert(result.type === 'error', 'Socket accepted admin token as driver');

  socket = connectSocket({ token: driverToken, actor: 'driver' });
  result = await waitSocketConnect(socket);
  assert(result.type === 'connect', `Driver socket failed: ${JSON.stringify(result)}`);

  const ownJoin = await joinRoom(socket, `driver:${TEST_DRIVER_ID}`);
  const adminJoin = await joinRoom(socket, 'admin:dashboard');
  const otherJoin = await joinRoom(socket, 'driver:00000000-0000-4000-8000-000000000000');
  assert(ownJoin?.ok === true, 'Driver failed to join own room');
  assert(adminJoin?.ok !== true && otherJoin?.ok !== true, 'Driver joined forbidden socket room');

  const offered = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for order:offered')), 30000);
    socket.once('order:offered', payload => { clearTimeout(timer); resolve(payload); });
  });

  await resetOrderForOffer();
  const payload = await offered;
  assert(payload.order_id === TEST_ORDER_ID, 'Socket offer payload used wrong order');
  await closeSocket(socket);

  await requireOk(`/driver/orders/${TEST_ORDER_ID}/claim`, { method: 'POST', token: driverToken });
  await deliverAssignedOrder(driverToken);
}

async function testDecline(driverToken) {
  await resetOrderForOffer();
  await waitForAvailableOrder(driverToken);
  await requireOk(`/driver/orders/${TEST_ORDER_ID}/decline`, {
    method: 'POST',
    token: driverToken,
    body: { reason: 'other', note: 'Regression decline' },
  });
  await wait(6000);

  const { data: order } = await supabase
    .from('orders')
    .select('offered_driver_id,offer_expires_at,rejected_driver_ids')
    .eq('id', TEST_ORDER_ID)
    .maybeSingle();
  const { data: driver } = await supabase
    .from('drivers')
    .select('state')
    .eq('id', TEST_DRIVER_ID)
    .maybeSingle();

  assert(order.offered_driver_id === null && order.offer_expires_at === null, 'Decline did not clear offer fields');
  assert(order.rejected_driver_ids.includes(TEST_DRIVER_ID), 'Decline did not reject driver for order');
  assert(driver.state === 'AVAILABLE', 'Driver was not available after decline');
}

async function testTimeout(driverToken) {
  const expiredAt = new Date(Date.now() - 10000).toISOString();
  await supabase.from('orders').update({
    status: 'confirmed',
    driver_id: null,
    offered_driver_id: TEST_DRIVER_ID,
    offer_expires_at: expiredAt,
    rejected_driver_ids: [],
    arrived_pickup_at: null,
    picked_up_at: null,
    arrived_customer_at: null,
    delivered_at: null,
    updated_at: new Date().toISOString(),
  }).eq('id', TEST_ORDER_ID);
  await supabase.from('drivers').update({ state: 'OFFERED', is_online: true, updated_at: new Date().toISOString() }).eq('id', TEST_DRIVER_ID);
  await wait(7000);

  const lateClaim = await request(`/driver/orders/${TEST_ORDER_ID}/claim`, { method: 'POST', token: driverToken });
  assert(lateClaim.res.status !== 200, 'Late claim after timeout was accepted');

  const { data: order } = await supabase
    .from('orders')
    .select('offered_driver_id,offer_expires_at,rejected_driver_ids')
    .eq('id', TEST_ORDER_ID)
    .maybeSingle();
  const { data: driver } = await supabase
    .from('drivers')
    .select('state,driver_timeout_count')
    .eq('id', TEST_DRIVER_ID)
    .maybeSingle();

  assert(order.offered_driver_id === null && order.offer_expires_at === null, 'Timeout did not clear offer fields');
  assert(order.rejected_driver_ids.includes(TEST_DRIVER_ID), 'Timeout did not reject driver');
  assert(driver.state === 'AVAILABLE', 'Driver was not available after timeout');
  assert(Number(driver.driver_timeout_count || 0) >= 1, 'Timeout count did not increment');
}

async function testAdminRescue(adminToken, driverToken) {
  await supabase.from('orders').update({
    status: 'confirmed',
    driver_id: TEST_DRIVER_ID,
    offered_driver_id: null,
    offer_expires_at: null,
    rejected_driver_ids: [],
    arrived_pickup_at: new Date().toISOString(),
    picked_up_at: null,
    arrived_customer_at: null,
    delivered_at: null,
    updated_at: new Date().toISOString(),
  }).eq('id', TEST_ORDER_ID);
  await supabase.from('drivers').update({ state: 'ACCEPTED', is_online: true, updated_at: new Date().toISOString() }).eq('id', TEST_DRIVER_ID);

  await requireOk(`/v1/admin/orders/${TEST_ORDER_ID}/reassign`, {
    method: 'POST',
    token: adminToken,
    body: { target_driver_id: null },
  });

  let { data: order } = await supabase
    .from('orders')
    .select('driver_id,offered_driver_id,offer_expires_at,rejected_driver_ids')
    .eq('id', TEST_ORDER_ID)
    .maybeSingle();
  assert(order.driver_id === null, 'Admin unassign did not clear driver_id');
  assert(order.offered_driver_id === null && order.offer_expires_at === null, 'Admin unassign did not clear offer fields');
  assert(order.rejected_driver_ids.includes(TEST_DRIVER_ID), 'Admin unassign did not reject previous driver');

  await requireOk(`/v1/admin/orders/${TEST_ORDER_ID}/reassign`, {
    method: 'POST',
    token: adminToken,
    body: { target_driver_id: TEST_DRIVER_ID },
  });
  await deliverAssignedOrder(driverToken);
}

async function main() {
  assert(process.env.SUPABASE_URL, 'SUPABASE_URL is required');
  assert(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY is required');

  const adminToken = await getAdminToken();
  const driverToken = signDriverToken({ driver_id: TEST_DRIVER_ID, cin: TEST_DRIVER_CIN });

  console.log('[1/7] auth boundaries');
  await testAuthBoundaries(adminToken, driverToken);
  console.log('[2/7] shift safe responses');
  await testShiftResponses(driverToken);
  console.log('[3/7] socket security and offer event');
  await testSocketSecurityAndOffer(driverToken, adminToken);
  console.log('[4/7] structured decline');
  await testDecline(driverToken);
  console.log('[5/7] offer timeout');
  await testTimeout(driverToken);
  console.log('[6/7] admin rescue');
  await testAdminRescue(adminToken, driverToken);
  console.log('[7/7] final cleanup offer/delivery');
  await resetOrderForOffer();
  await waitForAvailableOrder(driverToken);
  await requireOk(`/driver/orders/${TEST_ORDER_ID}/claim`, { method: 'POST', token: driverToken });
  await deliverAssignedOrder(driverToken);

  console.log('Regression passed');
}

main().catch(error => {
  console.error('Regression failed:', error.message);
  process.exit(1);
});

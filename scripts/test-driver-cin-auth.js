/**
 * JAHEEZ — Driver Authentication CIN + Password Security Verification Test Suite
 * Programmatically verifies the complete driver authentication flow, admin driver creation,
 * metadata updates, password resets, failed attempt locking, and legacy OTP/register route disabling.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change-this-to-a-strong-random-secret';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

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

// Helper fetch wrapper
async function apiCall(method, path, body = null, headers = {}) {
  const url = `${PROXY_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.statusCode || res.status, data };
}

async function run() {
  console.log('=== Starting JAHEEZ Phase 4A Driver CIN + Password Auth Tests ===\n');

  // 1. Fetch an admin account to sign an admin token
  const { data: admins } = await supabase.from('admins').select('*').limit(1);
  if (!admins || admins.length === 0) {
    console.error('No admin accounts found in DB. Seed DB first.');
    process.exit(1);
  }
  const admin = admins[0];
  
  // Sign admin JWT
  const adminToken = jwt.sign({
    id: admin.id,
    email: admin.email,
    role: 'super_admin',
    kind: 'admin',
    abs_exp: Math.floor(Date.now() / 1000) + 3600,
    last_seen: Math.floor(Date.now() / 1000),
    remember_me: true
  }, JWT_SECRET);

  const authHeaders = { Authorization: `Bearer ${adminToken}` };

  // Generate test credentials
  const testCin = 'TEST' + Math.floor(100000 + Math.random() * 900000);
  const testPhone = '+2126' + Math.floor(10000000 + Math.random() * 90000000);
  const testPassword = 'Password123!';

  let testDriverId = null;
  let driverToken = null;

  // --- TESTS ---

  // 1. Missing CIN returns 400
  await logTestResult('1. Missing CIN returns 400', (async () => {
    const res = await apiCall('POST', '/admin-api/driver/login', { password: testPassword });
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
    return 'Status: 400';
  })());

  // 2. Missing password returns 400
  await logTestResult('2. Missing password returns 400', (async () => {
    const res = await apiCall('POST', '/admin-api/driver/login', { cin: testCin });
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
    return 'Status: 400';
  })());

  // 3. Wrong CIN returns 401 generic invalid credentials
  await logTestResult('3. Wrong CIN returns 401 generic', (async () => {
    const res = await apiCall('POST', '/admin-api/driver/login', { cin: 'WRONG123', password: testPassword });
    if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
    if (res.data.error !== 'Identifiants invalides') throw new Error(`Expected generic message, got: ${res.data.error}`);
    return 'Status: 401, Msg: Identifiants invalides';
  })());

  // 7. Admin creates driver
  await logTestResult('7. Admin creates driver', (async () => {
    const res = await apiCall('POST', '/admin-api/v1/admin/drivers', {
      full_name: 'Test Driver Admin Seeding',
      cin: testCin,
      phone: testPhone,
      password: testPassword,
      vehicle_type: 'motorcycle',
      city: 'Safi'
    }, authHeaders);

    if (res.status !== 201) throw new Error(`Expected 201 Created, got ${res.status}. Error: ${JSON.stringify(res.data)}`);
    if (res.data.password_hash) throw new Error('Security violation: password_hash was returned in payload');
    if (res.data.cin !== testCin) throw new Error(`Expected CIN ${testCin}, got ${res.data.cin}`);
    testDriverId = res.data.id;
    return `Driver created: id=${testDriverId}, cin=${res.data.cin}, kyc=${res.data.kyc_status}`;
  })());

  // Verify Audit Log for creation
  await logTestResult('8. Audit log created for driver_created', (async () => {
    const { data: logs, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('entity_id', testDriverId)
      .eq('action', 'driver_created')
      .order('created_at', { ascending: false });

    if (error || !logs || logs.length === 0) throw new Error('No audit log entries found for driver_created');
    const log = logs[0];
    if (log.admin_id !== admin.id) throw new Error(`Expected admin_id ${admin.id}, got ${log.admin_id}`);
    if (log.new_value.cin !== testCin) throw new Error('Audit log did not store correct CIN metadata');
    return 'Audit Log found';
  })());

  // 9. Duplicate CIN returns 409 Conflict
  await logTestResult('9. Duplicate CIN returns 409 Conflict', (async () => {
    const res = await apiCall('POST', '/admin-api/v1/admin/drivers', {
      full_name: 'Duplicate Driver',
      cin: testCin,
      phone: testPhone + '2',
      password: testPassword,
      vehicle_type: 'motorcycle',
      city: 'Safi'
    }, authHeaders);

    if (res.status !== 409) throw new Error(`Expected status 409, got ${res.status}`);
    return 'Status: 409 Conflict';
  })());

  // 4. Old OTP / Register endpoint returns 410 Gone
  await logTestResult('4. Old OTP send endpoint returns 410', (async () => {
    const res = await apiCall('POST', '/admin-api/otp/send', { phone: testPhone });
    if (res.status !== 410) throw new Error(`Expected status 410, got ${res.status}`);
    if (!res.data.error.includes('Driver OTP login is disabled')) throw new Error(`Expected correct error message, got: ${res.data.error}`);
    return 'Status: 410, Msg: OTP disabled';
  })());

  await logTestResult('5. Old OTP verify endpoint returns 410', (async () => {
    const res = await apiCall('POST', '/admin-api/otp/verify', { phone: testPhone, code: '123456' });
    if (res.status !== 410) throw new Error(`Expected status 410, got ${res.status}`);
    return 'Status: 410';
  })());

  await logTestResult('6. Legacy driver login payload on login endpoint returns 410', (async () => {
    const res = await apiCall('POST', '/admin-api/driver/login', { phone: testPhone, otp_proof: 'fake_proof' });
    if (res.status !== 410) throw new Error(`Expected status 410, got ${res.status}`);
    return 'Status: 410';
  })());

  // 10. Wrong password returns 401 generic invalid credentials
  await logTestResult('10. Wrong password returns 401 generic', (async () => {
    const res = await apiCall('POST', '/admin-api/driver/login', { cin: testCin, password: 'WrongPassword123' });
    if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
    if (res.data.error !== 'Identifiants invalides') throw new Error(`Expected generic message, got: ${res.data.error}`);
    return 'Status: 401';
  })());

  // 11. Inactive driver login returns 403 Forbidden
  await logTestResult('11. Inactive driver login returns 403', (async () => {
    // Deactivate driver
    await apiCall('PATCH', `/admin-api/v1/admin/drivers/${testDriverId}`, { is_active: false }, authHeaders);

    const res = await apiCall('POST', '/admin-api/driver/login', { cin: testCin, password: testPassword });
    if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
    if (!res.data.error.includes('Compte inactif')) throw new Error(`Expected inactive account message, got: ${res.data.error}`);

    // Reactivate driver
    await apiCall('PATCH', `/admin-api/v1/admin/drivers/${testDriverId}`, { is_active: true }, authHeaders);
    return 'Status: 403 Forbidden';
  })());

  // 12. Active driver login returns JWT + safe profile
  await logTestResult('12. Active driver login returns JWT + safe profile', (async () => {
    const res = await apiCall('POST', '/admin-api/driver/login', { cin: testCin, password: testPassword });
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}. Msg: ${JSON.stringify(res.data)}`);
    if (!res.data.token) throw new Error('Login response missing token');
    if (res.data.driver.password_hash) throw new Error('Security violation: password_hash was returned in login response');
    driverToken = res.data.token;
    return 'Token issued successfully';
  })());

  // 13. JWT works on /admin-api/driver/me
  await logTestResult('13. JWT works on /admin-api/driver/me', (async () => {
    const res = await apiCall('GET', '/admin-api/driver/me', null, { Authorization: `Bearer ${driverToken}` });
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
    if (res.data.cin !== testCin) throw new Error(`Expected CIN ${testCin}, got ${res.data.cin}`);
    return `Approved access. Driver: ${res.data.full_name}`;
  })());

  // 14. Customer / admin token fails on driver endpoint
  await logTestResult('14. Admin token fails on driver endpoint', (async () => {
    const res = await apiCall('GET', '/admin-api/driver/me', null, { Authorization: `Bearer ${adminToken}` });
    if (res.status !== 401 && res.status !== 403) throw new Error(`Expected 401 or 403, got ${res.status}`);
    return 'Access blocked';
  })());

  // 15. Admin resets password
  await logTestResult('15. Admin resets password', (async () => {
    const newPassword = 'NewCoolPassword123!';
    // Reset password
    const resetRes = await apiCall('POST', `/admin-api/v1/admin/drivers/${testDriverId}/reset-password`, {
      new_password: newPassword
    }, authHeaders);
    if (resetRes.status !== 200) throw new Error(`Reset password failed: ${resetRes.status}`);

    // Verify old password fails
    const oldLogin = await apiCall('POST', '/admin-api/driver/login', { cin: testCin, password: testPassword });
    if (oldLogin.status !== 401) throw new Error('Old password should have failed');

    // Verify new password works
    const newLogin = await apiCall('POST', '/admin-api/driver/login', { cin: testCin, password: newPassword });
    if (newLogin.status !== 200) throw new Error(`New password failed to log in: ${newLogin.status}`);
    return 'Password updated & old password invalidated';
  })());

  // 16. Lockout verification (5 failed attempts locks account)
  await logTestResult('16. Lockout verification', (async () => {
    const badPassword = 'WrongPassword456!';
    
    // Perform 4 failed logins
    for (let i = 0; i < 4; i++) {
      const failRes = await apiCall('POST', '/admin-api/driver/login', { cin: testCin, password: badPassword });
      if (failRes.status !== 401) throw new Error(`Attempt ${i+1}: expected 401, got ${failRes.status}`);
    }

    // 5th failed login
    const fifthFail = await apiCall('POST', '/admin-api/driver/login', { cin: testCin, password: badPassword });
    if (fifthFail.status !== 401) throw new Error(`5th attempt: expected 401, got ${fifthFail.status}`);

    // 6th attempt (now locked)
    const lockedRes = await apiCall('POST', '/admin-api/driver/login', { cin: testCin, password: badPassword });
    if (lockedRes.status !== 403) throw new Error(`Expected status 403 (Account locked), got ${lockedRes.status}`);
    if (!lockedRes.data.error.includes('verrouillé')) throw new Error(`Expected locked error message, got: ${lockedRes.data.error}`);
    return 'Account successfully locked after 5 failures';
  })());

  // Clean up
  console.log('\nCleaning up test records from DB...');
  if (testDriverId) {
    // Delete audit logs
    await supabase.from('audit_log').delete().eq('entity_id', testDriverId);
    // Delete driver
    await supabase.from('drivers').delete().eq('id', testDriverId);
  }
  console.log('Cleanup complete.');

  console.log('\n=== Test Summary ===');
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});

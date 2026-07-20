'use strict';

require('dotenv').config({ path: '.env.staging.local' });

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

if (process.env.JAHEEZ_TARGET_ENV !== 'staging' || process.env.STAGING_CONFIRM_ISOLATED !== 'true') {
  throw new Error('Isolated staging is required.');
}

for (const key of ['STAGING_DATABASE_URL', 'STAGING_SUPABASE_URL', 'STAGING_SERVICE_ROLE_KEY', 'STAGING_ANON_KEY']) {
  if (!process.env[key]) throw new Error(`${key} is required.`);
}

const envPath = path.resolve(__dirname, '../.env.staging.local');
const fixtureEmail = 'jaheez-staging-customer@example.invalid';
const fixturePassword = crypto.randomBytes(32).toString('base64url');

function setPrivateEnv(values) {
  let text = fs.readFileSync(envPath, 'utf8');
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    text = pattern.test(text) ? text.replace(pattern, line) : `${text.trimEnd()}\n${line}\n`;
  }
  fs.writeFileSync(envPath, text, { mode: 0o600 });
  try { fs.chmodSync(envPath, 0o600); } catch { /* Best effort on Windows. */ }
}

async function findOrCreateAuthUser(adminClient, email, password, metadata) {
  const listed = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;
  let user = listed.data.users.find((entry) => entry.email === email);
  if (user) {
    const updated = await adminClient.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (updated.error) throw updated.error;
    user = updated.data.user;
  } else {
    const created = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (created.error || !created.data.user) throw created.error || new Error('Unable to create staging customer.');
    user = created.data.user;
  }
  return user;
}

async function firstOrInsert(client, selectSql, selectParams, insertSql, insertParams) {
  const existing = await client.query(selectSql, selectParams);
  if (existing.rowCount) return existing.rows[0];
  const inserted = await client.query(insertSql, insertParams);
  return inserted.rows[0];
}

async function main() {
  const service = createClient(process.env.STAGING_SUPABASE_URL, process.env.STAGING_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const customer = await findOrCreateAuthUser(service, fixtureEmail, fixturePassword,
    { full_name: 'JAHEEZ STAGING CUSTOMER', city: 'Safi', fixture: true });
  const adminAuth = {};
  for (const role of ['super_admin', 'operations', 'finance']) {
    const email = `staging-${role}@example.invalid`;
    adminAuth[role] = await findOrCreateAuthUser(service, email, crypto.randomBytes(32).toString('base64url'),
      { full_name: `STAGING ${role}`, fixture: true });
  }
  const publicClient = createClient(process.env.STAGING_SUPABASE_URL, process.env.STAGING_ANON_KEY, { auth: { persistSession: false } });
  const signedIn = await publicClient.auth.signInWithPassword({ email: fixtureEmail, password: fixturePassword });
  if (signedIn.error || !signedIn.data.session?.access_token) throw signedIn.error || new Error('Unable to sign in staging customer.');

  const db = new Client({ connectionString: process.env.STAGING_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await db.connect();
  try {
    await db.query('begin');
    await db.query(`insert into public.users (id,full_name,email,phone,role,city,language)
      values ($1,'JAHEEZ STAGING CUSTOMER',$2,'+212600009001','user','Safi','fr')
      on conflict (id) do update set full_name=excluded.full_name,email=excluded.email`, [customer.id, fixtureEmail]);

    const admins = {};
    for (const role of ['super_admin', 'operations', 'finance']) {
      admins[role] = await firstOrInsert(db,
        'select id from public.admins where email=$1 limit 1', [`staging-${role}@example.invalid`],
        `insert into public.admins (auth_id,email,full_name,role,is_active) values ($1,$2,$3,$4,true) returning id`,
        [adminAuth[role].id, `staging-${role}@example.invalid`, `STAGING ${role}`, role]);
    }

    const driverCin = 'STG-CIN-9001';
    const driver = await firstOrInsert(db,
      'select id from public.drivers where phone=$1 limit 1', ['+212600009002'],
      `insert into public.drivers (full_name,phone,cin,is_verified,is_active,status,kyc_status,state)
       values ('JAHEEZ STAGING DRIVER',$1,$2,true,true,'active','verified','OFFLINE') returning id`,
      ['+212600009002', driverCin]);
    await db.query(`update public.drivers set is_verified=true,is_active=true,status='active',
      kyc_status='verified',state='OFFLINE',cod_balance_centimes=100,is_online=false,shift_active=false,
      cooldown_until=null,cooldown_reason=null,paused_until=null,suspension_until=null,consecutive_timeouts=0
      where id=$1`, [driver.id]);

    const storeOne = await firstOrInsert(db,
      'select id from public.stores where name=$1 limit 1', ['JAHEEZ STAGING STORE A'],
      `insert into public.stores (name,name_ar,category,city,is_open,is_verified,address,lat,lng)
       values ($1,'متجر اختبار أ','food','Safi',true,true,'Staging only',32.299,-9.237) returning id`,
      ['JAHEEZ STAGING STORE A']);
    const storeTwo = await firstOrInsert(db,
      'select id from public.stores where name=$1 limit 1', ['JAHEEZ STAGING STORE B'],
      `insert into public.stores (name,name_ar,category,city,is_open,is_verified,address,lat,lng)
       values ($1,'متجر اختبار ب','food','Safi',true,true,'Staging only',32.301,-9.239) returning id`,
      ['JAHEEZ STAGING STORE B']);

    const makeOrder = async (label, storeId) => firstOrInsert(db,
      'select id from public.orders where notes=$1 limit 1', [label],
      `insert into public.orders (user_id,store_id,status,payment_status,payment_method,delivery_address,
       delivery_lat,delivery_lng,notes,subtotal,delivery_fee,total_amount,order_type)
       values ($1,$2,'confirmed','pending','cash','STAGING DELIVERY',32.30,-9.24,$3,50,15,65,'store_order') returning id`,
      [customer.id, storeId, label]);
    const testOrder = await makeOrder('JAHEEZ_FIXTURE_MAIN_ORDER', storeOne.id);
    const refundOrder = await makeOrder('JAHEEZ_FIXTURE_PREPAY_REFUND', storeOne.id);
    const otherStoreOrder = await makeOrder('JAHEEZ_FIXTURE_OTHER_STORE_ORDER', storeTwo.id);

    const oldShifts = await db.query('select id from public.driver_shift_records where driver_id=$1', [driver.id]);
    const oldShiftIds = oldShifts.rows.map((row) => row.id);
    if (oldShiftIds.length) {
      await db.query('delete from public.driver_payout_holds where driver_id=$1', [driver.id]);
      await db.query('delete from public.payout_transition_requests where shift_id=any($1::uuid[])', [oldShiftIds]);
      await db.query('delete from public.payout_requests where shift_id=any($1::uuid[])', [oldShiftIds]);
    }
    await db.query('delete from public.driver_earnings_ledger where driver_id=$1', [driver.id]);
    await db.query('delete from public.driver_shift_records where driver_id=$1', [driver.id]);
    await db.query('delete from public.cod_settlements where driver_id=$1', [driver.id]);
    await db.query(`insert into public.driver_earnings_ledger
      (driver_id,order_id,source_type,amount_centimes,status,is_cod_order,metadata)
      select $1,$2,'delivery_commission',100,'pending_shift_end',false,'{"fixture":true}'::jsonb
      where not exists (select 1 from public.driver_earnings_ledger where order_id=$2)`, [driver.id, refundOrder.id]);
    await db.query('delete from public.refunds where order_id=any($1::uuid[])', [[testOrder.id, refundOrder.id]]);

    const prefix = crypto.randomBytes(6).toString('hex');
    const secret = crypto.randomBytes(32).toString('base64url');
    const apiKey = `${prefix}.${secret}`;
    await db.query("update public.store_partner_credentials set is_active=false where name='JAHEEZ STAGING E2E'");
    await db.query(`insert into public.store_partner_credentials
      (store_id,name,key_prefix,secret_hash,scopes,is_active,created_by)
      values ($1,'JAHEEZ STAGING E2E',$2,$3,array['order:ready'],true,$4)`,
      [storeOne.id, prefix, crypto.createHash('sha256').update(secret).digest('hex'), admins.super_admin.id]);
    await db.query('commit');

    setPrivateEnv({
      STAGING_TEST_ADMIN_ID: admins.super_admin.id,
      STAGING_TEST_DRIVER_ID: driver.id,
      STAGING_TEST_DRIVER_CIN: driverCin,
      STAGING_TEST_ORDER_ID: testOrder.id,
      STAGING_PREPAY_REFUND_ORDER_ID: refundOrder.id,
      STAGING_STORE_API_KEY: apiKey,
      STAGING_OTHER_STORE_ORDER_ID: otherStoreOrder.id,
      STAGING_CUSTOMER_ACCESS_TOKEN: signedIn.data.session.access_token,
    });
  } catch (error) {
    await db.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    await db.end();
  }
  console.log(JSON.stringify({ ok: true, environment: 'isolated-staging', fixtures: 8, secrets_printed: false }));
}

main().catch((error) => { console.error(error.message); process.exit(1); });

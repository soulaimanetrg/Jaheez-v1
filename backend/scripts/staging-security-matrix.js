'use strict';
require('dotenv').config({path:'.env.staging.local'});require('dotenv').config({path:'../.env'});const {createClient}=require('@supabase/supabase-js');const jwt=require('jsonwebtoken');
function assert(x,m){if(!x)throw new Error(m)}function guard(){assert(process.env.JAHEEZ_TARGET_ENV==='staging'&&process.env.STAGING_CONFIRM_ISOLATED==='true','Isolated staging required.');
 for(const k of ['STAGING_SUPABASE_URL','STAGING_SERVICE_ROLE_KEY','STAGING_ANON_KEY','STAGING_CUSTOMER_ACCESS_TOKEN','ADMIN_JWT_SECRET','STAGING_API_BASE','STAGING_TEST_DRIVER_ID','STAGING_STORE_API_KEY','STAGING_OTHER_STORE_ORDER_ID'])assert(process.env[k],`${k} required`);}
const api=(path,{token,method='GET',body,headers={}}={})=>fetch(`${process.env.STAGING_API_BASE}/admin-api${path}`,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{ }),...headers},body:body?JSON.stringify(body):undefined});
async function adminToken(db,role){const {data,error}=await db.from('admins').select('id,email,role').eq('role',role).eq('is_active',true).limit(1).maybeSingle();if(error||!data)return null;
 const now=Math.floor(Date.now()/1000);return jwt.sign({id:data.id,email:data.email,role:data.role,kind:'admin',last_seen:now,abs_exp:now+3600,remember_me:false},process.env.ADMIN_JWT_SECRET,{expiresIn:'15m'});}
async function main(){guard();const db=createClient(process.env.STAGING_SUPABASE_URL,process.env.STAGING_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
 const [ops,finance,superAdmin]=await Promise.all(['operations','finance','super_admin'].map(r=>adminToken(db,r)));assert(ops&&finance&&superAdmin,'Active operations, finance and super_admin fixtures required.');
 const {data:driver}=await db.from('drivers').select('id,phone,cin').eq('id',process.env.STAGING_TEST_DRIVER_ID).single();
 const driverToken=jwt.sign({driver_id:driver.id,sub:driver.id,phone:driver.phone||'',cin:driver.cin||'',kind:'driver',actor:'driver'},process.env.ADMIN_JWT_SECRET,{expiresIn:'15m'});
 const cases=[
  ['anonymous finance denied',await api('/payouts'),[401]],
  ['driver finance denied',await api('/payouts',{token:driverToken}),[401]],
  ['customer finance denied',await api('/payouts',{token:process.env.STAGING_CUSTOMER_ACCESS_TOKEN}),[401]],
  ['operations finance denied',await api('/payouts',{token:ops}),[403]],
  ['finance driver creation denied',await api('/v1/admin/drivers',{token:finance,method:'POST',body:{}}),[403]],
  ['driver payout request gone',await api('/driver/payouts',{token:driverToken,method:'POST',body:{}}),[410]],
  ['driver registration absent',await api('/driver/register',{method:'POST',body:{}}),[401,404]],
  ['store cross-scope denied',await api(`/v1/store/orders/${process.env.STAGING_OTHER_STORE_ORDER_ID}/ready`,{method:'POST',headers:{'x-store-key':process.env.STAGING_STORE_API_KEY},body:{request_id:`matrix-${Date.now()}`}}),[400,403,404,409]],
  ['super admin finance allowed',await api('/payouts',{token:superAdmin}),[200]]
 ];
 for(const [name,res,allowed] of cases)assert(allowed.includes(res.status),`${name}: got ${res.status}`);
 console.log(JSON.stringify({ok:true,cases:cases.map(([name,res])=>({name,status:res.status}))}));}
main().catch(e=>{console.error(e.message);process.exit(1)});

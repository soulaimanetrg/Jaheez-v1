'use strict';
require('dotenv').config({ path: '.env.staging.local' });
require('dotenv').config({ path: '../.env' });
const crypto=require('crypto');const fs=require('fs');const os=require('os');const path=require('path');const {Client}=require('pg');
function guard(){if(process.env.JAHEEZ_TARGET_ENV!=='staging'||process.env.STAGING_CONFIRM_ISOLATED!=='true')throw new Error('Isolated staging confirmation required.');
 if(!process.env.STAGING_DATABASE_URL)throw new Error('STAGING_DATABASE_URL required.');
 if(process.env.DATABASE_URL===process.env.STAGING_DATABASE_URL)throw new Error('Refusing production database.');
 if((process.env.REPORT_SIGNING_KEY||'').length<32)throw new Error('REPORT_SIGNING_KEY must contain at least 32 characters.');}
const checks={
 delivered_without_ledger:`select o.id from orders o left join driver_earnings_ledger l on l.order_id=o.id where o.status in ('delivered','completed') and o.driver_id is not null group by o.id having count(l.id)=0`,
 shift_total_mismatch:`select s.id,s.total_earnings_centimes,coalesce(sum(l.amount_centimes) filter(where l.source_type<>'reversal'),0)::bigint ledger_total from driver_shift_records s left join driver_earnings_ledger l on l.shift_id=s.id where s.ended_at is not null group by s.id having s.total_earnings_centimes<>coalesce(sum(l.amount_centimes) filter(where l.source_type<>'reversal'),0)`,
 paid_ledger_mismatch:`select distinct s.id from driver_shift_records s join driver_earnings_ledger l on l.shift_id=s.id where s.payout_status='paid' and l.status not in ('paid','reversed')`,
 cod_mismatch:`select d.id,d.cod_balance_centimes,coalesce(x.cod_due,0)-coalesce(y.settled,0) expected from drivers d left join (select driver_id,sum(cod_amount_centimes) cod_due from driver_earnings_ledger where is_cod_order group by driver_id)x on x.driver_id=d.id left join (select driver_id,sum(amount_centimes) settled from cod_settlements where status='confirmed' group by driver_id)y on y.driver_id=d.id where d.cod_balance_centimes<>coalesce(x.cod_due,0)-coalesce(y.settled,0)`,
 refund_reversal_mismatch:`select r.id from refunds r join driver_earnings_ledger l on l.order_id=r.order_id and l.status='paid' left join driver_earnings_ledger v on v.reversed_ledger_entry_id=l.id where r.status='completed' and v.id is null`,
 duplicate_payment_reference:`select payment_reference,count(*) from driver_shift_records where payment_reference is not null group by payment_reference having count(*)>1`
};
async function main(){guard();const c=new Client({connectionString:process.env.STAGING_DATABASE_URL,ssl:{rejectUnauthorized:false}});await c.connect();
 try{const findings={};for(const [name,sql] of Object.entries(checks)){const r=await c.query(sql);findings[name]={count:r.rowCount,ids:r.rows.slice(0,100).map(x=>x.id||x.payment_reference)};
   const type={delivered_without_ledger:'missing_ledger',shift_total_mismatch:'shift_total_mismatch',paid_ledger_mismatch:'paid_ledger_mismatch',cod_mismatch:'cod_mismatch',refund_reversal_mismatch:'refund_mismatch',duplicate_payment_reference:'duplicate_reference'}[name];
   for(const row of r.rows){const entityId=String(row.id||row.payment_reference);await c.query(`insert into reconciliation_issues(issue_key,issue_type,severity,entity_type,entity_id,shift_id,order_id,expected_value,actual_value,status,last_detected_at)
     values($1,$2,'critical',$3,$4,$5,$6,$7,$8,'open',now()) on conflict(issue_key) do update set last_detected_at=now(),status='open',expected_value=excluded.expected_value,actual_value=excluded.actual_value`,
     [`${name}:${entityId}`,type,name.includes('shift')?'shift':name.includes('delivered')?'order':'financial',entityId,name.includes('shift')?row.id:null,name.includes('delivered')?row.id:null,JSON.stringify({expected:row.expected||row.ledger_total||0}),JSON.stringify(row)]);
     if(name==='shift_total_mismatch')await c.query('select hold_shift_for_risk($1,$2)',[row.id,'reconciliation_mismatch']);}}
 const unresolved=Object.values(findings).reduce((n,x)=>n+x.count,0);const body={generated_at:new Date().toISOString(),environment:'isolated-staging',findings,unresolved,pass:unresolved===0};
 const canonical=JSON.stringify(body);const signature=crypto.createHmac('sha256',process.env.REPORT_SIGNING_KEY).update(canonical).digest('hex');
 const dir=path.join(os.tmpdir(),'jaheez-reconciliation');fs.mkdirSync(dir,{recursive:true,mode:0o700});try{fs.chmodSync(dir,0o700);}catch{}const file=path.join(dir,`report-${Date.now()}.json`);
 fs.writeFileSync(file,JSON.stringify({...body,signature},null,2),{mode:0o600});console.log(JSON.stringify({report:file,unresolved,pass:body.pass}));if(!body.pass)process.exitCode=2;
 }finally{await c.end();}}
main().catch(e=>{console.error(e.message);process.exit(1)});

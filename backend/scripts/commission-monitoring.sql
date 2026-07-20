select * from public.commission_monitoring_summary;
select severity,status,count(*) from public.reconciliation_issues where status in ('open','acknowledged') group by severity,status;
select case_type,status,count(*) from public.fraud_cases where status in ('open','reviewing','confirmed') group by case_type,status;
select payment_reference,count(*) from public.driver_shift_records where payment_reference is not null group by payment_reference having count(*)>1;
select external_reference,count(*) from public.cod_settlements where external_reference is not null group by external_reference having count(*)>1;
select payment_reference,count(*) from public.refunds where payment_reference is not null group by payment_reference having count(*)>1;

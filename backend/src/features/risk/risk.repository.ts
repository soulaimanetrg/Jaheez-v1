import { supabase } from '../../db/supabase';

export class RiskRepository {
  async scan() {
    const { data: orders, error: orderError } = await supabase.from('orders')
      .select('id,driver_id').eq('status', 'delivered').is('financial_finalized_at', null).limit(500);
    if (orderError) throw new Error(orderError.message);
    for (const order of orders || []) {
      await this.upsertIssue({ issue_key: `missing-ledger:${order.id}`, issue_type: 'missing_ledger', severity: 'critical',
        entity_type: 'order', entity_id: order.id, order_id: order.id, driver_id: order.driver_id,
        expected_value: { financial_ledger: true }, actual_value: { financial_finalized_at: null } });
    }

    const { data: shifts, error: shiftError } = await supabase.from('driver_shift_records')
      .select('id,driver_id,total_earnings_centimes,payout_status').not('ended_at', 'is', null).limit(500);
    if (shiftError) throw new Error(shiftError.message);
    for (const shift of shifts || []) {
      const { data: ledger, error } = await supabase.from('driver_earnings_ledger')
        .select('amount_centimes,source_type,status').eq('shift_id', shift.id);
      if (error) throw new Error(error.message);
      const total = (ledger || []).filter((x: any) => x.source_type !== 'reversal')
        .reduce((sum: number, x: any) => sum + Number(x.amount_centimes || 0), 0);
      if (total !== Number(shift.total_earnings_centimes || 0)) {
        await this.upsertIssue({ issue_key: `shift-total:${shift.id}`, issue_type: 'shift_total_mismatch', severity: 'critical',
          entity_type: 'shift', entity_id: shift.id, shift_id: shift.id, driver_id: shift.driver_id,
          expected_value: { ledger_total_centimes: total }, actual_value: { shift_total_centimes: shift.total_earnings_centimes } });
        if (!['paid', 'reversed'].includes(shift.payout_status)) await this.holdShift(shift.id, 'reconciliation_mismatch');
      }
    }

    const { data: tips, error: tipError } = await supabase.from('driver_earnings_ledger')
      .select('id,order_id,driver_id,shift_id,tip_centimes,delivery_fee_centimes').eq('source_type', 'tip_commission').limit(500);
    if (tipError) throw new Error(tipError.message);
    for (const row of tips || []) {
      if (Number(row.tip_centimes) >= 5000 && Number(row.tip_centimes) > Number(row.delivery_fee_centimes || 0) * 3) {
        await this.upsertFraud({ case_key: `abnormal-tip:${row.order_id}`, case_type: 'tip_abuse', risk_score: 70,
          driver_id: row.driver_id, order_id: row.order_id, shift_id: row.shift_id,
          evidence: { rule: 'tip_gte_50dh_and_gt_3x_delivery_fee', ledger_id: row.id } });
        if (row.shift_id) await this.holdShift(row.shift_id, 'fraud_review');
      }
    }
    return { missing_ledger: orders?.length || 0, shifts_scanned: shifts?.length || 0 };
  }

  private async upsertIssue(value: any) {
    const { error } = await supabase.from('reconciliation_issues').upsert({ ...value, status: 'open',
      last_detected_at: new Date().toISOString() }, { onConflict: 'issue_key' });
    if (error) throw new Error(error.message);
  }
  private async upsertFraud(value: any) {
    const { error } = await supabase.from('fraud_cases').upsert({ ...value, status: 'open', updated_at: new Date().toISOString() },
      { onConflict: 'case_key' });
    if (error) throw new Error(error.message);
  }
  private async holdShift(id: string, reason: string) {
    const { error } = await supabase.rpc('hold_shift_for_risk', { p_shift_id: id, p_reason: reason });
    if (error) throw new Error(error.message);
  }
  listIssues() { return supabase.from('reconciliation_issues').select('*').order('last_detected_at', { ascending: false }); }
  listFraud() { return supabase.from('fraud_cases').select('*').order('risk_score', { ascending: false }); }
  resolveFraud(id: string, adminId: string, status: string, note: string) {
    return supabase.from('fraud_cases').update({ status, resolution_note: note, resolved_by: adminId,
      resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id).select().single();
  }
}

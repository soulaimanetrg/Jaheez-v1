import { supabase } from '../../db/supabase';

export interface LedgerInsert {
  driver_id: string;
  order_id: string;
  shift_id: string | null;
  source_type: 'delivery_commission' | 'tip_commission';
  delivery_fee_centimes: number;
  tip_centimes: number;
  delivery_commission_percent: number;
  tip_commission_percent: number;
  minimum_applied_centimes: number;
  amount_centimes: number;
  status: 'pending_shift_end' | 'held';
  hold_reason: string | null;
  is_cod_order: boolean;
  cod_amount_centimes: number;
  metadata: Record<string, unknown>;
  rate_source?: 'global' | 'driver_override';
  rate_version_id?: string | null;
  override_id?: string | null;
  calculation_version?: string;
}

export class CommissionRepository {
  async finalizeDeliveredOrder(orderId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('finalize_delivered_order_financial', { p_order_id: orderId });
    if (error) throw new Error(error.message);
    return Boolean(data);
  }

  /**
   * Delivered/completed orders whose financial finalization has not been
   * recorded. `financial_finalized_at IS NULL` on a delivered order is the
   * outbox marker: the finalize RPC is idempotent, so retrying is safe.
   * Only orders untouched for a grace period are returned, to avoid racing
   * the in-request finalization.
   */
  async listUnfinalizedDeliveredOrders(graceMinutes: number, limit: number): Promise<{ id: string; status: string; updated_at: string }[]> {
    const cutoff = new Date(Date.now() - graceMinutes * 60_000).toISOString();
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, updated_at')
      .in('status', ['delivered', 'completed'])
      .not('driver_id', 'is', null)
      .is('financial_finalized_at', null)
      .lt('updated_at', cutoff)
      .order('updated_at', { ascending: true })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data || [];
  }
  async getDriverOverride(driverId: string, at: string): Promise<any | null> {
    const { data, error } = await supabase.from('driver_commission_overrides').select('*')
      .eq('driver_id', driverId).lte('effective_from', at)
      .or(`effective_to.is.null,effective_to.gt.${at}`)
      .order('effective_from', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async getGlobalRate(at: string): Promise<any | null> {
    const { data, error } = await supabase.from('commission_rate_versions').select('*')
      .lte('effective_from', at).or(`effective_to.is.null,effective_to.gt.${at}`)
      .order('effective_from', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async listRates(): Promise<any[]> {
    const { data, error } = await supabase.from('commission_rate_versions').select('*')
      .order('effective_from', { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async createRate(row: Record<string, unknown>): Promise<any> {
    const { data, error } = await supabase.rpc('create_commission_rate_version', {
      p_delivery_percent: row.delivery_percent, p_tip_percent: row.tip_percent,
      p_effective_from: row.effective_from || null, p_effective_to: row.effective_to || null,
      p_reason: row.reason, p_admin_id: row.created_by || null,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async listOverrides(driverId?: string): Promise<any[]> {
    let query = supabase.from('driver_commission_overrides').select('*').order('effective_from', { ascending: false }).limit(200);
    if (driverId) query = query.eq('driver_id', driverId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async createOverride(row: Record<string, unknown>): Promise<any> {
    const { data, error } = await supabase.rpc('create_driver_commission_override', {
      p_driver_id: row.driver_id, p_delivery_percent: row.delivery_percent, p_tip_percent: row.tip_percent,
      p_effective_from: row.effective_from || null, p_effective_to: row.effective_to || null,
      p_reason: row.reason, p_admin_id: row.created_by || null,
    });
    if (error) throw new Error(error.message);
    return data;
  }
  async getSettings(keys: string[]): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', keys);

    if (error) throw new Error(error.message);
    return Object.fromEntries((data || []).map((row) => [row.key, row.value]));
  }

  async getActiveShift(driverId: string): Promise<{ id: string } | null> {
    const { data, error } = await supabase
      .from('driver_shift_records')
      .select('id')
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async insertLedger(entry: LedgerInsert): Promise<void> {
    const { error } = await supabase
      .from('driver_earnings_ledger')
      .insert(entry);

    if (error) {
      // The migration creates a partial unique index for order/source rows. PostgREST
      // upsert cannot reliably target partial indexes, so duplicate delivery retries
      // are handled by accepting the database unique-violation as idempotent.
      if (error.code === '23505' || /duplicate key/i.test(error.message || '')) return;
      throw new Error(error.message);
    }
  }

  async getShiftLedgerRows(shiftId: string): Promise<Array<{
    id: string;
    order_id: string | null;
    source_type: string;
    delivery_fee_centimes: number;
    tip_centimes: number;
    amount_centimes: number;
    status: string;
    is_cod_order: boolean;
    cod_amount_centimes: number;
  }>> {
    const { data, error } = await supabase
      .from('driver_earnings_ledger')
      .select('id, order_id, source_type, delivery_fee_centimes, tip_centimes, amount_centimes, status, is_cod_order, cod_amount_centimes')
      .eq('shift_id', shiftId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async updateLedgerStatusForShift(shiftId: string, status: 'payable' | 'held', holdReason: string | null): Promise<void> {
    const { error } = await supabase
      .from('driver_earnings_ledger')
      .update({ status, hold_reason: holdReason, updated_at: new Date().toISOString() })
      .eq('shift_id', shiftId)
      .in('status', ['pending_shift_end', 'held', 'payable']);

    if (error) throw new Error(error.message);
  }

  async updateShiftSummary(shiftId: string, updates: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('driver_shift_records')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', shiftId);

    if (error) throw new Error(error.message);
  }

  async createPayoutHold(params: {
    driverId: string;
    shiftId: string;
    reason: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await supabase
      .from('driver_payout_holds')
      .insert({
        driver_id: params.driverId,
        shift_id: params.shiftId,
        reason: params.reason,
        metadata: params.metadata,
      });

    if (error) throw new Error(error.message);
  }
}

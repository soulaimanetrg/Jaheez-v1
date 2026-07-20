import { supabase } from '../../db/supabase';

export class FinanceRepository {
  async getFinanceStats(): Promise<any> {
    const [
      { data: drivers, error: driversError },
      { data: settlements, error: settlementsError },
      { data: payoutShifts, error: payoutShiftsError },
    ] = await Promise.all([
      supabase.from('drivers').select('cod_balance_centimes'),
      supabase.from('cod_settlements').select('amount_centimes'),
      supabase.from('driver_shift_records').select('payable_centimes, payout_status').in('payout_status', ['payable', 'held']),
    ]);

    if (driversError) throw new Error(driversError.message);
    if (settlementsError) throw new Error(settlementsError.message);
    if (payoutShiftsError) throw new Error(payoutShiftsError.message);

    const uncollectedCodAmount = (drivers || []).reduce((sum, row) => sum + Number(row.cod_balance_centimes || 0), 0);
    const collectedCodAmount = (settlements || []).reduce((sum, row) => sum + Number(row.amount_centimes || 0), 0);
    const pendingPayoutAmount = (payoutShifts || []).reduce((sum, row) => sum + Number(row.payable_centimes || 0), 0);

    return {
      pendingPayoutsCount: (payoutShifts || []).length,
      pendingPayoutAmount: pendingPayoutAmount / 100,
      uncollectedCodCount: (drivers || []).filter(row => Number(row.cod_balance_centimes || 0) > 0).length,
      uncollectedCodAmount: uncollectedCodAmount / 100,
      collectedCodCount: (settlements || []).length,
      collectedCodAmount: collectedCodAmount / 100,
    };
  }

  // --- WALLETS ---
  async listUsersForWallets(searchQuery?: string): Promise<any[]> {
    let q = supabase
      .from('users')
      .select('id, full_name, phone, email, city, is_banned, role, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (searchQuery) {
      q = q.or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getWalletsByUserIds(userIds: string[]): Promise<any[]> {
    if (userIds.length === 0) return [];
    const { data, error } = await supabase
      .from('wallets')
      .select('id, user_id, balance_centimes, updated_at')
      .in('user_id', userIds);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getWalletByUserId(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async getUserById(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, phone, email, city, is_banned, role, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async getWalletTransactions(userId: string, limit = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async createWallet(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('wallets')
      .insert({ user_id: userId, balance_centimes: 0 })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async adjustWalletRPC(params: {
    p_user_id: string;
    p_delta: number;
    p_tx_type: string;
    p_label: string;
    p_sublabel: string;
    p_ref_id: string;
  }): Promise<any> {
    const { data, error } = await supabase.rpc('admin_wallet_adjust', params);
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  async updateWalletFreezeStatus(userId: string, updates: {
    is_frozen: boolean;
    frozen_reason: string | null;
    frozen_at: string | null;
    frozen_by: string | null;
  }): Promise<void> {
    // No-op: wallets table does not have is_frozen column
    return;
  }

  // --- REFUNDS ---
  async listRefunds(status?: string): Promise<any[]> {
    let q = supabase.from('refunds').select('*').order('created_at', { ascending: false }).limit(500);
    if (status && status !== 'all') {
      q = q.eq('status', status);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getRefundStats(): Promise<any> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('refunds')
      .select('status, amount_centimes, updated_at');

    if (error) throw new Error(error.message);

    let pendingCount = 0;
    let pendingAmount = 0;
    let completedCount = 0;
    let completedToday = 0;

    for (const r of data || []) {
      if (r.status === 'pending') {
        pendingCount++;
        pendingAmount += r.amount_centimes;
      } else if (r.status === 'completed') {
        completedCount++;
        if (r.updated_at && r.updated_at.startsWith(today)) {
          completedToday += r.amount_centimes;
        }
      }
    }

    return {
      pending_count: pendingCount,
      pending_amount: pendingAmount,
      completed_count: completedCount,
      completed_today: completedToday,
    };
  }

  async getOrderDetailsForRefund(orderId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('user_id, users!orders_user_id_fkey(full_name, phone)')
      .eq('id', orderId)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  async createRefund(refundData: any): Promise<any> {
    const { data, error } = await supabase
      .from('refunds')
      .insert(refundData)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findRefundByRequestId(requestId: string): Promise<any | null> {
    const { data, error } = await supabase.from('refunds').select('*').eq('request_id', requestId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async findRefundById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateRefund(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('refunds')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async insertWalletTransaction(txData: any): Promise<void> {
    const { error } = await supabase
      .from('wallet_transactions')
      .insert(txData);

    if (error) throw new Error(error.message);
  }

  async updateWalletBalance(userId: string, newBalance: number): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .update({ balance_centimes: newBalance })
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  // --- DRIVER PAYOUTS ---
  async listPayoutShifts(status?: string): Promise<any[]> {
    let q = supabase
      .from('driver_shift_records')
      .select('*, drivers!driver_shift_records_driver_id_fkey(full_name, phone, city, cod_balance_centimes)')
      .neq('payout_status', 'not_ready')
      .order('closed_at', { ascending: false })
      .limit(200);

    if (status && status !== 'all') {
      q = q.eq('payout_status', status);
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async findPayoutShiftById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('driver_shift_records')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async getLedgerRowsForShift(shiftId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('driver_earnings_ledger')
      .select('*')
      .eq('shift_id', shiftId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async updatePayoutShift(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('driver_shift_records')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async transitionPayout(id: string, action: string, adminId: string, note: string | null, paymentReference: string | null, requestId: string): Promise<any> {
    const { data, error } = await supabase.rpc('transition_driver_payout_idempotent', {
      p_shift_id: id, p_action: action, p_admin_id: adminId, p_note: note || null,
      p_payment_reference: paymentReference || null, p_request_id: requestId,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async isCommissionPayoutAllowed(driverId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('commission_payout_allowed', { p_driver_id: driverId });
    if (error) throw new Error(`Commission rollout check failed closed: ${error.message}`);
    return data === true;
  }

  async updateLedgerRowsForShift(shiftId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('driver_earnings_ledger')
      .update(updates)
      .eq('shift_id', shiftId);

    if (error) throw new Error(error.message);
  }

  async getLedgerRowsForOrder(orderId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('driver_earnings_ledger')
      .select('*')
      .eq('order_id', orderId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async updateLedgerRowsForOrder(orderId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('driver_earnings_ledger')
      .update(updates)
      .eq('order_id', orderId);

    if (error) throw new Error(error.message);
  }

  async insertLedgerReversal(row: any, reason: string): Promise<void> {
    const { error } = await supabase
      .from('driver_earnings_ledger')
      .insert({
        driver_id: row.driver_id,
        order_id: row.order_id,
        shift_id: row.shift_id,
        source_type: 'reversal',
        delivery_fee_centimes: row.delivery_fee_centimes || 0,
        tip_centimes: row.tip_centimes || 0,
        delivery_commission_percent: row.delivery_commission_percent || 0,
        tip_commission_percent: row.tip_commission_percent || 0,
        minimum_applied_centimes: 0,
        amount_centimes: -Math.abs(Number(row.amount_centimes || 0)),
        status: 'reversed',
        hold_reason: reason,
        is_cod_order: row.is_cod_order || false,
        cod_amount_centimes: row.cod_amount_centimes || 0,
        metadata: { reversed_ledger_entry_id: row.id, reason },
        reversed_at: new Date().toISOString(),
      });

    if (error) throw new Error(error.message);
  }

  async findDriverById(driverId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('id, cod_balance_centimes, full_name')
      .eq('id', driverId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateDriverCODBalance(driverId: string, newCODBalance: number): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .update({ cod_balance_centimes: newCODBalance })
      .eq('id', driverId);

    if (error) throw new Error(error.message);
  }

  // --- COD SETTLEMENTS ---
  async listCODSettlements(driverId?: string): Promise<any[]> {
    let q = supabase
      .from('cod_settlements')
      .select('*, drivers!cod_settlements_driver_id_fkey(full_name, phone)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (driverId) {
      q = q.eq('driver_id', driverId);
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async listCODOrders(): Promise<any[]> {
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('id, full_name, phone, city, cod_balance_centimes')
      .gt('cod_balance_centimes', 0)
      .order('cod_balance_centimes', { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    return (drivers || []).map((driver: any) => ({
      driverId: driver.id,
      driverName: driver.full_name,
      driverPhone: driver.phone,
      city: driver.city,
      codDueDh: Number(driver.cod_balance_centimes || 0) / 100,
    }));
  }

  async createCODSettlement(settlementData: any): Promise<any> {
    const { data, error } = await supabase
      .from('cod_settlements')
      .insert(settlementData)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async settleCODAtomic(input: { driverId: string; amountCentimes: number; method: string; note?: string | null;
    adminId: string; requestId: string; externalReference?: string | null }): Promise<any> {
    const { data, error } = await supabase.rpc('settle_driver_cod_atomic', {
      p_driver_id: input.driverId, p_amount_centimes: input.amountCentimes, p_method: input.method,
      p_note: input.note || null, p_admin_id: input.adminId, p_request_id: input.requestId,
      p_external_reference: input.externalReference || null,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async transitionRefundAtomic(input: { refundId: string; status: string; adminId: string; adminEmail: string;
    decisionNote?: string | null; requestId: string }): Promise<any> {
    const { data, error } = await supabase.rpc('transition_refund_atomic', {
      p_refund_id: input.refundId, p_status: input.status, p_admin_id: input.adminId,
      p_admin_email: input.adminEmail, p_decision_note: input.decisionNote || null, p_request_id: input.requestId,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async releaseCodHeldShifts(driverId: string): Promise<number> {
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('cod_balance_centimes')
      .eq('id', driverId)
      .maybeSingle();

    if (driverError) throw new Error(driverError.message);
    if (Number(driver?.cod_balance_centimes || 0) > 0) return 0;

    const { data: shifts, error: shiftError } = await supabase
      .from('driver_shift_records')
      .select('id, total_earnings_centimes')
      .eq('driver_id', driverId)
      .eq('payout_status', 'held')
      .eq('hold_reason', 'cod_due');

    if (shiftError) throw new Error(shiftError.message);
    const ids = (shifts || []).map((shift: any) => shift.id);
    if (ids.length === 0) return 0;

    const { error: updateShiftError } = await supabase
      .from('driver_shift_records')
      .update({
        payout_status: 'pending_review',
        payable_centimes: 0,
        held_centimes: 0,
        hold_reason: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (updateShiftError) throw new Error(updateShiftError.message);

    for (const shift of shifts || []) {
      await supabase
        .from('driver_shift_records')
        .update({ payable_centimes: Number(shift.total_earnings_centimes || 0) })
        .eq('id', shift.id);
      await this.updateLedgerRowsForShift(shift.id, {
        status: 'pending_shift_end',
        hold_reason: null,
        updated_at: new Date().toISOString(),
      });
    }

    return ids.length;
  }

  // --- AUDITING ---
  async writeAuditLog(auditData: {
    admin_id: string | null;
    admin_email: string | null;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    summary: string;
    old_value?: any;
    new_value?: any;
    ip: string | null;
  }): Promise<void> {
    const { error } = await supabase
      .from('audit_log')
      .insert(auditData);

    if (error) {
      console.error('[finance repo] Failed to write audit log:', error.message);
    }
  }
}

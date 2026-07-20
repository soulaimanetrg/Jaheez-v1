import { FinanceRepository } from './finance.repository';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../../middleware/error.middleware';
import { logger } from '../../config/logger';
import { isMissingColumnError } from '../../utils/schemaCompatibility';
import { moneyDto, parseDhToCentimes } from '../../utils/money';

export class FinanceService {
  private repo = new FinanceRepository();

  private requireSuperAdmin(context: { adminRole?: string | null }) {
    if (context.adminRole !== 'super_admin') {
      throw new ForbiddenError('Action reservee au super_admin.', 'role_forbidden');
    }
  }

  private requireFinance(context: { adminRole?: string | null }) {
    if (!['super_admin', 'finance'].includes(context.adminRole || '')) {
      throw new ForbiddenError('Action reservee a finance.', 'role_forbidden');
    }
  }

  async getFinanceStats() {
    return this.repo.getFinanceStats();
  }

  // --- WALLETS ---
  async listWallets(searchQuery?: string) {
    const users = await this.repo.listUsersForWallets(searchQuery);
    const userIds = users.map(u => u.id);
    
    const wallets = userIds.length ? await this.repo.getWalletsByUserIds(userIds) : [];
    const walletsByUser: Record<string, any> = {};
    wallets.forEach(w => {
      walletsByUser[w.user_id] = w;
    });

    return users.map(u => ({
      user_id: u.id,
      full_name: u.full_name,
      phone: u.phone,
      email: u.email,
      city: u.city,
      is_banned: u.is_banned,
      role: u.role,
      balance_dh: moneyDto(walletsByUser[u.id]?.balance_centimes ?? 0),
      is_frozen: walletsByUser[u.id]?.is_frozen ?? false,
      frozen_reason: walletsByUser[u.id]?.frozen_reason ?? null,
      has_wallet: !!walletsByUser[u.id],
      updated_at: walletsByUser[u.id]?.updated_at ?? null,
    }));
  }

  async getWalletDetail(userId: string) {
    const user = await this.repo.getUserById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable');
    }

    const wallet = await this.repo.getWalletByUserId(userId);
    const transactions = await this.repo.getWalletTransactions(userId);

    const sourceWallet = wallet || { user_id: userId, balance_centimes: 0, is_frozen: false, frozen_reason: null };
    const { balance_centimes, ...safeWallet } = sourceWallet;
    return { user, wallet: { ...safeWallet, balance_dh: moneyDto(balance_centimes) },
      transactions: (transactions || []).map(({ amount_centimes, ...tx }: any) => ({ ...tx, amount_dh: moneyDto(amount_centimes) })) };
  }

  async adjustWallet(userId: string, payload: any, context: { adminId: string | null; adminEmail: string | null; adminRole?: string | null; ip: string | null }) {
    this.requireSuperAdmin(context);

    const { type, amount_dh, reason, note } = payload;

    if (!['credit', 'debit'].includes(type)) {
      throw new BadRequestError('Type invalide (credit ou debit)');
    }
    if (amount_dh === undefined) {
      throw new BadRequestError('amount_dh requis.');
    }
    const amt = parseDhToCentimes(amount_dh);
    if (isNaN(amt) || amt <= 0) {
      throw new BadRequestError('Montant DH invalide');
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      throw new BadRequestError('Raison obligatoire (≥ 10 caractères)');
    }

    const user = await this.repo.getUserById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable');
    }

    const w = await this.repo.getWalletByUserId(userId);
    const oldBal = w?.balance_centimes ?? 0;

    const cleanReason = reason.trim().slice(0, 200);
    const cleanNote = note ? String(note).trim().slice(0, 200) : null;
    const label = `Ajustement admin — ${cleanReason.slice(0, 80)}`;
    const sublabel = cleanNote || `par ${context.adminEmail}`;
    const refId = `admin_adjust:${context.adminId}:${Date.now()}`;
    const delta = type === 'credit' ? amt : -amt;

    let result;
    try {
      result = await this.repo.adjustWalletRPC({
        p_user_id: userId,
        p_delta: delta,
        p_tx_type: type,
        p_label: label,
        p_sublabel: sublabel,
        p_ref_id: refId,
      });
    } catch (rpcErr: any) {
      const msg = rpcErr.message || '';
      if (/function .*admin_wallet_adjust.* does not exist/i.test(msg) || rpcErr.code === '42883') {
        throw new BadRequestError('RPC admin_wallet_adjust non déployée. Appliquez la migration 011.1.');
      }
      if (/insufficient balance/i.test(msg)) {
        throw new ConflictError(`Solde insuffisant pour debiter ${moneyDto(amt).toFixed(2)} DH`);
      }
      throw rpcErr;
    }

    const newBal = result?.new_balance_centimes ?? 0;
    const txId = result?.tx_id || null;

    // Strict audit: throw on audit log failure so admins know if reconciliation is needed
    try {
      await this.repo.writeAuditLog({
        admin_id: context.adminId,
        admin_email: context.adminEmail,
        action: 'wallet_adjustment',
        entity_type: 'wallet',
        entity_id: userId,
        summary: `${user.full_name || user.phone} : ${type === 'credit' ? '+' : '-'}${moneyDto(amt).toFixed(2)} DH (${moneyDto(oldBal).toFixed(2)} -> ${moneyDto(newBal).toFixed(2)}) — ${cleanReason.slice(0, 80)}`,
        old_value: { balance_centimes: oldBal },
        new_value: { balance_centimes: newBal, direction: type, amount_centimes: amt, reason: cleanReason, note: cleanNote, tx_id: txId },
        ip: context.ip,
      });
    } catch (auditErr: any) {
      console.error('[wallet adjust] audit insert FAILED after committed adjustment', { tx_id: txId, err: auditErr.message });
      throw new Error(`Ajustement appliqué (tx ${txId}) mais journalisation audit échouée : ${auditErr.message}. Réconciliation manuelle requise — ne PAS réessayer.`);
    }

    return { ok: true, old_balance_dh: moneyDto(oldBal), new_balance_dh: moneyDto(newBal), tx_id: txId };
  }

  async freezeWallet(userId: string, reason: string, context: { adminId: string | null; adminEmail: string | null; adminRole?: string | null; ip: string | null }) {
    this.requireSuperAdmin(context);

    if (!reason || reason.trim().length < 5) {
      throw new BadRequestError('Raison du gel obligatoire (≥ 5 caractères)');
    }

    const w = await this.repo.getWalletByUserId(userId);
    if (!w) {
      await this.repo.createWallet(userId);
    }

    await this.repo.updateWalletFreezeStatus(userId, {
      is_frozen: true,
      frozen_reason: reason.trim().slice(0, 200),
      frozen_at: new Date().toISOString(),
      frozen_by: context.adminEmail,
    });

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'wallet_frozen',
      entity_type: 'wallet',
      entity_id: userId,
      summary: `Portefeuille gelé : ${reason.trim().slice(0, 100)}`,
      old_value: { is_frozen: w?.is_frozen || false },
      new_value: { is_frozen: true, frozen_reason: reason },
      ip: context.ip,
    });

    return { ok: true };
  }

  async unfreezeWallet(userId: string, note: string, context: { adminId: string | null; adminEmail: string | null; adminRole?: string | null; ip: string | null }) {
    this.requireSuperAdmin(context);

    const w = await this.repo.getWalletByUserId(userId);
    if (!w || !w.is_frozen) {
      throw new ConflictError('Le portefeuille n\'est pas gelé');
    }

    const cleanNote = (note || '').trim().slice(0, 200);

    await this.repo.updateWalletFreezeStatus(userId, {
      is_frozen: false,
      frozen_reason: null,
      frozen_at: null,
      frozen_by: null,
    });

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'wallet_unfrozen',
      entity_type: 'wallet',
      entity_id: userId,
      summary: `Portefeuille dégelé${cleanNote ? ' — ' + cleanNote : ''}`,
      old_value: { is_frozen: true, frozen_reason: w.frozen_reason },
      new_value: { is_frozen: false, note: cleanNote },
      ip: context.ip,
    });

    return { ok: true };
  }

  // --- REFUNDS ---
  async listRefunds(status?: string) {
    const rows = await this.repo.listRefunds(status);
    return rows.map(({ amount_centimes, ...refund }: any) => ({
      ...refund,
      amount_dh: moneyDto(amount_centimes),
    }));
  }

  async getRefundStats() {
    const { pending_amount, completed_today, ...stats } = await this.repo.getRefundStats();
    return { ...stats, pending_amount_dh: moneyDto(pending_amount), completed_today_dh: moneyDto(completed_today) };
  }

  async createRefund(payload: any, context: { adminId: string | null; adminEmail: string | null; adminRole?: string | null; ip: string | null }) {
    this.requireSuperAdmin(context);

    const { order_id, amount_dh, method, reason, internal_note, request_id, payment_reference } = payload;
    const amount_centimes = parseDhToCentimes(amount_dh);
    if (amount_centimes <= 0) throw new BadRequestError('Montant invalide');
    if (!request_id || String(request_id).trim().length < 8) throw new BadRequestError('request_id requis');
    if (!method || !['wallet', 'cash', 'gateway'].includes(method)) {
      throw new BadRequestError('Méthode invalide');
    }
    if (!reason || reason.trim().length < 10) {
      throw new BadRequestError('La raison doit faire au moins 10 caractères');
    }

    const existing = await this.repo.findRefundByRequestId(String(request_id).trim());
    if (existing) {
      if (existing.order_id !== (order_id || null) || Number(existing.amount_centimes) !== amount_centimes || existing.method !== method)
        throw new ConflictError('request_id deja utilise avec un autre remboursement');
      const { amount_centimes: existingAmount, ...safeExisting } = existing;
      return { ...safeExisting, amount_dh: moneyDto(existingAmount) };
    }

    let user_name = payload.user_name || null;
    let user_phone = payload.user_phone || null;
    let user_id = payload.user_id || null;

    if (order_id && !user_name) {
      const ord = await this.repo.getOrderDetailsForRefund(order_id);
      if (ord) {
        user_id = ord.user_id;
        user_name = ord.users?.full_name;
        user_phone = ord.users?.phone;
      }
    }

    let refund: any;
    try {
      refund = await this.repo.createRefund({
      order_id: order_id || null,
      user_id,
      user_name,
      user_phone,
      amount_centimes,
      method,
      reason: reason.trim(),
      internal_note: internal_note || null,
      status: 'pending',
      requested_by: context.adminId,
      requested_by_email: context.adminEmail,
      request_id: String(request_id).trim(),
      payment_reference: payment_reference ? String(payment_reference).trim() : null,
      });
    } catch (error) {
      const raced = await this.repo.findRefundByRequestId(String(request_id).trim());
      if (!raced) throw error;
      if (raced.order_id !== (order_id || null) || Number(raced.amount_centimes) !== amount_centimes || raced.method !== method)
        throw new ConflictError('request_id deja utilise avec un autre remboursement');
      refund = raced;
    }

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'refund_requested',
      entity_type: 'refund',
      entity_id: refund.id,
      summary: `${moneyDto(amount_centimes).toFixed(2)} DH via ${method} — ${reason.slice(0, 80)}`,
      new_value: refund,
      ip: context.ip,
    });

    const { amount_centimes: internalAmount, ...safeRefund } = refund;
    return { ...safeRefund, amount_dh: moneyDto(internalAmount) };
  }

  async updateRefund(id: string, payload: any, context: { adminId: string | null; adminEmail: string | null; adminRole?: string | null; ip: string | null }) {
    this.requireSuperAdmin(context);

    const { status, decision_note } = payload;
    if (!status || !['approved', 'denied', 'processing', 'completed', 'failed'].includes(status)) {
      throw new BadRequestError('Statut invalide');
    }

    const r = await this.repo.findRefundById(id);
    if (!r) {
      throw new NotFoundError('Remboursement introuvable');
    }

    const ALLOWED_FROM: Record<string, string[]> = {
      approved: ['pending'],
      denied: ['pending'],
      processing: ['pending', 'approved'],
      completed: ['pending', 'approved', 'processing'],
      failed: ['pending', 'approved', 'processing'],
    };

    if (!ALLOWED_FROM[status].includes(r.status)) {
      throw new ConflictError(`Transition invalide : ${r.status} → ${status}`);
    }

    const requestId = String(payload.request_id || '').trim();
    if (requestId.length < 8) throw new BadRequestError('request_id requis');
    const transitioned = await this.repo.transitionRefundAtomic({
      refundId: id,
      status,
      requestId,
      decisionNote: decision_note || null,
      adminId: context.adminId!,
      adminEmail: context.adminEmail || '',
    });
    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: `refund_${status}`,
      entity_type: 'refund',
      entity_id: id,
      summary: `${moneyDto(r.amount_centimes)} DH -> ${status}`,
      old_value: { status: r.status },
      new_value: { status, decision_note, request_id: requestId },
      ip: context.ip,
    });
    const { amount_centimes: internalAmount, ...safeRefund } = transitioned;
    return { ...safeRefund, amount_dh: moneyDto(internalAmount) };

    /* Legacy non-atomic path retained temporarily for historical reference.
    let finalStatus = status;
    let walletError = null;

    if (status === 'completed' && r.method === 'wallet') {
      if (!r.user_id) {
        finalStatus = 'failed';
        await this.repo.updateRefund(id, {
          status: 'failed',
          decision_note: 'Crédit impossible : user_id manquant',
          processed_by: context.adminId,
          processed_by_email: context.adminEmail,
          processed_at: new Date().toISOString(),
        });
        await this.repo.writeAuditLog({
          admin_id: context.adminId,
          admin_email: context.adminEmail,
          action: 'refund_failed',
          entity_type: 'refund',
          entity_id: id,
          summary: `${moneyDto(r.amount_centimes).toFixed(2)} DH -> failed (user_id manquant)`,
          old_value: { status: r.status },
          new_value: { status: 'failed' },
          ip: context.ip,
        });
        throw new ConflictError('Crédit portefeuille impossible : user_id manquant. Statut → failed.');
      }

      try {
        const w = await this.repo.getWalletByUserId(r.user_id);
        const oldBal = w?.balance_centimes || 0;
        const newBal = oldBal + r.amount_centimes;

        const walletId = w?.id || null;

        // Insert ledger row first
        await this.repo.insertWalletTransaction({
          wallet_id: walletId,
          user_id: r.user_id,
          amount_centimes: r.amount_centimes,
          type: 'refund',
          direction: 'credit',
          label: `Remboursement #${r.id.slice(0, 8)} — ${r.reason.slice(0, 80)}`,
          ref_id: `refund:${r.id}`,
        });

        // Update wallet balance
        if (w) {
          await this.repo.updateWalletBalance(r.user_id, newBal);
        } else {
          // If no wallet row, create wallet with balance
          const newWallet = await this.repo.createWallet(r.user_id);
          await this.repo.updateWalletBalance(r.user_id, r.amount_centimes);
        }
      } catch (err: any) {
        walletError = err.message;
      }
    }

    if (walletError) {
      finalStatus = 'failed';
      const note = `Crédit échoué : ${walletError}${decision_note ? ' — ' + decision_note : ''}`;
      await this.repo.updateRefund(id, {
        status: 'failed',
        decision_note: note,
        processed_by: context.adminId,
        processed_by_email: context.adminEmail,
        processed_at: new Date().toISOString(),
      });
    } else {
      await this.repo.updateRefund(id, {
        status,
        decision_note: decision_note || null,
        processed_by: context.adminId,
        processed_by_email: context.adminEmail,
        processed_at: new Date().toISOString(),
      });
    }

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: `refund_${finalStatus}`,
      entity_type: 'refund',
      entity_id: id,
      summary: `${moneyDto(r.amount_centimes).toFixed(2)} DH -> ${finalStatus}${walletError ? ' (crédit échoué : ' + walletError + ')' : ''}${decision_note ? ' — ' + decision_note.slice(0, 80) : ''}`,
      old_value: { status: r.status },
      new_value: { status: finalStatus, decision_note },
      ip: context.ip,
    });

    if (finalStatus === 'completed' && r.order_id) {
      try {
        const ledgerRows = await this.repo.getLedgerRowsForOrder(r.order_id);
        const paidRows = ledgerRows.filter((row) => row.status === 'paid');
        const unpaidRows = ledgerRows.filter((row) => row.status !== 'paid' && row.status !== 'reversed');
        if (unpaidRows.length > 0) {
          await this.repo.updateLedgerRowsForOrder(r.order_id, {
            status: 'held',
            hold_reason: 'refund_completed',
            updated_at: new Date().toISOString(),
          });
        }
        for (const row of paidRows) {
          await this.repo.insertLedgerReversal(row, 'refund_completed');
        }
        if (ledgerRows.length > 0) {
          await this.repo.writeAuditLog({
            admin_id: context.adminId,
            admin_email: context.adminEmail,
            action: 'driver_commission_refund_hold',
            entity_type: 'order',
            entity_id: r.order_id,
            summary: `Commission chauffeur bloquee/reversee apres remboursement ${id}`,
            new_value: { refund_id: id, held_rows: unpaidRows.length, reversed_rows: paidRows.length },
            ip: context.ip,
          });
        }
      } catch (ledgerErr: any) {
        if (isMissingColumnError(ledgerErr)) {
          logger.warn('[finance] Commission ledger unavailable; skipped refund commission hold.', { refund_id: id, order_id: r.order_id });
        } else {
          throw ledgerErr;
        }
      }
    }

    if (walletError) {
      throw new Error(`Crédit portefeuille échoué : ${walletError}. Statut → failed.`);
    }

    return { ok: true };
    */
  }

  // --- DRIVER PAYOUTS ---
  async listPayouts(status?: string): Promise<any[]> {
    const rows = await this.repo.listPayoutShifts(status);
    return rows.map((shift: any) => {
      const { total_earnings_centimes, payable_centimes, held_centimes, cod_collected_centimes,
        cod_due_at_close_centimes, gross_delivery_fee_centimes, gross_tip_centimes, drivers, ...safe } = shift;
      const { cod_balance_centimes, ...safeDriver } = drivers || {};
      return { ...safe, drivers: { ...safeDriver, cod_due_dh: moneyDto(cod_balance_centimes) }, total_earnings_dh: moneyDto(total_earnings_centimes), payable_dh: moneyDto(payable_centimes),
        held_dh: moneyDto(held_centimes), cod_collected_dh: moneyDto(cod_collected_centimes),
        cod_due_dh: moneyDto(cod_due_at_close_centimes), gross_delivery_fee_dh: moneyDto(gross_delivery_fee_centimes),
        gross_tip_dh: moneyDto(gross_tip_centimes) };
    });
  }

  async updatePayout(id: string, payload: any, context: { adminId: string | null; adminEmail: string | null; adminRole?: string | null; ip: string | null }): Promise<any> {
    this.requireFinance(context);

    const action = String(payload.action || payload.status || '').trim();
    const note = payload.note ? String(payload.note).trim().slice(0, 300) : null;
    const paymentReference = payload.payment_reference ? String(payload.payment_reference).trim().slice(0, 120) : null;
    const requestId = String(payload.request_id || '').trim();
    if (requestId.length < 8) throw new BadRequestError('request_id requis');
    if (!['approve', 'mark_paid', 'hold', 'release', 'reject'].includes(action)) {
      throw new BadRequestError('Action payout invalide.');
    }

    const shift = await this.repo.findPayoutShiftById(id);
    if (!shift) {
      throw new NotFoundError('Shift payout introuvable');
    }

    if (['approve', 'mark_paid'].includes(action) && !(await this.repo.isCommissionPayoutAllowed(shift.driver_id))) {
      throw new ConflictError('Payout commission desactive pour ce chauffeur par le controle de deploiement.');
    }

    if (action === 'approve') {
      if (shift.payout_status !== 'pending_review') throw new ConflictError('Seuls les shifts en revue peuvent etre approuves.');
      if (Number(shift.cod_due_at_close_centimes || 0) > 0 || shift.hold_reason) throw new ConflictError('COD ou hold actif: approbation interdite.');
      const now = new Date().toISOString();
      const updated = await this.repo.transitionPayout(id, 'approve', context.adminId!, note, null, requestId);
      await this.repo.writeAuditLog({ admin_id: context.adminId, admin_email: context.adminEmail,
        action: 'driver_payout_approved', entity_type: 'driver_shift_records', entity_id: id,
        summary: `Payout shift approuve ${(Number(shift.total_earnings_centimes || 0) / 100).toFixed(2)} DH`,
        old_value: { payout_status: shift.payout_status }, new_value: { payout_status: 'approved', note }, ip: context.ip });
      return updated;
    }

    if (action === 'mark_paid') {
      if (shift.payout_status !== 'approved') {
        throw new ConflictError('Seuls les payouts approuves peuvent etre marques payes.');
      }
      if (!paymentReference || paymentReference.length < 4) {
        throw new BadRequestError('Reference de paiement obligatoire pour marquer un payout paye.');
      }
      const now = new Date().toISOString();
      const updated = await this.repo.transitionPayout(id, 'mark_paid', context.adminId!, note, paymentReference, requestId);
      await this.repo.writeAuditLog({
        admin_id: context.adminId,
        admin_email: context.adminEmail,
        action: 'driver_payout_paid',
        entity_type: 'driver_shift_records',
        entity_id: id,
        summary: `Payout shift paye ${(shift.total_earnings_centimes / 100).toFixed(2)} DH`,
        old_value: { payout_status: shift.payout_status },
        new_value: { payout_status: 'paid', payment_reference: paymentReference, note },
        ip: context.ip,
      });
      return updated;
    }

    if (action === 'hold') {
      if (!note || note.length < 5) {
        throw new BadRequestError('Note de blocage obligatoire.');
      }
      const updated = await this.repo.transitionPayout(id, 'hold', context.adminId!, note, null, requestId);
      await this.repo.writeAuditLog({
        admin_id: context.adminId,
        admin_email: context.adminEmail,
        action: 'driver_payout_held',
        entity_type: 'driver_shift_records',
        entity_id: id,
        summary: `Payout shift bloque — ${note}`,
        old_value: { payout_status: shift.payout_status },
        new_value: { payout_status: 'held', hold_reason: note },
        ip: context.ip,
      });
      return updated;
    }

    if (action === 'release') {
      const updated = await this.repo.transitionPayout(id, 'release', context.adminId!, note, null, requestId);
      await this.repo.writeAuditLog({
        admin_id: context.adminId,
        admin_email: context.adminEmail,
        action: 'driver_payout_released',
        entity_type: 'driver_shift_records',
        entity_id: id,
        summary: `Payout shift libere${note ? ' — ' + note : ''}`,
        old_value: { payout_status: shift.payout_status, hold_reason: shift.hold_reason },
        new_value: { payout_status: 'pending_review', note },
        ip: context.ip,
      });
      return updated;
    }

    if (!note || note.length < 5) {
      throw new BadRequestError('Note de rejet obligatoire.');
    }

    const updated = await this.repo.transitionPayout(id, 'reject', context.adminId!, note, null, requestId);
    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'driver_payout_rejected',
      entity_type: 'driver_shift_records',
      entity_id: id,
      summary: `Payout shift rejete${note ? ' — ' + note : ''}`,
      old_value: { payout_status: shift.payout_status },
      new_value: { payout_status: 'rejected', note },
      ip: context.ip,
    });
    return updated;
  }

  // --- COD SETTLEMENTS ---
  async listCODSettlements(driverId?: string) {
    const rows = await this.repo.listCODSettlements(driverId);
    return rows.map(({ amount_centimes, ...row }: any) => ({ ...row, amount_dh: moneyDto(amount_centimes) }));
  }

  async listCODOrders() {
    return this.repo.listCODOrders();
  }

  async createCODSettlement(payload: any, context: { adminId: string | null; adminEmail: string | null; adminRole?: string | null; ip: string | null }) {
    this.requireFinance(context);

    const { driver_id, amount_dh, method, note, request_id, external_reference } = payload;
    if (!driver_id) {
      throw new BadRequestError('driver_id requis');
    }
    const amt = parseDhToCentimes(amount_dh);
    if (!Number.isSafeInteger(amt) || amt <= 0) {
      throw new BadRequestError('Montant invalide');
    }
    if (!request_id || String(request_id).trim().length < 8) throw new BadRequestError('request_id requis');

    const drv = await this.repo.findDriverById(driver_id);
    if (!drv) {
      throw new NotFoundError('Livreur introuvable');
    }

    const currentCODBalance = drv.cod_balance_centimes || 0;
    if (amt > currentCODBalance) {
      throw new ConflictError(`Le livreur ne doit que ${moneyDto(currentCODBalance).toFixed(2)} DH`);
    }

    const settlement = await this.repo.settleCODAtomic({
      driverId: driver_id,
      amountCentimes: amt,
      method: method || 'cash_window',
      note: note || null,
      requestId: String(request_id).trim(),
      externalReference: external_reference ? String(external_reference).trim() : null,
      adminId: context.adminId!,
    });

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'cod_settled',
      entity_type: 'driver',
      entity_id: driver_id,
      summary: `${moneyDto(amt).toFixed(2)} DH via ${method || 'cash_window'} — ${drv.full_name}`,
      new_value: settlement,
      ip: context.ip,
    });

    const { amount_centimes: internalAmount, ...safeSettlement } = settlement;
    return { ...safeSettlement, amount_dh: moneyDto(internalAmount) };
  }
}

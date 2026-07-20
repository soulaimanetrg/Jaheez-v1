import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repository
const mockFinanceRepo = {
  getFinanceStats: vi.fn(),
  listUsersForWallets: vi.fn(),
  getWalletsByUserIds: vi.fn(),
  getUserById: vi.fn(),
  getWalletByUserId: vi.fn(),
  getWalletTransactions: vi.fn(),
  adjustWalletRPC: vi.fn(),
  writeAuditLog: vi.fn(),
  updateWalletFreezeStatus: vi.fn(),
  createWallet: vi.fn(),
  findRefundById: vi.fn(),
  updateRefund: vi.fn(),
  listRefunds: vi.fn(),
  getRefundStats: vi.fn(),
  createRefund: vi.fn(),
  getOrderDetailsForRefund: vi.fn(),
  findRefundByRequestId: vi.fn(),
  insertWalletTransaction: vi.fn(),
  updateWalletBalance: vi.fn(),
  findDriverById: vi.fn(),
  updateDriverCODBalance: vi.fn(),
  createCODSettlement: vi.fn(),
  listCODSettlements: vi.fn(),
  listCODOrders: vi.fn(),
  releaseCodHeldShifts: vi.fn(),
  listPayoutShifts: vi.fn(),
  findPayoutShiftById: vi.fn(),
  updatePayoutShift: vi.fn(),
  updateLedgerRowsForShift: vi.fn(),
  transitionPayout: vi.fn(),
  transitionRefundAtomic: vi.fn(),
  settleCODAtomic: vi.fn(),
  isCommissionPayoutAllowed: vi.fn(),
};

vi.mock('../features/finance/finance.repository', () => ({
  FinanceRepository: vi.fn().mockImplementation(function() {
    return mockFinanceRepo;
  }),
}));

import { FinanceService } from '../features/finance/finance.service';

describe('FinanceService', () => {
  let service: FinanceService;

  const adminContext = {
    adminId: 'admin-1',
    adminEmail: 'admin@jaheez.ma',
    adminRole: 'super_admin',
    ip: '127.0.0.1',
  };

  const financeContext = {
    adminId: 'finance-1',
    adminEmail: 'finance@jaheez.ma',
    adminRole: 'finance',
    ip: '127.0.0.1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFinanceRepo.isCommissionPayoutAllowed.mockResolvedValue(true);
    mockFinanceRepo.findRefundByRequestId.mockResolvedValue(null);
    service = new FinanceService();
  });

  describe('adjustWallet', () => {
    const validUser = { id: 'user-1', full_name: 'محمد', phone: '+212600000000' };

    it('should reject finance role money mutation', async () => {
      await expect(
        service.adjustWallet('user-1', { type: 'credit', amount_dh: 10, reason: 'Test reason long enough' }, financeContext)
      ).rejects.toThrow(/super_admin/);
    });

    it('should reject invalid type', async () => {
      await expect(
        service.adjustWallet('user-1', { type: 'steal', amount_dh: 1, reason: 'Test reason long enough' }, adminContext)
      ).rejects.toThrow(/Type invalide/);
    });

    it('should reject zero amount', async () => {
      await expect(
        service.adjustWallet('user-1', { type: 'credit', amount_dh: 0, reason: 'Test reason long enough' }, adminContext)
      ).rejects.toThrow(/Montant DH invalide/);
    });

    it('should reject negative amount', async () => {
      await expect(
        service.adjustWallet('user-1', { type: 'credit', amount_dh: -5, reason: 'Test reason long enough' }, adminContext)
      ).rejects.toThrow(/decimales|Montant DH invalide/);
    });

    it('should reject short reason', async () => {
      await expect(
        service.adjustWallet('user-1', { type: 'credit', amount_dh: 10, reason: 'short' }, adminContext)
      ).rejects.toThrow(/Raison obligatoire/);
    });

    it('should reject missing user', async () => {
      mockFinanceRepo.getUserById.mockResolvedValue(null);

      await expect(
        service.adjustWallet('user-1', { type: 'credit', amount_dh: 10, reason: 'Test credit reason enough' }, adminContext)
      ).rejects.toThrow(/Utilisateur introuvable/);
    });

    it('should credit wallet successfully', async () => {
      mockFinanceRepo.getUserById.mockResolvedValue(validUser);
      mockFinanceRepo.getWalletByUserId.mockResolvedValue({ balance_centimes: 5000 });
      mockFinanceRepo.adjustWalletRPC.mockResolvedValue({ new_balance_centimes: 6000, tx_id: 'tx-1' });
      mockFinanceRepo.writeAuditLog.mockResolvedValue(undefined);

      const result = await service.adjustWallet('user-1', {
        type: 'credit',
        amount_dh: 10,
        reason: 'Remboursement test',
      }, adminContext);

      expect(result.ok).toBe(true);
      expect(result.old_balance_dh).toBe(50);
      expect(result.new_balance_dh).toBe(60);
      expect(result.tx_id).toBe('tx-1');
    });

    it('should throw on audit log failure after successful adjustment', async () => {
      mockFinanceRepo.getUserById.mockResolvedValue(validUser);
      mockFinanceRepo.getWalletByUserId.mockResolvedValue({ balance_centimes: 5000 });
      mockFinanceRepo.adjustWalletRPC.mockResolvedValue({ new_balance_centimes: 6000, tx_id: 'tx-1' });
      mockFinanceRepo.writeAuditLog.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        service.adjustWallet('user-1', {
          type: 'credit',
          amount_dh: 10,
          reason: 'Remboursement test',
        }, adminContext)
      ).rejects.toThrow(/journalisation audit échouée/);
    });

    it('should handle insufficient balance on debit', async () => {
      mockFinanceRepo.getUserById.mockResolvedValue(validUser);
      mockFinanceRepo.getWalletByUserId.mockResolvedValue({ balance_centimes: 100 });
      mockFinanceRepo.adjustWalletRPC.mockRejectedValue(new Error('insufficient balance'));

      await expect(
        service.adjustWallet('user-1', {
          type: 'debit',
          amount_dh: 50,
          reason: 'Débit de test insuffisant',
        }, adminContext)
      ).rejects.toThrow(/Solde insuffisant/);
    });
  });

  describe('freezeWallet', () => {
    it('should reject short reason', async () => {
      await expect(
        service.freezeWallet('user-1', 'ab', adminContext)
      ).rejects.toThrow(/Raison du gel obligatoire/);
    });

    it('should create wallet if not exists before freezing', async () => {
      mockFinanceRepo.getWalletByUserId.mockResolvedValue(null);
      mockFinanceRepo.createWallet.mockResolvedValue(undefined);
      mockFinanceRepo.updateWalletFreezeStatus.mockResolvedValue(undefined);
      mockFinanceRepo.writeAuditLog.mockResolvedValue(undefined);

      await service.freezeWallet('user-1', 'Fraude suspectée', adminContext);

      expect(mockFinanceRepo.createWallet).toHaveBeenCalledWith('user-1');
      expect(mockFinanceRepo.updateWalletFreezeStatus).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ is_frozen: true })
      );
    });
  });

  describe('unfreezeWallet', () => {
    it('should reject if wallet is not frozen', async () => {
      mockFinanceRepo.getWalletByUserId.mockResolvedValue({ is_frozen: false });

      await expect(
        service.unfreezeWallet('user-1', 'Just testing', adminContext)
      ).rejects.toThrow(/pas gelé/);
    });

    it('should reject if wallet does not exist', async () => {
      mockFinanceRepo.getWalletByUserId.mockResolvedValue(null);

      await expect(
        service.unfreezeWallet('user-1', 'Just testing', adminContext)
      ).rejects.toThrow(/pas gelé/);
    });
  });

  describe('updateRefund', () => {
    const mockRefund = {
      id: 'refund-1',
      status: 'pending',
      amount_centimes: 5000,
      method: 'wallet',
      user_id: 'user-1',
      reason: 'Test refund reason',
    };

    it('should reject invalid status', async () => {
      await expect(
        service.updateRefund('refund-1', { status: 'invalid' }, adminContext)
      ).rejects.toThrow(/Statut invalide/);
    });

    it('should reject invalid state transition', async () => {
      mockFinanceRepo.findRefundById.mockResolvedValue({ ...mockRefund, status: 'completed' });

      await expect(
        service.updateRefund('refund-1', { status: 'approved' }, adminContext)
      ).rejects.toThrow(/Transition invalide/);
    });

    it('should allow valid state transition pending → approved', async () => {
      mockFinanceRepo.findRefundById.mockResolvedValue(mockRefund);
      mockFinanceRepo.transitionRefundAtomic.mockResolvedValue({ ...mockRefund, status: 'approved' });
      mockFinanceRepo.writeAuditLog.mockResolvedValue(undefined);

      const result = await service.updateRefund('refund-1', { status: 'approved', request_id: 'refund-request-1' }, adminContext);
      expect(result.status).toBe('approved');
      expect(result.amount_dh).toBe(50);
      expect(mockFinanceRepo.transitionRefundAtomic).toHaveBeenCalledOnce();
    });
  });

  describe('createCODSettlement', () => {
    it('should reject if driver does not exist', async () => {
      mockFinanceRepo.findDriverById.mockResolvedValue(null);

      await expect(
        service.createCODSettlement({ driver_id: 'drv-1', amount_dh: 10, request_id: 'cod-request-1' }, adminContext)
      ).rejects.toThrow(/Livreur introuvable/);
    });

    it('should reject if amount exceeds COD balance', async () => {
      mockFinanceRepo.findDriverById.mockResolvedValue({
        id: 'drv-1',
        full_name: 'Driver Test',
        cod_balance_centimes: 500,
      });

      await expect(
        service.createCODSettlement({ driver_id: 'drv-1', amount_dh: 10, request_id: 'cod-request-2' }, adminContext)
      ).rejects.toThrow(/ne doit que/);
    });

    it('should settle COD successfully', async () => {
      mockFinanceRepo.findDriverById.mockResolvedValue({
        id: 'drv-1',
        full_name: 'Driver Test',
        cod_balance_centimes: 5000,
      });
      mockFinanceRepo.settleCODAtomic.mockResolvedValue({ id: 'settlement-1', amount_centimes: 3000 });
      mockFinanceRepo.writeAuditLog.mockResolvedValue(undefined);
      mockFinanceRepo.releaseCodHeldShifts.mockResolvedValue(0);

      const result = await service.createCODSettlement({
        driver_id: 'drv-1',
        amount_dh: 30,
        method: 'cash_window',
        request_id: 'cod-request-3',
      }, adminContext);

      expect(result.id).toBe('settlement-1');
      expect(result.amount_dh).toBe(30);
      expect(mockFinanceRepo.settleCODAtomic).toHaveBeenCalledOnce();
      expect(mockFinanceRepo.updateDriverCODBalance).not.toHaveBeenCalled();
    });
  });

  describe('listPayouts / updatePayout', () => {
    it('should list shift payouts', async () => {
      mockFinanceRepo.listPayoutShifts.mockResolvedValue([{ id: 'shift-1', payout_status: 'payable' }]);

      const result = await service.listPayouts('payable');

      expect(result).toEqual([expect.objectContaining({ id: 'shift-1', payout_status: 'payable', total_earnings_dh: 0 })]);
      expect(mockFinanceRepo.listPayoutShifts).toHaveBeenCalledWith('payable');
    });

    it('should mark approved shift payout as paid', async () => {
      mockFinanceRepo.findPayoutShiftById.mockResolvedValue({
        id: 'shift-1',
        driver_id: 'driver-1',
        payout_status: 'approved',
        total_earnings_centimes: 1200,
        metadata: {},
      });
      mockFinanceRepo.transitionPayout.mockResolvedValue({ id: 'shift-1', payout_status: 'paid' });
      mockFinanceRepo.writeAuditLog.mockResolvedValue(undefined);

      const result = await service.updatePayout('shift-1', { action: 'mark_paid', payment_reference: 'BANK-1234', request_id: 'payout-request-1' }, adminContext);

      expect(result).toEqual({ id: 'shift-1', payout_status: 'paid' });
      expect(mockFinanceRepo.transitionPayout).toHaveBeenCalledWith('shift-1', 'mark_paid', 'admin-1', null, 'BANK-1234', 'payout-request-1');
    });

    it('should reject marking payout paid without payment reference', async () => {
      mockFinanceRepo.findPayoutShiftById.mockResolvedValue({
        id: 'shift-1',
        driver_id: 'driver-1',
        payout_status: 'approved',
        total_earnings_centimes: 1200,
        metadata: {},
      });

      await expect(service.updatePayout('shift-1', { action: 'mark_paid', request_id: 'payout-request-2' }, adminContext)).rejects.toThrow(/Reference de paiement obligatoire/);
    });
  });
});

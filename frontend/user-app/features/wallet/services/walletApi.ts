import { backendJson } from '@/lib/backendApi';

export interface Wallet {
  id: string;
  user_id: string;
  balance_dh: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string | null;
  user_id: string;
  type: 'credit' | 'debit' | 'admin_adjustment' | 'refund' | 'payout' | 'cod_settle' | 'topup';
  direction?: 'credit' | 'debit' | null;
  amount_dh: number;
  label: string;
  sublabel: string | null;
  ref_id: string | null;
  created_at: string;
}

// Returns 'credit' or 'debit' for a ledger row, preferring the explicit
// `direction` column (used by admin_adjustment) and falling back to `type`
// for legacy credit/debit rows.
export function walletTxDirection(t: WalletTransaction): 'credit' | 'debit' {
  return (t.direction ?? (t.type === 'debit' ? 'debit' : 'credit')) as 'credit' | 'debit';
}

const ZERO_WALLET: Wallet = {
  id: '', user_id: '', balance_dh: 0,
  created_at: '', updated_at: '',
};

export async function getWallet(userId: string): Promise<{ data: Wallet; error: null } | { data: null; error: string }> {
  try {
    const data = await backendJson<Wallet>('/admin-api/v1/customer/wallet');
    return { data: data ?? { ...ZERO_WALLET, user_id: userId }, error: null };
  } catch (e: any) {
    return { data: { ...ZERO_WALLET, user_id: userId }, error: null };
  }
}

export async function getWalletTransactions(
  userId: string,
  type?: 'credit' | 'debit',
): Promise<{ data: WalletTransaction[]; error: string | null }> {
  try {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    const data = await backendJson<WalletTransaction[]>(`/admin-api/v1/customer/wallet/transactions${query}`);
    return { data: data ?? [], error: null };
  } catch {
    return { data: [], error: null };
  }
}

export async function getWalletBalance(userId: string): Promise<number> {
  const { data } = await getWallet(userId);
  return data?.balance_dh ?? 0;
}

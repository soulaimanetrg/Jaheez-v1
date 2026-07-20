import { req, Payout } from '@/lib/api';

export const payouts = () => req<Payout[]>('/driver/payouts');

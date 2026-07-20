import { create } from 'zustand';
import type { Order } from '@shared/types';

export interface OrderState {
  activeOrder: Order | null;
  isTracking: boolean;
  setActiveOrder: (order: Order | null) => void;
  clearActiveOrder: () => void;
  setTracking: (isTracking: boolean) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  activeOrder: null,
  isTracking: false,
  setActiveOrder: (order) => set({ activeOrder: order }),
  clearActiveOrder: () => set({ activeOrder: null, isTracking: false }),
  setTracking: (isTracking) => set({ isTracking }),
}));

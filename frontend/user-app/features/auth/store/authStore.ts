import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '../../../lib/secureStorage';
import type { CustomerProfile } from '../services/authApi';

export interface AuthStoreState {
  user: CustomerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingPhone: string | null;

  setUser: (user: CustomerProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setPendingPhone: (phone: string | null) => void;
  updateProfile: (updates: Partial<CustomerProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      pendingPhone: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),


      setPendingPhone: (pendingPhone) => set({ pendingPhone }),

      updateProfile: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          pendingPhone: null,
        }),
    }),
    {
      name: 'jaheez-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: () => ({}),
    }
  )
);

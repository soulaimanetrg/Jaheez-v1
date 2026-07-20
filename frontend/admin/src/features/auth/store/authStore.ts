import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AdminRole =
  | 'super_admin'
  | 'operations'
  | 'finance'
  | 'support'
  | 'content_manager';

export const ROLE_LABELS: Record<string, string> = {
  super_admin:     'Super Admin',
  operations:      'Opérations',
  finance:         'Finance',
  support:         'Support',
  content_manager: 'Contenu',
  // Legacy fallbacks (server-side migration renames these on boot)
  admin:           'Opérations',
  operator:        'Opérations',
  manager:         'Opérations',
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin:     'Accès total — utilisateurs admin, audit, paramètres',
  operations:      'Commandes, magasins, produits, livreurs, utilisateurs, zones',
  finance:         'Remboursements, portefeuilles, paiements, COD',
  support:         'Tickets support et modération des avis',
  content_manager: 'Bannières, catégories, promotions, notifications',
};

export interface AdminUser {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  role: AdminRole;
}

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  setUser: (user: AdminUser | null) => void;
  logout: () => void;
}

export function defaultPathForRole(role?: string): string {
  if (role === 'support')         return '/support';
  if (role === 'content_manager') return '/categories';
  return '/dashboard';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout:  ()     => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'jaheez-admin-auth-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);

import { useAuthStore, ROLE_LABELS, type AdminRole } from "@/features/auth/store/authStore";

export { ROLE_LABELS, type AdminRole };

export const ROLE_BADGE_CLS: Record<string, string> = {
  super_admin:     "bg-primary/10 text-primary",
  operations:      "bg-blue-100 text-blue-800",
  finance:         "bg-emerald-100 text-emerald-800",
  support:         "bg-amber-100 text-amber-800",
  content_manager: "bg-violet-100 text-violet-800",
};

export function useAdminMe() {
  const { user } = useAuthStore();

  const can = (_action: string): boolean => {
    if (!user) return false;
    // super_admin can do everything
    if (user.role === 'super_admin') return true;
    return true; // simplified — the Express API handles RBAC
  };

  const canAny = (...actions: string[]): boolean => actions.some(can);

  return {
    me: user ? { email: user.email, role: user.role as AdminRole, actions: [] } : undefined,
    isLoading: false,
    can,
    canAny,
  };
}

import type { AdminRole } from "./store/authStore";

export const ALL_ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "operations",
  "finance",
  "support",
  "content_manager",
];

export const PAGE_ROLES: Record<string, AdminRole[]> = {
  "/dashboard": ["super_admin", "operations", "finance"],
  "/notifications": ["super_admin", "content_manager"],
  "/stats": ["super_admin", "operations", "finance"],
  "/orders": ["super_admin", "operations", "finance"],
  "/stores": ["super_admin", "operations", "content_manager"],
  "/products": ["super_admin", "operations", "content_manager"],
  "/categories": ["super_admin", "operations", "content_manager"],
  "/promotions": ["super_admin", "operations", "content_manager"],
  "/users": ["super_admin", "operations", "support"],
  "/drivers": ["super_admin", "operations"],
  "/support": ["super_admin", "support"],
  "/errands": ["super_admin", "operations"],
  "/driver-issues": ["super_admin", "support"],
  "/analytics": ["super_admin", "operations", "finance"],
  "/settings": ["super_admin"],
  "/admins": ["super_admin"],
  "/audit-logs": ["super_admin"],
  "/cities": ["super_admin", "operations"],
  "/refunds": ["super_admin", "finance"],
  "/wallets": ["super_admin", "finance"],
  "/finance": ["super_admin", "finance"],
  "/driver-payouts": ["super_admin", "finance"],
  "/commission": ["super_admin"],
  "/reliability": ["super_admin", "operations"],
  "/cod-reconciliation": ["super_admin", "finance"],
  "/app-content": ["super_admin", "content_manager", "support"],
  "/vehicle-types": ["super_admin", "operations"],
};

export function rolesForPath(pathname: string): AdminRole[] | null {
  if (pathname.startsWith("/products/")) return PAGE_ROLES["/products"];
  return PAGE_ROLES[pathname] ?? null;
}

export function canAccessPath(role: AdminRole | undefined, pathname: string): boolean {
  if (!role) return false;
  const allowed = rolesForPath(pathname);
  return !allowed || allowed.includes(role);
}

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ListOrdered, LogOut, Store, Users, Tag,
  Megaphone, Bike, MessageSquare, ShieldCheck, BarChart3,
  TrendingUp, Banknote, Coins, Settings, ShieldAlert,
  UserCog, ReceiptText, FileText, MapPin, Bike as BikeIcon,
  AlertTriangle, LayoutDashboard, Wallet, Percent, Gauge,
  Bell, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore, ROLE_LABELS, type AdminRole } from "@/features/auth/store/authStore";
import { canAccessPath } from "@/features/auth/permissions";
import { clearToken } from "@/lib/api";
import { adminGetSecurityAlerts } from "@/lib/adminApi";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// ── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchFn?: (loc: string) => boolean;
};

// ── Role permissions ─────────────────────────────────────────────────────────

// ── Navigation definition ─────────────────────────────────────────────────────

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Opérations",
    items: [
      { href: "/orders",        label: "Dispatch",          icon: ListOrdered },
      { href: "/dashboard",     label: "Statistiques",      icon: LayoutDashboard },
      { href: "/driver-issues", label: "Signalements",      icon: AlertTriangle },
    ],
  },
  {
    title: "Catalogue",
    items: [
      {
        href: "/stores",
        label: "Magasins & Produits",
        icon: Store,
        matchFn: (loc) => loc === "/stores" || loc.startsWith("/products/"),
      },
      { href: "/categories", label: "Catégories",  icon: Tag },
      { href: "/promotions", label: "Promotions",  icon: Megaphone },
    ],
  },
  {
    title: "Personnes",
    items: [
      { href: "/users",   label: "Utilisateurs", icon: Users },
      { href: "/drivers", label: "Livreurs",      icon: Bike },
      { href: "/reliability", label: "Retards & points", icon: Gauge },
      { href: "/support", label: "Support",       icon: MessageSquare },
      { href: "/errands", label: "Courses",       icon: Package },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/finance",            label: "Finance Hub",        icon: TrendingUp },
      { href: "/driver-payouts",     label: "Payouts chauffeurs", icon: Banknote },
      { href: "/commission",         label: "Commissions", icon: Percent },
      { href: "/refunds",            label: "Remboursements",     icon: ReceiptText },
      { href: "/wallets",            label: "Portefeuilles",      icon: Wallet },
      { href: "/cod-reconciliation", label: "Réconciliation COD", icon: Coins },
    ],
  },
  {
    title: "Système",
    items: [
      { href: "/audit-logs",    label: "Journal d'audit",  icon: ShieldCheck },
      { href: "/analytics",     label: "Analytics",        icon: BarChart3 },
      { href: "/settings",      label: "Paramètres",       icon: Settings },
      { href: "/notifications", label: "Notifications",    icon: Bell },
      { href: "/app-content",   label: "Contenu app",      icon: FileText },
      { href: "/cities",        label: "Villes",           icon: MapPin },
      { href: "/service-categories", label: "Catégories services", icon: Tag },
      { href: "/vehicle-types", label: "Types de véhicule", icon: BikeIcon },
      { href: "/admins",        label: "Comptes admin",    icon: UserCog },
    ],
  },
];

// ── Page title map ────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":           "Statistiques",
  "/orders":              "Dispatch — Commandes en direct",
  "/analytics":           "Analytics",
  "/stores":              "Magasins & Produits",
  "/users":               "Utilisateurs",
  "/categories":          "Catégories",
  "/promotions":          "Promotions & Bannières",
  "/drivers":             "Gestion des livreurs",
  "/driver-issues":       "Signalements chauffeurs",
  "/support":             "Support tickets",
  "/audit-logs":          "Journal d'audit",
  "/finance":             "Finance Hub",
  "/driver-payouts":      "Payouts chauffeurs",
  "/commission":          "Commissions chauffeurs",
  "/reliability":         "Retards & fiabilite",
  "/cod-reconciliation":  "Réconciliation COD",
  "/settings":            "Paramètres plateforme",
  "/notifications":       "Notifications & Diffusion",
  "/app-content":         "Contenu de l'application",
  "/cities":              "Villes desservies",
  "/service-categories":  "Catégories de services",
  "/vehicle-types":       "Types de véhicule",
  "/admins":              "Comptes administrateurs",
  "/refunds":             "Remboursements",
  "/wallets":             "Gestion des Portefeuilles",
};

// ── Security alert badge ──────────────────────────────────────────────────────

function SecurityBadge() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const check = async () => {
      try {
        const alerts = await adminGetSecurityAlerts();
        setCount(alerts.failedLoginsLast24h);
      } catch {
        // silent
      }
    };
    check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, []);

  if (count === 0) return null;

  return (
    <button
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors"
      onClick={() => navigate("/audit-logs")}
      title="Tentatives de connexion échouées dans les dernières 24h"
    >
      <ShieldAlert className="h-4 w-4" />
      {count}
    </button>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────

export function AdminLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const role = user?.role as AdminRole | undefined;

  const handleLogout = () => {
    clearToken();
    logout();
    window.location.href = "/login";
  };

  const pageTitle = location.pathname.startsWith("/products/")
    ? "Product Management"
    : (PAGE_TITLES[location.pathname] ?? "Admin");

  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : "Admin";

  const isAllowed = (href: string) => {
    return canAccessPath(role, href);
  };

  return (
    <div className="min-h-screen flex bg-muted/40">
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-sidebar text-sidebar-foreground flex flex-col shadow-xl z-10 shrink-0">
        {/* Logo / brand */}
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 rounded-lg p-1.5 shadow-[0_4px_12px_rgba(220,38,38,0.3)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="white" />
              </svg>
            </div>
            <div>
              <div className="font-black text-lg leading-tight tracking-tight text-white uppercase">JAHEEZ Ops</div>
              <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 font-bold -mt-0.5">Centre de contrôle</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => isAllowed(item.href));
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.title} className="mb-3">
                <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-2">
                  {group.title}
                </div>
                {visibleItems.map(({ href, label, icon: Icon, matchFn }) => {
                  const isActive = matchFn ? matchFn(location.pathname) : location.pathname === href;
                  return (
                    <Link key={href} to={href}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start mb-0.5 ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }`}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Admin identity (bottom) */}
        {user && (
          <div className="p-3 border-t border-sidebar-border shrink-0">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-sm font-bold text-white shadow-sm">
                {user.full_name?.[0] ?? "A"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{user.full_name ?? "Admin"}</div>
                <div className="text-xs text-sidebar-foreground/40 truncate">{roleLabel}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main area ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center px-8 shrink-0 justify-between">
          <h1 className="text-xl font-bold tracking-tight">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <SecurityBadge />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">System Operational</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

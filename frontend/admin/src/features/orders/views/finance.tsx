import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout";
import { apiRequest } from "@/lib/adminApi";
import { ArrowRight, Banknote, AlertCircle, Clock, RefreshCw } from "lucide-react";

type FinanceStats = {
  pendingPayoutsCount: number;
  pendingPayoutAmount: number;
  uncollectedCodCount: number;
  uncollectedCodAmount: number;
  collectedCodCount: number;
  collectedCodAmount: number;
};

function StatCard({
  title, value, sub, icon: Icon, color, href, badge,
}: {
  title: string; value: string; sub?: string; icon: React.ComponentType<{ className?: string }>;
  color: string; href?: string; badge?: number;
}) {
  const navigate = useNavigate();
  return (
    <div
      className={`bg-card border rounded-2xl p-6 flex flex-col gap-4 shadow-sm ${href ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={() => href && navigate(href)}
    >
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
            {badge} en attente
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-black tabular-nums">{value}</div>
        <div className="text-sm font-semibold text-foreground mt-0.5">{title}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </div>
      {href && (
        <div className="flex items-center gap-1 text-xs text-primary font-semibold">
          Gérer <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}

export default function Finance() {
  const { data: stats, isLoading, refetch } = useQuery<FinanceStats>({
    queryKey: ["finance-stats"],
    queryFn: () => apiRequest("/finance/stats"),
    refetchInterval: 30000,
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vue d'ensemble finance</h2>
          <p className="text-muted-foreground mt-0.5">Suivi des encaissements et versements</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">Chargement…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              title="COD non encaissé"
              value={`${stats?.uncollectedCodAmount?.toFixed(0) ?? 0} DH`}
              sub={`${stats?.uncollectedCodCount ?? 0} commande${(stats?.uncollectedCodCount ?? 0) !== 1 ? "s" : ""} livrée${(stats?.uncollectedCodCount ?? 0) !== 1 ? "s" : ""}`}
              icon={Clock}
              color="bg-yellow-100 text-yellow-600"
              href="/cod-reconciliation"
              badge={stats?.uncollectedCodCount}
            />
            <StatCard
              title="Payouts en attente"
              value={`${stats?.pendingPayoutAmount?.toFixed(0) ?? 0} DH`}
              sub={`${stats?.pendingPayoutsCount ?? 0} shift${(stats?.pendingPayoutsCount ?? 0) !== 1 ? "s" : ""}`}
              icon={AlertCircle}
              color="bg-green-100 text-green-600"
              href="/driver-payouts"
              badge={stats?.pendingPayoutsCount}
            />
            <StatCard
              title="COD total (global)"
              value={`${((stats?.uncollectedCodAmount ?? 0) + (stats?.collectedCodAmount ?? 0)).toFixed(0)} DH`}
              sub="Livraisons espèces cumulées"
              icon={Banknote}
              color="bg-purple-100 text-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-5">
            <QuickLink
              title="Payouts chauffeurs"
              desc="Valider, bloquer ou marquer payes les shifts clotures."
              icon={Banknote}
              href="/driver-payouts"
              urgent={stats?.pendingPayoutsCount ?? 0}
            />
            <QuickLink
              title="Réconciliation COD"
              desc="Marquer les livraisons en espèces comme encaissées."
              icon={Clock}
              href="/cod-reconciliation"
              urgent={stats?.uncollectedCodCount ?? 0}
            />
          </div>
        </>
      )}
      </div>
    </AdminLayout>
  );
}

function QuickLink({ title, desc, icon: Icon, href, urgent }: {
  title: string; desc: string; icon: React.ComponentType<{ className?: string }>;
  href: string; urgent: number;
}) {
  const navigate = useNavigate();
  return (
    <button
      className="text-left bg-card border rounded-2xl p-5 hover:shadow-md transition-shadow w-full"
      onClick={() => navigate(href)}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="h-5 w-5 text-primary" />
        {urgent > 0 && (
          <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
            {urgent} en attente
          </span>
        )}
      </div>
      <div className="font-bold mb-1">{title}</div>
      <div className="text-sm text-muted-foreground">{desc}</div>
    </button>
  );
}

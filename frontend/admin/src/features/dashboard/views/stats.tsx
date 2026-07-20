import { useQuery } from "@tanstack/react-query";
import { adminGetStats } from "@/lib/adminApi";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Package, Clock, CheckCircle2, XCircle, Banknote } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from "recharts";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmée", preparing: "Préparation",
  assigned: "Assignée", picked_up: "Récupérée", on_the_way: "En route",
  delivered: "Livrée", cancelled: "Annulée",
};

export default function Stats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: adminGetStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!stats) return <AdminLayout><div className="p-8 text-muted-foreground">Impossible de charger les statistiques.</div></AdminLayout>;

  const statusOrder = ["pending", "confirmed", "preparing", "assigned", "picked_up", "on_the_way", "delivered", "cancelled"];
  const chartData = statusOrder.map((status) => ({
    name: STATUS_LABELS[status] ?? status,
    value: stats.byStatus[status] || 0,
    status,
  }));

  const getBarColor = (status: string) => {
    switch (status) {
      case "delivered": return "#22c55e";
      case "cancelled": return "#ef4444";
      case "pending":   return "#94a3b8";
      case "on_the_way": return "#D32F2F";
      default:          return "#fbbf24";
    }
  };

  const revenueDH = stats.revenueToday ?? 0;
  const completionRate = (stats.deliveredToday + stats.cancelledToday) > 0
    ? Math.round((stats.deliveredToday / (stats.deliveredToday + stats.cancelledToday)) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Commandes actives</CardTitle>
              <ActivityDot />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.activeOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">En cours de traitement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenus du jour</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {revenueDH.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-lg ml-1 text-muted-foreground font-normal">DH</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Valeur des livraisons effectuées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Livrées aujourd'hui</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.deliveredToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Commandes réussies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Volume total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">Toutes commandes confondues</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart + At a Glance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Répartition par statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      angle={-35}
                      textAnchor="end"
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      formatter={(val: number) => [val, "Commandes"]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={getBarColor(entry.status)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Synthèse rapide</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <StatRow
                color="amber"
                icon={<Clock className="w-4 h-4" />}
                label="À traiter"
                sub="En attente / Confirmées"
                value={(stats.byStatus.pending || 0) + (stats.byStatus.confirmed || 0)}
              />
              <StatRow
                color="red"
                icon={<XCircle className="w-4 h-4" />}
                label="Annulées"
                sub="Aujourd'hui"
                value={stats.cancelledToday}
              />
              <StatRow
                color="primary"
                icon={<TrendingUp className="w-4 h-4" />}
                label="Taux de succès"
                sub="Livraisons / Total du jour"
                value={`${completionRate}%`}
                highlight
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatRow({
  color, icon, label, sub, value, highlight,
}: {
  color: string; icon: React.ReactNode; label: string; sub: string; value: string | number; highlight?: boolean;
}) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
    primary: "bg-primary/20 text-primary",
  };
  const wrapBg = highlight ? "bg-primary/10" : "bg-muted/50";
  return (
    <div className={`flex justify-between items-center p-3 ${wrapBg} rounded-lg`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${colorMap[color] ?? "bg-gray-100 text-gray-600"}`}>{icon}</div>
        <div>
          <div className={`font-medium text-sm ${highlight ? "text-primary" : ""}`}>{label}</div>
          <div className={`text-xs ${highlight ? "text-primary/70" : "text-muted-foreground"}`}>{sub}</div>
        </div>
      </div>
      <div className={`text-xl font-bold ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function ActivityDot() {
  return (
    <div className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
    </div>
  );
}

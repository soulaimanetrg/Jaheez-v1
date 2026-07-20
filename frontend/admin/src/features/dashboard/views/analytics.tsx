import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  adminGetAnalyticsRevenue,
  adminGetAnalyticsOrders,
  adminGetAnalyticsTopStores,
  adminGetAnalyticsTopDrivers,
  adminExport,
} from "@/lib/adminApi";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Store, Bike, TrendingUp, Package } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";

const DAYS_OPTIONS = [7, 14, 30, 60, 90];

function fmtDH(mad: number) {
  const value = Number.isFinite(mad) ? mad : 0;
  return value.toLocaleString("fr-MA", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " DH";
}

function fmtDay(day: string) {
  return new Date(day + "T12:00:00Z").toLocaleDateString("fr-MA", { day: "2-digit", month: "short" });
}

const CustomTooltipRevenue = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-lg shadow-lg p-3 text-sm">
      <div className="font-semibold mb-1">{label}</div>
      <div className="text-primary font-bold">{fmtDH(payload[0]?.value ?? 0)}</div>
    </div>
  );
};

const CustomTooltipOrders = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-lg shadow-lg p-3 text-sm">
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function safeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [exportingOrders, setExportingOrders] = useState(false);
  const [exportingUsers, setExportingUsers] = useState(false);
  const [exportingDrivers, setExportingDrivers] = useState(false);

  const { data: revenue = [], isLoading: loadingRev } = useQuery({
    queryKey: ["analytics_revenue", days],
    queryFn: () => adminGetAnalyticsRevenue(days),
    refetchInterval: 60_000,
  });

  const { data: orders = [], isLoading: loadingOrd } = useQuery({
    queryKey: ["analytics_orders", days],
    queryFn: () => adminGetAnalyticsOrders(days),
    refetchInterval: 60_000,
  });

  const { data: topStores = [], isLoading: loadingStores } = useQuery({
    queryKey: ["analytics_top_stores"],
    queryFn: () => adminGetAnalyticsTopStores(8),
    refetchInterval: 120_000,
  });

  const { data: topDrivers = [], isLoading: loadingDrivers } = useQuery({
    queryKey: ["analytics_top_drivers"],
    queryFn: () => adminGetAnalyticsTopDrivers(8),
    refetchInterval: 120_000,
  });

  const revenueData = revenue.map((r) => ({ ...r, revenue: safeNumber(r.revenue), day: fmtDay(r.day) }));
  const ordersData = orders.map((o) => ({
    ...o,
    delivered: safeNumber(o.delivered),
    cancelled: safeNumber(o.cancelled),
    total: safeNumber(o.total),
    day: fmtDay(o.day),
  }));

  const totalRevenue = revenue.reduce((s, r) => s + safeNumber(r.revenue), 0);
  const totalDelivered = orders.reduce((s, o) => s + safeNumber(o.delivered), 0);
  const totalCancelled = orders.reduce((s, o) => s + safeNumber(o.cancelled), 0);
  const totalOrders = orders.reduce((s, o) => s + safeNumber(o.total), 0);

  async function doExport(type: "orders" | "users" | "drivers") {
    const setter = type === "orders" ? setExportingOrders : type === "users" ? setExportingUsers : setExportingDrivers;
    setter(true);
    try { await adminExport(type); } finally { setter(false); }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Period selector + export */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">Période :</span>
            {DAYS_OPTIONS.map((d) => (
              <Button
                key={d}
                variant={days === d ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(d)}
              >
                {d}j
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={exportingOrders} onClick={() => doExport("orders")}>
              {exportingOrders ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
              Commandes CSV
            </Button>
            <Button variant="outline" size="sm" disabled={exportingUsers} onClick={() => doExport("users")}>
              {exportingUsers ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
              Clients CSV
            </Button>
            <Button variant="outline" size="sm" disabled={exportingDrivers} onClick={() => doExport("drivers")}>
              {exportingDrivers ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
              Chauffeurs CSV
            </Button>
          </div>
        </div>

        {/* KPI summary for selected period */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{fmtDH(totalRevenue)}</div>
                  <div className="text-xs text-muted-foreground">Revenus ({days}j)</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalOrders}</div>
                  <div className="text-xs text-muted-foreground">Commandes ({days}j)</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalDelivered}</div>
                  <div className="text-xs text-muted-foreground">Livrées ({days}j)</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <Package className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalCancelled}</div>
                  <div className="text-xs text-muted-foreground">Annulées ({days}j)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus quotidiens (DH) — {days} derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRev ? (
              <div className="h-[280px] flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : revenue.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Aucune donnée de revenu pour cette période.
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D32F2F" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#D32F2F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <YAxis
                      axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickFormatter={(v) => `${v.toLocaleString("fr-MA")} DH`}
                    />
                    <RechartsTooltip content={<CustomTooltipRevenue />} />
                    <Area
                      type="monotone" dataKey="revenue" stroke="#D32F2F" strokeWidth={2}
                      fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: "#D32F2F" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders trend */}
        <Card>
          <CardHeader>
            <CardTitle>Volume de commandes — {days} derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrd ? (
              <div className="h-[260px] flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : orders.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                Aucune commande sur cette période.
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                    <RechartsTooltip content={<CustomTooltipOrders />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="delivered" name="Livrées" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="cancelled" name="Annulées" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="total" name="Total" fill="#D32F2F" radius={[4, 4, 0, 0]} opacity={0.15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top stores + top drivers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Store className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Top Stores — Revenus</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingStores ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : topStores.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Aucune donnée.</div>
              ) : (
                <div className="divide-y">
                  {topStores.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-medium text-sm">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.orders} commandes</div>
                        </div>
                      </div>
                      <div className="font-bold text-sm">{fmtDH(safeNumber(s.revenue))}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Bike className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Top Chauffeurs — Livraisons</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingDrivers ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : topDrivers.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Aucune donnée.</div>
              ) : (
                <div className="divide-y">
                  {topDrivers.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-medium text-sm">{d.name}</div>
                          <div className="text-xs text-muted-foreground">{d.deliveries} livraison{d.deliveries !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                      <div className="font-bold text-sm">{fmtDH(safeNumber(d.revenue))}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

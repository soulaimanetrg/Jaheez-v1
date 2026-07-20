import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminGetAuditLogs } from "@/lib/adminApi";

type AuditLogEntry = {
  id: string;
  action: string;
  actorId: string;
  actorRole: string;
  targetType: string;
  targetId: string;
  result: string;
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
  previousValue?: unknown;
  newValue?: unknown;
  createdAt: string;
};
import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { safeDateStr } from "@/lib/utils";
import { Loader2, ShieldCheck, Search, ChevronRight, AlertCircle, CheckCircle } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  "auth.login":        "bg-green-100 text-green-800",
  "auth.login_failed": "bg-red-100 text-red-800",
  "auth.logout":       "bg-gray-100 text-gray-700",
  "order.cancel":      "bg-red-100 text-red-800",
  "order.status_change":"bg-blue-100 text-blue-800",
  "order.assign_driver":"bg-purple-100 text-purple-800",
  "driver.approve":    "bg-green-100 text-green-800",
  "driver.reject":     "bg-red-100 text-red-800",
  "driver.suspend":    "bg-amber-100 text-amber-800",
  "wallet.adjust":     "bg-amber-100 text-amber-800",
  "ticket.close":      "bg-gray-100 text-gray-700",
};

const TARGET_TYPE_OPTIONS = [
  "all", "order", "driver", "user", "store", "product", "category",
  "promotion", "wallet", "support_ticket", "admin_session",
];

export default function AuditLogs() {
  const [actionFilter, setActionFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-audit-logs", actionFilter, targetTypeFilter],
    queryFn: () => adminGetAuditLogs({
      action: actionFilter.trim() || undefined,
      targetType: targetTypeFilter !== "all" ? targetTypeFilter : undefined,
      limit: 200,
    }),
    refetchInterval: 60000,
  });

  const failures = logs.filter((l) => l.result === "failure").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
            <p className="text-muted-foreground mt-1">
              {logs.length} entrées
              {failures > 0 && (
                <span className="ml-2 text-red-600 font-semibold">· {failures} échecs</span>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Rafraîchir
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Filtrer par action (ex: order.cancel)"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
          </div>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
          >
            {TARGET_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t === "all" ? "Tous les types" : t}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground border rounded-xl border-dashed">
            <ShieldCheck className="h-12 w-12 opacity-30" />
            <p>Aucun log trouvé.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Horodatage</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Acteur</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead>Résultat</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-right">Détail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {safeDateStr(log.createdAt ?? (log as any).created_at, d => `${formatDistanceToNow(d)} ago`)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-700"}`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium truncate max-w-[120px]">{log.actorId}</div>
                      <div className="text-xs text-muted-foreground">{log.actorRole}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">{log.targetType}</div>
                      <div className="font-mono text-xs truncate max-w-[100px]">{log.targetId.slice(0, 12)}</div>
                    </TableCell>
                    <TableCell>
                      {log.result === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {log.ipAddress ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{selectedLog?.action}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Acteur:</span> <strong>{selectedLog.actorId}</strong> ({selectedLog.actorRole})</div>
                <div><span className="text-muted-foreground">Résultat:</span> <strong className={selectedLog.result === "success" ? "text-green-600" : "text-red-600"}>{selectedLog.result}</strong></div>
                <div><span className="text-muted-foreground">Cible:</span> {selectedLog.targetType} / <span className="font-mono">{selectedLog.targetId}</span></div>
                <div><span className="text-muted-foreground">IP:</span> {selectedLog.ipAddress ?? "—"}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Date:</span> {new Date(selectedLog.createdAt).toLocaleString("fr-MA")}</div>
                {selectedLog.failureReason && (
                  <div className="col-span-2 text-red-600"><span className="text-muted-foreground">Raison échec:</span> {selectedLog.failureReason}</div>
                )}
              </div>
              {selectedLog.previousValue !== null && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Valeur précédente</div>
                  <pre className="text-xs bg-muted rounded p-3 overflow-auto">{JSON.stringify(selectedLog.previousValue, null, 2)}</pre>
                </div>
              )}
              {selectedLog.newValue !== null && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Nouvelle valeur</div>
                  <pre className="text-xs bg-muted rounded p-3 overflow-auto">{JSON.stringify(selectedLog.newValue, null, 2)}</pre>
                </div>
              )}
              {selectedLog.userAgent && (
                <div className="text-xs text-muted-foreground truncate">UA: {selectedLog.userAgent}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

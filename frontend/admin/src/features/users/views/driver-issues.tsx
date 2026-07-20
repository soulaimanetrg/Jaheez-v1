import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/adminApi";
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type IssueType =
  | "client_absent"
  | "wrong_address"
  | "missing_item"
  | "damaged_item"
  | "refused_delivery"
  | "other";

type DriverIssue = {
  id: string;
  driver_id: string;
  driver_name?: string;
  order_id?: string;
  type: IssueType;
  description: string;
  status: "open" | "resolved";
  resolution_note?: string;
  created_at: string;
};

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  client_absent:    "Client absent",
  wrong_address:    "Mauvaise adresse",
  missing_item:     "Article manquant",
  damaged_item:     "Article endommagé",
  refused_delivery: "Refus de réception",
  other:            "Autre",
};

async function getDriverIssues(status?: string): Promise<DriverIssue[]> {
  const q = status && status !== "all" ? `?status=${status}` : "";
  return apiRequest<DriverIssue[]>(`/driver-issues${q}`);
}

async function resolveDriverIssue(id: string, resolution_note?: string): Promise<void> {
  await apiRequest(`/driver-issues/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "resolved", resolution_note }),
  });
}

export default function DriverIssues() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"open" | "resolved" | "all">("open");
  const [resolveTarget, setResolveTarget] = useState<DriverIssue | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const { data: issues = [], isLoading } = useQuery<DriverIssue[]>({
    queryKey: ["driver-issues", activeTab],
    queryFn: () => getDriverIssues(activeTab),
    refetchInterval: 30000,
  });

  const openCount = issues.filter((i) => i.status === "open").length;

  const resolveMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      resolveDriverIssue(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver-issues"] });
      setResolveTarget(null);
      setResolutionNote("");
      toast({ title: "Signalement résolu" });
    },
    onError: (e: Error) => toast({ title: e.message ?? "Erreur", variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Signalements chauffeurs</h2>
            <p className="text-muted-foreground mt-1">
              {openCount > 0 ? (
                <span className="text-yellow-700 font-semibold">{openCount} signalement{openCount !== 1 ? "s" : ""} ouvert{openCount !== 1 ? "s" : ""}</span>
              ) : (
                <span className="text-green-600 font-semibold">Tous les signalements sont résolus</span>
              )}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="open">
              Ouverts
              {openCount > 0 && (
                <span className="ml-1.5 text-[10px] font-bold bg-yellow-500 text-white rounded-full px-1.5 py-0.5">{openCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">Résolus</TabsTrigger>
            <TabsTrigger value="all">Tous</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Chauffeur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Commande</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Chargement…</p>
                  </TableCell>
                </TableRow>
              ) : issues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Aucun signalement dans cette catégorie.</p>
                  </TableCell>
                </TableRow>
              ) : (
                issues.map((issue) => (
                  <TableRow key={issue.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold text-sm">
                      {issue.driver_name ?? issue.driver_id?.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-orange-100 text-orange-800 border-0 font-medium text-xs">
                        {ISSUE_TYPE_LABELS[issue.type] ?? issue.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px] text-sm text-muted-foreground truncate" title={issue.description}>
                      {issue.description}
                      {issue.resolution_note && (
                        <p className="italic text-xs text-green-700 mt-0.5 truncate">
                          Résolution : {issue.resolution_note}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {issue.order_id ? `#${issue.order_id.slice(0, 8)}` : "—"}
                    </TableCell>
                    <TableCell>
                      {issue.status === "open" ? (
                        <Badge className="bg-yellow-100 text-yellow-800 border-0">Ouvert</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 border-0">Résolu</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {issue.created_at
                        ? formatDistanceToNow(new Date(issue.created_at), { addSuffix: true, locale: fr })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {issue.status === "open" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-200 hover:bg-green-50 gap-1"
                          onClick={() => { setResolveTarget(issue); setResolutionNote(""); }}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Résoudre
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveTarget} onOpenChange={(o) => { if (!o) setResolveTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marquer comme résolu</DialogTitle>
          </DialogHeader>
          {resolveTarget && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                <div className="font-semibold">{ISSUE_TYPE_LABELS[resolveTarget.type] ?? resolveTarget.type}</div>
                <div className="text-muted-foreground">{resolveTarget.description}</div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Note de résolution (optionnelle)</label>
                <Textarea
                  placeholder="Décrivez comment le problème a été résolu…"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveTarget(null)}>Annuler</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
              disabled={resolveMut.isPending}
              onClick={() => resolveTarget && resolveMut.mutate({ id: resolveTarget.id, note: resolutionNote || undefined })}
            >
              {resolveMut.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</>
                : <><CheckCircle className="h-4 w-4" /> Marquer comme résolu</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

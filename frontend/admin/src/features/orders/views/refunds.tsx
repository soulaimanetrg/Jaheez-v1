import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/adminApi";
import { CheckCircle, XCircle, RefreshCw, Plus, Wallet } from "lucide-react";

type Refund = {
  id: string; orderId: string; amount: number; reason: string; status: string;
  adminNote?: string; createdAt: string; resolvedAt?: string;
  approvedAt?: string; processedAt?: string; payoutMethod?: string;
  userName?: string; userPhone?: string; storeName?: string; orderTotal?: number;
};

// G-08 — 3-step flow per Cahier §4.10.3: pending → approved → processed (or rejected).
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: "En attente",  cls: "bg-yellow-100 text-yellow-700" },
  approved:  { label: "Approuvé",    cls: "bg-blue-100 text-blue-700" },
  completed: { label: "Traité",      cls: "bg-green-100 text-green-700" },
  denied:    { label: "Rejeté",      cls: "bg-red-100 text-red-700" },
};

export default function Refunds() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "completed" | "denied">("all");
  const [reviewTarget, setReviewTarget] = useState<Refund | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ orderId: "", amount: "", reason: "" });

  const { data: refunds = [], isLoading } = useQuery<Refund[]>({
    queryKey: ["admin-refunds"],
    queryFn: async () => (await apiRequest<any[]>("/refunds")).map((r) => ({ ...r, orderId: r.order_id || '',
      amount: r.amount_dh, adminNote: r.decision_note, createdAt: r.created_at,
      processedAt: r.processed_at, payoutMethod: r.method, userName: r.user_name, userPhone: r.user_phone })),
    refetchInterval: 15000,
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note: string }) =>
      apiRequest(`/refunds/${id}`, { method: "PATCH", body: JSON.stringify({ status, decision_note: note,
        request_id: crypto.randomUUID() }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-refunds"] });
      qc.invalidateQueries({ queryKey: ["finance-stats"] });
      setReviewTarget(null);
      toast({ title: "Remboursement mis à jour" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  // G-08 step 3: actually move the money. Default = wallet credit.
  const processMut = useMutation({
    mutationFn: ({ id, method }: { id: string; method?: "wallet" | "gateway" | "cash" }) =>
      apiRequest(`/refunds/${id}`, { method: "PATCH", body: JSON.stringify({ status: "completed", decision_note: method,
        request_id: crypto.randomUUID() }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-refunds"] });
      qc.invalidateQueries({ queryKey: ["finance-stats"] });
      toast({ title: "Remboursement traité — portefeuille crédité" });
    },
    onError: (err: any) => toast({
      title: "Erreur",
      description: err?.message ?? "Échec du traitement",
      variant: "destructive",
    }),
  });

  const createMut = useMutation({
    mutationFn: ({ orderId, amount, reason }: { orderId: string; amount: number; reason: string }) =>
      apiRequest('/refunds', { method: "POST", body: JSON.stringify({ order_id: orderId, amount_dh: amount,
        method: 'wallet', reason, request_id: crypto.randomUUID() }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-refunds"] });
      qc.invalidateQueries({ queryKey: ["finance-stats"] });
      setCreateOpen(false);
      setCreateForm({ orderId: "", amount: "", reason: "" });
      toast({ title: "Demande de remboursement créée" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const displayed = filter === "all" ? refunds : refunds.filter((r) => r.status === filter);
  const pendingCount = refunds.filter((r) => r.status === "pending").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Remboursements</h2>
            <p className="text-muted-foreground mt-0.5">
              {refunds.length} demande{refunds.length !== 1 ? "s" : ""}
              {pendingCount > 0 && (
                <span className="ml-2 text-yellow-700 font-semibold">· {pendingCount} en attente</span>
              )}
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nouvelle demande
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "approved", "completed", "denied"] as const).map((s) => (
            <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}
              className={filter === s ? "bg-primary" : ""}>
              {s === "all" ? "Toutes" : STATUS_MAP[s].label}
              {s === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 bg-white/20 rounded-full px-1.5 text-xs">{pendingCount}</span>
              )}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">Chargement…</div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground border rounded-xl border-dashed">
            <RefreshCw className="h-10 w-10 opacity-30" />
            <p>Aucun remboursement</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Client</TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((r) => {
                  const s = STATUS_MAP[r.status] ?? STATUS_MAP["pending"];
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-semibold">{r.userName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.userPhone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-muted-foreground">#{r.orderId.slice(-8)}</div>
                        {r.storeName && <div className="text-xs">{r.storeName}</div>}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm truncate">{r.reason}</p>
                        {r.adminNote && <p className="text-xs text-muted-foreground italic truncate">{r.adminNote}</p>}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        {r.amount.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">DH</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("fr-MA")}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === "pending" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            title="Approuver / rejeter"
                            onClick={() => { setReviewTarget(r); setAdminNote(""); }}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {r.status === "approved" && (
                          <Button variant="ghost" size="sm" className="h-8 text-green-700 hover:bg-green-50 gap-1"
                            disabled={processMut.isPending}
                            title="Créditer le portefeuille du client"
                            onClick={() => processMut.mutate({ id: r.id })}>
                            <Wallet className="h-4 w-4" /> Traiter
                          </Button>
                        )}
                        {r.status === "completed" && r.payoutMethod && (
                          <span className="text-xs text-muted-foreground">
                            via {r.payoutMethod === "gateway" ? "passerelle" : r.payoutMethod === "cash" ? "cash" : "portefeuille"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewTarget} onOpenChange={() => setReviewTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Traiter le remboursement</DialogTitle></DialogHeader>
          {reviewTarget && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
                <div><span className="font-semibold">Client:</span> {reviewTarget.userName}</div>
                <div><span className="font-semibold">Montant:</span> {reviewTarget.amount.toFixed(2)} DH</div>
                <div><span className="font-semibold">Raison:</span> {reviewTarget.reason}</div>
              </div>
              <p className="text-sm text-muted-foreground">
                L'approbation est une décision. Le portefeuille du client ne sera crédité
                qu'à l'étape suivante en cliquant sur <span className="font-semibold">Traiter</span>.
              </p>
              <div className="space-y-1.5">
                <Label>Note interne (optionnelle)</Label>
                <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Note visible uniquement en interne…" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewTarget(null)}>Annuler</Button>
            <Button variant="destructive" disabled={reviewMut.isPending}
              onClick={() => reviewMut.mutate({ id: reviewTarget!.id, status: "denied", note: adminNote })}>
              <XCircle className="h-4 w-4 mr-1" /> Rejeter
            </Button>
            <Button disabled={reviewMut.isPending} className="bg-green-600 hover:bg-green-700"
              onClick={() => reviewMut.mutate({ id: reviewTarget!.id, status: "approved", note: adminNote })}>
              <CheckCircle className="h-4 w-4 mr-1" /> Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Refund Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle demande de remboursement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>ID Commande *</Label>
              <Input value={createForm.orderId} onChange={(e) => setCreateForm(f => ({ ...f, orderId: e.target.value }))}
                placeholder="UUID de la commande" />
            </div>
            <div className="space-y-1.5">
              <Label>Montant (DH) *</Label>
              <Input type="number" step="0.5" value={createForm.amount}
                onChange={(e) => setCreateForm(f => ({ ...f, amount: e.target.value }))} placeholder="50" />
            </div>
            <div className="space-y-1.5">
              <Label>Raison *</Label>
              <Textarea value={createForm.reason} onChange={(e) => setCreateForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Motif du remboursement…" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button disabled={createMut.isPending || !createForm.orderId || !createForm.amount || !createForm.reason}
              onClick={() => createMut.mutate({ orderId: createForm.orderId, amount: parseFloat(createForm.amount), reason: createForm.reason })}>
              {createMut.isPending ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminGetSupportTickets, adminUpdateSupportTicket } from "@/lib/adminApi";

type SupportTicket = {
  id: string;
  subject: string;
  description: string;
  status: string;
  user_name?: string;
  user_phone?: string;
  order_id?: string;
  admin_note?: string;
  created_at: string;
  updated_at?: string;
};
import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { safeDateStr } from "@/lib/utils";
import { Loader2, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "open":        return <Badge className="bg-red-100 text-red-800 border-red-200">Open</Badge>;
    case "in_progress": return <Badge className="bg-amber-100 text-amber-800 border-amber-200">In Progress</Badge>;
    case "closed":      return <Badge className="bg-green-100 text-green-800 border-green-200">Closed</Badge>;
    default:            return <Badge variant="outline">{status}</Badge>;
  }
}

export default function Support() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);

  const { data: tickets = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin-support-tickets", statusFilter],
    queryFn: () => adminGetSupportTickets(statusFilter !== "all" ? statusFilter : undefined),
    refetchInterval: 30000,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminUpdateSupportTicket>[1] }) =>
      adminUpdateSupportTicket(id, data),
    onSuccess: (updated: any) => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      setSelectedTicket(updated);
      toast({ title: "Ticket mis à jour" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  function openTicket(ticket: SupportTicket) {
    setSelectedTicket(ticket);
    setAdminNote(ticket.admin_note ?? "");
    setConfirmClose(false);
  }

  const open   = tickets.filter((t: any) => t.status === "open").length;
  const inProg = tickets.filter((t: any) => t.status === "in_progress").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Support Tickets</h2>
            <p className="text-muted-foreground mt-1">
              {open > 0 && <span className="text-red-600 font-semibold">{open} open</span>}
              {open > 0 && inProg > 0 && " · "}
              {inProg > 0 && <span className="text-amber-600 font-semibold">{inProg} in progress</span>}
              {open === 0 && inProg === 0 && "All tickets resolved"}
            </p>
          </div>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground border rounded-xl border-dashed">
            <MessageSquare className="h-12 w-12 opacity-30" />
            <p>Aucun ticket trouvé.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Ticket</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Commande liée</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket: any) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openTicket(ticket)}>
                    <TableCell>
                      <div className="font-semibold text-sm">{ticket.subject}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 max-w-[260px] truncate">
                        {ticket.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{ticket.user_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{ticket.user_phone ?? ""}</div>
                    </TableCell>
                    <TableCell>
                      {ticket.order_id ? (
                        <span className="font-mono text-xs">#{ticket.order_id.slice(0, 8)}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {safeDateStr(ticket.createdAt ?? (ticket as any).created_at, d => `${formatDistanceToNow(d)} ago`)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openTicket(ticket); }}>
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 text-sm">
                {getStatusBadge(selectedTicket.status)}
                <span className="text-muted-foreground">
                  De <strong>{selectedTicket.user_name ?? "Utilisateur inconnu"}</strong>
                  {selectedTicket.user_phone && ` · ${selectedTicket.user_phone}`}
                </span>
              </div>

              {selectedTicket.order_id && (
                <div className="text-sm text-muted-foreground">
                  Commande liée: <span className="font-mono">#{selectedTicket.order_id.slice(0, 8)}</span>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                {selectedTicket.description}
              </div>

              <div className="space-y-1.5">
                <Label>Note interne admin</Label>
                <Textarea
                  placeholder="Ajouter une note interne..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                />
              </div>

              {selectedTicket.status !== "closed" && (
                <div className="flex gap-2 flex-wrap">
                  {selectedTicket.status === "open" && (
                    <Button
                      variant="outline" size="sm"
                      disabled={updateMut.isPending}
                      onClick={() => updateMut.mutate({ id: selectedTicket.id, data: { status: "in_progress", adminNote: adminNote } })}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1.5" /> Mark In Progress
                    </Button>
                  )}
                  <Button
                    variant="outline" size="sm"
                    disabled={updateMut.isPending}
                    onClick={() => {
                      if (!confirmClose) { setConfirmClose(true); return; }
                      updateMut.mutate({ id: selectedTicket.id, data: { status: "closed", adminNote: adminNote } });
                      setConfirmClose(false);
                    }}
                    className={confirmClose ? "border-red-300 text-red-600 hover:bg-red-50" : ""}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    {confirmClose ? "Confirmer la fermeture" : "Fermer le ticket"}
                  </Button>
                  {confirmClose && (
                    <Button variant="ghost" size="sm" onClick={() => setConfirmClose(false)}>Annuler</Button>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Fermer</Button>
            <Button
              disabled={updateMut.isPending}
              onClick={() => selectedTicket && updateMut.mutate({ id: selectedTicket.id, data: { adminNote: adminNote } })}
              className="bg-primary hover:bg-primary/90"
            >
              {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sauvegarder la note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

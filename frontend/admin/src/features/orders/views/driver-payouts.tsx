import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/adminApi";

type PayoutShift = {
  id: string;
  driver_id: string;
  started_at: string;
  ended_at?: string | null;
  payout_status: "pending_review" | "held" | "approved" | "paid" | "rejected" | "reversed" | "not_ready";
  orders_count: number;
  total_earnings_dh: number;
  payable_dh: number;
  held_dh: number;
  cod_due_dh: number;
  hold_reason?: string | null;
  drivers?: { full_name?: string; phone?: string; city?: string; cod_due_dh?: number };
};

const money = (dh: number) => `${Number(dh || 0).toFixed(2)} DH`;

export default function DriverPayouts() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [paymentReferenceById, setPaymentReferenceById] = useState<Record<string, string>>({});
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const { data: shifts = [], isLoading } = useQuery<PayoutShift[]>({
    queryKey: ["driver-payouts", status],
    queryFn: () => apiRequest(`/payouts${status !== "all" ? `?status=${encodeURIComponent(status)}` : ""}`),
    refetchInterval: 30000,
  });

  const actionMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      const note = noteById[id]?.trim();
      const paymentReference = paymentReferenceById[id]?.trim();

      if (action === "mark_paid" && !paymentReference) {
        throw new Error("Reference paiement obligatoire");
      }
      if (action === "reject" && !note) {
        throw new Error("Note de rejet obligatoire");
      }

      return apiRequest(`/payouts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          note: note || undefined,
          payment_reference: action === "mark_paid" ? paymentReference : undefined,
          request_id: crypto.randomUUID(),
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver-payouts"] });
      qc.invalidateQueries({ queryKey: ["finance-stats"] });
      toast({ title: "Payout mis a jour" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payouts chauffeurs</h2>
          <p className="text-muted-foreground mt-0.5">Versements calcules apres cloture de shift.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["all", "pending_review", "held", "approved", "paid", "rejected"].map((s) => (
            <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
              {s === "all" ? "Tous" : s}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">Chargement...</div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead className="text-right">Courses</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Payable</TableHead>
                  <TableHead className="text-right">Bloque</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Reference paiement</TableHead>
                  <TableHead>Note audit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>
                      <div className="font-semibold">{shift.drivers?.full_name || shift.driver_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">{shift.drivers?.phone || "-"}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{new Date(shift.started_at).toLocaleString("fr-MA")}</div>
                      <div>{shift.ended_at ? new Date(shift.ended_at).toLocaleString("fr-MA") : "-"}</div>
                    </TableCell>
                    <TableCell className="text-right">{shift.orders_count}</TableCell>
                    <TableCell className="text-right font-semibold">{money(shift.total_earnings_dh)}</TableCell>
                    <TableCell className="text-right text-green-700 font-semibold">{money(shift.payable_dh)}</TableCell>
                    <TableCell className="text-right text-yellow-700 font-semibold">{money(shift.held_dh)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted">{shift.payout_status}</span>
                      {shift.hold_reason ? <div className="text-xs text-muted-foreground mt-1">{shift.hold_reason}</div> : null}
                      {shift.cod_due_dh > 0 ? <div className="text-xs text-destructive mt-1">COD: {money(shift.cod_due_dh)}</div> : null}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={paymentReferenceById[shift.id] || ""}
                        onChange={(e) => setPaymentReferenceById((current) => ({ ...current, [shift.id]: e.target.value }))}
                        placeholder="Ref virement/cash"
                        className="h-8 min-w-[160px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={noteById[shift.id] || ""}
                        onChange={(e) => setNoteById((current) => ({ ...current, [shift.id]: e.target.value }))}
                        placeholder="Motif / note interne"
                        className="h-8 min-w-[160px]"
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {shift.payout_status === "pending_review" ? (
                        <Button size="sm" disabled={actionMut.isPending} onClick={() => actionMut.mutate({ id: shift.id, action: "approve" })}>Approuver</Button>
                      ) : null}
                      {shift.payout_status === "approved" ? (
                        <Button size="sm" disabled={actionMut.isPending} onClick={() => actionMut.mutate({ id: shift.id, action: "mark_paid" })}>Paye</Button>
                      ) : null}
                      {shift.payout_status === "held" ? (
                        <Button size="sm" variant="outline" disabled={actionMut.isPending} onClick={() => actionMut.mutate({ id: shift.id, action: "release" })}>Liberer</Button>
                      ) : null}
                      {shift.payout_status !== "paid" ? (
                        <Button size="sm" variant="outline" disabled={actionMut.isPending} onClick={() => actionMut.mutate({ id: shift.id, action: "hold" })}>Bloquer</Button>
                      ) : null}
                      {shift.payout_status !== "paid" && shift.payout_status !== "rejected" ? (
                        <Button size="sm" variant="outline" disabled={actionMut.isPending} onClick={() => actionMut.mutate({ id: shift.id, action: "reject" })}>Rejeter</Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
                {shifts.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground h-32">Aucun payout</TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

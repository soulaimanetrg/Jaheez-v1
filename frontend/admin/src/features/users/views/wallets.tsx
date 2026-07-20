import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { adminGetWallets, adminAdjustWallet } from "@/lib/adminApi";
import { Wallet, PlusCircle, MinusCircle, Search } from "lucide-react";

type WalletEntry = { id: string; userId: string; userName: string; userPhone: string; balance: number };
type AdjustForm = { amount: string; type: "credit" | "debit"; description: string };

export default function Wallets() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [adjustTarget, setAdjustTarget] = useState<WalletEntry | null>(null);
  const [adjustForm, setAdjustForm] = useState<AdjustForm>({ amount: "", type: "credit", description: "" });

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: adminGetWallets,
    refetchInterval: 60000,
  });

  const adjustMut = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Parameters<typeof adminAdjustWallet>[1] }) =>
      adminAdjustWallet(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-wallets"] });
      setAdjustTarget(null);
      toast({ title: "Balance adjusted" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const filtered = wallets.filter((w) =>
    !search || w.userName.toLowerCase().includes(search.toLowerCase()) || w.userPhone.includes(search)
  );

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  function handleAdjust() {
    const amount = parseFloat(adjustForm.amount);
    if (isNaN(amount) || amount <= 0) { toast({ title: "Montant invalide", variant: "destructive" }); return; }
    if (!adjustForm.description.trim()) { toast({ title: "Description requise", variant: "destructive" }); return; }
    adjustMut.mutate({ userId: adjustTarget!.userId, data: { amount, type: adjustForm.type, description: adjustForm.description.trim() } });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Wallets</h2>
            <p className="text-muted-foreground mt-1">
              {wallets.length} wallet{wallets.length !== 1 ? "s" : ""} · Total: <span className="font-semibold text-foreground">{totalBalance.toFixed(2)} DH</span>
            </p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground border rounded-xl border-dashed">
            <Wallet className="h-12 w-12 opacity-30" />
            <p>No wallets found.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((wallet) => (
                  <TableRow key={wallet.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold">{wallet.userName || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{wallet.userPhone}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold tabular-nums text-base ${wallet.balance < 0 ? "text-destructive" : wallet.balance > 0 ? "text-green-700" : "text-muted-foreground"}`}>
                        {wallet.balance.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">DH</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-green-600 hover:bg-green-50"
                          onClick={() => { setAdjustTarget(wallet); setAdjustForm({ amount: "", type: "credit", description: "" }); }}
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          Credit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
                          onClick={() => { setAdjustTarget(wallet); setAdjustForm({ amount: "", type: "debit", description: "" }); }}
                        >
                          <MinusCircle className="h-3.5 w-3.5" />
                          Debit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!adjustTarget} onOpenChange={() => setAdjustTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustForm.type === "credit" ? "Credit Wallet" : "Debit Wallet"} — {adjustTarget?.userName || adjustTarget?.userPhone}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Button
                variant={adjustForm.type === "credit" ? "default" : "outline"}
                className={adjustForm.type === "credit" ? "flex-1 bg-green-600 hover:bg-green-700" : "flex-1"}
                onClick={() => setAdjustForm((f) => ({ ...f, type: "credit" }))}
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Credit
              </Button>
              <Button
                variant={adjustForm.type === "debit" ? "destructive" : "outline"}
                className="flex-1"
                onClick={() => setAdjustForm((f) => ({ ...f, type: "debit" }))}
              >
                <MinusCircle className="h-4 w-4 mr-2" /> Debit
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (DH) *</Label>
              <Input type="number" step="0.01" value={adjustForm.amount}
                onChange={(e) => setAdjustForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="50.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Input value={adjustForm.description}
                onChange={(e) => setAdjustForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Remboursement commande #..." />
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
              Current balance: <span className="font-bold text-foreground">{adjustTarget?.balance.toFixed(2)} DH</span>
              {adjustForm.amount && !isNaN(parseFloat(adjustForm.amount)) && (
                <> → New: <span className="font-bold text-foreground">
                  {(adjustTarget!.balance + (adjustForm.type === "credit" ? 1 : -1) * parseFloat(adjustForm.amount)).toFixed(2)} DH
                </span></>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustTarget(null)}>Cancel</Button>
            <Button
              onClick={handleAdjust}
              disabled={adjustMut.isPending}
              className={adjustForm.type === "credit" ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
            >
              {adjustMut.isPending ? "…" : `${adjustForm.type === "credit" ? "Credit" : "Debit"} Wallet`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

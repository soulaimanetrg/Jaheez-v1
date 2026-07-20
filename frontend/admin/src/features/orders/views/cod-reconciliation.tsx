import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/adminApi";
import { Banknote, CheckCircle, Search } from "lucide-react";

type CodDriver = {
  driverId: string;
  driverName: string;
  driverPhone?: string;
  city?: string;
  codDueDh: number;
};

const money = (dh: number) => `${Number(dh || 0).toFixed(2)} DH`;

export default function CodReconciliation() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [amountByDriver, setAmountByDriver] = useState<Record<string, string>>({});
  const [noteByDriver, setNoteByDriver] = useState<Record<string, string>>({});

  const { data: drivers = [], isLoading } = useQuery<CodDriver[]>({
    queryKey: ["admin-cod-drivers"],
    queryFn: () => apiRequest("/cod-orders"),
    refetchInterval: 20000,
  });

  const settleMut = useMutation({
    mutationFn: (driver: CodDriver) => {
      const rawAmount = amountByDriver[driver.driverId];
      const amountDh = rawAmount || String(driver.codDueDh);
      return apiRequest("/cod-settlements", {
        method: "POST",
        body: JSON.stringify({
          driver_id: driver.driverId,
          amount_dh: amountDh,
          method: "cash_window",
          note: noteByDriver[driver.driverId] || undefined,
          request_id: crypto.randomUUID(),
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cod-drivers"] });
      qc.invalidateQueries({ queryKey: ["finance-stats"] });
      qc.invalidateQueries({ queryKey: ["driver-payouts"] });
      toast({ title: "Encaissement COD enregistre" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const displayed = drivers.filter((driver) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return driver.driverName.toLowerCase().includes(q) || (driver.driverPhone || "").includes(q) || driver.driverId.includes(q);
  });

  const totalDue = drivers.reduce((sum, driver) => sum + Number(driver.codDueDh || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Réconciliation COD</h2>
          <p className="text-muted-foreground mt-0.5">Encaissements espèces par chauffeur. Les payouts restent bloques tant que le COD est du.</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-md">
          <div className="text-2xl font-black text-yellow-800">{money(totalDue)}</div>
          <div className="text-sm font-semibold text-yellow-700 mt-0.5">COD total a encaisser · {drivers.length} chauffeur{drivers.length !== 1 ? "s" : ""}</div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher chauffeur..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">Chargement...</div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground border rounded-xl border-dashed">
            <Banknote className="h-10 w-10 opacity-30" />
            <p>Aucun COD du</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead className="text-right">COD du</TableHead>
                  <TableHead>Montant recu</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((driver) => (
                  <TableRow key={driver.driverId}>
                    <TableCell>
                      <div className="font-semibold text-sm">{driver.driverName}</div>
                      <div className="text-xs text-muted-foreground">{driver.driverPhone || driver.driverId}</div>
                    </TableCell>
                    <TableCell>{driver.city || "-"}</TableCell>
                    <TableCell className="text-right font-bold text-yellow-700">{money(driver.codDueDh)}</TableCell>
                    <TableCell>
                      <Input
                        className="h-8 max-w-[140px]"
                        placeholder={driver.codDueDh.toFixed(2)}
                        value={amountByDriver[driver.driverId] || ""}
                        onChange={(e) => setAmountByDriver((current) => ({ ...current, [driver.driverId]: e.target.value }))}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8"
                        placeholder="Note optionnelle"
                        value={noteByDriver[driver.driverId] || ""}
                        onChange={(e) => setNoteByDriver((current) => ({ ...current, [driver.driverId]: e.target.value }))}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="h-8 text-xs border-green-300 text-green-700 hover:bg-green-50" disabled={settleMut.isPending} onClick={() => settleMut.mutate(driver)}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Encaisser
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

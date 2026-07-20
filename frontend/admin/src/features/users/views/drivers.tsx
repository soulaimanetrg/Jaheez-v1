import type { Driver } from "@/types/admin";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  adminGetDrivers, adminCreateDriver, adminUpdateDriver, adminDeleteDriver, adminResetDriverPassword
} from "@/lib/adminApi";
import {
  Plus, Pencil, Trash2, Bike, Search,
  Ban, Wifi, WifiOff, FileText, User, MapPin, Phone, CreditCard
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:         { label: "Actif",            cls: "bg-green-100 text-green-800" },
  suspended:      { label: "Suspendu",         cls: "bg-gray-100 text-gray-700" },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  id_front:      "CIN — recto",
  id_back:       "CIN — verso",
  license:       "Permis de conduire",
  registration:  "Carte grise",
  profile_photo: "Photo de profil",
};

const VEHICLE_OPTIONS = [
  { value: "motorcycle", label: "Moto" },
  { value: "car", label: "Voiture" },
  { value: "bicycle", label: "Velo" },
];

type DriverForm = {
  full_name: string;
  cin: string;
  phone: string;
  password: string;
  vehicle_type: string;
  vehicle_plate: string;
  city: string;
  is_active: boolean;
};
const emptyForm = (): DriverForm => ({
  full_name: "",
  cin: "",
  phone: "",
  password: "",
  vehicle_type: "motorcycle",
  vehicle_plate: "",
  city: "Safi",
  is_active: true,
});

export default function Drivers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState<DriverForm>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [detailDriver, setDetailDriver] = useState<Driver | null>(null);

  const { data: drivers = [], isLoading, error } = useQuery({
    queryKey: ["admin-drivers", statusFilter, search],
    queryFn: () => adminGetDrivers(statusFilter !== "all" ? statusFilter : undefined, search || undefined),
    refetchInterval: 30000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-drivers"] });

  const createMut = useMutation({
    mutationFn: adminCreateDriver,
    onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: "Chauffeur ajouté" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data, password }: { id: string; data: Parameters<typeof adminUpdateDriver>[1]; password?: string }) => {
      const updated = await adminUpdateDriver(id, data);
      if (password) {
        await adminResetDriverPassword(id, password);
      }
      return updated;
    },
    onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: "Mis a jour" }); },
    onError: (err) => toast({ title: "Erreur", description: err instanceof Error ? err.message : undefined, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: adminDeleteDriver,
    onSuccess: () => { invalidate(); setDeleteTarget(null); toast({ title: "Supprimé" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  function openCreate() { setEditDriver(null); setForm(emptyForm()); setDialogOpen(true); }
  function openEdit(d: any) {
    setEditDriver(d);
    setForm({
      full_name: d.full_name || "",
      cin: d.cin || "",
      phone: d.phone || "",
      password: "",
      vehicle_type: d.vehicle_type || "motorcycle",
      vehicle_plate: d.vehicle_plate ?? "",
      city: d.city || "Safi",
      is_active: d.is_active !== false,
    });
    setDialogOpen(true);
  }
  function handleSubmit() {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast({ title: "Nom et téléphone requis", variant: "destructive" });
      return;
    }
    if (!editDriver && (!form.cin.trim() || form.password.length < 8)) {
      toast({ title: "CIN et mot de passe requis", description: "Le mot de passe doit contenir au moins 8 caracteres.", variant: "destructive" });
      return;
    }
    const payload: Record<string, unknown> = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      vehicle_type: form.vehicle_type,
      vehicle_plate: form.vehicle_plate.trim() || null,
      city: form.city.trim() || "Safi",
      is_active: form.is_active,
    };
    if (form.cin.trim()) {
      payload.cin = form.cin.trim().toUpperCase();
    }
    if (editDriver) {
      if (form.password && form.password.length < 8) {
        toast({ title: "Mot de passe trop court", description: "Le mot de passe doit contenir au moins 8 caracteres.", variant: "destructive" });
        return;
      }
      updateMut.mutate({
        id: editDriver.id,
        data: payload,
        password: form.password || undefined,
      });
    } else {
      createMut.mutate({
        full_name: form.full_name.trim(),
        cin: form.cin.trim().toUpperCase(),
        phone: form.phone.trim(),
        password: form.password,
        vehicle_type: form.vehicle_type,
        vehicle_plate: form.vehicle_plate.trim() || null,
        city: form.city.trim() || "Safi",
      });
    }
  }

  const online   = drivers.filter((d: any) => d.is_online).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Livreurs</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {drivers.length} chauffeur{drivers.length !== 1 ? "s" : ""}
              {online > 0 && <span className="ml-2 text-green-600 font-bold">· {online} en ligne</span>}
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 font-bold">
            <Plus className="h-4 w-4" /> Ajouter un chauffeur
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
            {[
              { key: "all",      label: "Tous" },
              { key: "active",   label: "Actifs" },
              { key: "suspended",label: "Suspendus" },
            ].map(({ key, label }) => (
              <Button
                key={key} size="sm"
                variant={statusFilter === key ? "default" : "ghost"}
                onClick={() => setStatusFilter(key)}
                className={`px-4 ${statusFilter === key ? "bg-white shadow-sm hover:bg-white" : "text-muted-foreground"}`}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 bg-white border-muted" placeholder="Rechercher par nom ou téléphone…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Chargement…</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-destructive border rounded-xl border-dashed border-destructive/40 bg-destructive/5">
            <Ban className="h-10 w-10 opacity-70" />
            <p className="font-bold">Impossible de charger les chauffeurs.</p>
            <p className="text-xs text-muted-foreground">{error instanceof Error ? error.message : "Erreur API inconnue"}</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground border rounded-xl border-dashed">
            <Bike className="h-12 w-12 opacity-30" />
            <p>Aucun chauffeur trouvé.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Activité</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver: any) => {
                  const isActive = driver.is_active !== false;
                  const s = isActive ? STATUS_MAP["active"] : STATUS_MAP["suspended"];
                  return (
                    <TableRow key={driver.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setDetailDriver(driver)}>
                      <TableCell>
                        <div className="font-bold text-sm">{driver.full_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{driver.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium capitalize">{driver.vehicle_type}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{driver.vehicle_plate || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${s.cls} font-bold border-0`}>{s.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${driver.is_online ? "text-green-600" : "text-muted-foreground"}`}>
                            {driver.is_online ? <><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> En ligne</> : <><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" /> Hors ligne</>}
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {driver.created_at ? new Date(driver.created_at).toLocaleDateString("fr-MA") : "—"}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setDetailDriver(driver)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(driver)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(driver)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editDriver ? "Modifier le chauffeur" : "Ajouter un chauffeur"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Nom complet *</Label>
                <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Youssef El Amrani" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>CIN *</Label>
                <Input value={form.cin} onChange={(e) => setForm((f) => ({ ...f, cin: e.target.value }))} placeholder="AB123456" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Téléphone *</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+212 6XX XXXXXX" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>{editDriver ? "Nouveau mot de passe" : "Mot de passe *"}</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder={editDriver ? "Laisser vide pour ne pas changer" : "Minimum 8 caracteres"} />
              </div>
              <div className="space-y-1.5">
                <Label>Type de véhicule</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.vehicle_type}
                  onChange={(e) => setForm((f) => ({ ...f, vehicle_type: e.target.value }))}
                >
                  {VEHICLE_OPTIONS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Plaque</Label>
                <Input value={form.vehicle_plate} onChange={(e) => setForm((f) => ({ ...f, vehicle_plate: e.target.value }))} placeholder="A-12345-B" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Ville</Label>
                <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Safi" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Statut du compte</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.is_active ? "active" : "suspended"}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === "active" }))}
                >
                  <option value="active">Actif</option>
                  <option value="suspended">Suspendu</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="bg-primary hover:bg-primary/90 font-bold">
              {createMut.isPending || updateMut.isPending ? "Enregistrement…" : editDriver ? "Sauvegarder" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Double-Screen Detail Dialog */}
      <DriverDetailDialog driver={detailDriver} onClose={() => { setDetailDriver(null); invalidate(); }} />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer le chauffeur</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Supprimer définitivement <strong>{(deleteTarget as any)?.full_name}</strong> ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}>
              {deleteMut.isPending ? "…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// ─── Detail Dialog ─────────────────────────────────
function DriverDetailDialog({ driver, onClose }: { driver: Driver | null; onClose: () => void }) {
  const d = driver as any;
  const { toast } = useToast();
  const securityUpdate = useMutation({
    mutationFn: (updates: Record<string, unknown>) => adminUpdateDriver(d.id, updates),
    onSuccess: () => { toast({ title: "Securite du livreur mise a jour" }); onClose(); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={!!driver} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-[95vw] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
              {d?.full_name?.[0] ?? "D"}
            </div>
            <div>
              <div className="text-lg font-black">{d?.full_name}</div>
              <div className="text-xs text-muted-foreground font-mono">{d?.phone}</div>
            </div>
          </DialogTitle>
          <div className="flex items-center gap-2 pr-6">
            <Badge variant="outline" className={`${d ? (d.is_active !== false ? STATUS_MAP["active"].cls : STATUS_MAP["suspended"].cls) : ""} border-0 font-bold`}>
              {d ? (d.is_active !== false ? STATUS_MAP["active"].label : STATUS_MAP["suspended"].label) : ""}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-muted/5">
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Profil</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{d?.full_name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{d?.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground italic">Adresse non spécifiée</span>
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-muted">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Véhicule</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Bike className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{d?.vehicle_type}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono uppercase">{d?.vehicle_plate || "—"}</span>
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-muted">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Securite</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="border rounded-md p-3"><div className="text-xs text-muted-foreground">OTP</div><div className="font-bold">{d?.driver_otp_enabled === false ? "Desactive" : "Active"}</div></div>
              <div className="border rounded-md p-3"><div className="text-xs text-muted-foreground">Derniere verification</div><div className="font-bold">{d?.last_otp_verified_at ? new Date(d.last_otp_verified_at).toLocaleString("fr-MA") : "Jamais"}</div></div>
              <div className="border rounded-md p-3 col-span-2"><div className="text-xs text-muted-foreground">Verrouillage</div><div className="font-bold">{d?.otp_locked_until ? new Date(d.otp_locked_until).toLocaleString("fr-MA") : "Aucun"}</div></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={securityUpdate.isPending} onClick={() => securityUpdate.mutate({ driver_otp_enabled: d?.driver_otp_enabled === false })}>{d?.driver_otp_enabled === false ? "Activer OTP" : "Desactiver OTP"}</Button>
              <Button size="sm" variant="outline" disabled={securityUpdate.isPending || !d?.otp_locked_until} onClick={() => securityUpdate.mutate({ reset_otp_lock: true })}>Reinitialiser le verrou</Button>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-muted">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Statistiques</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border shadow-sm text-center">
                <div className="text-lg font-black">0</div>
                <div className="text-[10px] text-muted-foreground">Commandes</div>
              </div>
              <div className="bg-white p-3 rounded-xl border shadow-sm text-center">
                <div className="text-lg font-black">0.0</div>
                <div className="text-[10px] text-muted-foreground">Note</div>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/5">
          <Button variant="outline" onClick={onClose} className="font-bold">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2, Loader2, Bike } from "lucide-react";
import { getAdminToken } from "@/lib/adminApi";

const API_BASE = "";

type VehicleType = {
  id: string;
  slug: string;
  labelFr: string;
  labelAr: string;
  iconName: string;
  isActive: boolean;
  displayOrder: number;
};

type FormState = Omit<VehicleType, "id"> & { id?: string };

const EMPTY: FormState = { slug: "", labelFr: "", labelAr: "", iconName: "bike", isActive: true, displayOrder: 0 };

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).error ?? "Erreur serveur");
  return json as T;
}

export default function VehicleTypesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const list = useQuery({
    queryKey: ["admin-vehicle-types"],
    queryFn: () => jsonFetch<VehicleType[]>("/admin-api/vehicle-types"),
  });

  const upsert = useMutation({
    mutationFn: async (data: FormState) => {
      if (data.id) {
        // slug is immutable on edit (drivers reference it)
        return jsonFetch<VehicleType>(`/admin-api/vehicle-types/${data.id}`, {
          method: "PATCH",
          body: JSON.stringify({ labelFr: data.labelFr, labelAr: data.labelAr, iconName: data.iconName, isActive: data.isActive, displayOrder: data.displayOrder }),
        });
      }
      return jsonFetch<VehicleType>(`/admin-api/vehicle-types`, { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-vehicle-types"] });
      setOpen(false);
      toast({ title: "Enregistré" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => jsonFetch<{ message: string }>(`/admin-api/vehicle-types/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-vehicle-types"] });
      toast({ title: "Supprimé" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Types de véhicule</h1>
            <p className="text-sm text-muted-foreground">Catégories de véhicule disponibles à l'inscription chauffeur. Le slug est immuable.</p>
          </div>
          <Button onClick={() => { setForm(EMPTY); setOpen(true); }} data-testid="btn-create-vt"><Plus className="mr-2 h-4 w-4" /> Nouveau type</Button>
        </div>

        {list.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</div>
        ) : !list.data?.length ? (
          <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
            <Bike className="mx-auto h-8 w-8 mb-2" />
            Aucun type de véhicule.
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 w-16">Ordre</th>
                  <th className="px-3 py-2 w-32">Slug</th>
                  <th className="px-3 py-2">Libellé (FR)</th>
                  <th className="px-3 py-2">Libellé (AR)</th>
                  <th className="px-3 py-2 w-24">Icône</th>
                  <th className="px-3 py-2 w-24">Actif</th>
                  <th className="px-3 py-2 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((v) => (
                  <tr key={v.id} className="border-t" data-testid={`vt-row-${v.id}`}>
                    <td className="px-3 py-2">{v.displayOrder}</td>
                    <td className="px-3 py-2 font-mono text-xs">{v.slug}</td>
                    <td className="px-3 py-2 font-medium">{v.labelFr}</td>
                    <td className="px-3 py-2" dir="rtl">{v.labelAr || "—"}</td>
                    <td className="px-3 py-2 text-xs">{v.iconName}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs ${v.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                        {v.isActive ? "Oui" : "Non"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Button size="sm" variant="ghost" onClick={() => { setForm({ ...v }); setOpen(true); }} data-testid={`btn-edit-${v.id}`}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Supprimer ${v.labelFr} ?`)) remove.mutate(v.id); }} data-testid={`btn-delete-${v.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Modifier le type" : "Nouveau type"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Slug (immuable une fois créé)</Label>
                <Input value={form.slug} disabled={!!form.id} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ex: moto" data-testid="input-slug" />
              </div>
              <div>
                <Label>Libellé (FR)</Label>
                <Input value={form.labelFr} onChange={(e) => setForm({ ...form, labelFr: e.target.value })} data-testid="input-label-fr" />
              </div>
              <div>
                <Label>Libellé (AR)</Label>
                <Input dir="rtl" value={form.labelAr} onChange={(e) => setForm({ ...form, labelAr: e.target.value })} data-testid="input-label-ar" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Icône (lucide)</Label>
                  <Input value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })} placeholder="bike" data-testid="input-icon" />
                </div>
                <div>
                  <Label>Ordre</Label>
                  <Input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) || 0 })} data-testid="input-order" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} data-testid="switch-active" />
                <Label>Actif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending} data-testid="btn-save-vt">
                {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

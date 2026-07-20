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
import { Pencil, Plus, Trash2, Loader2, MapPin } from "lucide-react";
import { getAdminToken } from "@/lib/adminApi";

const API_BASE = "";

type City = {
  id: string;
  nameFr: string;
  nameAr: string;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
  displayOrder: number;
};

type FormState = Omit<City, "id"> & { id?: string };

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

const EMPTY: FormState = { nameFr: "", nameAr: "", lat: null, lng: null, isActive: true, displayOrder: 0 };

export default function CitiesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const list = useQuery({
    queryKey: ["admin-cities"],
    queryFn: () => jsonFetch<City[]>("/admin-api/cities"),
  });

  const upsert = useMutation({
    mutationFn: async (data: FormState) => {
      const body = { nameFr: data.nameFr, nameAr: data.nameAr, lat: data.lat ?? undefined, lng: data.lng ?? undefined, isActive: data.isActive, displayOrder: data.displayOrder };
      if (data.id) {
        return jsonFetch<City>(`/admin-api/cities/${data.id}`, { method: "PATCH", body: JSON.stringify(body) });
      }
      return jsonFetch<City>(`/admin-api/cities`, { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cities"] });
      setOpen(false);
      toast({ title: "Enregistré" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => jsonFetch<{ message: string }>(`/admin-api/cities/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cities"] });
      toast({ title: "Supprimé" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Villes desservies</h1>
            <p className="text-sm text-muted-foreground">Liste des villes où JAHEEZ opère. Coordonnées GPS optionnelles pour la cartographie.</p>
          </div>
          <Button onClick={() => { setForm(EMPTY); setOpen(true); }} data-testid="btn-create-city"><Plus className="mr-2 h-4 w-4" /> Nouvelle ville</Button>
        </div>

        {list.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</div>
        ) : !list.data?.length ? (
          <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
            <MapPin className="mx-auto h-8 w-8 mb-2" />
            Aucune ville — ajoutez-en une.
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 w-16">Ordre</th>
                  <th className="px-3 py-2">Nom (FR)</th>
                  <th className="px-3 py-2">Nom (AR)</th>
                  <th className="px-3 py-2">Coordonnées</th>
                  <th className="px-3 py-2 w-24">Actif</th>
                  <th className="px-3 py-2 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((c) => (
                  <tr key={c.id} className="border-t" data-testid={`city-row-${c.id}`}>
                    <td className="px-3 py-2">{c.displayOrder}</td>
                    <td className="px-3 py-2 font-medium">{c.nameFr}</td>
                    <td className="px-3 py-2" dir="rtl">{c.nameAr || "—"}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {c.lat != null && c.lng != null ? `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs ${c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                        {c.isActive ? "Oui" : "Non"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Button size="sm" variant="ghost" onClick={() => { setForm({ ...c }); setOpen(true); }} data-testid={`btn-edit-${c.id}`}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Supprimer ${c.nameFr} ?`)) remove.mutate(c.id); }} data-testid={`btn-delete-${c.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Modifier la ville" : "Nouvelle ville"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nom (FR)</Label>
                <Input value={form.nameFr} onChange={(e) => setForm({ ...form, nameFr: e.target.value })} data-testid="input-name-fr" />
              </div>
              <div>
                <Label>Nom (AR)</Label>
                <Input dir="rtl" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} data-testid="input-name-ar" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude</Label>
                  <Input type="number" step="any" value={form.lat ?? ""} onChange={(e) => setForm({ ...form, lat: e.target.value === "" ? null : Number(e.target.value) })} data-testid="input-lat" />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input type="number" step="any" value={form.lng ?? ""} onChange={(e) => setForm({ ...form, lng: e.target.value === "" ? null : Number(e.target.value) })} data-testid="input-lng" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ordre</Label>
                  <Input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) || 0 })} data-testid="input-order" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} data-testid="switch-active" />
                  <Label>Actif</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending} data-testid="btn-save-city">
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

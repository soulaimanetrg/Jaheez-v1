import React, { useState } from "react";
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
import { Pencil, Plus, Trash2, Loader2, Tags, FolderDot, Layers } from "lucide-react";
import { getAdminToken } from "@/lib/adminApi";

const API_BASE = "";

type ServiceCategory = {
  id: string;
  name_ar: string;
  name_fr: string;
  type: "service" | "store" | "product" | "errand";
  parent_id?: string | null;
  icon_emoji?: string | null;
  color_hex: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

type FormState = Omit<ServiceCategory, "id" | "created_at"> & { id?: string };

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

const EMPTY: FormState = {
  name_ar: "",
  name_fr: "",
  type: "service",
  parent_id: null,
  icon_emoji: "✨",
  color_hex: "#F03030",
  sort_order: 0,
  is_active: true,
};

export default function ServiceCategoriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "parents" | "children">("children"); // Default to subcategories for detailed view

  const list = useQuery({
    queryKey: ["admin-service-categories"],
    queryFn: () => jsonFetch<ServiceCategory[]>("/admin-api/service-categories"),
  });

  const upsert = useMutation({
    mutationFn: async (data: FormState) => {
      const body = {
        name_ar: data.name_ar,
        name_fr: data.name_fr,
        type: data.type,
        parent_id: data.parent_id || null,
        icon_emoji: data.icon_emoji || null,
        color_hex: data.color_hex || "#F03030",
        sort_order: data.sort_order,
        is_active: data.is_active,
      };
      if (data.id) {
        return jsonFetch<ServiceCategory>(`/admin-api/service-categories/${data.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      return jsonFetch<ServiceCategory>(`/admin-api/service-categories`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-service-categories"] });
      setOpen(false);
      toast({ title: "Enregistré avec succès" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      jsonFetch<{ message: string }>(`/admin-api/service-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-service-categories"] });
      toast({ title: "Supprimé avec succès" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const allCategories = list.data || [];
  const parentCategories = allCategories.filter(c => !c.parent_id && c.id !== form.id);

  // Helper filter function
  const matchesSearch = (c: ServiceCategory) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name_fr.toLowerCase().includes(q) ||
      (c.name_ar || "").includes(search) ||
      c.type.toLowerCase().includes(q)
    );
  };

  const renderCategoryRow = (c: ServiceCategory) => {
    const parent = allCategories.find((p) => p.id === c.parent_id);
    const parentName = parent ? `${parent.name_fr} (${parent.icon_emoji})` : "—";
    const isUrl = c.icon_emoji && (c.icon_emoji.startsWith("http://") || c.icon_emoji.startsWith("https://"));

    return (
      <tr key={c.id} className="border-t hover:bg-muted/10 transition-colors" data-testid={`category-row-${c.id}`}>
        <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{c.sort_order}</td>
        <td className="px-3 py-2 text-center text-lg">
          {isUrl ? (
            <img
              src={c.icon_emoji!}
              className="w-8 h-8 rounded border mx-auto object-contain bg-background"
              alt={c.name_fr}
            />
          ) : (
            c.icon_emoji
          )}
        </td>
        <td className="px-3 py-2 font-medium">{c.name_fr}</td>
        <td className="px-3 py-2" dir="rtl">{c.name_ar || "—"}</td>
        <td className="px-3 py-2 text-muted-foreground">{parentName}</td>
        <td className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
          {c.type}
        </td>
        <td className="px-3 py-2 flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-black/10"
            style={{ backgroundColor: c.color_hex }}
          />
          <code className="text-xs">{c.color_hex}</code>
        </td>
        <td className="px-3 py-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              c.is_active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
            }`}
          >
            {c.is_active ? "Actif" : "Inactif"}
          </span>
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setForm({
                  id: c.id,
                  name_ar: c.name_ar,
                  name_fr: c.name_fr,
                  type: c.type,
                  parent_id: c.parent_id,
                  icon_emoji: c.icon_emoji,
                  color_hex: c.color_hex,
                  sort_order: c.sort_order,
                  is_active: c.is_active,
                });
                setOpen(true);
              }}
              data-testid={`btn-edit-${c.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm(`Supprimer la catégorie ${c.name_fr} ?`)) remove.mutate(c.id);
              }}
              data-testid={`btn-delete-${c.id}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FolderDot className="h-6 w-6 text-primary" /> Catégories & Types de Services
            </h1>
            <p className="text-sm text-muted-foreground">
              Gérez la hiérarchie des types de services principaux et leurs catégories associées (Types puis Catégories).
            </p>
          </div>
          <Button onClick={() => { setForm(EMPTY); setOpen(true); }} data-testid="btn-create-category">
            <Plus className="mr-2 h-4 w-4" /> Nouveau Type / Catégorie
          </Button>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
          <Input
            placeholder="Rechercher par nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center border rounded-md p-1 bg-muted/40 shrink-0 self-start">
            <Button
              size="sm"
              variant={tab === "parents" ? "secondary" : "ghost"}
              onClick={() => setTab("parents")}
              className="h-8 text-xs font-medium"
            >
              1. Types Principaux ({allCategories.filter(c => !c.parent_id).length})
            </Button>
            <Button
              size="sm"
              variant={tab === "children" ? "secondary" : "ghost"}
              onClick={() => setTab("children")}
              className="h-8 text-xs font-medium"
            >
              2. Catégories Associées ({allCategories.filter(c => !!c.parent_id).length})
            </Button>
            <Button
              size="sm"
              variant={tab === "all" ? "secondary" : "ghost"}
              onClick={() => setTab("all")}
              className="h-8 text-xs font-medium"
            >
              Tout Afficher ({allCategories.length})
            </Button>
          </div>
        </div>

        {list.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" /> Chargement des configurations...
          </div>
        ) : !allCategories.length ? (
          <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
            <Tags className="mx-auto h-8 w-8 mb-2" />
            Aucune catégorie configurée dans le système.
          </div>
        ) : (
          <div className="rounded-md border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 w-16">Ordre</th>
                  <th className="px-3 py-2 w-16 text-center">Icône</th>
                  <th className="px-3 py-2">Nom (FR)</th>
                  <th className="px-3 py-2">Nom (AR)</th>
                  <th className="px-3 py-2">Parent / Type de Service</th>
                  <th className="px-3 py-2">Usage</th>
                  <th className="px-3 py-2">Couleur</th>
                  <th className="px-3 py-2 w-24">Statut</th>
                  <th className="px-3 py-2 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. PARENTS TAB */}
                {tab === "parents" &&
                  allCategories
                    .filter(c => !c.parent_id && matchesSearch(c))
                    .map(c => renderCategoryRow(c))}

                {/* 2. CHILDREN TAB (Grouped by Parent Type) */}
                {tab === "children" &&
                  parentCategories.map(parent => {
                    const children = allCategories.filter(c => c.parent_id === parent.id && matchesSearch(c));
                    if (children.length === 0) return null;

                    return (
                      <React.Fragment key={parent.id}>
                        {/* Section Header */}
                        <tr className="bg-muted/40 font-semibold border-t">
                          <td colSpan={9} className="px-3 py-2 text-primary text-xs uppercase tracking-wider">
                            📁 Type: {parent.name_fr} ({parent.name_ar})
                          </td>
                        </tr>
                        {children.map(c => renderCategoryRow(c))}
                      </React.Fragment>
                    );
                  })}

                {/* 3. ALL TAB (Structured Hierarchical: Type -> Categories) */}
                {tab === "all" && (
                  <>
                    {/* Root parents with no parent */}
                    <tr className="bg-muted/40 font-semibold border-t">
                      <td colSpan={9} className="px-3 py-2 text-primary text-xs uppercase tracking-wider">
                        ⭐ Types principaux de services
                      </td>
                    </tr>
                    {allCategories
                      .filter(c => !c.parent_id && matchesSearch(c))
                      .map(c => renderCategoryRow(c))}

                    {/* Children grouped by parent */}
                    {parentCategories.map(parent => {
                      const children = allCategories.filter(c => c.parent_id === parent.id && matchesSearch(c));
                      if (children.length === 0) return null;

                      return (
                        <React.Fragment key={parent.id}>
                          <tr className="bg-muted/30 font-semibold border-t">
                            <td colSpan={9} className="px-3 py-2 text-primary/80 text-xs uppercase tracking-wider">
                              ↳ Sous-catégories de: {parent.name_fr} ({parent.name_ar})
                            </td>
                          </tr>
                          {children.map(c => renderCategoryRow(c))}
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Update Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {form.id ? "Modifier la Catégorie / Type" : "Nouveau Type / Catégorie"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nom (FR)</Label>
                  <Input
                    value={form.name_fr}
                    onChange={(e) => setForm({ ...form, name_fr: e.target.value })}
                    data-testid="input-name-fr"
                    placeholder="Ex: Restauration"
                  />
                </div>
                <div>
                  <Label>Nom (AR)</Label>
                  <Input
                    dir="rtl"
                    value={form.name_ar}
                    onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                    data-testid="input-name-ar"
                    placeholder="Ex: طعام"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    data-testid="select-type"
                  >
                    <option value="service">Service principal (Type)</option>
                    <option value="store">Magasin (Sous-catégorie)</option>
                    <option value="product">Produit (Sous-catégorie)</option>
                    <option value="errand">Course (Errand)</option>
                  </select>
                </div>
                <div>
                  <Label>Icône (Emoji ou URL image)</Label>
                  <Input
                    value={form.icon_emoji ?? ""}
                    onChange={(e) => setForm({ ...form, icon_emoji: e.target.value })}
                    data-testid="input-icon"
                    placeholder="Ex: 🍔 ou https://image.com/icon.png"
                  />
                </div>
              </div>

              <div>
                <Label>Type de Service Parent (Optionnel)</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={form.parent_id ?? ""}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value === "" ? null : e.target.value })}
                  data-testid="select-parent"
                >
                  <option value="">— Aucun (Type de Service Principal) —</option>
                  {parentCategories.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_fr} ({p.icon_emoji})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>Couleur Hex</Label>
                  <Input
                    value={form.color_hex}
                    onChange={(e) => setForm({ ...form, color_hex: e.target.value })}
                    data-testid="input-color"
                    placeholder="Ex: #F03030"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <input
                    type="color"
                    className="w-full h-10 border border-input rounded-md cursor-pointer"
                    value={form.color_hex.startsWith("#") && form.color_hex.length === 7 ? form.color_hex : "#F03030"}
                    onChange={(e) => setForm({ ...form, color_hex: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ordre de tri</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                    data-testid="input-order"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                    data-testid="switch-active"
                  />
                  <Label>Catégorie active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending} data-testid="btn-save-category">
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

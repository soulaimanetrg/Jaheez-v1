import type { Store } from "@/types/admin";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  adminGetStores, adminCreateStore, adminUpdateStore, adminDeleteStore, adminApplyStoreReduction,
} from "@/lib/adminApi";
import { Plus, Pencil, Trash2, Package, Store as StoreIcon, Percent } from "lucide-react";

import { ImageUpload } from "@/components/ImageUpload";

const CATEGORY_OPTIONS = [
  { value: "food", label: "🍔 Food" },
  { value: "grocery", label: "🛒 Grocery" },
  { value: "pharmacy", label: "💊 Pharmacy" },
  { value: "package", label: "📦 Package" },
  { value: "errand", label: "🏃 Errand" },
];

const COVER_COLORS = [
  "#D32F2F", "#B71C1C", "#8B2635", "#B8420A", "#C0392B",
  "#1A6B3C", "#2E7D32", "#1565C0", "#1A237E", "#37474F",
  "#F57F17", "#E65100", "#4A148C", "#880E4F",
];

type StoreForm = {
  name: string; // French name
  nameEn: string; // English name
  nameAr: string; // Arabic name
  categoryId: string;
  description: string; // French description
  descriptionEn: string; // English description
  descriptionAr: string; // Arabic description
  tags: string;
  deliveryTime: string; deliveryFee: string;
  isOpen: boolean; isFeatured: boolean; coverColor: string;
  logoUrl: string; coverImageUrl: string;
  openingHours: Record<string, { open: string; close: string; is_closed: boolean }>;
};

const emptyForm = (): StoreForm => ({
  name: "", nameEn: "", nameAr: "", categoryId: "food", description: "", descriptionEn: "", descriptionAr: "", tags: "",
  deliveryTime: "20-35 min", deliveryFee: "10",
  isOpen: true, isFeatured: false, coverColor: "#D32F2F",
  logoUrl: "", coverImageUrl: "",
  openingHours: {
    mon: { open: "09:00", close: "23:00", is_closed: false },
    tue: { open: "09:00", close: "23:00", is_closed: false },
    wed: { open: "09:00", close: "23:00", is_closed: false },
    thu: { open: "09:00", close: "23:00", is_closed: false },
    fri: { open: "09:00", close: "23:00", is_closed: false },
    sat: { open: "09:00", close: "23:00", is_closed: false },
    sun: { open: "09:00", close: "23:00", is_closed: false },
  },
});

function buildBilingualText(fr: string, en: string) {
  const f = fr.trim();
  const e = en.trim();
  if (!f) return e;
  if (!e || f === e) return f;
  return `${f} | ${e}`;
}

export default function Stores() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStore, setEditStore] = useState<Store | null>(null);
  const [form, setForm] = useState<StoreForm>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);

  const [reductionStore, setReductionStore] = useState<Store | null>(null);
  const [reductionType, setReductionType] = useState<'percentage' | 'fixed'>('percentage');
  const [reductionValue, setReductionValue] = useState<string>("10");

  const reductionMut = useMutation({
    mutationFn: ({ id, type, value }: { id: string; type: 'percentage' | 'fixed'; value: number }) =>
      adminApplyStoreReduction(id, { type, value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-stores"] });
      setReductionStore(null);
      toast({ title: "Réduction appliquée avec succès" });
    },
    onError: (err: any) =>
      toast({ title: "Erreur", description: err.message || "Échec de l'application de la réduction", variant: "destructive" }),
  });

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ["admin-stores"],
    queryFn: adminGetStores,
    refetchInterval: 30000,
  });

  const createMut = useMutation({
    mutationFn: adminCreateStore,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-stores"] }); setDialogOpen(false); toast({ title: "Magasin créé" }); },
    onError: () => toast({ title: "Erreur", description: "Création échouée", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminUpdateStore>[1] }) =>
      adminUpdateStore(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-stores"] }); setDialogOpen(false); toast({ title: "Magasin mis à jour" }); },
    onError: () => toast({ title: "Erreur", description: "Mise à jour échouée", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: adminDeleteStore,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-stores"] }); setDeleteTarget(null); toast({ title: "Magasin supprimé" }); },
    onError: () => toast({ title: "Erreur", description: "Suppression échouée", variant: "destructive" }),
  });

  const toggleOpen = (store: any) => {
    updateMut.mutate({ id: store.id, data: { is_open: !store.is_open } });
  };

  const toggleFeatured = (store: any) => {
    updateMut.mutate({ id: store.id, data: { is_featured: !store.is_featured } });
  };

  function openCreate() {
    setEditStore(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(store: any) {
    const [nameFr = "", nameEn = ""] = (store.name || "").split("|").map((s: string) => s.trim());
    const [descFr = "", descEn = ""] = (store.description || "").split("|").map((s: string) => s.trim());
    setEditStore(store);
    setForm({
      name: nameFr,
      nameEn: nameEn,
      nameAr: store.name_ar || "",
      categoryId: store.category || "food",
      description: descFr,
      descriptionEn: descEn,
      descriptionAr: store.description_ar || "",
      tags: store.tags?.join(", ") ?? "",
      deliveryTime: store.delivery_time || "30-45 min",
      deliveryFee: String(store.delivery_fee || 0),
      isOpen: !!store.is_open,
      isFeatured: !!store.is_featured,
      coverColor: store.coverColor || "#D32F2F",
      logoUrl: store.logo_url || "",
      coverImageUrl: store.cover_url || "",
      openingHours: store.opening_hours && Object.keys(store.opening_hours).length > 0
        ? (typeof store.opening_hours === "string" ? JSON.parse(store.opening_hours) : store.opening_hours)
        : {
            mon: { open: "09:00", close: "23:00", is_closed: false },
            tue: { open: "09:00", close: "23:00", is_closed: false },
            wed: { open: "09:00", close: "23:00", is_closed: false },
            thu: { open: "09:00", close: "23:00", is_closed: false },
            fri: { open: "09:00", close: "23:00", is_closed: false },
            sat: { open: "09:00", close: "23:00", is_closed: false },
            sun: { open: "09:00", close: "23:00", is_closed: false },
          },
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.description.trim()) { toast({ title: "La description (FR) est requise", variant: "destructive" }); return; }
    if (!form.descriptionEn.trim()) { toast({ title: "La description (EN) est requise", variant: "destructive" }); return; }
    if (!form.descriptionAr.trim()) { toast({ title: "La description (AR) est requise", variant: "destructive" }); return; }
    
    const combinedName = buildBilingualText(form.name, form.nameEn);
    const combinedDesc = buildBilingualText(form.description, form.descriptionEn);

    const payload = {
      name: combinedName,
      name_ar: form.nameAr.trim() || form.name.trim(),
      category: form.categoryId,
      categoryId: form.categoryId,
      description: combinedDesc,
      description_ar: form.descriptionAr.trim() || null,
      address_ar: "",
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      delivery_time: parseInt(form.deliveryTime, 10) || 30,
      delivery_fee: parseFloat(form.deliveryFee) || 0,
      min_order: 0,
      is_open: form.isOpen,
      is_featured: form.isFeatured,
      coverColor: form.coverColor,
      logo_url: form.logoUrl,
      cover_url: form.coverImageUrl,
      opening_hours: form.openingHours,
    };

    if (editStore) {
      updateMut.mutate({ id: editStore.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  }

  const isBusy = createMut.isPending || updateMut.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Stores</h2>
            <p className="text-muted-foreground mt-1">{stores.length} magasin{stores.length !== 1 ? "s" : ""} enregistré{stores.length !== 1 ? "s" : ""}</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New Store
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading stores…</div>
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground border rounded-xl border-dashed">
            <StoreIcon className="h-12 w-12 opacity-30" />
            <p>No stores yet. Create your first store.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead className="text-center">Open</TableHead>
                  <TableHead className="text-center">Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => {
                  const logo = store.logo_url;
                  const logoSrc = logo
                    ? logo.startsWith("http")
                      ? logo
                      : logo.startsWith("/api/")
                        ? logo
                        : `/api/storage${logo}`
                    : "";
                  return (
                  <TableRow key={store.id} className="hover:bg-muted/30">
                    <TableCell>
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt=""
                          className="w-8 h-8 rounded-md object-cover shadow-sm shrink-0"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shadow-sm shrink-0"
                        >
                          {store.name ? store.name.substring(0, 2).toUpperCase() : "S"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{store.name}</span>
                        {(store as any).promo_type === 'store_percentage' && (
                          <Badge className="bg-red-600 hover:bg-red-700 text-white text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider scale-90 shrink-0">
                            -{(store as any).reduction_percentage}% Store
                          </Badge>
                        )}
                        {(store as any).promo_type === 'store_fixed' && (
                          <Badge className="bg-red-600 hover:bg-red-700 text-white text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider scale-90 shrink-0">
                            -{(store as any).reduction_percentage} DH Store
                          </Badge>
                        )}
                        {(store as any).promo_type === 'articles' && (
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider scale-90 shrink-0">
                            -% Articles
                          </Badge>
                        )}
                      </div>
                      {store.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{store.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{store.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {store.tags?.slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                        {(store.tags?.length ?? 0) > 2 && (
                          <Badge variant="outline" className="text-xs">+{store.tags!.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{store.delivery_time}</div>
                      <div className="text-xs">{store.delivery_fee > 0 ? `${store.delivery_fee} DH` : "Free"}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={!!store.is_open}
                        onCheckedChange={() => toggleOpen(store)}
                        disabled={updateMut.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={!!store.is_featured}
                        onCheckedChange={() => toggleFeatured(store)}
                        disabled={updateMut.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => navigate(`/products/${store.id}`)}
                          title="Manage products"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setReductionStore(store);
                            if ((store as any).promo_type === 'store_percentage') {
                              setReductionType('percentage');
                              setReductionValue(((store as any).reduction_percentage || 10).toString());
                            } else if ((store as any).promo_type === 'store_fixed') {
                              setReductionType('fixed');
                              setReductionValue(((store as any).reduction_percentage || 10).toString());
                            } else {
                              setReductionType('percentage');
                              setReductionValue(((store as any).reduction_percentage || 10).toString());
                            }
                          }}
                          title="Apply reduction to all products"
                        >
                          <Percent className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(store)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(store)}
                        >
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editStore ? "Edit Store" : "New Store"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label>Name (FR) *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Dar Tagine"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Name (EN) *</Label>
                  <Input
                    value={form.nameEn}
                    onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                    placeholder="Dar Tagine (EN)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Name (AR) *</Label>
                  <Input
                    dir="rtl"
                    value={form.nameAr}
                    onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                    placeholder="دار الطاجين"
                  />
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Delivery Time</Label>
                  <Input
                    value={form.deliveryTime}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryTime: e.target.value }))}
                    placeholder="20-35 min"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Delivery Fee (DH)</Label>
                  <Input
                    type="number"
                    value={form.deliveryFee}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryFee: e.target.value }))}
                  />
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label>Description (FR)</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Dar Tagine (FR)"
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (EN)</Label>
                  <Textarea
                    value={form.descriptionEn}
                    onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
                    placeholder="Dar Tagine (EN)"
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (AR)</Label>
                  <Textarea
                    dir="rtl"
                    value={form.descriptionAr}
                    onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))}
                    placeholder="وصف المحل"
                    rows={3}
                  />
                </div>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="Moroccan, Tagine, Couscous"
                />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <ImageUpload
                  label="Logo"
                  value={form.logoUrl}
                  onChange={(p) => setForm((f) => ({ ...f, logoUrl: p }))}
                  aspect="square"
                />
                <ImageUpload
                  label="Image de couverture"
                  value={form.coverImageUrl}
                  onChange={(p) => setForm((f) => ({ ...f, coverImageUrl: p }))}
                  aspect="wide"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Cover Color (fallback)</Label>
                <div className="flex flex-wrap gap-2">
                  {COVER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-lg transition-transform ${form.coverColor === color ? "scale-125 ring-2 ring-offset-2 ring-foreground" : "hover:scale-110"}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setForm((f) => ({ ...f, coverColor: color }))}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.coverColor}
                    onChange={(e) => setForm((f) => ({ ...f, coverColor: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    title="Custom color"
                  />
                </div>
              </div>
              <div className="col-span-2 border-t pt-4 mt-2 space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  📅 Horaires d'ouverture hebdomadaires (Casablanca Timezone)
                </Label>
                <div className="space-y-2 bg-muted/20 p-3 rounded-lg border">
                  {[
                    { key: "mon", label: "Lundi / الإثنين" },
                    { key: "tue", label: "Mardi / الثلاثاء" },
                    { key: "wed", label: "Mercredi / الأربعاء" },
                    { key: "thu", label: "Jeudi / الخميس" },
                    { key: "fri", label: "Vendredi / الجمعة" },
                    { key: "sat", label: "Samedi / السبت" },
                    { key: "sun", label: "Dimanche / الأحد" },
                  ].map((day) => {
                    const dayConfig = form.openingHours[day.key] || { open: "09:00", close: "23:00", is_closed: false };
                    return (
                      <div key={day.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                        <span className="text-sm font-medium w-36">{day.label}</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!dayConfig.is_closed}
                              onChange={(e) => {
                                const nextHours = { ...form.openingHours };
                                nextHours[day.key] = { ...dayConfig, is_closed: e.target.checked };
                                setForm({ ...form, openingHours: nextHours });
                              }}
                              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                            />
                            Fermé
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={dayConfig.open || "09:00"}
                              disabled={!!dayConfig.is_closed}
                              placeholder="09:00"
                              onChange={(e) => {
                                const nextHours = { ...form.openingHours };
                                nextHours[day.key] = { ...dayConfig, open: e.target.value };
                                setForm({ ...form, openingHours: nextHours });
                              }}
                              className="h-8 w-16 text-center text-xs rounded border border-input bg-background disabled:opacity-50"
                            />
                            <span className="text-xs text-muted-foreground">à</span>
                            <input
                              type="text"
                              value={dayConfig.close || "23:00"}
                              disabled={!!dayConfig.is_closed}
                              placeholder="23:00"
                              onChange={(e) => {
                                const nextHours = { ...form.openingHours };
                                nextHours[day.key] = { ...dayConfig, close: e.target.value };
                                setForm({ ...form, openingHours: nextHours });
                              }}
                              className="h-8 w-16 text-center text-xs rounded border border-input bg-background disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isOpen}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isOpen: v }))}
                />
                <Label>Open now</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))}
                />
                <Label>Featured</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isBusy} className="bg-primary hover:bg-primary/90">
              {isBusy ? "Saving…" : editStore ? "Save Changes" : "Create Store"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Store Reduction Dialog */}
      <Dialog open={!!reductionStore} onOpenChange={() => setReductionStore(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appliquer une réduction — {reductionStore?.name}</DialogTitle>
          </DialogHeader>
          
          {reductionStore && (
            <>
              {/* Notice of existing active promotions */}
              {(reductionStore as any).promo_type === 'store_percentage' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-md mb-2 flex flex-col gap-1">
                  <span className="font-semibold">⚠️ Promotion déjà active</span>
                  <span>Ce magasin a actuellement une réduction globale de <strong>-{(reductionStore as any).reduction_percentage}%</strong> active sur tous ses articles.</span>
                </div>
              )}
              {(reductionStore as any).promo_type === 'store_fixed' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-md mb-2 flex flex-col gap-1">
                  <span className="font-semibold">⚠️ Promotion déjà active</span>
                  <span>Ce magasin a actuellement une réduction globale de <strong>-{(reductionStore as any).reduction_percentage} DH</strong> active sur tous ses articles.</span>
                </div>
              )}
              {(reductionStore as any).promo_type === 'articles' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-md mb-2 flex flex-col gap-1">
                  <span className="font-semibold">⚠️ Promotion déjà active</span>
                  <span>Certains articles de ce magasin possèdent déjà des promotions individuelles spécifiques (Jusqu'à <strong>-{(reductionStore as any).reduction_percentage}%</strong>).</span>
                </div>
              )}
            </>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Type de réduction</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="reductionType"
                    value="percentage"
                    checked={reductionType === 'percentage'}
                    onChange={() => setReductionType('percentage')}
                    className="accent-primary"
                  />
                  Pourcentage (%)
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="reductionType"
                    value="fixed"
                    checked={reductionType === 'fixed'}
                    onChange={() => setReductionType('fixed')}
                    className="accent-primary"
                  />
                  Montant fixe (DH)
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reduction-input">
                {reductionType === 'percentage' ? "Valeur du pourcentage (%)" : "Montant de la réduction (DH)"}
              </Label>
              <Input
                id="reduction-input"
                type="number"
                min="0"
                max={reductionType === 'percentage' ? "100" : undefined}
                value={reductionValue}
                onChange={(e) => setReductionValue(e.target.value)}
                placeholder={reductionType === 'percentage' ? "Ex: 10, 15, 20" : "Ex: 5, 10, 15"}
              />
              <p className="text-xs text-muted-foreground">
                Saisissez <strong>0</strong> pour effacer toutes les réductions de produits (supprimer le prix promo).
              </p>
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
                ⚠️ Cela écrasera et modifiera le prix promotionnel de tous les produits de ce magasin.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReductionStore(null)}>Annuler</Button>
            <Button
              disabled={reductionMut.isPending}
              onClick={() => {
                if (reductionStore) {
                  const val = parseFloat(reductionValue);
                  if (Number.isNaN(val) || val < 0) {
                    toast({ title: "Valeur invalide", description: "Veuillez entrer une valeur positive ou 0", variant: "destructive" });
                    return;
                  }
                  if (reductionType === 'percentage' && val > 100) {
                    toast({ title: "Valeur invalide", description: "Le pourcentage ne peut pas dépasser 100%", variant: "destructive" });
                    return;
                  }
                  reductionMut.mutate({ id: reductionStore.id, type: reductionType, value: val });
                }
              }}
              className="bg-primary hover:bg-primary/90"
            >
              {reductionMut.isPending ? "Application…" : "Appliquer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Store</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? All products will also be removed. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

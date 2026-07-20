import type { Product } from "@/types/admin";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  adminGetStoreProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct,
  adminGetStores, adminGetMenuCategories,
  adminCreateMenuCategory, adminUpdateMenuCategory, adminDeleteMenuCategory,
} from "@/lib/adminApi";
import { ArrowLeft, Plus, Pencil, Trash2, ShoppingBag, ChevronDown, ChevronUp, Grip, Languages, FolderDot } from "lucide-react";

import { ImageUpload } from "@/components/ImageUpload";

type OptionItem = { id: string; name: string; nameEn?: string; nameAr?: string; price: number };
type OptionGroup = {
  id: string;
  name: string;
  nameEn?: string;
  nameAr?: string;
  required: boolean;
  multiple: boolean;
  items: OptionItem[];
};

type ProductForm = {
  name: string; // French name
  nameEn: string; // English name
  nameAr: string; // Arabic name
  description: string; // French description
  descriptionEn: string; // English description
  descriptionAr: string; // Arabic description
  price: string;
  promoPrice: string;
  promoUntil: string;
  categoryTag: string; // references menu_category UUID
  isAvailable: boolean;
  isPopular: boolean;
  optionGroups: OptionGroup[];
  imageUrl: string;
};

const emptyForm = (): ProductForm => ({
  name: "", nameEn: "", nameAr: "", description: "", descriptionEn: "", descriptionAr: "", price: "", promoPrice: "", promoUntil: "", categoryTag: "",
  isAvailable: true, isPopular: false, optionGroups: [], imageUrl: "",
});

type MenuCategory = {
  id: string;
  name: string; // French | English
  name_ar: string;
  sort_order: number;
  is_active: boolean;
};

type MenuCategoryForm = {
  id?: string;
  nameFr: string;
  nameEn: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyCatForm = (): MenuCategoryForm => ({
  nameFr: "", nameEn: "", nameAr: "", sortOrder: 0, isActive: true,
});

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Helpers to split French / English from "name" column
function parseMenuCatName(fullName: string) {
  if (fullName.includes("|")) {
    const parts = fullName.split("|");
    return {
      fr: parts[0].trim(),
      en: parts[1]?.trim() || parts[0].trim(),
    };
  }
  return {
    fr: fullName,
    en: fullName,
  };
}

function formatMenuCatLabel(fullName: string, nameAr: string) {
  const parsed = parseMenuCatName(fullName);
  const arSuffix = nameAr ? ` (${nameAr})` : "";
  if (parsed.fr === parsed.en) {
    return `${parsed.fr}${arSuffix}`;
  }
  return `${parsed.fr} / ${parsed.en}${arSuffix}`;
}

function buildBilingualText(fr: string, en: string) {
  const f = fr.trim();
  const e = en.trim();
  if (!f) return e;
  if (!e || f === e) return f;
  return `${f} | ${e}`;
}


function OptionGroupEditor({
  groups,
  onChange,
}: {
  groups: OptionGroup[];
  onChange: (groups: OptionGroup[]) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function addGroup() {
    const newGroup: OptionGroup = {
      id: uid(),
      name: "",
      nameEn: "",
      nameAr: "",
      required: false,
      multiple: false,
      items: [],
    };
    const next = [...groups, newGroup];
    onChange(next);
    setExpandedId(newGroup.id);
  }

  function removeGroup(id: string) {
    onChange(groups.filter((g) => g.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function updateGroup(id: string, patch: Partial<OptionGroup>) {
    onChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function addItem(groupId: string) {
    updateGroup(groupId, {
      items: [...(groups.find((g) => g.id === groupId)?.items ?? []), { id: uid(), name: "", nameEn: "", nameAr: "", price: 0 }],
    });
  }

  function updateItem(groupId: string, itemId: string, patch: Partial<OptionItem>) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    updateGroup(groupId, {
      items: group.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
    });
  }

  function removeItem(groupId: string, itemId: string) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    updateGroup(groupId, { items: group.items.filter((i) => i.id !== itemId) });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Groupes d'options / Suppléments</Label>
        <Button type="button" size="sm" variant="outline" onClick={addGroup} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Ajouter un groupe
        </Button>
      </div>

      {groups.length === 0 && (
        <div className="text-xs text-muted-foreground border border-dashed rounded-lg p-4 text-center">
          Aucun groupe d'options. Ajoutez des tailles, suppléments, sauces…
        </div>
      )}

      {groups.map((group) => (
        <div key={group.id} className="border rounded-lg overflow-hidden">
          {/* Group header */}
          <div className="flex flex-col gap-2 p-3 bg-muted/40">
            <div className="flex items-center gap-2">
              <Grip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="grid grid-cols-3 gap-2 flex-1">
                <Input
                  value={group.name}
                  onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                  placeholder="Groupe (FR)"
                  className="h-7 text-xs bg-white/80 border px-2"
                />
                <Input
                  value={group.nameEn || ""}
                  onChange={(e) => updateGroup(group.id, { nameEn: e.target.value })}
                  placeholder="Groupe (EN)"
                  className="h-7 text-xs bg-white/80 border px-2"
                />
                <Input
                  dir="rtl"
                  value={group.nameAr || ""}
                  onChange={(e) => updateGroup(group.id, { nameAr: e.target.value })}
                  placeholder="المجموعة (AR)"
                  className="h-7 text-xs bg-white/80 border px-2"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <Switch
                    checked={group.required}
                    onCheckedChange={(v) => updateGroup(group.id, { required: v })}
                    className="scale-75"
                  />
                  Requis
                </label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <Switch
                    checked={group.multiple}
                    onCheckedChange={(v) => updateGroup(group.id, { multiple: v })}
                    className="scale-75"
                  />
                  Multiple
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button" size="icon" variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
                >
                  {expandedId === group.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button
                  type="button" size="icon" variant="ghost"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => removeGroup(group.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Group items */}
          {expandedId === group.id && (
            <div className="px-3 py-2 space-y-2 bg-background">
              {(group.items || []).length === 0 && (
                <p className="text-xs text-muted-foreground py-1">Aucun choix. Ajoutez-en ci-dessous.</p>
              )}
              {(group.items || []).map((item) => (
                <div key={item.id} className="flex flex-col gap-2 p-2 border rounded-md bg-muted/10">
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(group.id, item.id, { name: e.target.value })}
                      placeholder="Choix (FR)"
                      className="h-8 text-xs"
                    />
                    <Input
                      value={item.nameEn || ""}
                      onChange={(e) => updateItem(group.id, item.id, { nameEn: e.target.value })}
                      placeholder="Choix (EN)"
                      className="h-8 text-xs"
                    />
                    <Input
                      dir="rtl"
                      value={item.nameAr || ""}
                      onChange={(e) => updateItem(group.id, item.id, { nameAr: e.target.value })}
                      placeholder="الخيار (AR)"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateItem(group.id, item.id, { price: parseFloat(e.target.value) || 0 })}
                        className="h-8 w-24 text-xs text-right"
                      />
                      <span className="text-[10px] text-muted-foreground shrink-0">DH</span>
                    </div>
                    <Button
                      type="button" size="icon" variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => removeItem(group.id, item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button" size="sm" variant="ghost"
                className="h-7 text-xs w-full border border-dashed mt-1"
                onClick={() => addItem(group.id)}
              >
                <Plus className="h-3 w-3 mr-1" /> Ajouter un choix
              </Button>
            </div>
          )}

          {/* Summary when collapsed */}
          {expandedId !== group.id && (group.items || []).length > 0 && (
            <div className="px-3 py-1.5 flex flex-wrap gap-1">
              {(group.items || []).map((item) => (
                <span key={item.id} className="text-xs bg-muted rounded px-2 py-0.5">
                  {item.name || "—"}
                  {item.price > 0 && <span className="text-muted-foreground ml-1">+{item.price} DH</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Products() {
  const params = useParams<{ storeId: string }>();
  const storeId = params.storeId!;
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [filterCat, setFilterCat] = useState("all");

  // Menu Categories CRUD state
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingMenuCat, setEditingMenuCat] = useState<MenuCategory | null>(null);
  const [catForm, setCatForm] = useState<MenuCategoryForm>(emptyCatForm());

  const { data: stores = [] } = useQuery({ queryKey: ["admin-stores"], queryFn: adminGetStores });
  const store = stores.find((s) => s.id === storeId);

  // Fetch store's actual menu categories (e.g. Burgers, Beverages) from database
  const { data: menuCategories = [], isLoading: catsLoading } = useQuery<MenuCategory[]>({
    queryKey: ["admin-store-menu-categories", storeId],
    queryFn: () => adminGetMenuCategories(storeId),
    enabled: !!storeId,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-store-products", storeId],
    queryFn: () => adminGetStoreProducts(storeId),
    enabled: !!storeId,
    refetchInterval: 30000,
  });

  const activeCategoryIds = Array.from(new Set(products.map((p) => p.category_id).filter(Boolean)));
  const displayed = filterCat === "all" ? products : products.filter((p) => p.category_id === filterCat);

  // Product Mutations
  const createMut = useMutation({
    mutationFn: (data: Parameters<typeof adminCreateProduct>[1]) => adminCreateProduct(storeId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-store-products", storeId] }); setDialogOpen(false); toast({ title: "Produit créé" }); },
    onError: (err: any) => toast({ title: "Erreur lors de la création", description: err.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminUpdateProduct>[1] }) => adminUpdateProduct(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-store-products", storeId] }); setDialogOpen(false); toast({ title: "Produit mis à jour" }); },
    onError: (err: any) => toast({ title: "Erreur lors de la mise à jour", description: err.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: adminDeleteProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-store-products", storeId] }); setDeleteTarget(null); toast({ title: "Produit supprimé" }); },
    onError: (err: any) => toast({ title: "Erreur lors de la suppression", description: err.message, variant: "destructive" }),
  });

  // Menu Category Mutations
  const createCatMut = useMutation({
    mutationFn: (data: Partial<MenuCategory>) => adminCreateMenuCategory(storeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-store-menu-categories", storeId] });
      setCatFormOpen(false);
      toast({ title: "Catégorie créée" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const updateCatMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuCategory> }) => adminUpdateMenuCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-store-menu-categories", storeId] });
      setCatFormOpen(false);
      toast({ title: "Catégorie mise à jour" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const deleteCatMut = useMutation({
    mutationFn: adminDeleteMenuCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-store-menu-categories", storeId] });
      qc.invalidateQueries({ queryKey: ["admin-store-products", storeId] });
      toast({ title: "Catégorie supprimée" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  function openCreate() { setEditProduct(null); setForm(emptyForm()); setDialogOpen(true); }

  function openEdit(product: any) {
    const [nameFr = "", nameEn = ""] = (product.name || "").split("|").map((s: string) => s.trim());
    const [descFr = "", descEn = ""] = (product.description || "").split("|").map((s: string) => s.trim());
    
    // Parse bilingual options
    const parsedOptionGroups = ((product.options || []) as any[]).map((g) => {
      const [gFr = "", gEn = ""] = (g.name || "").split("|").map((s: string) => s.trim());
      return {
        id: g.id || String(Math.random()),
        name: gFr,
        nameEn: gEn,
        nameAr: g.name_ar || "",
        required: !!g.required,
        multiple: !!g.multiple,
        items: (g.items || g.options || []).map((i: any) => {
          const [iFr = "", iEn = ""] = (i.name || "").split("|").map((s: string) => s.trim());
          return {
            id: i.id || String(Math.random()),
            name: iFr,
            nameEn: iEn,
            nameAr: i.name_ar || "",
            price: Number(i.price || i.price_delta || 0),
          };
        }),
      };
    });

    setEditProduct(product);
    setForm({
      name: nameFr,
      nameEn: nameEn,
      nameAr: product.name_ar || "",
      description: descFr,
      descriptionEn: descEn,
      descriptionAr: product.description_ar ?? "",
      price: String(product.price || 0),
      promoPrice: product.promo_price ? String(product.promo_price) : "",
      promoUntil: product.promo_until ? product.promo_until.substring(0, 16) : "",
      categoryTag: product.category_id ?? "",
      isAvailable: !!product.is_available,
      isPopular: !!product.is_popular,
      optionGroups: parsedOptionGroups,
      imageUrl: product.image_url ?? "",
    });
    setDialogOpen(true);
  }

  const toggleAvailable = (p: any) => {
    updateMut.mutate({ id: p.id, data: { is_available: !p.is_available } });
  };

  const togglePopular = (p: any) => {
    updateMut.mutate({ id: p.id, data: { is_popular: !p.is_popular } });
  };

  function handleSubmit() {
    const price = parseFloat(form.price);
    if (!form.description.trim()) { toast({ title: "La description (FR) est requise", variant: "destructive" }); return; }
    if (!form.descriptionEn.trim()) { toast({ title: "La description (EN) est requise", variant: "destructive" }); return; }
    if (!form.descriptionAr.trim()) { toast({ title: "La description (AR) est requise", variant: "destructive" }); return; }
    if (isNaN(price) || price <= 0) { toast({ title: "Prix de base invalide", variant: "destructive" }); return; }

    const combinedName = buildBilingualText(form.name, form.nameEn);
    const combinedDesc = buildBilingualText(form.description, form.descriptionEn);

    const parsedPromoPrice = form.promoPrice.trim() ? parseFloat(form.promoPrice) : null;
    const parsedPromoUntil = form.promoUntil.trim() ? new Date(form.promoUntil).toISOString() : null;

    if (parsedPromoPrice !== null && (isNaN(parsedPromoPrice) || parsedPromoPrice < 0)) {
      toast({ title: "Prix promotionnel invalide", variant: "destructive" });
      return;
    }

    // Map trilingual option groups
    const optionGroupsPayload = form.optionGroups.map((g) => {
      const gFrName = g.name.trim() || g.nameEn?.trim() || "Option";
      const gEnName = g.nameEn?.trim() || "";
      const combinedGroupName = buildBilingualText(gFrName, gEnName);
      
      const mappedItems = g.items.map((i) => {
        const iFrName = i.name.trim() || i.nameEn?.trim() || "Choice";
        const iEnName = i.nameEn?.trim() || "";
        const combinedItemName = buildBilingualText(iFrName, iEnName);
        return {
          id: i.id,
          name: combinedItemName,
          name_ar: i.nameAr?.trim() || iFrName,
          price: Number(i.price),
          price_delta: Number(i.price),
        };
      });
      return {
        id: g.id,
        name: combinedGroupName,
        name_ar: g.nameAr?.trim() || gFrName,
        required: g.required,
        multiple: g.multiple,
        type: g.required ? "required" : "optional", // Compatibility for user app
        items: mappedItems, // Admin editor
        options: mappedItems, // Compatibility for user app options mapping
      };
    });

    const payload = {
      name: combinedName,
      name_ar: form.nameAr.trim() || form.name.trim(),
      description: combinedDesc,
      description_ar: form.descriptionAr.trim() || null,
      price,
      promo_price: parsedPromoPrice,
      promo_until: parsedPromoUntil,
      category_id: form.categoryTag.trim() || null,
      is_available: form.isAvailable,
      is_popular: form.isPopular,
      options: optionGroupsPayload,
      image_url: form.imageUrl || null,
    };

    if (editProduct) updateMut.mutate({ id: editProduct.id, data: payload as any });
    else createMut.mutate(payload as any);
  }

  // Handle Category Submit (joins FR and EN with Pipe '|')
  function handleCatSubmit() {
    if (!catForm.nameFr.trim() && !catForm.nameEn.trim()) {
      toast({ title: "Nom en Français ou Anglais requis", variant: "destructive" });
      return;
    }
    const frName = catForm.nameFr.trim() || catForm.nameEn.trim();
    const enName = catForm.nameEn.trim() || catForm.nameFr.trim();
    const combinedName = `${frName} | ${enName}`;

    const payload: Partial<MenuCategory> = {
      name: combinedName,
      name_ar: catForm.nameAr.trim() || frName,
      sort_order: catForm.sortOrder,
      is_active: catForm.isActive,
    };

    if (editingMenuCat) {
      updateCatMut.mutate({ id: editingMenuCat.id, data: payload });
    } else {
      createCatMut.mutate(payload);
    }
  }

  const isBusy = createMut.isPending || updateMut.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/stores")} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{store ? store.name : "Menu Produits"}</h2>
              <div className="text-muted-foreground mt-0.5">
                {products.length} produit{products.length !== 1 ? "s" : ""}
                {store && (
                  <span className="ml-2">
                    <Badge variant={store.is_open ? "default" : "secondary"} className="text-xs">
                      {store.is_open ? "Ouvert" : "Fermé"}
                    </Badge>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCatManagerOpen(true)}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              <FolderDot className="h-4 w-4" /> Catégories de menu
            </Button>
            <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Nouveau produit
            </Button>
          </div>
        </div>

        {/* Categories tag filter buttons */}
        {activeCategoryIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCat("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filterCat === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/30"
              }`}
            >
              Tous les produits
            </button>
            {activeCategoryIds.map((catId) => {
              const catObj = menuCategories.find((cat) => cat.id === catId);
              const label = catObj ? parseMenuCatName(catObj.name).fr : "Autre";
              return (
                <button
                  key={catId}
                  onClick={() => setFilterCat(catId)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    filterCat === catId
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {isLoading || catsLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Chargement…</div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground border rounded-xl border-dashed">
            <ShoppingBag className="h-12 w-12 opacity-30" />
            <p>Aucun produit dans cette section.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie de Menu</TableHead>
                  <TableHead>Options / Choix</TableHead>
                  <TableHead className="text-right">Prix de base</TableHead>
                  <TableHead className="text-center">Disponible</TableHead>
                  <TableHead className="text-center">Populaire</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((product: any) => {
                  const groups = (product.options as OptionGroup[]) ?? [];
                  const img = product.image_url as string | undefined;
                  const catObj = menuCategories.find((cat) => cat.id === product.category_id);
                  const catLabel = catObj ? formatMenuCatLabel(catObj.name, catObj.name_ar) : "—";
                  
                  return (
                    <TableRow key={product.id} className="hover:bg-muted/30">
                      <TableCell>
                        {img ? (
                          <img src={img.startsWith("http") ? img : `/api/storage${img}`} alt="" className="w-10 h-10 rounded-md object-cover shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">—</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{product.name}</div>
                        {product.name_ar && product.name_ar !== product.name && (
                          <div className="text-xs text-muted-foreground" dir="rtl">{product.name_ar}</div>
                        )}
                        {product.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[220px]">{product.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.category_id ? (
                          <Badge variant="secondary">{catLabel}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {groups.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {groups.map((g) => (
                              <span key={g.id} className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">
                                {g.name}
                                <span className="ml-1 text-primary/60">{(g.items || []).length}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        {product.promo_price ? (
                          <div className="flex flex-col items-end">
                            <span className="text-destructive font-bold">{product.promo_price.toFixed(2)} DH</span>
                            <span className="text-xs text-muted-foreground line-through font-normal">{product.price.toFixed(2)} DH</span>
                            {product.promo_until && (
                              <span className="text-[10px] text-muted-foreground font-normal mt-0.5">
                                Jusqu'au: {new Date(product.promo_until).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>{product.price.toFixed(2)} <span className="text-muted-foreground font-normal text-xs">DH</span></span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={!!product.is_available}
                          onCheckedChange={() => toggleAvailable(product)}
                          disabled={updateMut.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={!!product.is_popular}
                          onCheckedChange={() => togglePopular(product)}
                          disabled={updateMut.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(product)}
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

      {/* Create / Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <ImageUpload
              label="Photo du produit"
              value={form.imageUrl}
              onChange={(p) => setForm((f) => ({ ...f, imageUrl: p }))}
              aspect="square"
            />
            
            {/* Trilingual Names */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Nom (FR) *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Classic Smash Burger"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nom (EN) *</Label>
                <Input
                  value={form.nameEn}
                  onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                  placeholder="Classic Smash Burger"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Nom (AR) * <Languages className="h-3 w-3 text-muted-foreground" /></Label>
                <Input
                  dir="rtl"
                  value={form.nameAr}
                  onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                  placeholder="برجر كلاسيك"
                />
              </div>
            </div>

            {/* Trilingual Descriptions */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Description (FR)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Steak de boeuf, fromage, sauce maison..."
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description (EN)</Label>
                <Textarea
                  value={form.descriptionEn}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
                  placeholder="Beef patty, cheese, homemade sauce..."
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Description (AR) <Languages className="h-3 w-3 text-muted-foreground" /></Label>
                <Textarea
                  dir="rtl"
                  value={form.descriptionAr}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))}
                  placeholder="شريحة لحم بقري، جبنة، صلصة خاصة..."
                  rows={2}
                />
              </div>
            </div>

            {/* Price and Category Select Dropdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prix de base (DH) *</Label>
                <Input
                  type="number" step="0.5"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="55"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Catégorie de Menu</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.categoryTag}
                  onChange={(e) => setForm((f) => ({ ...f, categoryTag: e.target.value }))}
                >
                  <option value="">— Sans catégorie —</option>
                  {menuCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {formatMenuCatLabel(cat.name, cat.name_ar)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Promo Price and Valid Until */}
            <div className="grid grid-cols-2 gap-4 border border-dashed border-primary/30 rounded-lg p-3 bg-primary/5">
              <div className="space-y-1.5">
                <Label className="text-primary font-semibold text-xs sm:text-sm">Prix Promo (DH)</Label>
                <Input
                  type="number" step="0.5"
                  value={form.promoPrice}
                  onChange={(e) => setForm((f) => ({ ...f, promoPrice: e.target.value }))}
                  placeholder="Ex: 39 (Laisser vide si aucun)"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-primary font-semibold text-xs sm:text-sm">Valable jusqu'à</Label>
                <Input
                  type="datetime-local"
                  value={form.promoUntil}
                  onChange={(e) => setForm((f) => ({ ...f, promoUntil: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm((f) => ({ ...f, isAvailable: v }))} />
                <Label>Disponible</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isPopular} onCheckedChange={(v) => setForm((f) => ({ ...f, isPopular: v }))} />
                <Label>Populaire ⭐</Label>
              </div>
            </div>

            <div className="border-t pt-4">
              <OptionGroupEditor
                groups={form.optionGroups}
                onChange={(groups) => setForm((f) => ({ ...f, optionGroups: groups }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={isBusy} className="bg-primary hover:bg-primary/90">
              {isBusy ? "Enregistrement…" : editProduct ? "Sauvegarder" : "Créer le produit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer le produit</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Supprimer définitivement <strong>{deleteTarget?.name}</strong> ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              variant="destructive" disabled={deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              {deleteMut.isPending ? "…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MENU CATEGORIES MANAGER DIALOG --- */}
      <Dialog open={catManagerOpen} onOpenChange={setCatManagerOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Catégories de Menu ({menuCategories.length})</span>
              <Button
                size="sm"
                onClick={() => {
                  setEditingMenuCat(null);
                  setCatForm(emptyCatForm());
                  setCatFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Ajouter
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {menuCategories.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">
                Aucune catégorie de menu configurée pour ce commerce.
              </p>
            ) : (
              <div className="border rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">Ordre</th>
                      <th className="px-3 py-2">Nom (FR / EN)</th>
                      <th className="px-3 py-2">Nom (AR)</th>
                      <th className="px-3 py-2 w-20 text-center">Statut</th>
                      <th className="px-3 py-2 w-20 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuCategories.map((cat) => {
                      const parsed = parseMenuCatName(cat.name);
                      return (
                        <tr key={cat.id} className="border-t hover:bg-muted/10">
                          <td className="px-3 py-2 text-center text-xs font-mono text-muted-foreground">
                            {cat.sort_order}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-xs sm:text-sm">{parsed.fr}</div>
                            {parsed.en !== parsed.fr && (
                              <div className="text-xs text-muted-foreground">{parsed.en}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs sm:text-sm" dir="rtl">
                            {cat.name_ar}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                cat.is_active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {cat.is_active ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => {
                                  const parsedName = parseMenuCatName(cat.name);
                                  setEditingMenuCat(cat);
                                  setCatForm({
                                    nameFr: parsedName.fr,
                                    nameEn: parsedName.en,
                                    nameAr: cat.name_ar,
                                    sortOrder: cat.sort_order,
                                    isActive: !!cat.is_active,
                                  });
                                  setCatFormOpen(true);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (confirm(`Supprimer la catégorie "${parsed.fr}" ?`)) {
                                    deleteCatMut.mutate(cat.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCatManagerOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ADD / EDIT MENU CATEGORY DIALOG (3 LANGUAGES) --- */}
      <Dialog open={catFormOpen} onOpenChange={setCatFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMenuCat ? "Modifier la catégorie de menu" : "Nouvelle catégorie de menu"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nom (Français) *</Label>
              <Input
                value={catForm.nameFr}
                onChange={(e) => setCatForm({ ...catForm, nameFr: e.target.value })}
                placeholder="Ex: Salé"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nom (English / Anglais) *</Label>
              <Input
                value={catForm.nameEn}
                onChange={(e) => setCatForm({ ...catForm, nameEn: e.target.value })}
                placeholder="Ex: Savory"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Nom (Arabe / Arabic) * <Languages className="h-3.5 w-3.5 text-muted-foreground" /></Label>
              <Input
                dir="rtl"
                value={catForm.nameAr}
                onChange={(e) => setCatForm({ ...catForm, nameAr: e.target.value })}
                placeholder="Ex: مملحات"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ordre de tri</Label>
                <Input
                  type="number"
                  value={catForm.sortOrder}
                  onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={catForm.isActive}
                  onCheckedChange={(val) => setCatForm({ ...catForm, isActive: val })}
                />
                <Label>Catégorie active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCatFormOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCatSubmit}
              disabled={createCatMut.isPending || updateCatMut.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {(createCatMut.isPending || updateCatMut.isPending) ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

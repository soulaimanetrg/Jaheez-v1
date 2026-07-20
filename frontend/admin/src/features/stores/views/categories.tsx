import type { Category } from "@/types/admin";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from "@/lib/adminApi";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";


const ICON_OPTIONS = [
  "restaurant", "cart", "medkit", "cube", "briefcase", "fast-food",
  "pizza", "cafe", "beer", "ice-cream", "storefront", "bag",
  "bicycle", "car", "airplane", "home", "heart", "star",
];

type CatForm = { name_ar: string; name_fr: string; type: string; icon_emoji: string; color_hex: string; sort_order: string; is_active: boolean };
const emptyForm = (): CatForm => ({ name_ar: "", name_fr: "", type: "store", icon_emoji: "🏪", color_hex: "#D32F2F", sort_order: "0", is_active: true });

export default function Categories() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState<CatForm>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: cats = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: adminGetCategories,
  });

  const createMut = useMutation({
    mutationFn: adminCreateCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); setDialogOpen(false); toast({ title: "Catégorie créée" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminUpdateCategory>[1] }) => adminUpdateCategory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); setDialogOpen(false); toast({ title: "Catégorie mise à jour" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: adminDeleteCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); setDeleteTarget(null); toast({ title: "Supprimé" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const toggleActive = (cat: any) => updateMut.mutate({ id: cat.id, data: { is_active: !cat.is_active } });

  function openCreate() { setEditCat(null); setForm(emptyForm()); setDialogOpen(true); }
  function openEdit(cat: any) {
    setEditCat(cat);
    setForm({ name_ar: cat.name_ar || "", name_fr: cat.name_fr || "", type: cat.type || "store", icon_emoji: cat.icon_emoji || "", color_hex: cat.color_hex || "#D32F2F", sort_order: String(cat.sort_order || 0), is_active: !!cat.is_active });
    setDialogOpen(true);
  }
  function handleSubmit() {
    if (!form.name_fr.trim() || !form.name_ar.trim() || !form.type) { toast({ title: "Noms et Type requis", variant: "destructive" }); return; }
    const payload = {
      name: form.name_fr.trim(),
      name_ar: form.name_ar.trim(),
      name_fr: form.name_fr.trim(),
      type: form.type,
      icon_emoji: form.icon_emoji,
      color_hex: form.color_hex,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active,
    };
    if (editCat) updateMut.mutate({ id: editCat.id, data: payload });
    else createMut.mutate(payload);
  }

  const sorted = [...cats].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
            <p className="text-muted-foreground mt-1">Manage app service categories shown to users</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New Category
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground border rounded-xl border-dashed">
            <Tag className="h-12 w-12 opacity-30" />
            <p>No categories yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10">Order</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((cat: any) => (
                  <TableRow key={cat.id} className="hover:bg-muted/30">
                    <TableCell className="text-center font-mono text-sm text-muted-foreground">{cat.sort_order || 0}</TableCell>
                    <TableCell>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                        style={{ backgroundColor: `${cat.color_hex}20`, color: cat.color_hex }}
                      >
                        {cat.icon_emoji || "◆"}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{cat.name_fr} <span className="text-muted-foreground font-normal text-sm">({cat.name_ar})</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">{cat.type}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={!!cat.is_active} onCheckedChange={() => toggleActive(cat)} disabled={updateMut.isPending} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(cat)}>
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editCat ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nom (FR) *</Label>
              <Input value={form.name_fr} onChange={(e) => setForm((f) => ({ ...f, name_fr: e.target.value }))} placeholder="Restaurants" />
            </div>
            <div className="space-y-1.5">
              <Label>Nom (AR) *</Label>
              <Input value={form.name_ar} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} placeholder="مطاعم" />
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="service">Service</option>
                <option value="store">Store</option>
                <option value="product">Product</option>
                <option value="errand">Errand</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Icon Emoji</Label>
              <Input value={form.icon_emoji} onChange={(e) => setForm((f) => ({ ...f, icon_emoji: e.target.value }))} placeholder="🏪" />
            </div>
            <div className="space-y-1.5">
              <Label>Couleur (Hex)</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color_hex} onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                <Input value={form.color_hex} onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))} className="font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Order (lower = first)</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <Label>Active (visible in app)</Label>
            </div>
            {/* Preview */}
            <div className="rounded-lg border p-3 flex items-center gap-3 bg-muted/30">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${form.color_hex}20`, color: form.color_hex }}>
                {form.icon_emoji || "◆"}
              </div>
              <div>
                <p className="text-sm font-semibold">{form.name_fr || "Preview"} <span className="text-muted-foreground font-normal">({form.name_ar})</span></p>
                <p className="text-xs text-muted-foreground font-mono">{form.type}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="bg-primary hover:bg-primary/90">
              {createMut.isPending || updateMut.isPending ? "Saving…" : editCat ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Category</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete <strong>{deleteTarget?.name}</strong>? Stores using this category ID will still work but the category won't appear in the app.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}>
              {deleteMut.isPending ? "…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

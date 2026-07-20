import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import { adminGetPromotions, adminCreatePromotion, adminUpdatePromotion, adminDeletePromotion, apiBanners } from "@/lib/adminApi";
import { Plus, Pencil, Trash2, Megaphone, Tag, Percent, Image as ImageIcon } from "lucide-react";


type PromoForm = {
  title_ar: string;
  code: string;
  discount_type: string;
  discount_value: string;
  min_order_dh: string;
  max_uses: string;
  start_at: string;
  end_at: string;
  is_active: boolean;
  store_id: string;
};

type BannerRow = {
  id: string;
  title_ar: string;
  subtitle_ar?: string | null;
  image_url?: string | null;
  link_type?: string | null;
  link_value?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
};

type BannerForm = {
  title_ar: string;
  subtitle_ar: string;
  image_url: string;
  link_type: string;
  link_value: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm = (): PromoForm => ({
  title_ar: "",
  code: "",
  discount_type: "percentage",
  discount_value: "10",
  min_order_dh: "0",
  max_uses: "",
  start_at: new Date().toISOString().slice(0, 16),
  end_at: "",
  is_active: true,
  store_id: "",
});

const emptyBannerForm = (): BannerForm => ({
  title_ar: "",
  subtitle_ar: "",
  image_url: "",
  link_type: "none",
  link_value: "",
  sort_order: "0",
  is_active: true,
});

function formatDiscount(type: string, value: number): string {
  if (type === "percentage") return `${value}%`;
  return `${Number(value || 0).toFixed(2)} DH`;
}

export default function Promotions() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPromo, setEditPromo] = useState<any | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<BannerRow | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerForm>(emptyBannerForm());
  const [deleteBannerTarget, setDeleteBannerTarget] = useState<BannerRow | null>(null);

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: adminGetPromotions,
  });
  const { data: banners = [], isLoading: bannersLoading } = useQuery<BannerRow[]>({
    queryKey: ["admin-banners"],
    queryFn: () => apiBanners.list(),
  });

  const createMut = useMutation({
    mutationFn: adminCreatePromotion,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-promotions"] }); setDialogOpen(false); toast({ title: "Promotion créée" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminUpdatePromotion(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-promotions"] }); setDialogOpen(false); toast({ title: "Promotion mise à jour" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: adminDeletePromotion,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-promotions"] }); setDeleteTarget(null); toast({ title: "Supprimé" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });
  const createBannerMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiBanners.create(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-banners"] }); setBannerDialogOpen(false); toast({ title: "Bannière créée" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });
  const updateBannerMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => apiBanners.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-banners"] }); setBannerDialogOpen(false); toast({ title: "Bannière mise à jour" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });
  const deleteBannerMut = useMutation({
    mutationFn: (id: string) => apiBanners.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-banners"] }); setDeleteBannerTarget(null); toast({ title: "Bannière supprimée" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const toggleActive = (p: any) => updateMut.mutate({ id: p.id, data: { is_active: !p.is_active } });
  const toggleBannerActive = (banner: BannerRow) => updateBannerMut.mutate({ id: banner.id, data: { is_active: !banner.is_active } });

  function openCreate() { setEditPromo(null); setForm(emptyForm()); setDialogOpen(true); }
  function openEdit(p: any) {
    setEditPromo(p);
    setForm({
      title_ar: p.title_ar || "",
      code: p.code || "",
      discount_type: p.discount_type || "percentage",
      discount_value: String(p.discount_value || 10),
      min_order_dh: String(Number(p.min_order_dh || 0)),
      max_uses: p.max_uses ? String(p.max_uses) : "",
      start_at: p.start_at ? new Date(p.start_at).toISOString().slice(0, 16) : "",
      end_at: p.end_at ? new Date(p.end_at).toISOString().slice(0, 16) : "",
      is_active: !!p.is_active,
      store_id: p.store_id || "",
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.title_ar.trim()) { toast({ title: "Titre requis", variant: "destructive" }); return; }
    const payload: Record<string, unknown> = {
      title_ar: form.title_ar.trim(),
      code: form.code.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) || 0,
      min_order_dh: Number(form.min_order_dh) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      start_at: form.start_at || null,
      end_at: form.end_at || null,
      is_active: form.is_active,
      store_id: form.store_id || null,
    };
    if (editPromo) updateMut.mutate({ id: editPromo.id, data: payload });
    else createMut.mutate(payload as any);
  }

  function openCreateBanner() {
    setEditBanner(null);
    setBannerForm(emptyBannerForm());
    setBannerDialogOpen(true);
  }

  function openEditBanner(banner: BannerRow) {
    setEditBanner(banner);
    setBannerForm({
      title_ar: banner.title_ar || "",
      subtitle_ar: banner.subtitle_ar || "",
      image_url: banner.image_url || "",
      link_type: banner.link_type || "none",
      link_value: banner.link_value || "",
      sort_order: String(banner.sort_order ?? 0),
      is_active: !!banner.is_active,
    });
    setBannerDialogOpen(true);
  }

  function handleBannerSubmit() {
    if (!bannerForm.title_ar.trim()) { toast({ title: "Titre requis", variant: "destructive" }); return; }
    if (!bannerForm.image_url.trim()) { toast({ title: "Image requise", variant: "destructive" }); return; }
    const payload: Record<string, unknown> = {
      title_ar: bannerForm.title_ar.trim(),
      subtitle_ar: bannerForm.subtitle_ar.trim() || null,
      image_url: bannerForm.image_url.trim(),
      link_type: bannerForm.link_type,
      link_value: bannerForm.link_type === "none" ? null : bannerForm.link_value.trim() || null,
      sort_order: Number(bannerForm.sort_order) || 0,
      is_active: bannerForm.is_active,
    };
    if (editBanner) updateBannerMut.mutate({ id: editBanner.id, data: payload });
    else createBannerMut.mutate(payload);
  }

  const activeCount = promos.filter((p: any) => p.is_active).length;
  const activeBannerCount = banners.filter((banner) => banner.is_active).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Promotions & Codes Promo</h2>
            <p className="text-muted-foreground mt-1">
              {promos.length} promotion{promos.length !== 1 ? "s" : ""} · {activeCount} active{activeCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nouvelle Promotion
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Chargement…</div>
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground border rounded-xl border-dashed">
            <Megaphone className="h-12 w-12 opacity-30" />
            <p>Aucune promotion. Créez votre première.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Titre</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Remise</TableHead>
                  <TableHead>Min. commande</TableHead>
                  <TableHead>Utilisations</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Magasin</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.map((promo: any) => (
                  <TableRow key={promo.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold">{promo.title_ar}</TableCell>
                    <TableCell>
                      {promo.code ? (
                        <Badge variant="outline" className="font-mono text-xs">{promo.code}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Auto</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {promo.discount_type === "percentage" ? (
                          <Percent className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Tag className="h-3.5 w-3.5 text-blue-600" />
                        )}
                        <span className="font-semibold">{formatDiscount(promo.discount_type, promo.discount_value)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {promo.min_order_dh ? `${Number(promo.min_order_dh).toFixed(0)} DH` : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {promo.uses_count ?? 0}{promo.max_uses ? ` / ${promo.max_uses}` : ""}
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!promo.is_active} onCheckedChange={() => toggleActive(promo)} disabled={updateMut.isPending} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {promo.store_name || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(promo)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(promo)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="space-y-4 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Bannières accueil</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {banners.length} bannière{banners.length !== 1 ? "s" : ""} · {activeBannerCount} active{activeBannerCount !== 1 ? "s" : ""} · toutes tailles acceptées · conseillé 700 × 500
              </p>
            </div>
            <Button onClick={openCreateBanner} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Nouvelle bannière
            </Button>
          </div>

          {bannersLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">Chargement…</div>
          ) : banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 gap-3 text-muted-foreground border rounded-xl border-dashed">
              <ImageIcon className="h-10 w-10 opacity-30" />
              <p>Aucune bannière. Ajoutez une image pour le carousel accueil.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {banners.map((banner) => (
                <div key={banner.id} className="grid gap-4 rounded-lg border p-3 md:grid-cols-[220px_1fr_auto] md:items-center">
                  <div className="aspect-[700/500] overflow-hidden rounded-md bg-muted">
                    {banner.image_url ? (
                      <img src={banner.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{banner.title_ar}</p>
                      {banner.is_active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{banner.subtitle_ar || "Sans sous-titre"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Lien: {banner.link_type || "none"}{banner.link_value ? ` · ${banner.link_value}` : ""} · Ordre {banner.sort_order ?? 0}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Switch checked={!!banner.is_active} onCheckedChange={() => toggleBannerActive(banner)} disabled={updateBannerMut.isPending} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditBanner(banner)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteBannerTarget(banner)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editPromo ? "Modifier la Promotion" : "Nouvelle Promotion"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Titre (AR) *</Label>
              <Input value={form.title_ar} onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))} placeholder="خصم الصيف" />
            </div>
            <div className="space-y-1.5">
              <Label>Code Promo</Label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" className="font-mono" />
              <p className="text-xs text-muted-foreground">Laissez vide pour une promotion automatique</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type de remise</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.discount_type}
                  onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
                >
                  <option value="percentage">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (DH)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Valeur de remise</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))} placeholder="10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Min. commande (DH)</Label>
                <Input type="number" step="0.01" value={form.min_order_dh} onChange={(e) => setForm((f) => ({ ...f, min_order_dh: e.target.value }))} placeholder="50.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Utilisations max</Label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} placeholder="Illimité" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Début</Label>
                <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Fin (optionnel)</Label>
                <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="bg-primary hover:bg-primary/90">
              {createMut.isPending || updateMut.isPending ? "Enregistrement…" : editPromo ? "Sauvegarder" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer la promotion</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Supprimer définitivement <strong>{deleteTarget?.title_ar}</strong> {deleteTarget?.code ? `(${deleteTarget.code})` : ""} ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}>
              {deleteMut.isPending ? "…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editBanner ? "Modifier la bannière" : "Nouvelle bannière accueil"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <ImageUpload
              value={bannerForm.image_url}
              onChange={(imageUrl) => setBannerForm((f) => ({ ...f, image_url: imageUrl }))}
              label="Image bannière *"
              aspect="wide"
              folder="banners"
            />
            <p className="text-xs text-muted-foreground">Toutes tailles sont acceptées. Conseil design: 700 × 500 pour éviter un cadrage trop coupé dans l'app mobile.</p>

            <div className="space-y-1.5">
              <Label>Titre *</Label>
              <Input value={bannerForm.title_ar} onChange={(e) => setBannerForm((f) => ({ ...f, title_ar: e.target.value }))} placeholder="Offre du jour" />
            </div>
            <div className="space-y-1.5">
              <Label>Sous-titre</Label>
              <Input value={bannerForm.subtitle_ar} onChange={(e) => setBannerForm((f) => ({ ...f, subtitle_ar: e.target.value }))} placeholder="Optionnel" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type de lien</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={bannerForm.link_type}
                  onChange={(e) => setBannerForm((f) => ({ ...f, link_type: e.target.value }))}
                >
                  <option value="none">Aucun</option>
                  <option value="store">Magasin</option>
                  <option value="category">Catégorie</option>
                  <option value="search">Recherche</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Valeur du lien</Label>
                <Input
                  value={bannerForm.link_value}
                  onChange={(e) => setBannerForm((f) => ({ ...f, link_value: e.target.value }))}
                  placeholder="ID magasin, ID catégorie ou texte"
                  disabled={bannerForm.link_type === "none"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ordre</Label>
                <Input type="number" value={bannerForm.sort_order} onChange={(e) => setBannerForm((f) => ({ ...f, sort_order: e.target.value }))} />
              </div>
              <div className="flex items-end gap-3 pb-2">
                <Switch checked={bannerForm.is_active} onCheckedChange={(v) => setBannerForm((f) => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBannerDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleBannerSubmit} disabled={createBannerMut.isPending || updateBannerMut.isPending} className="bg-primary hover:bg-primary/90">
              {createBannerMut.isPending || updateBannerMut.isPending ? "Enregistrement…" : editBanner ? "Sauvegarder" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteBannerTarget} onOpenChange={() => setDeleteBannerTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer la bannière</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Supprimer définitivement <strong>{deleteBannerTarget?.title_ar}</strong> ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBannerTarget(null)}>Annuler</Button>
            <Button variant="destructive" disabled={deleteBannerMut.isPending} onClick={() => deleteBannerTarget && deleteBannerMut.mutate(deleteBannerTarget.id)}>
              {deleteBannerMut.isPending ? "…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

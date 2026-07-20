import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2, Loader2, FileText } from "lucide-react";
import { getAdminToken } from "@/lib/adminApi";

const API_BASE = "";

type ContentType = "faq" | "terms" | "privacy" | "about";

type ContentRow = {
  slug: string;
  type: ContentType;
  titleFr: string;
  titleAr: string;
  bodyFr: string;
  bodyAr: string;
  position: number;
  isActive: boolean;
  updatedAt: string;
};

type FormState = {
  slug: string;
  type: ContentType;
  titleFr: string;
  titleAr: string;
  bodyFr: string;
  bodyAr: string;
  position: number;
  isActive: boolean;
};

const TYPE_LABELS: Record<ContentType, string> = {
  faq: "FAQ",
  terms: "CGU",
  privacy: "Confidentialité",
  about: "À propos",
};

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

export default function AppContentPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<ContentType>("faq");
  const [open, setOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm("faq"));

  const rowsQuery = useQuery({
    queryKey: ["admin-content", tab],
    queryFn: () => jsonFetch<ContentRow[]>(`/admin-api/content?type=${tab}`),
  });

  const upsert = useMutation({
    mutationFn: async (data: FormState) => {
      if (editingSlug) {
        return jsonFetch<ContentRow>(`/admin-api/content/${encodeURIComponent(editingSlug)}`, {
          method: "PATCH",
          body: JSON.stringify({
            titleFr: data.titleFr, titleAr: data.titleAr,
            bodyFr: data.bodyFr, bodyAr: data.bodyAr,
            position: data.position, isActive: data.isActive,
          }),
        });
      }
      return jsonFetch<ContentRow>(`/admin-api/content`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-content"] });
      setOpen(false);
      setEditingSlug(null);
      toast({ title: "Enregistré" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (slug: string) => jsonFetch<{ message: string }>(`/admin-api/content/${encodeURIComponent(slug)}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-content"] });
      toast({ title: "Supprimé" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  function openCreate() {
    setEditingSlug(null);
    setForm(emptyForm(tab));
    setOpen(true);
  }

  function openEdit(row: ContentRow) {
    setEditingSlug(row.slug);
    setForm({
      slug: row.slug, type: row.type,
      titleFr: row.titleFr, titleAr: row.titleAr,
      bodyFr: row.bodyFr, bodyAr: row.bodyAr,
      position: row.position, isActive: row.isActive,
    });
    setOpen(true);
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Contenu de l'application</h1>
            <p className="text-sm text-muted-foreground">FAQ, CGU, Confidentialité, À propos — bilingue FR / AR.</p>
          </div>
          <Button onClick={openCreate} data-testid="btn-create-content">
            <Plus className="mr-2 h-4 w-4" /> Nouveau
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as ContentType)}>
          <TabsList>
            {(["faq", "terms", "privacy", "about"] as const).map((t) => (
              <TabsTrigger key={t} value={t} data-testid={`tab-${t}`}>{TYPE_LABELS[t]}</TabsTrigger>
            ))}
          </TabsList>

          {(["faq", "terms", "privacy", "about"] as const).map((t) => (
            <TabsContent key={t} value={t} className="mt-4">
              {rowsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</div>
              ) : !rowsQuery.data?.length ? (
                <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                  <FileText className="mx-auto h-8 w-8 mb-2" />
                  Aucun contenu — cliquez sur « Nouveau » pour en créer.
                </div>
              ) : (
                <div className="space-y-2">
                  {rowsQuery.data.map((row) => (
                    <div key={row.slug} className="flex items-start gap-3 rounded-md border p-3" data-testid={`content-row-${row.slug}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{row.titleFr}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{row.slug}</span>
                          {!row.isActive && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Désactivé</span>}
                        </div>
                        {row.titleAr && <div className="text-sm text-muted-foreground" dir="rtl">{row.titleAr}</div>}
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.bodyFr}</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(row)} data-testid={`btn-edit-${row.slug}`}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Supprimer « ${row.titleFr} » ?`)) remove.mutate(row.slug); }} data-testid={`btn-delete-${row.slug}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlug ? "Modifier" : "Nouveau contenu"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {!editingSlug && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Slug (identifiant unique)</Label>
                    <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ex: how-to-order" data-testid="input-slug" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as ContentType })} data-testid="select-type">
                      {(["faq", "terms", "privacy", "about"] as const).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div>
                <Label>Titre (FR)</Label>
                <Input value={form.titleFr} onChange={(e) => setForm({ ...form, titleFr: e.target.value })} data-testid="input-title-fr" />
              </div>
              <div>
                <Label>Titre (AR)</Label>
                <Input dir="rtl" value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} data-testid="input-title-ar" />
              </div>
              <div>
                <Label>Contenu (FR)</Label>
                <Textarea rows={6} value={form.bodyFr} onChange={(e) => setForm({ ...form, bodyFr: e.target.value })} data-testid="textarea-body-fr" />
              </div>
              <div>
                <Label>Contenu (AR)</Label>
                <Textarea rows={6} dir="rtl" value={form.bodyAr} onChange={(e) => setForm({ ...form, bodyAr: e.target.value })} data-testid="textarea-body-ar" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ordre d'affichage</Label>
                  <Input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) || 0 })} data-testid="input-position" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} data-testid="switch-active" />
                  <Label>Actif</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending} data-testid="btn-save-content">
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

function emptyForm(type: ContentType): FormState {
  return { slug: "", type, titleFr: "", titleAr: "", bodyFr: "", bodyAr: "", position: 0, isActive: true };
}

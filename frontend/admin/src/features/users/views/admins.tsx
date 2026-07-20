import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/adminApi";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  Plus, Pencil, Trash2, ShieldCheck, Eye, EyeOff, KeyRound,
  RefreshCw, ShieldAlert,
} from "lucide-react";

type AdminAccount = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminForm = {
  email: string;
  name: string;
  password: string;
  role: string;
};

const emptyForm = (): AdminForm => ({ email: "", name: "", password: "", role: "support" });

function normalizeAdmin(admin: any): AdminAccount {
  return {
    id: String(admin.id ?? ""),
    email: String(admin.email ?? ""),
    name: String(admin.name ?? admin.full_name ?? ""),
    role: String(admin.role ?? "support"),
    isActive: Boolean(admin.isActive ?? admin.is_active ?? true),
    createdAt: String(admin.createdAt ?? admin.created_at ?? ""),
    updatedAt: String(admin.updatedAt ?? admin.updated_at ?? ""),
  };
}

const ROLE_MAP: Record<string, { label: string; cls: string }> = {
  super_admin:     { label: "Super Admin", cls: "bg-primary/10 text-primary" },
  operations:      { label: "Opérations",  cls: "bg-blue-100 text-blue-800" },
  finance:         { label: "Finance",     cls: "bg-emerald-100 text-emerald-800" },
  support:         { label: "Support",     cls: "bg-amber-100 text-amber-800" },
  content_manager: { label: "Contenu",     cls: "bg-violet-100 text-violet-800" },
  admin:           { label: "Admin (legacy)", cls: "bg-gray-200 text-gray-800" },
};

export default function Admins() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const currentAdmin = useAuthStore((s) => s.user);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);
  const [tokenTarget, setTokenTarget] = useState<AdminAccount | null>(null);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<AdminForm>(emptyForm());

  const { data: admins = [], isLoading } = useQuery<AdminAccount[]>({
    queryKey: ["admin-accounts"],
    queryFn: async () => {
      const data = await apiRequest<any[]>("/admins");
      return (data || []).map(normalizeAdmin);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-accounts"] });

  const createMut = useMutation({
    mutationFn: (data: AdminForm) =>
      apiRequest("/admins", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      toast({ title: "Admin créé avec succès" });
    },
    onError: (err: Error) =>
      toast({ title: err.message ?? "Erreur", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminForm & { isActive: boolean }> }) =>
      apiRequest(`/admins/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      toast({ title: "Admin mis à jour" });
    },
    onError: (err: Error) =>
      toast({ title: err.message ?? "Erreur", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/admins/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast({ title: "Admin supprimé" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const resetTokenMut = useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ token: string }>(`/admins/${id}/reset-token`, { method: "POST" }),
    onSuccess: (data: { token: string }) => {
      invalidate();
      setRevealedToken(data.token);
      toast({ title: "Token réinitialisé" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setShowPassword(false);
    setDialogOpen(true);
  }

  function openEdit(a: AdminAccount) {
    setEditTarget(a);
    setForm({ email: a.email, name: a.name, password: "", role: a.role });
    setShowPassword(false);
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.email.trim()) {
      toast({ title: "Email requis", variant: "destructive" });
      return;
    }
    if (!form.name.trim()) {
      toast({ title: "Nom complet requis", variant: "destructive" });
      return;
    }
    if (!editTarget && !form.password.trim()) {
      toast({ title: "Mot de passe requis pour un nouvel admin", variant: "destructive" });
      return;
    }
    if (editTarget) {
      const isEditingSelf = editTarget.id === currentAdmin?.id || editTarget.email === currentAdmin?.email;
      const payload: Record<string, unknown> = {
        full_name: form.name.trim(),
      };
      if (!isEditingSelf) payload.role = form.role;
      if (form.password.trim()) payload.password = form.password;
      updateMut.mutate({ id: editTarget.id, data: payload as any });
    } else {
      createMut.mutate({ ...form, email: form.email.trim(), name: form.name.trim() });
    }
  }

  const rootAdminEntry = {
    id: "root",
    email: "admin@jaheez.ma",
    name: "Root Admin",
    role: "super_admin",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  } as AdminAccount;

  const allAdmins = [rootAdminEntry, ...admins];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Admin Accounts</h2>
            <p className="text-muted-foreground mt-0.5">
              {allAdmins.length} compte{allAdmins.length !== 1 ? "s" : ""}
              {admins.filter((a) => !a.isActive).length > 0 && (
                <span className="ml-2 text-destructive font-semibold">
                  · {admins.filter((a) => !a.isActive).length} désactivé{admins.filter((a) => !a.isActive).length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nouvel admin
          </Button>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Chargement…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Admin</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allAdmins.map((admin) => {
                  const isRoot = admin.id === "root";
                  const isSelf = admin.id === currentAdmin?.id || admin.email === currentAdmin?.email;
                  const role = ROLE_MAP[admin.role] ?? ROLE_MAP["admin"];
                  return (
                    <TableRow key={admin.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-semibold">{admin.name || admin.email.split("@")[0]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{admin.email}</TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${role.cls}`}>
                          {role.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {admin.isActive ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Actif</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Désactivé</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {isRoot
                          ? <span className="italic text-muted-foreground/60">Système</span>
                          : new Date(admin.createdAt).toLocaleDateString("fr-MA")}
                      </TableCell>
                      <TableCell className="text-right">
                        {isRoot ? (
                          <span className="text-xs text-muted-foreground italic">Protégé</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {!isSelf && (
                              <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Réinitialiser le token"
                              onClick={() => { setTokenTarget(admin); setRevealedToken(null); }}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={admin.isActive ? "Désactiver" : "Activer"}
                              onClick={() => updateMut.mutate({ id: admin.id, data: { isActive: !admin.isActive } })}
                            >
                              {admin.isActive
                                ? <ShieldAlert className="h-4 w-4 text-yellow-600" />
                                : <ShieldCheck className="h-4 w-4 text-green-600" />}
                            </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(admin)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {!isSelf && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(admin)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Modifier l'admin" : "Nouvel admin"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nom complet</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Youssef El Amrani"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="admin@jaheez.ma"
                disabled={!!editTarget}
                className={editTarget ? "opacity-60" : ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{editTarget ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={editTarget ? "Laisser vide pour conserver" : "Minimum 8 caractères"}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                disabled={!!editTarget && (editTarget.id === currentAdmin?.id || editTarget.email === currentAdmin?.email)}
              >
                <option value="support">Support</option>
                <option value="content_manager">Contenu</option>
                <option value="operations">Opérations</option>
                <option value="finance">Finance</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createMut.isPending || updateMut.isPending ? "Enregistrement…" : editTarget ? "Sauvegarder" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer l'admin</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Supprimer définitivement le compte admin <strong>{deleteTarget?.email}</strong> ?
            <br />
            Cette action est irréversible et révoquera immédiatement l'accès.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              {deleteMut.isPending ? "…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Token Dialog */}
      <Dialog open={!!tokenTarget} onOpenChange={() => { setTokenTarget(null); setRevealedToken(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Token d'accès</DialogTitle></DialogHeader>
          {revealedToken ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Nouveau token généré. Copiez-le maintenant — il ne sera plus visible.
              </p>
              <div className="bg-muted rounded-lg p-3 font-mono text-xs break-all select-all border border-dashed">
                {revealedToken}
              </div>
              <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                Partagez ce token uniquement avec l'admin concerné. Il permet un accès complet au panneau d'administration.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Réinitialiser le token d'accès de <strong>{tokenTarget?.email}</strong> ?
                <br />
                L'ancien token sera immédiatement révoqué.
              </p>
            </div>
          )}
          <DialogFooter>
            {revealedToken ? (
              <Button onClick={() => { setTokenTarget(null); setRevealedToken(null); }}>Fermer</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setTokenTarget(null)}>Annuler</Button>
                <Button
                  disabled={resetTokenMut.isPending}
                  className="gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => tokenTarget && resetTokenMut.mutate(tokenTarget.id)}
                >
                  <RefreshCw className="h-4 w-4" />
                  {resetTokenMut.isPending ? "…" : "Réinitialiser"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

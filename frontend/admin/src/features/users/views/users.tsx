import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { adminUpdateUser, adminGetUserOrders, adminDeleteUser } from "@/lib/adminApi";
import { apiRequest } from "@/lib/adminApi";
import {
  Search, Users as UsersIcon, ShoppingBag, Ban, CheckCircle,
  MapPin, Phone, Calendar, TrendingUp, Clock, Package, Trash2,
} from "lucide-react";

type Address = {
  id: string; userId: string; label: string; address: string; isDefault: boolean; createdAt: string;
};

type EnrichedUser = {
  id: string; phone: string; full_name: string; is_banned: boolean; created_at: string;
  orderCount: number; totalSpent: number; lastOrderAt: string | null;
  addressCount: number; primaryAddress: string | null; addresses: Address[]; city?: string;
  [key: string]: unknown;
};

type OrderItem = { productName: string; quantity: number; price: number };
type UserOrder = {
  id: string; storeName: string; status: string; total: number; paymentMethod: string;
  createdAt: string; items: OrderItem[]; address: string;
};

const STATUS_COLORS: Record<string, string> = {
  delivered:   "bg-green-100 text-green-800",
  on_the_way:  "bg-blue-100 text-blue-800",
  picked_up:   "bg-blue-100 text-blue-800",
  preparing:   "bg-yellow-100 text-yellow-800",
  assigned:    "bg-yellow-100 text-yellow-800",
  confirmed:   "bg-purple-100 text-purple-800",
  cancelled:   "bg-red-100 text-red-800",
  pending:     "bg-gray-100 text-gray-700",
};

const STATUS_LABELS: Record<string, string> = {
  delivered: "Livré", on_the_way: "En route", picked_up: "Récupéré",
  preparing: "En préparation", assigned: "Assigné", confirmed: "Confirmé",
  cancelled: "Annulé", pending: "En attente",
};

const PM_LABELS: Record<string, string> = {
  cash_on_delivery: "Espèces", card: "Carte", wallet: "Portefeuille",
};

function UserAvatar({ name, phone }: { name?: string | null; phone?: string | null }) {
  const safeName = (name || "").trim();
  const safePhone = (phone || "").trim();
  const initials = safeName
    ? safeName.split(" ").map((p) => p[0]?.toUpperCase()).slice(0, 2).join("")
    : safePhone ? safePhone.slice(-2) : "?";
  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
      {initials}
    </div>
  );
}

export default function Users() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailUser, setDetailUser] = useState<EnrichedUser | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "addresses">("orders");
  const [deleteTarget, setDeleteTarget] = useState<EnrichedUser | null>(null);

  const { data: users = [], isLoading } = useQuery<EnrichedUser[]>({
    queryKey: ["admin-users", search],
    queryFn: () => apiRequest(`/users${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    refetchInterval: 30000,
  });

  const { data: userOrders = [], isLoading: ordersLoading } = useQuery<UserOrder[]>({
    queryKey: ["admin-user-orders", detailUser?.id],
    queryFn: () => adminGetUserOrders(detailUser!.id) as Promise<UserOrder[]>,
    enabled: !!detailUser,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { is_banned?: boolean } }) =>
      adminUpdateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Utilisateur mis à jour" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminDeleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteTarget(null);
      toast({ title: "Utilisateur supprimé" });
    },
    onError: () => toast({ title: "Erreur lors de la suppression", variant: "destructive" }),
  });

  const activeCount = users.filter((u) => !u.is_banned).length;
  const suspendedCount = users.filter((u) => u.is_banned).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground mt-0.5">
              {users.length} utilisateur{users.length !== 1 ? "s" : ""}
              {suspendedCount > 0 && (
                <span className="ml-2 text-destructive font-semibold">· {suspendedCount} suspendu{suspendedCount !== 1 ? "s" : ""}</span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-card border rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-black text-green-600">{activeCount}</div>
              <div className="text-xs text-muted-foreground">Actifs</div>
            </div>
            <div className="bg-card border rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-black tabular-nums">
                {users.reduce((s, u) => s + (u.totalSpent ?? 0), 0).toFixed(0)} DH
              </div>
              <div className="text-xs text-muted-foreground">Total dépensé</div>
            </div>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher par nom ou téléphone…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Chargement…</div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground border rounded-xl border-dashed">
            <UsersIcon className="h-12 w-12 opacity-30" />
            <p>Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Commandes</TableHead>
                  <TableHead className="text-right">Total dépensé</TableHead>
                  <TableHead>Dernière commande</TableHead>
                  <TableHead>Adresse principale</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => { setDetailUser(user); setActiveTab("orders"); }}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={user.full_name} phone={user.phone} />
                        <span className="font-semibold">{user.full_name || <span className="text-muted-foreground italic">Sans nom</span>}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.phone}</TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge variant="destructive" className="text-xs">Suspendu</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Actif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {user.orderCount}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {(user.totalSpent ?? 0).toFixed(2)}
                      <span className="text-xs text-muted-foreground font-normal ml-1">DH</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastOrderAt
                        ? new Date(user.lastOrderAt).toLocaleDateString("fr-MA")
                        : <span className="italic">—</span>}
                    </TableCell>
                    <TableCell className="text-sm max-w-[180px]">
                      {user.primaryAddress
                        ? <span className="truncate block text-muted-foreground">{user.primaryAddress}</span>
                        : <span className="text-muted-foreground italic">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(user.created_at || new Date()).toLocaleDateString("fr-MA")}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {user.is_banned ? (
                          <Button variant="ghost" size="sm"
                            className="h-8 gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50"
                            disabled={updateMut.isPending}
                            onClick={() => updateMut.mutate({ id: user.id, data: { is_banned: false } })}>
                            <CheckCircle className="h-3.5 w-3.5" /> Activer
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm"
                            className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={updateMut.isPending}
                            onClick={() => updateMut.mutate({ id: user.id, data: { is_banned: true } })}>
                            <Ban className="h-3.5 w-3.5" /> Suspendre
                          </Button>
                        )}
                        <Button variant="ghost" size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Supprimer"
                          onClick={() => setDeleteTarget(user)}>
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
      </div>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'utilisateur</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Supprimer définitivement <strong>{deleteTarget?.full_name || deleteTarget?.phone}</strong> ?
            <br />
            Toutes ses données (commandes, adresses, portefeuille) seront conservées mais dissociées de ce compte.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              {deleteMut.isPending ? "Suppression…" : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      <Dialog open={!!detailUser} onOpenChange={() => setDetailUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {detailUser && <UserAvatar name={detailUser.full_name} phone={detailUser.phone} />}
              <div>
                <div>{detailUser?.full_name || "Utilisateur sans nom"}</div>
                <div className="text-sm font-normal text-muted-foreground font-mono">{detailUser?.phone}</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {detailUser && (
            <div className="space-y-5">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <div className="text-xl font-black">{detailUser.orderCount}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                    <Package className="h-3 w-3" /> Commandes
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <div className="text-xl font-black tabular-nums">{(detailUser.totalSpent ?? 0).toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                    <TrendingUp className="h-3 w-3" /> DH dépensé
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <div className="text-xl font-black">{detailUser.addressCount}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> Adresse{detailUser.addressCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <div className="text-sm font-bold">
                    {detailUser.lastOrderAt ? new Date(detailUser.lastOrderAt).toLocaleDateString("fr-MA") : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> Dernière cmd
                  </div>
                </div>
              </div>

              {/* User info chips */}
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {detailUser.phone}
                </span>
                <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Inscrit le {new Date(detailUser.created_at || new Date()).toLocaleDateString("fr-MA")}
                </span>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                  detailUser.is_banned ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}>
                  {detailUser.is_banned ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  {detailUser.is_banned ? "Suspendu" : "Actif"}
                </span>
              </div>

              <section className="border-t pt-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Securite du compte</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  <SecurityState label="Fournisseur" value={String(detailUser.auth_provider || "inconnu")} />
                  <SecurityState label="Email" value={detailUser.email_verified ? "Verifie" : "Non verifie"} good={Boolean(detailUser.email_verified)} />
                  <SecurityState label="Telephone" value={detailUser.phone_verified ? "Verifie" : "Non verifie"} good={Boolean(detailUser.phone_verified)} />
                  <SecurityState label="WhatsApp" value={detailUser.whatsapp_verified ? "Verifie" : "Non verifie"} good={Boolean(detailUser.whatsapp_verified)} />
                  <SecurityState label="Profil" value={detailUser.profile_completed_at ? "Complet" : "Incomplet"} good={Boolean(detailUser.profile_completed_at)} />
                  <SecurityState label="Risque" value={String(detailUser.auth_risk_level || "low")} good={detailUser.auth_risk_level === "low"} />
                </div>
              </section>

              {/* Tabs */}
              <div className="flex gap-1 border-b">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    activeTab === "orders"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Commandes ({detailUser.orderCount})
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("addresses")}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    activeTab === "addresses"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Adresses ({detailUser.addressCount})
                  </span>
                </button>
              </div>

              {/* Orders tab */}
              {activeTab === "orders" && (
                <div>
                  {ordersLoading ? (
                    <div className="flex justify-center py-8 text-muted-foreground">Chargement…</div>
                  ) : userOrders.length === 0 ? (
                    <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
                      <ShoppingBag className="h-10 w-10 opacity-30" />
                      <p>Aucune commande</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {userOrders.map((order) => (
                        <div key={order.id} className="rounded-xl border p-3.5 space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{order.storeName}</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                                {STATUS_LABELS[order.status] ?? order.status}
                              </span>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {PM_LABELS[order.paymentMethod] ?? order.paymentMethod}
                              </span>
                            </div>
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {order.items?.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                          </div>
                          {order.address && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {order.address}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString("fr-MA")} · #{order.id.slice(-8)}
                            </span>
                            <span className="font-bold">{order.total.toFixed(2)} DH</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Addresses tab */}
              {activeTab === "addresses" && (
                <div>
                  {detailUser.addresses.length === 0 ? (
                    <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
                      <MapPin className="h-10 w-10 opacity-30" />
                      <p>Aucune adresse enregistrée</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {detailUser.addresses.map((addr) => (
                        <div key={addr.id} className={`rounded-xl border p-3.5 flex items-start gap-3 ${addr.isDefault ? "border-primary/30 bg-primary/5" : ""}`}>
                          <MapPin className={`h-4 w-4 mt-0.5 shrink-0 ${addr.isDefault ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{addr.label}</span>
                              {addr.isDefault && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">Par défaut</span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-0.5">{addr.address}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-2 border-t">
                <Button variant="outline" onClick={() => setDetailUser(null)}>Fermer</Button>
                {detailUser.is_banned ? (
                  <Button className="gap-2 bg-green-600 hover:bg-green-700" disabled={updateMut.isPending}
                    onClick={() => { updateMut.mutate({ id: detailUser.id, data: { is_banned: false } }); setDetailUser(null); }}>
                    <CheckCircle className="h-4 w-4" /> Activer le compte
                  </Button>
                ) : (
                  <Button variant="destructive" className="gap-2" disabled={updateMut.isPending}
                    onClick={() => { updateMut.mutate({ id: detailUser.id, data: { is_banned: true } }); setDetailUser(null); }}>
                    <Ban className="h-4 w-4" /> Suspendre le compte
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function SecurityState({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return <div className="rounded-md border bg-background p-2"><div className="text-[11px] text-muted-foreground">{label}</div><div className={good === undefined ? "font-semibold" : good ? "font-semibold text-green-700" : "font-semibold text-amber-700"}>{value}</div></div>;
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, Send, RefreshCw, Sparkles, Tag } from "lucide-react";
import { api } from "@/lib/api";
import { adminGetPromotions, adminGetStores } from "@/lib/adminApi";

type NotificationLog = {
  id: number;
  title: string;
  body: string;
  target: string;
  sent_count: number;
  failed_count: number;
  sent_by: string;
  created_at: string;
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Notification fields
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");

  // Linked action states
  const [actionType, setActionType] = useState<"broadcast" | "promo" | "store">("broadcast");
  const [selectedPromoId, setSelectedPromoId] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");

  const list = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => api.notifications.list() as Promise<NotificationLog[]>,
  });

  // Queries for dropdown selection data
  const promos = useQuery({
    queryKey: ["admin-promos-dropdown"],
    queryFn: () => adminGetPromotions(),
    enabled: actionType === "promo" && open,
  });

  const storesList = useQuery({
    queryKey: ["admin-stores-dropdown"],
    queryFn: () => adminGetStores(),
    enabled: actionType === "store" && open,
  });

  const sendNotif = useMutation({
    mutationFn: async (data: { title: string; body: string; target: string }) => {
      return api.notifications.send(data);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      setOpen(false);
      setTitle("");
      setBody("");
      setTarget("all");
      setActionType("broadcast");
      setSelectedPromoId("");
      setSelectedStoreId("");
      toast({
        title: "Notification envoyée",
        description: `Envoyée à ${res.sent} appareils, échecs: ${res.failed}`,
      });
    },
    onError: (err: Error) =>
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      }),
  });

  const handleActionTypeChange = (type: "broadcast" | "promo" | "store") => {
    setActionType(type);
    setSelectedPromoId("");
    setSelectedStoreId("");
    setTitle("");
    setBody("");
  };

  const handlePromoSelect = (promoId: string) => {
    setSelectedPromoId(promoId);
    const promo = promos.data?.find((p: any) => String(p.id) === promoId || p.code === promoId);
    if (promo) {
      setTitle(`Code Promo: ${promo.code}`);
      const val = promo.discount_value;
      const t = promo.discount_type === "percentage" ? `${val}%` : `${val} DH`;
      setBody(`Utilisez le code promo pour bénéficier de ${t} de réduction sur votre commande.`);
    }
  };

  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    const store = storesList.data?.find((s: any) => String(s.id) === storeId);
    if (store) {
      setTitle(`Nouveau chez ${store.name}`);
      setBody(`Découvrez les nouveautés et commandez dès aujourd'hui chez ${store.name} sur Jaheez.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast({ title: "Champs requis", description: "Le titre et le message sont requis", variant: "destructive" });
      return;
    }
    sendNotif.mutate({ title, body, target });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Notifications & Diffusion</h2>
            <p className="text-sm text-muted-foreground">
              Envoyez et suivez les notifications push et de diffusion in-app aux clients.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => list.refetch()} disabled={list.isFetching}>
              <RefreshCw className={`h-4 w-4 ${list.isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Bell className="mr-2 h-4 w-4" />
              Créer une notification
            </Button>
          </div>
        </div>

        {/* List of Notification Logs */}
        <div className="rounded-md border bg-card text-card-foreground shadow-sm">
          <div className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4">Titre</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Cible</th>
                  <th className="px-6 py-4 text-center">Envoyés / Échecs</th>
                  <th className="px-6 py-4">Envoyé par</th>
                  <th className="px-6 py-4">Date d'envoi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Chargement des notifications...
                    </td>
                  </tr>
                ) : !list.data?.length ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Aucune notification envoyée pour le moment.
                    </td>
                  </tr>
                ) : (
                  list.data.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium">{log.title}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={log.body}>{log.body}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {log.target === "all" ? "Tous" : `Utilisateur: ${log.target}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-emerald-600 font-semibold">{log.sent_count}</span>
                        {" / "}
                        <span className="text-rose-600 font-semibold">{log.failed_count}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{log.sent_by}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dialog for Sending Notification */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Envoyer une nouvelle notification</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {/* Type of Action */}
              <div className="space-y-2">
                <Label>Type d'action de la notification</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={actionType === "broadcast" ? "default" : "outline"}
                    className="text-xs"
                    onClick={() => handleActionTypeChange("broadcast")}
                  >
                    Message simple
                  </Button>
                  <Button
                    type="button"
                    variant={actionType === "promo" ? "default" : "outline"}
                    className="text-xs"
                    onClick={() => handleActionTypeChange("promo")}
                  >
                    <Tag className="mr-1 h-3 w-3" /> Promo / Offre
                  </Button>
                  <Button
                    type="button"
                    variant={actionType === "store" ? "default" : "outline"}
                    className="text-xs"
                    onClick={() => handleActionTypeChange("store")}
                  >
                    <Sparkles className="mr-1 h-3 w-3" /> Magasin
                  </Button>
                </div>
              </div>

              {/* Dynamic Action Fields */}
              {actionType === "promo" && (
                <div className="space-y-2">
                  <Label htmlFor="promoSelect">Associer à un Code Promo</Label>
                  {promos.isLoading ? (
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Chargement des codes promo...
                    </div>
                  ) : (
                    <select
                      id="promoSelect"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={selectedPromoId}
                      onChange={(e) => handlePromoSelect(e.target.value)}
                    >
                      <option value="">Sélectionnez un code promo</option>
                      {promos.data?.map((p: any) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.code} ({p.discount_type === "percentage" ? `${p.discount_value}%` : `${p.discount_value} DH`})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {actionType === "store" && (
                <div className="space-y-2">
                  <Label htmlFor="storeSelect">Associer à un Magasin</Label>
                  {storesList.isLoading ? (
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Chargement des magasins...
                    </div>
                  ) : (
                    <select
                      id="storeSelect"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={selectedStoreId}
                      onChange={(e) => handleStoreSelect(e.target.value)}
                    >
                      <option value="">Sélectionnez un magasin</option>
                      {storesList.data?.map((s: any) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Titre de la notification</Label>
                <Input
                  id="title"
                  placeholder="Saisissez le titre"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Contenu du message</Label>
                <textarea
                  id="body"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Saisissez le message"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Cible des destinataires</Label>
                <select
                  id="target"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="all">Tous les utilisateurs (Broadcast)</option>
                  <option value="specific">Utilisateur spécifique (UUID)</option>
                </select>
              </div>

              {/* If target is specific user, we can prompt for user ID */}
              {target !== "all" && (
                <div className="space-y-2">
                  <Label htmlFor="targetUser">ID (UUID) de l'utilisateur</Label>
                  <Input
                    id="targetUser"
                    placeholder="Saisissez l'ID"
                    value={target === "specific" ? "" : target}
                    onChange={(e) => setTarget(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={sendNotif.isPending}>
                  {sendNotif.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetOrders, adminUpdateOrderStatus, adminAssignDriver,
  adminCancelOrder, adminUpdateOrderNote, adminGetAvailableDrivers,
  adminCleanupDevelopmentDispatch,
  apiRequest,
} from "@/lib/adminApi";
import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { safeDateStr } from "@/lib/utils";
import {
  Loader2, ArrowRight, CheckCircle2, Clock, Search, Bike,
  XCircle, FileText, Eye, RefreshCw, MapPin, Phone, User, Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type OrderStatus = "pending" | "confirmed" | "preparing" | "assigned" | "picked_up" | "on_the_way" | "delivered" | "cancelled";

const STATUS_FLOW: OrderStatus[] = [
  "pending", "confirmed", "preparing", "assigned", "picked_up", "on_the_way", "delivered"
];

function getNextStatus(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

// Map order statuses to styled color classes
function getStatusColor(status: string) {
  switch (status) {
    case "pending":    return "bg-gray-100 text-gray-800 border-gray-200";
    case "confirmed":  return "bg-blue-100 text-blue-800 border-blue-200";
    case "preparing":  return "bg-amber-100 text-amber-800 border-amber-200";
    case "assigned":   return "bg-purple-100 text-purple-800 border-purple-200";
    case "picked_up":  return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "on_the_way": return "bg-primary/10 text-primary border-primary/20";
    case "delivered":  return "bg-green-100 text-green-800 border-green-200";
    case "cancelled":  return "bg-red-100 text-red-800 border-red-200";
    default:           return "bg-gray-100 text-gray-800";
  }
}

function formatStatus(status: string) {
  return status.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const CANCELLABLE = new Set(["pending", "confirmed", "preparing"]);

function formatExactDateTime(value: any) {
  return safeDateStr(value, d => new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(d));
}

function shortOrderId(id?: string) {
  return id ? `#${id.slice(0, 8)}` : "#--------";
}

function firstText(...values: any[]) {
  return values.find(value => typeof value === "string" && value.trim().length > 0)?.trim();
}

// Fallback logic to show store name
function getStoreName(order: any) {
  if (order.order_type === "errand") return "Course personnalisée";
  return firstText(order.store_name, order.stores?.name, order.stores?.name_ar) || "Magasin inconnu";
}

// Fallback logic to show customer name
function getCustomerName(order: any) {
  return firstText(order.customer_name, order.user_name, order.users?.full_name) || "Client inconnu";
}

// Fallback logic to show driver name
function getDriverName(order: any) {
  return firstText(order.driver_name, order.drivers?.full_name) || "Chauffeur inconnu";
}

function getPhone(...values: any[]) {
  return firstText(...values);
}

export default function Orders() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [cancelDialog, setCancelDialog] = useState<{ id: string; storeName: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [assignDialog, setAssignDialog] = useState<{ id: string; storeName: string } | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [noteDialog, setNoteDialog] = useState<{ id: string; currentNote: string } | null>(null);
  const [noteText, setNoteText] = useState("");

  const { data: allOrders = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin_orders_full"],
    queryFn: () => adminGetOrders(),
    refetchInterval: 10000,
  });

  const { data: availableDrivers = [] } = useQuery<any[]>({
    queryKey: ["admin-available-drivers"],
    queryFn: adminGetAvailableDrivers,
    enabled: !!assignDialog,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin_orders_full"] });
    queryClient.invalidateQueries({ queryKey: ["admin_stats"] });
  };

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      adminUpdateOrderStatus(id, { status }),
    onSuccess: invalidate,
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const cleanupDispatch = useMutation({
    mutationFn: adminCleanupDevelopmentDispatch,
    onSuccess: (result: any) => {
      invalidate();
      toast({
        title: "Dispatch nettoyé",
        description: `${result?.orders_deleted || 0} commandes test supprimées.`,
      });
    },
    onError: (err: Error) => toast({ title: "Nettoyage impossible", description: err.message, variant: "destructive" }),
  });

  const markStoreReady = useMutation({
    mutationFn: (order: any) => apiRequest(`/stores/${order.store_id}/orders/${order.id}/ready`, {
      method: 'POST', body: JSON.stringify({ request_id: crypto.randomUUID() }),
    }),
    onSuccess: () => { invalidate(); toast({ title: 'Commande marquee prete' }); },
    onError: (err: Error) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const assignDriver = useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: string; driverId: string }) =>
      adminAssignDriver(orderId, driverId),
    onSuccess: () => {
      invalidate();
      setAssignDialog(null);
      setSelectedDriverId("");
      toast({ title: "Chauffeur assigné" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const cancelOrder = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminCancelOrder(id, reason),
    onSuccess: () => {
      invalidate();
      setCancelDialog(null);
      setCancelReason("");
      toast({ title: "Commande annulée" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const updateNote = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => adminUpdateOrderNote(id, note),
    onSuccess: () => {
      invalidate();
      setNoteDialog(null);
      setNoteText("");
      toast({ title: "Note mise à jour" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const stats = useMemo(() => {
    const counts: Record<string, number> = { all: allOrders.length };
    allOrders.forEach((o: any) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [allOrders]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter((o: any) => {
      const matchesTab = activeTab === "all" || o.status === activeTab;
      const term = search.toLowerCase();
      const matchesSearch = !search ||
        o.id.toLowerCase().includes(term) ||
        (o.store_id || "").toLowerCase().includes(term) ||
        (getStoreName(o) || "").toLowerCase().includes(term) ||
        (getCustomerName(o) || "").toLowerCase().includes(term) ||
        (getDriverName(o) || "").toLowerCase().includes(term) ||
        (o.user_phone || o.customer_phone || "").toLowerCase().includes(term) ||
        (o.store_phone || "").toLowerCase().includes(term) ||
        (o.driver_phone || "").toLowerCase().includes(term) ||
        (o.delivery_address?.address || "").toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
  }, [allOrders, activeTab, search]);

  const handleCleanupDispatch = () => {
    const answer = window.prompt(
      "Cette action supprime les commandes test et remet le dispatch propre en développement. Tape DELETE_TEST_ORDERS pour confirmer."
    );
    if (answer === "DELETE_TEST_ORDERS") {
      cleanupDispatch.mutate();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Live Order Board</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCleanupDispatch}
              disabled={cleanupDispatch.isPending}
              className="gap-2"
            >
              {cleanupDispatch.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Nettoyer test
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Chercher commande, magasin, client, chauffeur..."
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-11 w-full justify-start overflow-x-auto bg-muted/50 p-1">
            <TabsTrigger value="all" className="px-4">Toutes ({stats.all})</TabsTrigger>
            <TabsTrigger value="pending" className="px-4">En attente ({stats.pending || 0})</TabsTrigger>
            <TabsTrigger value="confirmed" className="px-4">Confirmées ({stats.confirmed || 0})</TabsTrigger>
            <TabsTrigger value="preparing" className="px-4">Préparation ({stats.preparing || 0})</TabsTrigger>
            <TabsTrigger value="on_the_way" className="px-4">En route ({stats.on_the_way || 0})</TabsTrigger>
            <TabsTrigger value="delivered" className="px-4">Livrées ({stats.delivered || 0})</TabsTrigger>
            <TabsTrigger value="cancelled" className="px-4">Annulées ({stats.cancelled || 0})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[170px]">Commande / Heure exacte</TableHead>
                <TableHead>Magasin & Client</TableHead>
                <TableHead>Chauffeur</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Chargement des commandes en direct...</p>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order: any) => {
                  const nextStatus = getNextStatus(order.status as OrderStatus);
                  const isUpdating = updateStatus.isPending && updateStatus.variables?.id === order.id;
                  const canCancel = CANCELLABLE.has(order.status);
                  const canAssign = ["confirmed", "preparing", "assigned"].includes(order.status);
                  const storeName = getStoreName(order);
                  const customerName = getCustomerName(order);
                  const customerPhone = getPhone(order.customer_phone, order.user_phone, order.users?.phone);
                  const storePhone = getPhone(order.store_phone, order.stores?.phone);
                  const driverPhone = getPhone(order.driver_phone, order.drivers?.phone);

                  return (
                    <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="font-mono text-xs font-bold text-primary">
                          {shortOrderId(order.id)}
                        </div>
                        <div className="text-[11px] mt-1 flex items-center text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatExactDateTime(order.createdAt ?? order.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-sm">{storeName}</div>
                        {storePhone && (
                          <div className="text-[11px] text-muted-foreground flex items-center mt-1">
                            <Phone className="w-3 h-3 mr-1 opacity-60" />
                            {storePhone}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <User className="w-3 h-3 mr-1 opacity-60" />
                          {customerName}{customerPhone ? ` · ${customerPhone}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.driver_id ? (
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bike className="h-3 w-3 text-primary" />
                            </div>
                            <span>{getDriverName(order)}{driverPhone ? ` · ${driverPhone}` : ""}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Non assigné</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-sm">{parseFloat(order.total_amount || 0).toFixed(2)} DH</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground/60 mt-0.5">
                          {order.payment_method?.replace(/_/g, " ")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusColor(order.status)} font-bold text-[11px] border-0`}>
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {nextStatus && (
                            <Button
                              size="icon" variant="ghost" className="h-8 w-8 text-primary"
                              disabled={isUpdating}
                              onClick={() => updateStatus.mutate({ id: order.id, status: nextStatus })}
                            >
                              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                            </Button>
                          )}

                          {canAssign && (
                            <Button
                              size="icon" variant="ghost" className="h-8 w-8 text-blue-600"
                              onClick={() => setAssignDialog({ id: order.id, storeName })}
                            >
                              <Bike className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"
                            onClick={() => { setNoteDialog({ id: order.id, currentNote: order.notes ?? "" }); setNoteText(order.notes ?? ""); }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>

                          {canCancel && (
                            <Button
                              size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                              onClick={() => setCancelDialog({ id: order.id, storeName })}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <p className="text-muted-foreground">Aucune commande pour ce filtre.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <span className="text-primary font-mono">{shortOrderId(selectedOrder?.id)}</span>
              <Badge variant="outline" className={selectedOrder ? getStatusColor(selectedOrder.status) : ""}>
                {selectedOrder ? formatStatus(selectedOrder.status) : ""}
              </Badge>
            </SheetTitle>
          </SheetHeader>

          {selectedOrder && (
            <div className="space-y-8">
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Informations Client</h3>
                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {getCustomerName(selectedOrder)}
                      {getPhone(selectedOrder.customer_phone, selectedOrder.user_phone, selectedOrder.users?.phone)
                        ? ` · ${getPhone(selectedOrder.customer_phone, selectedOrder.user_phone, selectedOrder.users?.phone)}`
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatExactDateTime(selectedOrder.createdAt ?? selectedOrder.created_at)}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{selectedOrder.delivery_address?.address || selectedOrder.delivery_address || "Non spécifié"}</span>
                  </div>
                </div>
              </section>

              {['confirmed','preparing'].includes(selectedOrder.status) && !selectedOrder.store_ready_at ? (
                <Button className="w-full" disabled={markStoreReady.isPending} onClick={() => markStoreReady.mutate(selectedOrder)}>
                  {markStoreReady.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Restaurant / magasin: commande prete'}
                </Button>
              ) : null}

              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Détails Magasin</h3>
                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <div className="font-bold text-sm">{getStoreName(selectedOrder)}</div>
                  {getPhone(selectedOrder.store_phone, selectedOrder.stores?.phone) && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {getPhone(selectedOrder.store_phone, selectedOrder.stores?.phone)}
                    </div>
                  )}
                  {(selectedOrder.store_address || selectedOrder.stores?.address || selectedOrder.stores?.address_ar) && (
                    <div className="text-sm text-muted-foreground flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      {selectedOrder.store_address || selectedOrder.stores?.address || selectedOrder.stores?.address_ar}
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Articles</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-muted/30 pb-2 last:border-0">
                      <div>
                        <span className="font-bold text-primary mr-2">{item.quantity}x</span>
                        <span>{item.productName}</span>
                      </div>
                      <span className="font-mono">{(item.price * item.quantity).toFixed(2)} DH</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3 border-t pt-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Sous-total</span>
                  <span className="font-mono">{parseFloat(selectedOrder.subtotal || 0).toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Frais de livraison</span>
                  <span className="font-mono">{parseFloat(selectedOrder.delivery_fee || 0).toFixed(2)} DH</span>
                </div>
                {parseFloat(selectedOrder.discount || 0) > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                    <span>Remise / Code Promo</span>
                    <span className="font-mono">-{parseFloat(selectedOrder.discount || 0).toFixed(2)} DH</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-black border-t pt-2">
                  <span>Total</span>
                  <span className="text-primary font-mono">{parseFloat(selectedOrder.total_amount || 0).toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                  <span>Méthode de paiement</span>
                  <span className="font-bold uppercase">{selectedOrder.payment_method?.replace(/_/g, " ")}</span>
                </div>
              </section>

              {selectedOrder.notes && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</h3>
                  <div className="bg-amber-50 text-amber-800 rounded-xl p-4 text-sm italic">
                    "{selectedOrder.notes}"
                  </div>
                </section>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Assign Driver Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assigner un chauffeur</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Commande chez <strong>{assignDialog?.storeName}</strong></p>
            <div className="space-y-1.5">
              <Label>Chauffeur disponible</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
              >
                <option value="">— Choisir un chauffeur —</option>
                {availableDrivers.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name || d.name} — {d.vehicle_type || d.vehicleType} {d.is_online || d.isOnline ? "🟢" : "⚪"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>Annuler</Button>
            <Button
              disabled={!selectedDriverId || assignDriver.isPending}
              onClick={() => assignDialog && assignDriver.mutate({ orderId: assignDialog.id, driverId: selectedDriverId })}
              className="bg-primary hover:bg-primary/90"
            >
              {assignDriver.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assigner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Annuler la commande</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Annuler la commande chez <strong>{cancelDialog?.storeName}</strong> ?
            </p>
            <div className="space-y-1.5">
              <Label>Raison d'annulation <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Ex: Client injoignable, erreur de commande..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(null)}>Retour</Button>
            <Button
              variant="destructive"
              disabled={!cancelReason.trim() || cancelOrder.isPending}
              onClick={() => cancelDialog && cancelOrder.mutate({ id: cancelDialog.id, reason: cancelReason })}
            >
              {cancelOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer l'annulation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Internal Note Dialog */}
      <Dialog open={!!noteDialog} onOpenChange={() => setNoteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Note interne</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Note (visible uniquement par les admins)</Label>
            <Textarea
              placeholder="Ajouter une note interne..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(null)}>Annuler</Button>
            <Button
              disabled={updateNote.isPending}
              onClick={() => noteDialog && updateNote.mutate({ id: noteDialog.id, note: noteText })}
              className="bg-primary hover:bg-primary/90"
            >
              {updateNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

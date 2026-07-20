import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, Package, Search, XCircle } from 'lucide-react';
import {
  AdminErrand, adminAdjustErrandQuote, adminAssignDriver, adminCancelOrder,
  adminGetAvailableDrivers, adminGetErrands, adminGetManualErrandQuotes,
  adminOpenErrandDispute, adminReviewErrand,
} from '../services/orderApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ReviewAction = 'approve' | 'reject' | 'request_information';

export default function Errands() {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [search, setSearch] = useState('');
  const [driversByOrder, setDriversByOrder] = useState<Record<string, string>>({});
  const [manualPrices, setManualPrices] = useState<Record<string, string>>({});
  const { data = [], isLoading, error } = useQuery({ queryKey: ['admin-errands'], queryFn: adminGetErrands });
  const { data: drivers = [] } = useQuery({ queryKey: ['admin-available-drivers'], queryFn: adminGetAvailableDrivers });
  const { data: manualQuotes = [] } = useQuery({ queryKey: ['admin-errand-manual-quotes'], queryFn: adminGetManualErrandQuotes });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-errands'] });
  const review = useMutation({ mutationFn: ({ id, action }: { id: string; action: ReviewAction }) => adminReviewErrand(id, { action, reason: reason.trim() }), onSuccess: () => { setReason(''); refresh(); } });
  const assign = useMutation({ mutationFn: ({ id, driverId }: { id: string; driverId: string }) => adminAssignDriver(id, driverId), onSuccess: refresh });
  const cancel = useMutation({ mutationFn: ({ id }: { id: string }) => adminCancelOrder(id, reason.trim()), onSuccess: () => { setReason(''); refresh(); } });
  const dispute = useMutation({ mutationFn: ({ id }: { id: string }) => adminOpenErrandDispute(id, reason.trim()), onSuccess: () => { setReason(''); refresh(); } });
  const adjustQuote = useMutation({ mutationFn: ({ id, total }: { id: string; total: number }) => adminAdjustErrandQuote(id, total, reason.trim()), onSuccess: () => { setReason(''); queryClient.invalidateQueries({ queryKey: ['admin-errand-manual-quotes'] }); } });
  const validReason = reason.trim().length >= 3;
  const mutationError = review.error || assign.error || cancel.error || dispute.error || adjustQuote.error;
  const rows = data.filter((item: AdminErrand) => `${item.id} ${item.details?.pickup_address || ''} ${item.details?.recipient_name || ''}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold">Courses & Errands</h1><p className="text-sm text-muted-foreground">Validation manuelle avant assignation du livreur.</p></div>
    <div className="flex gap-3"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Commande, adresse ou destinataire"/></div><Input className="max-w-md" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motif obligatoire pour la decision"/></div>
    {manualQuotes.length ? <Card><CardHeader><CardTitle>Tarification manuelle requise</CardTitle></CardHeader><CardContent className="space-y-3">{manualQuotes.map((quote) => <div key={quote.id} className="grid items-center gap-2 rounded-lg border p-3 md:grid-cols-[1fr_120px_auto]"><div className="text-sm"><b>{quote.distance_km.toFixed(1)} km</b> - {quote.draft?.pickup_address} vers {quote.draft?.dropoff_address}</div><Input type="number" min="0.01" max="500" step="0.01" value={manualPrices[quote.id] || ''} onChange={(event) => setManualPrices((current) => ({ ...current, [quote.id]: event.target.value }))} placeholder="Prix DH"/><Button disabled={!validReason || !(Number(manualPrices[quote.id]) > 0) || adjustQuote.isPending} onClick={() => adjustQuote.mutate({ id: quote.id, total: Number(manualPrices[quote.id]) })}>Valider le tarif</Button></div>)}</CardContent></Card> : null}
    {mutationError ? <p className="text-sm text-destructive">{mutationError.message}</p> : null}
    {isLoading ? <p>Chargement...</p> : error ? <p className="text-destructive">Impossible de charger les courses.</p> : <div className="grid gap-4">{rows.map((item) => <Card key={item.id}>
      <CardHeader className="pb-3"><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base"><Package className="h-5 w-5 text-red-600"/>#{item.id.slice(0, 8)} - {item.details?.service_type === 'send_item' ? 'Envoi' : 'Retrait commande'}</CardTitle><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{item.details?.errand_stage || item.moderation_status}</span></div></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 text-sm md:grid-cols-2"><p><b>Depart:</b> {item.details?.pickup_address || '-'}</p><p><b>Destinataire:</b> {item.details?.recipient_name || '-'}</p><p><b>Objet:</b> {item.details?.item_category} - {item.details?.item_size} - {item.details?.weight_band}</p><p><b>Valeur declaree:</b> {(item.details?.declared_value_dh || 0).toFixed(2)} DH</p><p><b>Tarif:</b> {item.total_dh.toFixed(2)} DH</p><p><b>Devis:</b> v{item.details?.quote?.version || '-'} - {item.details?.quote?.pricing_version || '-'}</p><p className="flex items-center gap-1"><Clock3 className="h-4 w-4"/>{new Date(item.created_at).toLocaleString()}</p></div>
        {item.details?.instructions ? <p className="rounded-lg bg-muted p-3 text-sm">{item.details.instructions}</p> : null}
        {item.details?.risk_flags?.length ? <div className="flex flex-wrap gap-2">{item.details.risk_flags.map((flag) => <span key={flag} className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">{flag}</span>)}</div> : null}
        {item.proofs?.length ? <div className="flex flex-wrap gap-3">{item.proofs.map((proof) => proof.url ? <a key={proof.id} href={proof.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline">Preuve {proof.proof_type === 'pickup' ? 'de retrait' : 'de livraison'}</a> : <span key={proof.id} className="text-sm text-muted-foreground">Preuve indisponible</span>)}</div> : null}
        {item.events?.length ? <details className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer font-semibold">Historique ({item.events.length})</summary><div className="mt-2 space-y-1">{item.events.slice(-10).map((event, index) => <p key={`${event.created_at}-${index}`}>{new Date(event.created_at).toLocaleString()} - {event.actor_type} - {event.event_type}</p>)}</div></details> : null}
        {item.moderation_status === 'pending_review' ? <div className="flex flex-wrap gap-2"><Button disabled={review.isPending || !validReason} onClick={() => review.mutate({ id: item.id, action: 'approve' })}><CheckCircle2 className="mr-2 h-4 w-4"/>Approuver</Button><Button variant="outline" disabled={review.isPending || !validReason} onClick={() => review.mutate({ id: item.id, action: 'request_information' })}>Demander des informations</Button><Button variant="destructive" disabled={review.isPending || !validReason} onClick={() => review.mutate({ id: item.id, action: 'reject' })}><XCircle className="mr-2 h-4 w-4"/>Rejeter</Button></div> : null}
        {item.moderation_status === 'approved' && !item.driver_id ? <div className="flex max-w-lg gap-2"><select aria-label="Livreur verifie" className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm" value={driversByOrder[item.id] || ''} onChange={(event) => setDriversByOrder((current) => ({ ...current, [item.id]: event.target.value }))}><option value="">Choisir un livreur verifie</option>{drivers.map((driver: any) => <option key={driver.id} value={driver.id}>{driver.full_name || driver.name || driver.id}</option>)}</select><Button disabled={!driversByOrder[item.id] || assign.isPending} onClick={() => assign.mutate({ id: item.id, driverId: driversByOrder[item.id] })}>Assigner</Button></div> : null}
        {!['cancelled', 'delivered', 'completed'].includes(item.status) ? <Button variant="destructive" disabled={!validReason || cancel.isPending} onClick={() => cancel.mutate({ id: item.id })}>Annuler via operations</Button> : null}
        <Button variant="outline" disabled={!validReason || dispute.isPending} onClick={() => dispute.mutate({ id: item.id })}>Ouvrir un litige</Button>
      </CardContent>
    </Card>)}</div>}
  </div>;
}

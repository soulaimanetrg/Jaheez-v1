import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { req } from '@/lib/api';

/* ── Types ────────────────────────────────────────────────────────── */

interface Rate {
  id: string;
  delivery_percent: number;
  tip_percent: number;
  effective_from: string;
  effective_to: string | null;
  reason: string;
  created_by: string | null;
  created_at: string;
}

interface Override {
  id: string;
  driver_id: string;
  delivery_percent: number;
  tip_percent: number;
  effective_from: string;
  effective_to: string | null;
  reason: string;
  created_by: string | null;
  created_at: string;
}

/* ── Component ────────────────────────────────────────────────────── */

export default function CommissionSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();

  /* ── Form state ── */
  const [deliveryPct, setDeliveryPct] = useState('70');
  const [tipPct, setTipPct] = useState('100');
  const [reason, setReason] = useState('Mise a jour des taux commission');

  const [driverId, setDriverId] = useState('');
  const [overrideDelivery, setOverrideDelivery] = useState('70');
  const [overrideTip, setOverrideTip] = useState('100');
  const [overrideReason, setOverrideReason] = useState('Override chauffeur');

  /* ── Queries ── */
  const { data: rates = [], isLoading: ratesLoading, error: ratesError } = useQuery<Rate[]>({
    queryKey: ['commission-rates'],
    queryFn: () => req<Rate[]>('/commission/rates'),
  });

  const { data: overrides = [], isLoading: overridesLoading } = useQuery<Override[]>({
    queryKey: ['commission-overrides'],
    queryFn: () => req<Override[]>('/commission/overrides'),
  });

  /* Pre-fill form with current active global rate */
  useEffect(() => {
    if (rates.length > 0) {
      const active = rates[0]; // sorted by effective_from DESC
      setDeliveryPct(String(active.delivery_percent));
      setTipPct(String(active.tip_percent));
    }
  }, [rates]);

  /* ── Mutations ── */
  const createRate = useMutation({
    mutationFn: () =>
      req<Rate>('/commission/rates', {
        method: 'POST',
        body: JSON.stringify({
          delivery_percent: Number(deliveryPct),
          tip_percent: Number(tipPct),
          reason,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commission-rates'] });
      toast({ title: 'Nouveaux taux actifs' });
    },
    onError: (e: Error) =>
      toast({ title: e.message, variant: 'destructive' }),
  });

  const createOverride = useMutation({
    mutationFn: () =>
      req<Override>('/commission/overrides', {
        method: 'POST',
        body: JSON.stringify({
          driver_id: driverId,
          delivery_percent: Number(overrideDelivery),
          tip_percent: Number(overrideTip),
          reason: overrideReason,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commission-overrides'] });
      toast({ title: 'Override chauffeur cree' });
      setDriverId('');
    },
    onError: (e: Error) =>
      toast({ title: e.message, variant: 'destructive' }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page header ── */}
        <div>
          <h2 className="text-2xl font-bold">Commissions chauffeurs</h2>
          <p className="text-muted-foreground">
            Taux versionnes ; aucun changement retroactif.
          </p>
        </div>

        {/* ── Form cards ── */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Global rates */}
          <section className="border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold">Taux globaux</h3>

            <Label>Frais de livraison (%)</Label>
            <Input
              value={deliveryPct}
              onChange={(e) => setDeliveryPct(e.target.value)}
              type="number"
              min="0"
              max="100"
              step="0.01"
            />

            <Label>Pourboire (%)</Label>
            <Input
              value={tipPct}
              onChange={(e) => setTipPct(e.target.value)}
              type="number"
              min="0"
              max="100"
              step="0.01"
            />

            <Label>Motif audit</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <Button
              onClick={() => createRate.mutate()}
              disabled={createRate.isPending}
            >
              {createRate.isPending ? 'Enregistrement...' : 'Activer'}
            </Button>
          </section>

          {/* Driver override */}
          <section className="border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold">Override chauffeur</h3>

            <Label>ID chauffeur</Label>
            <Input
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              placeholder="UUID du chauffeur"
            />

            <Label>Livraison (%)</Label>
            <Input
              value={overrideDelivery}
              onChange={(e) => setOverrideDelivery(e.target.value)}
              type="number"
              min="0"
              max="100"
              step="0.01"
            />

            <Label>Pourboire (%)</Label>
            <Input
              value={overrideTip}
              onChange={(e) => setOverrideTip(e.target.value)}
              type="number"
              min="0"
              max="100"
              step="0.01"
            />

            <Label>Motif audit</Label>
            <Input
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />

            <Button
              onClick={() => createOverride.mutate()}
              disabled={!driverId || createOverride.isPending}
            >
              {createOverride.isPending ? 'Enregistrement...' : 'Creer override'}
            </Button>
          </section>
        </div>

        {/* ── Rate history ── */}
        <section className="border rounded-xl overflow-hidden">
          <div className="p-4 font-semibold">Historique des taux globaux</div>
          {ratesLoading && (
            <div className="p-4 text-muted-foreground">Chargement...</div>
          )}
          {ratesError && (
            <div className="p-4 text-red-500">
              Erreur : {(ratesError as Error).message}
            </div>
          )}
          {rates.map((r) => (
            <div
              key={r.id}
              className="border-t p-4 flex justify-between items-center"
            >
              <span>
                Livraison {r.delivery_percent}% · Pourboire {r.tip_percent}%
              </span>
              <span className="text-muted-foreground text-sm">
                {new Date(r.effective_from).toLocaleString('fr-MA')} ·{' '}
                {r.reason}
              </span>
            </div>
          ))}
        </section>

        {/* ── Override history ── */}
        <section className="border rounded-xl overflow-hidden">
          <div className="p-4 font-semibold">Overrides chauffeurs</div>
          {overridesLoading && (
            <div className="p-4 text-muted-foreground">Chargement...</div>
          )}
          {overrides.length === 0 && !overridesLoading && (
            <div className="p-4 text-muted-foreground">Aucun override.</div>
          )}
          {overrides.map((o) => (
            <div
              key={o.id}
              className="border-t p-4 flex justify-between items-center"
            >
              <span>
                Chauffeur {o.driver_id.slice(0, 8)}… · Livraison{' '}
                {o.delivery_percent}% · Pourboire {o.tip_percent}%
              </span>
              <span className="text-muted-foreground text-sm">
                {new Date(o.effective_from).toLocaleString('fr-MA')} ·{' '}
                {o.reason}
              </span>
            </div>
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}

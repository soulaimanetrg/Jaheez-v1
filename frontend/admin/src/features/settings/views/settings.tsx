import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Settings2, Loader2 } from "lucide-react";
import { getAdminToken } from "@/lib/adminApi";

const API_BASE = "";

type Setting = { id: string; key: string; value: string; description: string; updatedAt: string; updatedBy?: string };
type SettingForm = { key: string; value: string; description: string };

const MONEY_SETTING_KEYS = new Set([
  "driver_min_delivery_earning_centimes",
  "driver_high_tip_review_threshold_centimes",
]);

function isMoneySetting(key: string) {
  return MONEY_SETTING_KEYS.has(key);
}

function toDhValue(centimes: string) {
  const parsed = Number(centimes || 0);
  return Number.isFinite(parsed) ? String(parsed / 100) : "";
}

function toInternalSettingValue(key: string, value: string) {
  if (!isMoneySetting(key)) return value;
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return value;
  return String(Math.round(parsed * 100));
}

function toUiSettingValue(key: string, value: string) {
  return isMoneySetting(key) ? toDhValue(value) : value;
}

function displaySettingKey(key: string) {
  const labels: Record<string, string> = {
    driver_min_delivery_earning_centimes: "driver_min_delivery_earning_dh",
    driver_high_tip_review_threshold_centimes: "driver_high_tip_review_threshold_dh",
    cod_change_default_max_mad: "cod_change_default_max_dh",
  };
  return labels[key] || key.replace(/centimes/g, "dh").replace(/mad/g, "dh");
}

async function fetchSettings(): Promise<Setting[]> {
  const res = await fetch(`${API_BASE}/admin-api/settings`, { headers: { Authorization: `Bearer ${getAdminToken()}` } });
  if (!res.ok) throw new Error("Failed to fetch settings");
  const json = await res.json();
  if (Array.isArray(json)) return json;
  return Object.entries(json ?? {}).map(([key, value]) => ({
    id: key,
    key,
    value: toUiSettingValue(key, String(value ?? "")),
    description: PRESET_KEYS.find((p) => p.key === key)?.description ?? "",
    updatedAt: new Date().toISOString(),
  }));
}

async function upsertSetting(data: SettingForm): Promise<Setting> {
  const internalValue = toInternalSettingValue(data.key, data.value);
  const res = await fetch(`${API_BASE}/admin-api/settings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAdminToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ [data.key]: internalValue }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to save setting");
  return {
    id: data.key,
    key: data.key,
    value: data.value,
    description: data.description,
    updatedAt: new Date().toISOString(),
  };
}

async function deleteSetting(key: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin-api/settings/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!res.ok) throw new Error("Failed to delete setting");
}

// Cahier §4.12 — typed app settings, seeded server-side via lib/settings.ts.
const PRESET_KEYS = [
  { key: "cancellation_window_min",    description: "Délai max (minutes) pour qu'un client annule une commande" },
  { key: "auto_assign_timeout_sec",    description: "Délai (secondes) avant auto-annulation d'une commande sans chauffeur" },
  { key: "driver_commission_hold_until_shift_end", description: "Bloquer les commissions jusqu'a fin de shift (true/false)" },
  { key: "driver_cod_payout_requires_settlement", description: "Bloquer payout si COD du (true/false)" },
  { key: "driver_min_delivery_earning_centimes", description: "Gain minimum chauffeur par livraison (DH)" },
  { key: "driver_high_tip_review_threshold_centimes", description: "Seuil de pourboire suspect a verifier (DH)" },
  { key: "wallet_expiry_days",         description: "Durée de validité du crédit promo (jours)" },
  { key: "cod_change_default_max_mad", description: "Monnaie max que le chauffeur peut rendre par défaut (DH)" },
  { key: "support_whatsapp_number",    description: "Numéro WhatsApp affiché en page Support" },
];

const emptyForm = (): SettingForm => ({ key: "", value: "", description: "" });

function inputTypeForKey(key: string) {
  if (key.includes("percent") || isMoneySetting(key) || key.includes("days") || key.includes("min")) return "number";
  return "text";
}

export default function Settings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSetting, setEditSetting] = useState<Setting | null>(null);
  const [form, setForm] = useState<SettingForm>(emptyForm());
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchSettings,
    refetchInterval: 60000,
  });

  const upsertMut = useMutation({
    mutationFn: upsertSetting,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      setDialogOpen(false);
      toast({ title: "Paramètre sauvegardé" });
    },
    onError: (e: any) => toast({ title: e.message ?? "Erreur", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteSetting,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      setDeleteKey(null);
      toast({ title: "Paramètre supprimé" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  function openCreate() {
    setEditSetting(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(s: Setting) {
    setEditSetting(s);
    setForm({ key: s.key, value: s.value, description: s.description });
    setDialogOpen(true);
  }

  function handlePreset(preset: { key: string; description: string }) {
    setEditSetting(null);
    setForm({ key: preset.key, value: "", description: preset.description });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.key.trim()) { toast({ title: "Clé requise", variant: "destructive" }); return; }
    upsertMut.mutate({ key: form.key.trim(), value: form.value.trim(), description: form.description.trim() });
  }

  const settingMap = new Map(settings.map((s) => [s.key, s]));
  const configuredKeys = new Set(settings.map((s) => s.key));
  const unconfiguredPresets = PRESET_KEYS.filter((p) => !configuredKeys.has(p.key));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Paramètres plateforme</h2>
            <p className="text-muted-foreground mt-1">Configuration globale de l'application JAHEEZ</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nouveau paramètre
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Configured settings */}
            {settings.map((s) => (
              <div key={s.id} className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-semibold text-foreground truncate">{displaySettingKey(s.key)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description || "Aucune description"}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteKey(s.key)}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <p className="font-mono text-sm font-bold text-foreground break-all">
                    {s.value ? `${s.value}${isMoneySetting(s.key) ? " DH" : ""}` : <span className="text-muted-foreground italic">vide</span>}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Modifié le {new Date(s.updatedAt).toLocaleDateString("fr-MA", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}

            {/* Unconfigured preset keys */}
            {unconfiguredPresets.map((preset) => (
              <div
                key={preset.key}
                className="bg-card/50 rounded-xl border border-dashed border-border p-5 flex flex-col gap-3 cursor-pointer hover:bg-card hover:border-primary/30 transition-all"
                onClick={() => handlePreset(preset)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-semibold text-muted-foreground truncate">{displaySettingKey(preset.key)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{preset.description}</p>
                  </div>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground shrink-0">Non configuré</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                  <Plus className="h-3.5 w-3.5" />
                  Configurer ce paramètre
                </div>
              </div>
            ))}

            {settings.length === 0 && unconfiguredPresets.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground border rounded-xl border-dashed">
                <Settings2 className="h-12 w-12 opacity-30" />
                <p>Aucun paramètre configuré.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upsert dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editSetting ? "Modifier le paramètre" : "Nouveau paramètre"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Clé *</Label>
              <Input
                value={displaySettingKey(form.key)}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
                placeholder="nom_du_parametre"
                disabled={!!editSetting || displaySettingKey(form.key) !== form.key}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{isMoneySetting(form.key) ? "Valeur (DH) *" : "Valeur *"}</Label>
              <Input
                type={inputTypeForKey(form.key)}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder="Valeur du paramètre"
                step={isMoneySetting(form.key) ? "0.01" : undefined}
                autoFocus={!!editSetting}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="À quoi sert ce paramètre ?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={upsertMut.isPending} className="bg-primary hover:bg-primary/90">
              {upsertMut.isPending ? "Sauvegarde…" : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteKey} onOpenChange={() => setDeleteKey(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer le paramètre</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Supprimer le paramètre <span className="font-mono font-bold">{deleteKey}</span> ? Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteKey(null)}>Annuler</Button>
            <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteKey && deleteMut.mutate(deleteKey)}>
              {deleteMut.isPending ? "…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

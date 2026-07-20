import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { adminUploadImage } from "@/lib/adminApi";
import { ImagePlus, Loader2, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (objectPath: string) => void;
  label?: string;
  aspect?: "square" | "wide";
  folder?: "general" | "stores" | "products" | "drivers" | "banners" | "categories";
};

export function ImageUpload({ value, onChange, label, aspect = "wide", folder = "stores" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const previewSrc = value
    ? /^https?:\/\//i.test(value)
      ? value
      : value.startsWith("/api/")
        ? value
        : `/api/storage${value}`
    : "";

  async function handleFile(file: File) {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast({ title: "Format invalide", description: "Choisissez une image.", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Image trop lourde", description: "Maximum 15 MB.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { objectPath } = await adminUploadImage(file, "public", folder);
      onChange(objectPath);
    } catch (err: any) {
      toast({ title: "Échec de l'envoi", description: err?.message ?? "", variant: "destructive" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div
        className={`relative rounded-lg border-2 border-dashed bg-muted/30 overflow-hidden ${
          aspect === "square" ? "aspect-square w-24" : "aspect-[16/9] w-full max-w-sm"
        }`}
      >
        {previewSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
              title="Supprimer l'image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-xs">{busy ? "Envoi…" : "Choisir"}</span>
          </button>
        )}
      </div>
      {previewSrc && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Envoi…</> : "Remplacer"}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}

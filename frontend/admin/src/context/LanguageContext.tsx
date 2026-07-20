import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createDomTranslator, type DomTranslatorHandle } from "./domTranslator";

export type Lang = "fr" | "ar" | "en";

const STORAGE_KEY = "jaheez_admin_lang";
const CACHE_KEY = "jaheez_admin_translations_v1";
const TOKEN_KEY = "jaheez_admin_token";
// /api/* is routed by the shared proxy directly to the api-server.
// Do NOT prefix with import.meta.env.BASE_URL — that would send the request
// back to this SPA's vite server (404).
const TRANSLATE_URL = "/api/translate";

type Cache = Record<string, string>; // `${target}|${text}` → translation
const MAX_CACHE_ENTRIES = 1500;

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  isRTL: boolean;
  /** Translate a static FR string. Returns FR as-is when lang === "fr". */
  t: (text: string) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

function loadCache(): Cache {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cache) : {};
  } catch {
    return {};
  }
}

function trimCache(c: Cache): Cache {
  const keys = Object.keys(c);
  if (keys.length <= MAX_CACHE_ENTRIES) return c;
  const drop = keys.length - MAX_CACHE_ENTRIES;
  const trimmed: Cache = {};
  let i = 0;
  for (const k of keys) {
    if (i++ < drop) continue;
    trimmed[k] = c[k];
  }
  return trimmed;
}

function saveCache(c: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* quota exceeded — drop silently */
  }
}

async function postTranslate(texts: string[], target: "ar" | "en"): Promise<Record<string, string>> {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const resp = await fetch(TRANSLATE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ texts, source: "fr", target }),
  });
  if (!resp.ok) return {};
  const json = (await resp.json()) as { translations?: string[] };
  const arr = json.translations ?? [];
  const out: Record<string, string> = {};
  for (let i = 0; i < texts.length; i++) {
    const tr = arr[i];
    if (typeof tr === "string") out[texts[i]] = tr;
  }
  return out;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "fr";
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "ar" || v === "en" ? v : "fr";
  });
  const cacheRef = useRef<Cache>(loadCache());
  const [, force] = useState(0);
  const pending = useRef<Set<string>>(new Set());
  const flushTimer = useRef<number | null>(null);
  const translatorRef = useRef<DomTranslatorHandle | null>(null);

  // Sync <html dir> + lang
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  // useT() flush — used when components manually call t("...")
  const flush = useCallback(async (target: "ar" | "en") => {
    flushTimer.current = null;
    const items = Array.from(pending.current);
    pending.current.clear();
    if (items.length === 0) return;
    const map = await postTranslate(items, target);
    let cache = cacheRef.current;
    for (const text of items) {
      const tr = map[text];
      if (tr) cache[`${target}|${text}`] = tr;
    }
    cache = trimCache(cache);
    cacheRef.current = cache;
    saveCache(cache);
    force((n) => n + 1);
  }, []);

  const t = useCallback(
    (text: string): string => {
      if (!text) return text;
      if (lang === "fr") return text;
      const target = lang;
      const key = `${target}|${text}`;
      const hit = cacheRef.current[key];
      if (hit !== undefined) return hit;
      pending.current.add(text);
      if (flushTimer.current === null && typeof window !== "undefined") {
        flushTimer.current = window.setTimeout(() => flush(target), 60);
      }
      return text;
    },
    [lang, flush],
  );

  // DOM auto-translator: walks the page when lang !== "fr" and swaps every
  // visible French text node for its target-language translation. Owned by
  // React's effect lifecycle — the cleanup function runs restore() + destroy()
  // before the next effect runs (and on unmount), so every fr↔ar↔en swap
  // atomically reverts the previous target's mutations before starting fresh.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (lang === "fr") return;

    const target = lang;
    const translator = createDomTranslator({
      lookup: (text: string) => cacheRef.current[`${target}|${text}`],
      fetchTranslations: async (texts: string[]) => {
        const map = await postTranslate(texts, target);
        let cache = cacheRef.current;
        for (const text of texts) {
          const tr = map[text];
          if (tr) cache[`${target}|${text}`] = tr;
        }
        cache = trimCache(cache);
        cacheRef.current = cache;
        saveCache(cache);
        return map;
      },
    });
    translatorRef.current = translator;
    translator.retranslate();

    return () => {
      translator.restore();
      translator.destroy();
      if (translatorRef.current === translator) {
        translatorRef.current = null;
      }
    };
  }, [lang]);

  const value = useMemo<Ctx>(() => ({ lang, setLang, isRTL: lang === "ar", t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

/** Convenience: translate a FR string with the current lang. */
export function useT(): (text: string) => string {
  return useLanguage().t;
}

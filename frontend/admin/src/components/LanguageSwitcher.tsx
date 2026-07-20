import { useLanguage, type Lang } from "@/context/LanguageContext";

const OPTIONS: { code: Lang; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "ar", label: "AR" },
  { code: "en", label: "EN" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5 text-xs font-semibold">
      {OPTIONS.map((opt) => (
        <button
          key={opt.code}
          type="button"
          onClick={() => setLang(opt.code)}
          className={`px-2.5 py-1 rounded ${lang === opt.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          aria-pressed={lang === opt.code}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

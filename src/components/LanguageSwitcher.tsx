import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs font-semibold">
      <Button
        type="button"
        variant={lang === "en" ? "default" : "ghost"}
        size="sm"
        className="h-8 px-3"
        onClick={() => setLang("en")}
      >
        EN
      </Button>
      <Button
        type="button"
        variant={lang === "mr" ? "default" : "ghost"}
        size="sm"
        className="h-8 px-3"
        onClick={() => setLang("mr")}
      >
        मराठी
      </Button>
    </div>
  );
}

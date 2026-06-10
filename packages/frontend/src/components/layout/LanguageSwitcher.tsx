import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { i18n } = useTranslation("common");

  const toggleLanguage = () => {
    const newLang = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center gap-2 h-9 px-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
      onClick={toggleLanguage}
      title={i18n.language === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
    >
      <span className="text-lg leading-none">{i18n.language === "vi" ? "🇻🇳" : "🇬🇧"}</span>
      <span className="text-xs font-semibold uppercase">{i18n.language === "vi" ? "VI" : "EN"}</span>
    </Button>
  );
}

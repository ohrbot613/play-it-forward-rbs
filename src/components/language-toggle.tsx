"use client";

import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "he" : "en")}
      className={cn(
        "fixed top-3 z-50 h-8 px-2.5 rounded-full glass elevation-2 flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 hover:elevation-3 active:scale-95",
        lang === "he" ? "left-3" : "right-3"
      )}
      aria-label="Toggle language"
    >
      <span className={cn("transition-opacity", lang === "en" ? "opacity-100" : "opacity-50")}>EN</span>
      <span className="text-border">|</span>
      <span className={cn("transition-opacity", lang === "he" ? "opacity-100" : "opacity-50")}>עב</span>
    </button>
  );
}

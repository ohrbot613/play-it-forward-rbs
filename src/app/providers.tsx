"use client";

import { type ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { BottomNav } from "@/components/bottom-nav";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <LanguageToggle />
      <main className="mx-auto min-h-screen max-w-md pb-20">{children}</main>
      <BottomNav />
    </LanguageProvider>
  );
}

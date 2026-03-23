"use client";

import { type ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <TopBar />
      <main className="mx-auto min-h-screen max-w-md pt-12 pb-20">{children}</main>
      <BottomNav />
    </LanguageProvider>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import type { User } from "@supabase/supabase-js";

export function TopBar() {
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setReady(true); return; }

    supabase.auth.getUser().then((res: { data: { user: User | null } }) => {
      setUser(res.data.user ?? null);
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: unknown, session: { user: User } | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-12 border-b border-border/40 glass">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 text-sm font-bold text-primary tracking-tight"
      >
        <span className="text-base">🎲</span>
        <span>Play it Forward</span>
      </Link>

      {/* Right side — language toggle + dashboard/signin */}
      <div className="flex items-center gap-3">
        {/* Language toggle — inline in header */}
        <button
          onClick={() => setLang(lang === "en" ? "he" : "en")}
          className="h-7 px-2 rounded-full border border-border/60 flex items-center gap-1 text-[11px] font-semibold transition-colors hover:bg-accent"
          aria-label="Toggle language"
        >
          <span className={cn("transition-opacity", lang === "en" ? "opacity-100" : "opacity-40")}>EN</span>
          <span className="text-border/60">|</span>
          <span className={cn("transition-opacity", lang === "he" ? "opacity-100" : "opacity-40")}>עב</span>
        </button>

        {/* Dashboard or Sign in */}
        {ready && (
          user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              aria-label="My dashboard"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">
                {lang === "he" ? "לוח בקרה" : "Dashboard"}
              </span>
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              aria-label="Sign in"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">
                {lang === "he" ? "התחברות" : "Sign in"}
              </span>
            </Link>
          )
        )}
      </div>
    </header>
  );
}

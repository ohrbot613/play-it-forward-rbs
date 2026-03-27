"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, PlusCircle, User, MapPin, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { fetchPendingRequestCount } from "@/lib/queries";

const links: { href: string; labelKey: TranslationKey; icon: typeof Search }[] = [
  { href: "/", labelKey: "nav.browse", icon: Search },
  { href: "/map", labelKey: "nav.map", icon: MapPin },
  { href: "/add", labelKey: "nav.share", icon: PlusCircle },
  { href: "/requests", labelKey: "nav.wishes", icon: Heart },
  { href: "/profile", labelKey: "nav.profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPendingRequestCount().then(setPendingCount);
  }, [pathname]); // Re-check on navigation

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 glass">
      <div className="mx-auto flex max-w-md items-center justify-around py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {links.map(({ href, labelKey, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : (pathname?.startsWith(href) ?? false);
          const showBadge = href === "/profile" && pendingCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">
                <Icon className={cn("h-5 w-5 transition-all", active && "stroke-[2.5]")} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-coral text-white text-[9px] font-bold px-1 leading-none">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </span>
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

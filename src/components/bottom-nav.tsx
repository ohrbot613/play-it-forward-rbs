"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search, PlusCircle, User, MapPin, Heart, LayoutDashboard, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

const links: { href: string; labelKey: TranslationKey; icon: typeof Search }[] = [
  { href: "/", labelKey: "nav.browse", icon: Search },
  { href: "/map", labelKey: "nav.map", icon: MapPin },
  { href: "/add", labelKey: "nav.share", icon: PlusCircle },
  { href: "/requests", labelKey: "nav.wishes", icon: Heart },
  { href: "/leaderboard", labelKey: "nav.leaderboard", icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 glass">
      <div className="mx-auto flex max-w-md items-center justify-around py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {links.map(({ href, labelKey, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : (pathname?.startsWith(href) ?? false);
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
              <Icon className={cn("h-5 w-5 transition-all", active && "stroke-[2.5]")} />
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

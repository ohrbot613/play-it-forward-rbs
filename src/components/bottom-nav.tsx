"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Gift, Truck, Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Games", labelHe: "משחקים", icon: Gamepad2 },
  { href: "/donate", label: "Donate", labelHe: "תרומה", icon: Gift },
  { href: "/relay", label: "Relay", labelHe: "שליחות", icon: Truck },
];

export function BottomNav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/80 backdrop-blur-lg safe-area-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          onClick={toggle}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
      </div>
    </nav>
  );
}

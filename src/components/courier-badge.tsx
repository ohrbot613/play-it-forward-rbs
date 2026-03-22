"use client";

import { cn } from "@/lib/utils";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import type { BadgeId } from "@/lib/data";

const BADGE_CONFIG: Record<
  BadgeId,
  { labelKey: TranslationKey; emoji: string; bg: string; text: string; darkBg: string }
> = {
  "first-delivery": {
    labelKey: "badge.first-delivery",
    emoji: "🚀",
    bg: "bg-sky-50",
    text: "text-sky-700 dark:text-sky-300",
    darkBg: "dark:bg-sky-950/40",
  },
  "five-deliveries": {
    labelKey: "badge.five-deliveries",
    emoji: "⭐",
    bg: "bg-amber-50",
    text: "text-amber-700 dark:text-amber-300",
    darkBg: "dark:bg-amber-950/40",
  },
  "ten-deliveries": {
    labelKey: "badge.ten-deliveries",
    emoji: "🔥",
    bg: "bg-orange-50",
    text: "text-orange-700 dark:text-orange-300",
    darkBg: "dark:bg-orange-950/40",
  },
  "neighborhood-hero": {
    labelKey: "badge.neighborhood-hero",
    emoji: "🏆",
    bg: "bg-emerald-50",
    text: "text-emerald-700 dark:text-emerald-300",
    darkBg: "dark:bg-emerald-950/40",
  },
  "seven-day-streak": {
    labelKey: "badge.seven-day-streak",
    emoji: "⚡",
    bg: "bg-purple-50",
    text: "text-purple-700 dark:text-purple-300",
    darkBg: "dark:bg-purple-950/40",
  },
  "community-hero": {
    labelKey: "badge.community-hero",
    emoji: "💎",
    bg: "bg-indigo-50",
    text: "text-indigo-700 dark:text-indigo-300",
    darkBg: "dark:bg-indigo-950/40",
  },
  "speed-demon": {
    labelKey: "badge.speed-demon",
    emoji: "⚡",
    bg: "bg-rose-50",
    text: "text-rose-700 dark:text-rose-300",
    darkBg: "dark:bg-rose-950/40",
  },
  "cross-neighborhood": {
    labelKey: "badge.cross-neighborhood",
    emoji: "🌉",
    bg: "bg-teal-50",
    text: "text-teal-700 dark:text-teal-300",
    darkBg: "dark:bg-teal-950/40",
  },
};

export type BadgeVariant = BadgeId;

export function CourierBadge({
  variant,
  size = "sm",
}: {
  variant: BadgeVariant;
  size?: "sm" | "md" | "lg";
}) {
  const { t } = useLanguage();
  const config = BADGE_CONFIG[variant];
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        config.bg,
        config.darkBg,
        config.text,
        size === "sm" && "px-2 py-0.5 text-2xs",
        size === "md" && "px-3 py-1 text-xs",
        size === "lg" && "px-4 py-1.5 text-sm"
      )}
    >
      <span>{config.emoji}</span>
      {t(config.labelKey)}
    </span>
  );
}

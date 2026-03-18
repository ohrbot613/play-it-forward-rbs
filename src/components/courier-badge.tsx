"use client";

import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "first-delivery"
  | "five-deliveries"
  | "ten-deliveries"
  | "neighborhood-hero"
  | "seven-day-streak";

const BADGE_CONFIG: Record<
  BadgeVariant,
  { label: string; emoji: string; bg: string; text: string }
> = {
  "first-delivery": {
    label: "First Delivery",
    emoji: "🚀",
    bg: "bg-sky-50",
    text: "text-sky-700",
  },
  "five-deliveries": {
    label: "5 Deliveries",
    emoji: "⭐",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  "ten-deliveries": {
    label: "10 Deliveries",
    emoji: "🔥",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  "neighborhood-hero": {
    label: "Neighborhood Hero",
    emoji: "🏆",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  "seven-day-streak": {
    label: "7-Day Streak",
    emoji: "⚡",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
};

export function CourierBadge({
  variant,
  size = "sm",
}: {
  variant: BadgeVariant;
  size?: "sm" | "md";
}) {
  const config = BADGE_CONFIG[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        config.bg,
        config.text,
        size === "sm" ? "px-2 py-0.5 text-2xs" : "px-3 py-1 text-xs"
      )}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
}

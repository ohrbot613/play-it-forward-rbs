"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Package, UserPlus, Heart, Repeat, Gift, Star, Hand, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { MOCK_GAMES, MOCK_USERS } from "@/lib/data";
import { getRecentActivity, type ActivityItem } from "@/lib/queries";

type ActivityType = "game-added" | "request-fulfilled" | "new-member" | "game-shared" | "game-donated" | "review" | "request" | "milestone";

const ACTIVITY_ICONS: Record<ActivityType, { icon: typeof Package; bg: string; color: string }> = {
  "game-added": { icon: Package, bg: "bg-sky-50", color: "text-sky-600" },
  "request-fulfilled": { icon: Heart, bg: "bg-emerald-50", color: "text-emerald-600" },
  "new-member": { icon: UserPlus, bg: "bg-purple-50", color: "text-purple-600" },
  "game-shared": { icon: Repeat, bg: "bg-primary/10", color: "text-primary" },
  "game-donated": { icon: Gift, bg: "bg-coral/10", color: "text-coral" },
  review: { icon: Star, bg: "bg-sunshine/10", color: "text-sunshine" },
  request: { icon: Hand, bg: "bg-amber-50", color: "text-amber-600" },
  milestone: { icon: PartyPopper, bg: "bg-emerald-50", color: "text-emerald-600" },
};

/** Returns an ISO timestamp string offset by `hoursAgo` hours from now */
function hoursBack(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

function timeAgo(timestamp: string, t: (key: TranslationKey, replacements?: Record<string, string | number>) => string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 60) return t("time.just_now");
  if (diffHr < 24) return t("time.hr_ago", { count: diffHr });
  if (diffDay === 1) return t("time.yesterday");
  if (diffDay < 7) return t("time.days_ago", { count: diffDay });
  return t("time.weeks_ago", { count: Math.floor(diffDay / 7) });
}

/** Pick a first-name initial from a full name. E.g. "Miriam Katz" → "Miriam K." */
function shortName(fullName: string): string {
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return fullName;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

/** Computed fallback activity derived from mock data — used when Supabase is unavailable */
function buildFallbackActivity(): ActivityItem[] {
  const games = MOCK_GAMES.slice(0, 20);
  const users = MOCK_USERS;

  const u = (i: number) => users[i % users.length];
  const g = (i: number) => games[i % games.length];

  return [
    {
      id: "act-1",
      type: "game-shared",
      message: `${shortName(u(0).name)} shared ${g(0).title} with ${shortName(u(1).name)}`,
      timestamp: hoursBack(2),
      neighborhood: u(0).neighborhood,
    },
    {
      id: "act-2",
      type: "new-member",
      message: `${shortName(u(2).name)} joined Play it Forward from ${u(2).neighborhood}`,
      timestamp: hoursBack(5),
      neighborhood: u(2).neighborhood,
    },
    {
      id: "act-3",
      type: "game-added",
      message: `${shortName(u(3).name)} added ${g(3).title} to the catalog`,
      timestamp: hoursBack(18),
      neighborhood: u(3).neighborhood,
    },
    {
      id: "act-4",
      type: "request-fulfilled",
      message: `${g(4).title} request fulfilled for ${shortName(u(4).name)}`,
      timestamp: hoursBack(26),
      neighborhood: u(4).neighborhood,
    },
    {
      id: "act-5",
      type: "game-donated",
      message: `${shortName(u(5 % users.length).name)} donated ${g(5).title} to the community library`,
      timestamp: hoursBack(34),
      neighborhood: u(5 % users.length).neighborhood,
    },
    {
      id: "act-6",
      type: "review",
      message: `${shortName(u(1).name)} left a 5-star review for ${g(6).title}`,
      timestamp: hoursBack(42),
      neighborhood: u(1).neighborhood,
    },
    {
      id: "act-7",
      type: "request",
      message: `${g(7).requestCount + 1} people requested ${g(7).title} this week`,
      timestamp: hoursBack(55),
      neighborhood: u(2).neighborhood,
    },
    {
      id: "act-8",
      type: "new-member",
      message: `${shortName(u(4 % users.length).name)} joined from ${u(4 % users.length).neighborhood}`,
      timestamp: hoursBack(68),
      neighborhood: u(4 % users.length).neighborhood,
    },
    {
      id: "act-9",
      type: "game-shared",
      message: `${shortName(u(0).name)} shared ${g(8).title} with a neighbour`,
      timestamp: hoursBack(80),
      neighborhood: u(0).neighborhood,
    },
    {
      id: "act-10",
      type: "milestone",
      message: `Community hit ${Math.max(200, MOCK_GAMES.reduce((sum, game) => sum + game.handoffs, 0))} total shares!`,
      timestamp: hoursBack(96),
      neighborhood: "All",
    },
  ];
}

export function ActivityFeed() {
  const { t } = useLanguage();
  const fallback = useMemo(buildFallbackActivity, []);

  const [activity, setActivity] = useState<ActivityItem[]>(fallback);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getRecentActivity(10).then((items) => {
      if (cancelled) return;
      if (items.length > 0) {
        setActivity(items);
        setIsLive(true);
      }
      // If empty (Supabase unavailable / no data yet), keep the fallback silently
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-8 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold tracking-tight">{t("activity.title")}</h2>
        <span className="text-2xs text-muted-foreground font-medium">
          {isLive ? t("activity.live") : t("activity.demo")}
        </span>
      </div>

      <div className="space-y-2.5">
        {activity.map((item, i) => {
          const config = ACTIVITY_ICONS[item.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className="flex items-start gap-3 rounded-2xl bg-white p-3.5 elevation-1"
            >
              <div className={cn("shrink-0 h-9 w-9 rounded-xl flex items-center justify-center", config.bg)}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{item.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xs text-muted-foreground">{timeAgo(item.timestamp, t)}</span>
                  <span className="text-2xs text-border">·</span>
                  <span className="text-2xs text-muted-foreground">{item.neighborhood}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

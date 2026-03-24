"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getTopCouriers, type CourierProfile, type BadgeId } from "@/lib/data";
import { fetchTopCouriers, type CourierStat } from "@/lib/queries";
import { CourierBadge } from "@/components/courier-badge";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Trophy, Flame, Truck, ChevronDown, ChevronUp, Zap, Medal } from "lucide-react";

const RANK_STYLES = [
  "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30",
  "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30",
  "bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30",
];

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
          RANK_STYLES[rank - 1]
        )}
      >
        {rank}
      </div>
    );
  }
  return (
    <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold bg-muted text-muted-foreground shrink-0">
      {rank}
    </div>
  );
}

function StreakFire({ days }: { days: number }) {
  if (days === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-2xs font-semibold text-orange-600 dark:text-orange-400">
      <Flame className="h-3 w-3" />
      {days}
    </span>
  );
}

function CourierRow({
  courier,
  rank,
  index,
}: {
  courier: CourierProfile;
  rank: number;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t, lang } = useLanguage();

  const deliveryLabel =
    courier.totalDeliveries === 1 ? t("lb.delivery") : t("lb.deliveries");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full text-start rounded-2xl p-3 transition-all duration-200",
          "bg-white dark:bg-white/5 elevation-1 hover:elevation-2",
          rank <= 3 && "ring-1 ring-primary/10"
        )}
      >
        <div className="flex items-center gap-3">
          <RankBadge rank={rank} />

          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={courier.avatar}
              alt={courier.name}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
            />
            {courier.currentStreak >= 7 && (
              <span className="absolute -bottom-0.5 -right-0.5 text-xs">🔥</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground truncate">
                {courier.name}
              </span>
              <StreakFire days={courier.currentStreak} />
            </div>
            <div className="flex items-center gap-2 text-2xs text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground">
                {courier.totalDeliveries}
              </span>{" "}
              {deliveryLabel}
              <span className="text-border">·</span>
              <span>{courier.neighborhood}</span>
            </div>
          </div>

          {/* Expand toggle */}
          <div className="shrink-0 text-muted-foreground">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-muted/50 p-2">
                    <div className="text-lg font-bold text-foreground">
                      {courier.totalDeliveries}
                    </div>
                    <div className="text-2xs text-muted-foreground">
                      {t("lb.total_deliveries")}
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-2">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
                      {courier.currentStreak}
                      {courier.currentStreak > 0 && (
                        <Flame className="h-4 w-4" />
                      )}
                    </div>
                    <div className="text-2xs text-muted-foreground">
                      {t("lb.current_streak")}
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-2">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {courier.longestStreak}
                    </div>
                    <div className="text-2xs text-muted-foreground">
                      {t("lb.longest_streak")}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                {courier.badges.length > 0 && (
                  <div>
                    <div className="text-2xs font-medium text-muted-foreground mb-1.5">
                      {t("lb.badges")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {courier.badges.map((badge) => (
                        <CourierBadge key={badge} variant={badge} size="sm" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Courier since */}
                <div className="text-2xs text-muted-foreground">
                  {t("lb.courier_since")}{" "}
                  {new Date(courier.joinedAt).toLocaleDateString(
                    lang === "he" ? "he-IL" : "en-US",
                    { month: "short", year: "numeric" }
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [liveStats, setLiveStats] = useState<CourierStat[]>([]);
  const mockCouriers = getTopCouriers(10);
  const { t } = useLanguage();

  useEffect(() => {
    fetchTopCouriers(10).then((data) => {
      if (data.length > 0) setLiveStats(data);
    });
  }, []);

  // Use real data if available, fall back to mock
  // Map CourierStat → CourierProfile shape (streak/badge fields default to 0/[])
  const couriers: CourierProfile[] = liveStats.length > 0
    ? liveStats.map((s) => ({
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        neighborhood: s.neighborhood,
        totalDeliveries: s.totalDeliveries,
        currentStreak: 0,
        longestStreak: 0,
        badges: [] as BadgeId[],
        joinedAt: s.joinedAt,
        lastDeliveryAt: s.joinedAt,
        gamesDelivered: [],
      }))
    : mockCouriers;

  const totalDeliveries = couriers.reduce((s, c) => s + c.totalDeliveries, 0);
  const totalStreakDays = couriers.reduce((s, c) => s + c.currentStreak, 0);
  const totalBadges = couriers.reduce((s, c) => s + c.badges.length, 0);

  return (
    <div className="px-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative pt-8 pb-6"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 bg-gradient-to-b from-primary/[0.04] via-amber-500/[0.03] to-transparent -z-10 rounded-b-[40%]" />
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
            {t("lb.title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px]">
          {t("lb.subtitle")}
        </p>
      </motion.div>

      {/* Summary stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-3 gap-2 mb-6"
      >
        <div className="rounded-2xl bg-white dark:bg-white/5 elevation-1 p-3 text-center">
          <Truck className="h-4 w-4 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{totalDeliveries}</div>
          <div className="text-2xs text-muted-foreground">{t("lb.deliveries")}</div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-white/5 elevation-1 p-3 text-center">
          <Zap className="h-4 w-4 text-orange-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{totalStreakDays}</div>
          <div className="text-2xs text-muted-foreground">{t("lb.active_streak")}</div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-white/5 elevation-1 p-3 text-center">
          <Medal className="h-4 w-4 text-purple-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{totalBadges}</div>
          <div className="text-2xs text-muted-foreground">{t("lb.badges")}</div>
        </div>
      </motion.div>

      {/* Leaderboard list */}
      <div className="space-y-2">
        {couriers.map((courier, i) => (
          <CourierRow
            key={courier.id}
            courier={courier}
            rank={i + 1}
            index={i}
          />
        ))}
      </div>

      {/* CTA to become a courier */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-8 rounded-2xl bg-gradient-to-br from-primary/10 to-amber-500/10 dark:from-primary/20 dark:to-amber-500/20 p-5 text-center"
      >
        <div className="text-3xl mb-2">🚴</div>
        <h3 className="text-sm font-bold text-foreground mb-1">
          {t("lb.become_courier")}
        </h3>
        <p className="text-2xs text-muted-foreground mb-3">
          {t("lb.become_courier_sub")}
        </p>
        <Link href="/relay" className="inline-block px-5 py-2.5 rounded-full bg-primary text-white text-xs font-semibold elevation-2 hover:elevation-3 transition-all">
          {t("lb.become_courier_cta")}
        </Link>
      </motion.div>
    </div>
  );
}

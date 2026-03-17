"use client";

import { motion } from "framer-motion";
import { Package, UserPlus, Heart, Repeat, Gift, Star, Hand, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

type ActivityType = "game-added" | "request-fulfilled" | "new-member" | "game-shared" | "game-donated" | "review" | "request" | "milestone";

interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  neighborhood: string;
}

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

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "a1",
    type: "game-shared",
    message: "Miriam K. shared Settlers of Catan with Yosef L.",
    timestamp: "2026-03-17T09:30:00",
    neighborhood: "RBS Aleph",
  },
  {
    id: "a2",
    type: "new-member",
    message: "Chana R. joined Play it Forward from RBS Bet",
    timestamp: "2026-03-17T08:15:00",
    neighborhood: "RBS Bet",
  },
  {
    id: "a3",
    type: "game-added",
    message: "Sarah B. added LEGO City Police Station to the catalog",
    timestamp: "2026-03-16T19:45:00",
    neighborhood: "RBS Bet",
  },
  {
    id: "a4",
    type: "request-fulfilled",
    message: "Ticket to Ride request fulfilled for Devorah G.",
    timestamp: "2026-03-16T17:20:00",
    neighborhood: "RBS Aleph",
  },
  {
    id: "a5",
    type: "game-donated",
    message: "Avi M. donated Pandemic to the community library",
    timestamp: "2026-03-16T14:00:00",
    neighborhood: "RBS Aleph",
  },
  {
    id: "a6",
    type: "review",
    message: "Rivka S. left a 5-star review for Codenames",
    timestamp: "2026-03-16T11:30:00",
    neighborhood: "RBS Gimmel",
  },
  {
    id: "a7",
    type: "request",
    message: "3 people requested Dixit this week",
    timestamp: "2026-03-15T20:00:00",
    neighborhood: "RBS Aleph",
  },
  {
    id: "a8",
    type: "new-member",
    message: "Moshe and Leah F. joined from Old Beit Shemesh",
    timestamp: "2026-03-15T16:30:00",
    neighborhood: "Old Beit Shemesh",
  },
  {
    id: "a9",
    type: "game-shared",
    message: "Azriel K. shared Magnetic Tiles set with neighbor",
    timestamp: "2026-03-15T14:15:00",
    neighborhood: "RBS Gimmel",
  },
  {
    id: "a10",
    type: "milestone",
    message: "Community hit 200 total shares!",
    timestamp: "2026-03-15T10:00:00",
    neighborhood: "All",
  },
  {
    id: "a11",
    type: "game-added",
    message: "Nechama W. added 3 puzzle sets to the catalog",
    timestamp: "2026-03-14T18:00:00",
    neighborhood: "RBS Aleph",
  },
  {
    id: "a12",
    type: "request-fulfilled",
    message: "Kingdomino delivered to Tzvi B. via relay volunteer",
    timestamp: "2026-03-14T15:30:00",
    neighborhood: "RBS Bet",
  },
];

function timeAgo(timestamp: string): string {
  const now = new Date("2026-03-17T12:00:00");
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  return `${diffDay}d ago`;
}

export function ActivityFeed() {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-8 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold tracking-tight">{t("activity.title")}</h2>
        <span className="text-2xs text-muted-foreground font-medium">{t("activity.live")}</span>
      </div>

      <div className="space-y-2.5">
        {MOCK_ACTIVITY.map((item, i) => {
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
                  <span className="text-2xs text-muted-foreground">{timeAgo(item.timestamp)}</span>
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

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { GameCard } from "@/components/game-card";
import { CATEGORIES, NEIGHBORHOODS, SORT_OPTIONS, MOCK_GAMES, getDistance, type Game, type GameCategory, type SortOption } from "@/lib/data";
import { fetchGames, fetchGameStats } from "@/lib/queries";
import { Search, X, ChevronDown, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ActivityFeed } from "@/components/activity-feed";
import { useLanguage } from "@/lib/i18n";
import { HotRightNow } from "@/components/hot-right-now";

const DISTANCE_OPTIONS = [
  { label: "0.5km", value: 0.5 },
  { label: "1km", value: 1 },
  { label: "2km", value: 2 },
  { label: "5km", value: 5 },
  { label: "10km+", value: "all" as const },
];

const NEIGHBORHOOD_KEYS: Record<string, string> = {
  "RBS Aleph": "neighborhood.rbs_aleph",
  "RBS Bet": "neighborhood.rbs_bet",
  "RBS Gimmel": "neighborhood.rbs_gimmel",
  "RBS Dalet": "neighborhood.rbs_dalet",
  "RBS Hey": "neighborhood.rbs_hey",
  "Old Beit Shemesh": "neighborhood.old_bs",
};

const SORT_KEYS: Record<string, string> = {
  closest: "sort.closest",
  newest: "sort.newest",
  "top-rated": "sort.top_rated",
  "most-shared": "sort.most_shared",
  category: "sort.category",
};

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GameCategory | "all">("all");
  const [neighborhood, setNeighborhood] = useState<typeof NEIGHBORHOODS[number] | "all">("all");
  const [sort, setSort] = useState<SortOption>("closest");
  const [maxDistance, setMaxDistance] = useState<number | "all">("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const { t, lang } = useLanguage();

  // Real data from Supabase
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [totalShares, setTotalShares] = useState(0);
  const [usingLiveData, setUsingLiveData] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    fetchGames().then((liveGames) => {
      if (liveGames.length > 0) {
        setAllGames(liveGames);
        setTotalShares(liveGames.reduce((sum, g) => sum + g.handoffs, 0));
        setUsingLiveData(true);
      } else {
        // Fall back to mock catalog when Supabase is not configured (demo mode)
        setAllGames(MOCK_GAMES);
        setTotalShares(MOCK_GAMES.reduce((sum, g) => sum + g.handoffs, 0));
      }
      setGamesLoading(false);
    }).catch(() => {
      setAllGames(MOCK_GAMES);
      setTotalShares(MOCK_GAMES.reduce((sum, g) => sum + g.handoffs, 0));
      setGamesLoading(false);
    });

    fetchGameStats().then(({ totalShares: shares, totalGames }) => {
      if (totalGames > 0) {
        setTotalShares(shares);
      }
    });
  }, []);

  const games = useMemo(() => {
    let filtered = allGames;

    if (category !== "all") {
      filtered = filtered.filter((g) => g.category === category);
    }

    if (neighborhood !== "all") {
      filtered = filtered.filter((g) => g.neighborhood === neighborhood);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
      );
    }

    if (maxDistance !== "all") {
      filtered = filtered.filter((g) => getDistance(g) <= maxDistance);
    }

    if (availableOnly) {
      filtered = filtered.filter((g) => g.available);
    }

    const sorted = [...filtered];
    if (sort === "closest") {
      sorted.sort((a, b) => getDistance(a) - getDistance(b));
    } else if (sort === "category") {
      sorted.sort((a, b) => a.category.localeCompare(b.category));
    } else if (sort === "newest") {
      sorted.sort((a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime());
    } else if (sort === "most-shared") {
      sorted.sort((a, b) => b.handoffs - a.handoffs);
    } else if (sort === "top-rated") {
      sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    }

    return sorted;
  }, [allGames, search, category, neighborhood, sort, maxDistance, availableOnly]);

  return (
    <div className="px-4">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative pt-8 pb-6"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 bg-gradient-to-b from-primary/[0.04] via-sunshine/[0.03] to-transparent -z-10 rounded-b-[40%]" />
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
            {t("app.title")}
          </h1>
          <Sparkles className="h-5 w-5 text-sunshine" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
          {t("app.subtitle")}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", usingLiveData ? "bg-emerald-400" : "bg-amber-400")} />
            <span className="font-medium text-foreground">{allGames.length}</span> {t("app.games_live")}
          </span>
          <span className="text-border">|</span>
          <span>
            <span className="font-medium text-foreground">{totalShares}</span> {t("app.shares_counting")}
          </span>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-4"
      >
        <div className="relative">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", lang === "he" ? "right-3.5" : "left-3.5")} />
          <Input
            placeholder={t("search.placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn("bg-white border-0 elevation-1 h-12 rounded-2xl text-sm focus-visible:elevation-2 transition-shadow", lang === "he" ? "pr-10 pl-10" : "pl-10")}
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch("")}
                className={cn("absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted flex items-center justify-center", lang === "he" ? "left-3.5" : "right-3.5")}
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Hot Right Now */}
      <HotRightNow games={allGames} />

      {/* Category Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-4 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
      >
        {[{ value: "all" as const, label: t("category.all"), emoji: "" }, ...CATEGORIES].map((c) => {
          const isActive = category === c.value;
          return (
            <button
              key={c.value}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-foreground text-white elevation-2"
                  : "bg-white text-muted-foreground elevation-1 hover:elevation-2"
              )}
              onClick={() => setCategory(c.value)}
            >
              {c.emoji ? `${c.emoji} ` : ""}{c.value === "all" ? c.label : c.label}
            </button>
          );
        })}
      </motion.div>

      {/* Neighborhood Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.16 }}
        className="mb-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
      >
        <button
          className={cn(
            "shrink-0 px-3.5 py-1.5 rounded-full text-2xs font-medium transition-all duration-200",
            neighborhood === "all"
              ? "bg-primary text-white elevation-2"
              : "bg-white text-muted-foreground elevation-1 hover:elevation-2"
          )}
          onClick={() => setNeighborhood("all")}
        >
          {t("neighborhood.all")}
        </button>
        {NEIGHBORHOODS.map((n) => {
          const isActive = neighborhood === n;
          return (
            <button
              key={n}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-2xs font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-white elevation-2"
                  : "bg-white text-muted-foreground elevation-1 hover:elevation-2"
              )}
              onClick={() => setNeighborhood(n)}
            >
              {NEIGHBORHOOD_KEYS[n] ? t(NEIGHBORHOOD_KEYS[n] as never) : n}
            </button>
          );
        })}
      </motion.div>

      {/* Distance Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="mb-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
      >
        {DISTANCE_OPTIONS.map((d) => {
          const isActive = maxDistance === d.value;
          return (
            <button
              key={d.label}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-2xs font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-white elevation-2"
                  : "bg-white text-muted-foreground elevation-1 hover:elevation-2"
              )}
              onClick={() => setMaxDistance(d.value)}
            >
              {d.label}
            </button>
          );
        })}
      </motion.div>

      {/* Availability Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-4 flex items-center gap-2"
      >
        <button
          onClick={() => setAvailableOnly(!availableOnly)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors duration-200",
            availableOnly ? "bg-primary" : "bg-border"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white elevation-1 transition-transform duration-200",
              availableOnly && "translate-x-5"
            )}
          />
        </button>
        <span className="text-xs text-muted-foreground font-medium">
          {availableOnly ? t("filter.available_only") : t("filter.all_games")}
        </span>
      </motion.div>

      {/* Stats + Sort */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{games.length} {t("filter.results")}</span>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="appearance-none bg-white rounded-xl pl-3 pr-7 py-1.5 text-xs font-medium elevation-1 border-0 cursor-pointer focus:outline-none"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {SORT_KEYS[s.value] ? t(SORT_KEYS[s.value] as keyof typeof SORT_KEYS & string as never) : s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-muted-foreground" />
        </div>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        {gamesLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white elevation-2">
                <Skeleton className="h-40 w-full rounded-none" />
                <div className="p-3.5 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-3 pt-1">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              </div>
            ))
          : games.map((game, i) => (
              <GameCard key={game.id} game={game} index={i} />
            ))}
      </div>

      {/* Activity Feed */}
      <ActivityFeed />

      <AnimatePresence>
        {!gamesLoading && games.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-16 text-center pb-8"
          >
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">{t("empty.no_games")}</p>
            <p className="text-xs text-muted-foreground">
              {t("empty.adjust_filters")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

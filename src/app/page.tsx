"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { GameCard } from "@/components/game-card";
import { MOCK_GAMES, CATEGORIES, SORT_OPTIONS, getDistance, type GameCategory, type SortOption } from "@/lib/data";
import { Search, X, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GameCategory | "all">("all");
  const [sort, setSort] = useState<SortOption>("closest");

  const games = useMemo(() => {
    let filtered = MOCK_GAMES;

    if (category !== "all") {
      filtered = filtered.filter((g) => g.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
      );
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
  }, [search, category, sort]);

  const totalShares = MOCK_GAMES.reduce((sum, g) => sum + g.handoffs, 0);

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
            Play it Forward
          </h1>
          <Sparkles className="h-5 w-5 text-sunshine" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
          Free game sharing across Ramat Beit Shemesh
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-medium text-foreground">{MOCK_GAMES.length}</span> games live
          </span>
          <span className="text-border">|</span>
          <span>
            <span className="font-medium text-foreground">{totalShares}</span> shares & counting
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-0 elevation-1 h-12 rounded-2xl text-sm focus-visible:elevation-2 transition-shadow"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Category Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-4 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
      >
        {[{ value: "all" as const, label: "All", emoji: "" }, ...CATEGORIES].map((c) => {
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
              {c.emoji ? `${c.emoji} ` : ""}{c.label}
            </button>
          );
        })}
      </motion.div>

      {/* Stats + Sort */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{games.length} results</span>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="appearance-none bg-white rounded-xl pl-3 pr-7 py-1.5 text-xs font-medium elevation-1 border-0 cursor-pointer focus:outline-none"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-muted-foreground" />
        </div>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        {games.map((game, i) => (
          <GameCard key={game.id} game={game} index={i} />
        ))}
      </div>

      <AnimatePresence>
        {games.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-16 text-center pb-8"
          >
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No games found</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

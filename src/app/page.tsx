"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "@/components/game-card";
import { MOCK_GAMES, NEIGHBORHOODS, type Neighborhood } from "@/lib/data";
import { MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [filter, setFilter] = useState<Neighborhood | "all">("all");

  const games =
    filter === "all" ? MOCK_GAMES : MOCK_GAMES.filter((g) => g.neighborhood === filter);

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Play it Forward</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Free board game lending across RBS
        </p>
        <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">
          השאלת משחקי קופסא חינם ברמת בית שמש
        </p>
      </div>

      {/* Location Filters */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Badge
          variant={filter === "all" ? "default" : "outline"}
          className={cn(
            "cursor-pointer whitespace-nowrap transition-all",
            filter === "all" && "shadow-md"
          )}
          onClick={() => setFilter("all")}
        >
          <MapPin className="mr-1 h-3 w-3" />
          All
        </Badge>
        {NEIGHBORHOODS.map((n) => (
          <Badge
            key={n}
            variant={filter === n ? "default" : "outline"}
            className={cn(
              "cursor-pointer whitespace-nowrap transition-all",
              filter === n && "shadow-md"
            )}
            onClick={() => setFilter(n)}
          >
            {n}
          </Badge>
        ))}
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card p-2 text-center border">
          <div className="text-lg font-bold text-primary">{MOCK_GAMES.length}</div>
          <div className="text-[10px] text-muted-foreground">Games</div>
        </div>
        <div className="rounded-lg bg-card p-2 text-center border">
          <div className="text-lg font-bold text-primary">
            {MOCK_GAMES.filter((g) => g.status === "available").length}
          </div>
          <div className="text-[10px] text-muted-foreground">Available</div>
        </div>
        <div className="rounded-lg bg-card p-2 text-center border">
          <div className="text-lg font-bold text-primary">{NEIGHBORHOODS.length}</div>
          <div className="text-[10px] text-muted-foreground">Neighborhoods</div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-2 gap-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {games.length === 0 && (
        <div className="mt-12 text-center text-sm text-muted-foreground">
          No games in this neighborhood yet. Be the first to donate!
        </div>
      )}
    </div>
  );
}

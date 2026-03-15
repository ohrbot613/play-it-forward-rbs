import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Users, Clock } from "lucide-react";
import type { Game } from "@/lib/data";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  available: "bg-green-500/20 text-green-400 border-green-500/30",
  requested: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "in-transit": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  borrowed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const conditionLabels: Record<string, string> = {
  "like-new": "Like New",
  good: "Good",
  fair: "Fair",
};

export function GameCard({ game }: { game: Game }) {
  return (
    <Link href={`/game/${game.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
        <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Gamepad2 className="h-12 w-12 text-primary/40 group-hover:text-primary/60 transition-colors" />
          <Badge
            variant="outline"
            className={cn("absolute top-2 right-2 text-[10px]", statusColors[game.status])}
          >
            {game.status}
          </Badge>
        </div>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{game.name}</h3>
              <p className="text-xs text-muted-foreground truncate" dir="rtl">
                {game.nameHe}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {game.minPlayers}-{game.maxPlayers}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {game.ageRange}
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {conditionLabels[game.condition]}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="outline" className="text-[10px]">
              {game.neighborhood}
            </Badge>
            <span className="text-[10px] text-muted-foreground">by {game.donorName}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

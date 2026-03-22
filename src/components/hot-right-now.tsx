"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Flame, Star, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Game } from "@/lib/data";
import { getCategoryEmoji, formatDistance } from "@/lib/data";
import { useLanguage } from "@/lib/i18n";

export function HotRightNow({ games }: { games: Game[] }) {
  const { t } = useLanguage();

  const hotGames = useMemo(() => {
    return [...games]
      .sort((a, b) => (b.requestCount + b.handoffs) - (a.requestCount + a.handoffs))
      .slice(0, 4);
  }, [games]);

  if (hotGames.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      className="mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-4 w-4 text-orange-500" />
        <h2 className="text-sm font-semibold text-foreground">{t("hot.title")}</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {hotGames.map((game, i) => {
          const hasPhoto = game.photos.length > 0;
          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="shrink-0 w-[160px]"
            >
              <div
                role="link"
                tabIndex={0}
                onClick={() => { window.location.href = `/game/${game.id}`; }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") window.location.href = `/game/${game.id}`; }}
                className="cursor-pointer"
              >
                <Card className="overflow-hidden border-0 elevation-2 hover:elevation-4 bg-white transition-shadow duration-300">
                  {/* Image */}
                  <div className="relative h-24 overflow-hidden">
                    {hasPhoto ? (
                      <Image
                        src={game.photos[0]}
                        alt={game.title}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-orange-100 via-sunshine/10 to-coral/10 flex items-center justify-center">
                        <span className="text-3xl">{getCategoryEmoji(game.category)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                    {/* Fire badge */}
                    {game.requestCount > 0 && (
                      <div className="absolute bottom-1.5 left-1.5 bg-orange-500 text-white rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                        <span>🔥</span>
                        <span>{game.requestCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-2.5">
                    <h3 className="font-semibold text-xs truncate leading-tight">{game.title}</h3>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-sunshine text-sunshine" />
                        {game.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {formatDistance(game)}
                      </span>
                    </div>

                    {game.requestCount > 0 && (
                      <p className="mt-1 text-[10px] font-medium text-orange-600 dark:text-orange-400 truncate">
                        {t("hot.families_want", { count: game.requestCount })}
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Star, Hand, BookOpen } from "lucide-react";
import type { Game } from "@/lib/data";
import { getCategoryEmoji, getCategoryLabel, formatDistance } from "@/lib/data";
import { useLanguage } from "@/lib/i18n";

export function GameCard({ game, index = 0 }: { game: Game; index?: number }) {
  const { t } = useLanguage();

  const conditionConfig: Record<string, { bg: string; text: string; key: "game.like_new" | "game.good" | "game.fair" }> = {
    "like-new": { bg: "bg-emerald-50", text: "text-emerald-700", key: "game.like_new" },
    good: { bg: "bg-sky-50", text: "text-sky-700", key: "game.good" },
    fair: { bg: "bg-amber-50", text: "text-amber-700", key: "game.fair" },
  };

  const condition = conditionConfig[game.condition];
  const hasPhoto = game.photos.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/game/${game.id}`}>
        <Card className="group overflow-hidden border-0 elevation-2 hover:elevation-4 bg-white transition-shadow duration-300">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            {/* Image */}
            <div className="relative h-40 overflow-hidden">
              {hasPhoto ? (
                <Image
                  src={game.photos[0]}
                  alt={game.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 448px) 50vw, 224px"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/10 via-sunshine/10 to-coral/10 flex items-center justify-center">
                  <span className="text-4xl">{getCategoryEmoji(game.category)}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <Badge
                className={`absolute top-2.5 right-2.5 text-2xs border-0 font-medium ${condition.bg} ${condition.text}`}
              >
                {t(condition.key)}
              </Badge>
              {game.handoffs > 0 && (
                <div className="absolute top-2.5 left-2.5 glass rounded-full px-2.5 py-1 text-2xs font-semibold text-primary">
                  {t("game.shared_x", { count: game.handoffs })}
                </div>
              )}
              {/* Ownership badge */}
              {game.ownershipType === "lent" && (
                <div className="absolute bottom-2 left-2 bg-amber-50 text-amber-700 rounded-full px-2 py-0.5 text-2xs font-medium">
                  {t("game.on_loan")}
                </div>
              )}
              {game.ownershipType === "donated" && (
                <div className="absolute bottom-2 left-2 bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 text-2xs font-medium">
                  {t("game.community_game")}
                </div>
              )}
              {/* Unavailable overlay */}
              {!game.available && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white/90 text-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
                    {t("game.currently_out")}
                  </span>
                </div>
              )}
            </div>

            <CardContent className="p-3.5">
              <h3 className="font-semibold text-sm truncate leading-tight">{game.title}</h3>
              <p className="text-2xs text-muted-foreground mt-1 font-medium">
                {getCategoryLabel(game.category)}
              </p>

              <div className="mt-2.5 flex items-center gap-3 text-2xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-sunshine text-sunshine" />
                  {game.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {game.minPlayers === game.maxPlayers
                    ? game.minPlayers
                    : `${game.minPlayers}-${game.maxPlayers}`}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {formatDistance(game)}
                </span>
                {game.requestCount > 0 && (
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <Hand className="h-3 w-3" />
                    {game.requestCount}
                  </span>
                )}
              </div>

              {game.handoffs > 0 && (
                <Link
                  href={`/game/${game.id}/journey`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 flex items-center gap-1 text-2xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <BookOpen className="h-3 w-3" />
                  {t("game.see_journey")}
                </Link>
              )}
            </CardContent>
          </motion.div>
        </Card>
      </Link>
    </motion.div>
  );
}

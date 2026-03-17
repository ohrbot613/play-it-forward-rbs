"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { getGame, getUser, getGameReviews, getCategoryEmoji, getCategoryLabel, formatWhatsAppLink, formatWhatsAppRequest, formatDistance, canBorrow, COMPLEXITY_LABELS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { RequestGameModal } from "@/components/request-game-modal";
import { ArrowLeft, Users, MapPin, Heart, MessageCircle, Share2, Repeat, Clock, Star, Timer, Brain, ThumbsUp, Hand } from "lucide-react";

const conditionConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  "like-new": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "Like New" },
  good: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-400", label: "Good" },
  fair: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", label: "Fair" },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const game = getGame(id);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [localRequestCount, setLocalRequestCount] = useState(0);

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <p className="text-sm font-medium mb-1">Game not found</p>
        <p className="text-xs text-muted-foreground mb-4">It may have been removed</p>
        <Button variant="ghost" onClick={() => router.push("/")} className="text-sm">
          Back to games
        </Button>
      </div>
    );
  }

  const whatsappUrl = formatWhatsAppRequest(game.currentHolder.phone, game.title, "Guest", game.ownershipType);
  const owner = getUser(game.ownerId);
  const condition = conditionConfig[game.condition];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${game.title} — Play it Forward`,
        text: `Check out "${game.title}" on Play it Forward! Free game sharing in RBS.`,
        url: window.location.href,
      });
    }
  };

  return (
    <div>
      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative h-64 w-full"
      >
        {game.photos.length > 0 ? (
          <Image
            src={game.photos[0]}
            alt={game.title}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 via-sunshine/10 to-coral/10 flex items-center justify-center">
            <span className="text-6xl">{getCategoryEmoji(game.category)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 h-9 w-9 rounded-full glass flex items-center justify-center transition-transform hover:scale-105"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 h-9 w-9 rounded-full glass flex items-center justify-center transition-transform hover:scale-105"
        >
          <Share2 className="h-4 w-4 text-foreground" />
        </button>

        {/* Condition badge */}
        <div className={`absolute bottom-4 right-4 ${condition.bg} ${condition.text} rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5`}>
          <span className={`h-1.5 w-1.5 rounded-full ${condition.dot}`} />
          {condition.label}
        </div>

        {/* Handoff counter */}
        {game.handoffs > 0 && (
          <div className="absolute bottom-4 left-4 glass rounded-full px-3 py-1.5 text-xs font-semibold text-primary flex items-center gap-1.5">
            <Repeat className="h-3 w-3" />
            Shared {game.handoffs} times
          </div>
        )}
      </motion.div>

      <div className="px-4 -mt-2 relative">
        {/* Content card */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-t-3xl pt-6 -mx-4 px-4"
        >
          {/* Title block */}
          <h1 className="text-2xl font-bold tracking-tight leading-tight">{game.title}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {getCategoryLabel(game.category)}
          </p>

          {/* Ownership Badge */}
          <div className="mt-2">
            {game.ownershipType === "donated" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                Community Game
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                On loan from {owner?.name ?? game.currentHolder.name}
                {owner && (
                  <span className="text-2xs text-amber-500 ml-1">
                    Trust: {owner.trustScore}%
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-sunshine text-sunshine" />
              <span className="font-bold text-sm">{game.rating.toFixed(1)}</span>
            </div>
            <span className="text-2xs text-muted-foreground">({game.reviewCount} reviews)</span>
          </div>

          {/* Details Grid */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-4 gap-2 my-5"
          >
            <div className="rounded-2xl bg-background p-3 text-center">
              <Users className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <div className="text-sm font-bold">
                {game.minPlayers === game.maxPlayers
                  ? game.minPlayers
                  : `${game.minPlayers}-${game.maxPlayers}`}
              </div>
              <div className="text-2xs text-muted-foreground mt-0.5">Players</div>
            </div>
            <div className="rounded-2xl bg-background p-3 text-center">
              <Timer className="h-4 w-4 text-sunshine mx-auto mb-1.5" />
              <div className="text-2xs font-bold leading-tight">
                {game.playTime}
              </div>
              <div className="text-2xs text-muted-foreground mt-0.5">Time</div>
            </div>
            <div className="rounded-2xl bg-background p-3 text-center">
              <Brain className="h-4 w-4 text-coral mx-auto mb-1.5" />
              <div className="text-2xs font-bold capitalize">
                {COMPLEXITY_LABELS[game.complexity]}
              </div>
              <div className="text-2xs text-muted-foreground mt-0.5">Level</div>
            </div>
            <div className="rounded-2xl bg-background p-3 text-center">
              <MapPin className="h-4 w-4 text-mint mx-auto mb-1.5" />
              <div className="text-2xs font-bold leading-tight">
                {formatDistance(game)}
              </div>
              <div className="text-2xs text-muted-foreground mt-0.5">Distance</div>
            </div>
          </motion.div>

          {/* Age groups */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {game.ageGroups.map((age) => (
              <span key={age} className="px-2.5 py-1 rounded-full bg-background text-2xs font-medium capitalize">
                {age}
              </span>
            ))}
          </div>

          {/* Description */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mb-5"
          >
            <h2 className="text-sm font-semibold mb-2">About this game</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{game.description}</p>
          </motion.div>

          {/* Current Holder Card */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-6 rounded-2xl bg-background p-4"
          >
            <div className="text-2xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Currently with</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {game.currentHolder.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{game.currentHolder.name}</div>
                  <div className="text-2xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {formatDistance(game)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Listed {new Date(game.listedAt).toLocaleDateString("en-IL", { month: "short", day: "numeric" })}
              </div>
            </div>
          </motion.div>

          {/* Reviews */}
          {(() => {
            const reviews = getGameReviews(game.id);
            if (reviews.length === 0) return null;
            return (
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="mb-6"
              >
                <h2 className="text-sm font-semibold mb-3">Reviews ({reviews.length})</h2>
                <div className="space-y-3">
                  {reviews.slice(0, 5).map((review) => {
                    const reviewer = getUser(review.userId);
                    return (
                      <div key={review.id} className="rounded-2xl bg-background p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {reviewer && (
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xs">
                                {reviewer.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs font-semibold">{reviewer?.name ?? "User"}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? "fill-sunshine text-sunshine" : "text-muted-foreground/30"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{review.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-2xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString("en-IL", { month: "short", day: "numeric" })}
                          </span>
                          {review.helpful > 0 && (
                            <span className="flex items-center gap-1 text-2xs text-muted-foreground">
                              <ThumbsUp className="h-3 w-3" />
                              {review.helpful} helpful
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })()}

          {/* Interest Indicator */}
          {(game.requestCount + localRequestCount > 0) && (
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.33 }}
              className="mb-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary/5"
            >
              <Hand className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {game.requestCount + localRequestCount} {game.requestCount + localRequestCount === 1 ? "person" : "people"} interested
              </span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="pb-8 space-y-3"
          >
            {game.available ? (
              <>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#1eba59] text-white font-semibold text-base transition-all duration-200 elevation-3 hover:elevation-4 active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5" />
                  Request via WhatsApp
                </a>
                <button
                  onClick={() => setRequestModalOpen(true)}
                  className="flex items-center justify-center gap-2.5 w-full h-12 rounded-2xl bg-primary/10 hover:bg-primary/15 text-primary font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
                >
                  <Hand className="h-4 w-4" />
                  Express Interest
                </button>
                <p className="text-center text-2xs text-muted-foreground mt-2">
                  WhatsApp messages the holder directly. Express Interest notifies them you&apos;re interested.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2.5 w-full h-14 rounded-2xl bg-muted text-muted-foreground font-semibold text-base cursor-not-allowed">
                  Currently Unavailable
                </div>
                <button
                  onClick={() => setRequestModalOpen(true)}
                  className="flex items-center justify-center gap-2.5 w-full h-12 rounded-2xl bg-primary/10 hover:bg-primary/15 text-primary font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
                >
                  <Hand className="h-4 w-4" />
                  Notify Me When Available
                </button>
                <p className="text-center text-2xs text-muted-foreground mt-2">
                  Get notified when this game becomes available again
                </p>
              </>
            )}
          </motion.div>

          <RequestGameModal
            gameTitle={game.title}
            isOpen={requestModalOpen}
            onClose={() => setRequestModalOpen(false)}
            onSubmit={() => setLocalRequestCount((c) => c + 1)}
          />
        </motion.div>
      </div>
    </div>
  );
}

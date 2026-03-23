"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { getGame, getUser, getCategoryEmoji, getCategoryLabel, formatDistance, COMPLEXITY_LABELS, RBS_CENTER } from "@/lib/data";
import type { Game, Review } from "@/lib/data";
import { bestRelayRoute, type VolunteerCourier } from "@/lib/relay";
import { Button } from "@/components/ui/button";
import { RequestGameModal } from "@/components/request-game-modal";
import { RelayRouteDisplay } from "@/components/relay-route-display";
import { ArrowLeft, Users, MapPin, MessageCircle, Share2, Repeat, Clock, Star, Timer, Brain, ThumbsUp, Hand, Loader2 } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { fetchGame, fetchGameReviews, submitReview, insertLendingRequest, fetchGameRelays } from "@/lib/queries";
import { createClient } from "@/lib/supabase";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function GameDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const [game, setGame] = useState<Game | undefined>(getGame(id));
  const [gameLoading, setGameLoading] = useState(!getGame(id));
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [localRequestCount, setLocalRequestCount] = useState(0);
  const { t, lang } = useLanguage();

  // ── Relay volunteers state ────────────────────────────────────────────
  const [relayVolunteers, setRelayVolunteers] = useState<VolunteerCourier[]>([]);

  // ── Reviews state ────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setReviewsLoading(true);
      try {
        const supabase = createClient();
        if (supabase?.auth) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!cancelled) setIsLoggedIn(!!user);
        }

        const [dbGame, realReviews, realRelays] = await Promise.all([
          fetchGame(id),
          fetchGameReviews(id),
          fetchGameRelays(id),
        ]);
        if (!cancelled) {
          if (dbGame) setGame(dbGame);
          setGameLoading(false);
          setReviews(realReviews);
          setRelayVolunteers(realRelays);
        }
      } catch (err) {
        console.error("[game-detail] load error:", err);
        if (!cancelled) setGameLoading(false);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [id]);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reviewRating === 0 || !reviewComment.trim()) return;

    setReviewSubmitting(true);
    setReviewError(null);

    // Re-check session before hitting the DB — handles expired sessions mid-page
    const supabase = createClient();
    if (supabase?.auth) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/auth/signin?next=/game/${id}`);
        return;
      }
    }

    const result = await submitReview(id, reviewRating, reviewComment);

    if (result.success) {
      setReviewSuccess(true);
      setReviewRating(0);
      setReviewComment("");
      // Refresh reviews list
      const updated = await fetchGameReviews(id);
      setReviews(updated);
    } else {
      setReviewError(result.error ?? "Something went wrong. Please try again.");
    }
    setReviewSubmitting(false);
  }

  if (gameLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <p className="text-sm font-medium mb-1">{t("game.not_found")}</p>
        <p className="text-xs text-muted-foreground mb-4">{t("game.may_removed")}</p>
        <Button variant="ghost" onClick={() => router.push("/")} className="text-sm">
          {t("game.back_to_games")}
        </Button>
      </div>
    );
  }

  const conditionKeys: Record<string, { bg: string; text: string; dot: string; key: "game.like_new" | "game.good" | "game.fair" }> = {
    "like-new": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", key: "game.like_new" },
    good: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-400", key: "game.good" },
    fair: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", key: "game.fair" },
  };

  const COORDINATOR_PHONE = process.env.NEXT_PUBLIC_COORDINATOR_PHONE || "972544444444";
  const coordinatorRequestUrl = `https://wa.me/${COORDINATOR_PHONE}?text=${encodeURIComponent(
    `Hi, I'd like to borrow ${game.title} (ID: ${game.id}). Please coordinate with the owner on my behalf.`
  )}`;
  const coordinatorWaitlistUrl = `https://wa.me/${COORDINATOR_PHONE}?text=${encodeURIComponent(
    `Hi, I'd like to join the waitlist for ${game.title} (ID: ${game.id}). Please let me know when it becomes available.`
  )}`;
  const owner = getUser(game.ownerId);
  const condition = conditionKeys[game.condition];

  const complexityMap: Record<string, "complexity.light" | "complexity.medium" | "complexity.heavy"> = {
    light: "complexity.light",
    medium: "complexity.medium",
    heavy: "complexity.heavy",
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${game.title} — ${t("app.title")}`,
        text: lang === "he"
          ? `בדוק את "${game.title}" ב${t("app.title")}! שיתוף משחקים חינם ברמת בית שמש.`
          : `Check out "${game.title}" on Play it Forward! Free game sharing in RBS.`,
        url: window.location.href,
      });
    }
  };

  const totalInterested = game.requestCount + localRequestCount;

  const relayRoute = bestRelayRoute(
    { lat: game.currentHolder.lat, lng: game.currentHolder.lng },
    RBS_CENTER,
    relayVolunteers
  );

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
          className={`absolute top-4 ${lang === "he" ? "right-4" : "left-4"} h-9 w-9 rounded-full glass flex items-center justify-center transition-transform hover:scale-105`}
        >
          <ArrowLeft className={`h-4 w-4 text-foreground ${lang === "he" ? "rotate-180" : ""}`} />
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          className={`absolute top-4 ${lang === "he" ? "left-4" : "right-4"} h-9 w-9 rounded-full glass flex items-center justify-center transition-transform hover:scale-105`}
        >
          <Share2 className="h-4 w-4 text-foreground" />
        </button>

        {/* Condition badge */}
        <div className={`absolute bottom-4 ${lang === "he" ? "left-4" : "right-4"} ${condition.bg} ${condition.text} rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5`}>
          <span className={`h-1.5 w-1.5 rounded-full ${condition.dot}`} />
          {t(condition.key)}
        </div>

        {/* Handoff counter */}
        {game.handoffs > 0 && (
          <div className={`absolute bottom-4 ${lang === "he" ? "right-4" : "left-4"} glass rounded-full px-3 py-1.5 text-xs font-semibold text-primary flex items-center gap-1.5`}>
            <Repeat className="h-3 w-3" />
            {t("game.shared_times", { count: game.handoffs })}
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
                {t("game.community_game")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                {t("game.on_loan_from")} {owner?.name ?? game.currentHolder.name}
                {owner && (
                  <span className="text-2xs text-amber-500 ml-1">
                    {t("game.trust")}: {owner.trustScore}%
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Piece completeness badge */}
          {game.piecesComplete === false ? (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <span>⚠️</span>
              <span>{t("game.missing_pieces")}</span>
              {game.missingPiecesNote && (
                <span className="text-amber-500 dark:text-amber-300">— {game.missingPiecesNote}</span>
              )}
            </div>
          ) : game.piecesComplete === true ? (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <span>✅</span>
              <span>{t("game.complete_set")}</span>
            </div>
          ) : null}

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-sunshine text-sunshine" />
              <span className="font-bold text-sm">{game.rating.toFixed(1)}</span>
            </div>
            <span className="text-2xs text-muted-foreground">({game.reviewCount} {t("game.reviews").toLowerCase()})</span>
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
              <div className="text-2xs text-muted-foreground mt-0.5">{t("game.players")}</div>
            </div>
            <div className="rounded-2xl bg-background p-3 text-center">
              <Timer className="h-4 w-4 text-sunshine mx-auto mb-1.5" />
              <div className="text-2xs font-bold leading-tight">
                {game.playTime}
              </div>
              <div className="text-2xs text-muted-foreground mt-0.5">{t("game.time")}</div>
            </div>
            <div className="rounded-2xl bg-background p-3 text-center">
              <Brain className="h-4 w-4 text-coral mx-auto mb-1.5" />
              <div className="text-2xs font-bold capitalize">
                {complexityMap[game.complexity] ? t(complexityMap[game.complexity]) : COMPLEXITY_LABELS[game.complexity]}
              </div>
              <div className="text-2xs text-muted-foreground mt-0.5">{t("game.level")}</div>
            </div>
            <div className="rounded-2xl bg-background p-3 text-center">
              <MapPin className="h-4 w-4 text-mint mx-auto mb-1.5" />
              <div className="text-2xs font-bold leading-tight">
                {formatDistance(game)}
              </div>
              <div className="text-2xs text-muted-foreground mt-0.5">{t("game.distance")}</div>
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
            <h2 className="text-sm font-semibold mb-2">{t("game.about")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{game.description}</p>
          </motion.div>

          {/* Current Holder Card */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-6 rounded-2xl bg-background p-4"
          >
            <div className="text-2xs text-muted-foreground font-medium uppercase tracking-wider mb-2">{t("game.currently_with")}</div>
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
                {t("game.listed")} {new Date(game.listedAt).toLocaleDateString(lang === "he" ? "he-IL" : "en-IL", { month: "short", day: "numeric" })}
              </div>
            </div>
          </motion.div>

          {/* Reviews */}
          {!reviewsLoading && (reviews.length > 0 || isLoggedIn) && (
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="mb-6"
            >
              {reviews.length > 0 && (
                <>
                  <h2 className="text-sm font-semibold mb-3">{t("game.reviews")} ({reviews.length})</h2>
                  <div className="space-y-3 mb-5">
                    {reviews.slice(0, 5).map((review) => {
                      const reviewer = getUser(review.userId);
                      return (
                        <div key={review.id} className="rounded-2xl bg-background p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xs">
                                {(reviewer?.name ?? "U").charAt(0)}
                              </div>
                              <span className="text-xs font-semibold">{reviewer?.name ?? "Community member"}</span>
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
                              {new Date(review.createdAt).toLocaleDateString(lang === "he" ? "he-IL" : "en-IL", { month: "short", day: "numeric" })}
                            </span>
                            {review.helpful > 0 && (
                              <span className="flex items-center gap-1 text-2xs text-muted-foreground">
                                <ThumbsUp className="h-3 w-3" />
                                {review.helpful} {t("game.helpful")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Leave a Review form — only shown when logged in */}
              {isLoggedIn && !reviewSuccess && (
                <div className="rounded-2xl bg-background p-4">
                  <h3 className="text-sm font-semibold mb-3">Leave a Review</h3>
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    {/* Star Rating */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseEnter={() => setReviewHover(i + 1)}
                          onMouseLeave={() => setReviewHover(0)}
                          onClick={() => setReviewRating(i + 1)}
                          className="p-0.5"
                        >
                          <Star
                            className={`h-6 w-6 transition-colors ${
                              i < (reviewHover || reviewRating)
                                ? "fill-sunshine text-sunshine"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Comment */}
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this game..."
                      rows={3}
                      className="w-full rounded-xl bg-white border-0 elevation-1 p-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />

                    {reviewError && (
                      <p className="text-xs text-red-500">{reviewError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={reviewSubmitting || reviewRating === 0 || !reviewComment.trim()}
                      className="w-full h-10 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      {reviewSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                </div>
              )}

              {isLoggedIn && reviewSuccess && (
                <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                  <p className="text-sm font-medium text-emerald-700">Thanks for your review!</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Relay Route */}
          {relayRoute && (
            <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.32 }}>
              <RelayRouteDisplay route={relayRoute} />
            </motion.div>
          )}

          {/* Interest Indicator */}
          {(totalInterested > 0) && (
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.33 }}
              className="mb-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary/5"
            >
              <Hand className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {totalInterested === 1
                  ? t("game.person_interested")
                  : t("game.people_interested", { count: totalInterested })}
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
                  href={coordinatorRequestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#1eba59] text-white font-semibold text-base transition-all duration-200 elevation-3 hover:elevation-4 active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t("game.request_to_borrow")}
                </a>
                <button
                  onClick={() => setRequestModalOpen(true)}
                  className="flex items-center justify-center gap-2.5 w-full h-12 rounded-2xl bg-primary/10 hover:bg-primary/15 text-primary font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
                >
                  <Hand className="h-4 w-4" />
                  {t("game.express_interest")}
                </button>
                <p className="text-center text-2xs text-muted-foreground mt-2">
                  {t("game.coordinator_help")}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2.5 w-full h-14 rounded-2xl bg-muted text-muted-foreground font-semibold text-base cursor-not-allowed">
                  {t("game.currently_unavailable")}
                </div>
                <a
                  href={coordinatorWaitlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full h-12 rounded-2xl bg-primary/10 hover:bg-primary/15 text-primary font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("game.join_waitlist")}
                </a>
                <p className="text-center text-2xs text-muted-foreground mt-2">
                  {t("game.waitlist_help")}
                </p>
              </>
            )}
          </motion.div>

          <RequestGameModal
            gameTitle={game.title}
            isOpen={requestModalOpen}
            onClose={() => setRequestModalOpen(false)}
            onSubmit={async (_name: string, message: string) => {
              setLocalRequestCount((c) => c + 1);
              // Record the request in Supabase if user is logged in
              try {
                const supabase = createClient();
                if (supabase?.auth) {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    await insertLendingRequest(game.id, user.id, message);
                  }
                }
              } catch {
                // Non-fatal — optimistic count already updated
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

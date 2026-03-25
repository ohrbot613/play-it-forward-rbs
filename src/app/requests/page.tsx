"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MOCK_WISHES,
  CATEGORIES,
  URGENCY_CONFIG,
  getCategoryEmoji,
  type GameCategory,
  type CommunityWish,
} from "@/lib/data";
import { fetchCommunityWishes } from "@/lib/queries";
import {
  Search,
  X,
  Heart,
  MessageCircle,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  HandHeart,
  Plus,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const NEIGHBORHOODS = ["Aleph", "Bet", "Gimmel", "Dalet", "Hey"] as const;
type Neighborhood = (typeof NEIGHBORHOODS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string, t: ReturnType<typeof useLanguage>["t"]): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return t("time.just_now");
  if (diffHrs < 24) return t("time.hr_ago", { count: diffHrs });
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return t("time.yesterday");
  if (diffDays < 7) return t("time.days_ago", { count: diffDays });
  return t("time.weeks_ago", { count: Math.floor(diffDays / 7) });
}

// ─────────────────────────────────────────────────────────────────────────────
// WishCard
// ─────────────────────────────────────────────────────────────────────────────

function WishCard({ wish, index }: { wish: CommunityWish; index: number }) {
  const urgency = URGENCY_CONFIG[wish.urgency];
  const isFulfilled = wish.status === "fulfilled";
  const isMatched = wish.status === "matched";
  const isOpen = wish.status === "open";

  type OfferState = "idle" | "loading" | "done" | "error";
  const [offerState, setOfferState] = useState<OfferState>("idle");
  const [localResponses, setLocalResponses] = useState(wish.responses);
  const { t } = useLanguage();

  async function handleOffer() {
    setOfferState("loading");
    try {
      // 1. Open WhatsApp link directly to the requester (if phone is available)
      if (wish.requesterPhone) {
        const phone = wish.requesterPhone.replace(/[^0-9]/g, "");
        const text = encodeURIComponent(
          `היי ${wish.requesterName}, ראיתי את הבקשה שלך ל-${wish.title} ב-Play it Forward — יש לי אותו! מתי יתאים לך?`
        );
        window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
      }

      // 2. Get the current authenticated user ID
      const supabase = createClient();
      const lenderUserId = supabase
        ? (await supabase.auth.getUser()).data.user?.id ?? "anonymous"
        : "anonymous";

      // 3. Record the offer in Supabase (fire-and-forget — non-blocking)
      fetch("/api/lending-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishId: wish.id,
          lenderUserId,
          gameTitle: wish.title,
          lenderNeighborhood: wish.neighborhood,
          requesterName: wish.requesterName,
        }),
      }).catch(() => {
        // Non-fatal — WhatsApp already opened
      });

      // 3. Optimistically update the response count
      setLocalResponses((n) => n + 1);
      setOfferState("done");
    } catch {
      setOfferState("error");
      // Reset to allow retry after 2s
      setTimeout(() => setOfferState("idle"), 2000);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Card
        className={cn(
          "overflow-hidden border-0 elevation-2 bg-white transition-shadow duration-300",
          isFulfilled && "opacity-75"
        )}
      >
        <div className="p-4">
          {/* Header: Avatar + Name + Time */}
          <div className="flex items-start gap-3 mb-3">
            <Image
              src={wish.requesterAvatar}
              alt={wish.requesterName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">
                  {wish.requesterName}
                </span>
                {wish.urgency === "high" && (
                  <Badge
                    className={`text-2xs border-0 font-medium ${urgency.bg} ${urgency.color}`}
                  >
                    {t("urgency.high")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-2xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {wish.neighborhood}
                </span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(wish.createdAt, t)}
                </span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
            <span className="text-base">
              {getCategoryEmoji(wish.category)}
            </span>
            {wish.title}
            {isMatched && (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            )}
            {isFulfilled && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
          </h3>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {wish.description}
          </p>

          {/* Footer: Tags + Responses */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="text-2xs border-0 font-medium bg-primary/10 text-primary">
                {wish.ageRange}
              </Badge>
              {wish.urgency !== "high" && (
                <Badge
                  className={`text-2xs border-0 font-medium ${urgency.bg} ${urgency.color}`}
                >
                  {wish.urgency === "normal" ? t("urgency.normal") : t("urgency.low")}
                </Badge>
              )}
              {isFulfilled && (
                <Badge className="text-2xs border-0 font-medium bg-emerald-50 text-emerald-700">
                  {t("wishes.fulfilled")}
                </Badge>
              )}
              {isMatched && (
                <Badge className="text-2xs border-0 font-medium bg-primary/10 text-primary">
                  {t("wishes.match_found")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-2xs text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{localResponses}</span>
            </div>
          </div>

          {/* "I have this game!" CTA — only on open wishes */}
          {isOpen && (
            <AnimatePresence mode="wait">
              {offerState === "done" ? (
                <motion.div
                  key="offered"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {t("wishes.offer_sent")}
                </motion.div>
              ) : offerState === "error" ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium"
                >
                  <X className="h-4 w-4 shrink-0" />
                  {t("wishes.offer_error")}
                </motion.div>
              ) : (
                <motion.button
                  key="offer-btn"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  onClick={handleOffer}
                  disabled={offerState === "loading"}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {offerState === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <HandHeart className="h-4 w-4" />
                  )}
                  {offerState === "loading" ? t("wishes.offering") : t("wishes.i_have_it")}
                </motion.button>
              )}
            </AnimatePresence>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AddWishModal
// ─────────────────────────────────────────────────────────────────────────────

interface InventoryMatch {
  id: string;
  title: string;
  neighborhood: string;
  holderName: string;
}

interface NewWishData {
  id: string;
  gameTitle: string;
  neighborhood: string;
  notes: string;
  matches?: InventoryMatch[];
}

interface AddWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (wish: NewWishData) => void;
  matchedGames?: InventoryMatch[];
}

function AddWishModal({ isOpen, onClose, onSuccess, matchedGames }: AddWishModalProps) {
  const { t } = useLanguage();
  const [gameTitle, setGameTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [neighborhood, setNeighborhood] = useState<Neighborhood | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    if (submitting) return;
    // Reset state on close
    setGameTitle("");
    setNotes("");
    setNeighborhood("");
    setSubmitted(false);
    setError("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gameTitle.trim() || !neighborhood) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/create-wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameTitle: gameTitle.trim(), notes: notes.trim(), neighborhood }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setSubmitted(true);

      setTimeout(() => {
        onSuccess({
          id: data.id ?? `local-${Date.now()}`,
          gameTitle: gameTitle.trim(),
          neighborhood,
          notes: notes.trim(),
          matches: data.matches,
        });
        handleClose();
      }, 1800);
    } catch {
      setError(t("wish.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md"
          >
            <div className="bg-white rounded-t-3xl p-6 elevation-4">
              {/* Handle */}
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3 ${matchedGames && matchedGames.length > 0 ? "bg-primary/10" : "bg-emerald-50"}`}>
                    {matchedGames && matchedGames.length > 0
                      ? <Sparkles className="h-7 w-7 text-primary" />
                      : <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                    }
                  </div>
                  {matchedGames && matchedGames.length > 0 ? (
                    <>
                      <p className="text-base font-semibold">🎯 Match in the library!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {matchedGames[0].title} is held by {matchedGames[0].holderName} in {matchedGames[0].neighborhood}. We&apos;ve notified the coordinator!
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-semibold">{t("wish.success")}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("wish.success_sub")}
                      </p>
                    </>
                  )}
                </motion.div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h2 className="text-lg font-bold">{t("wish.add_title")}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("wish.add_subtitle")}
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Game Title */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        {t("wish.game_title")} *
                      </label>
                      <Input
                        value={gameTitle}
                        onChange={(e) => setGameTitle(e.target.value)}
                        placeholder={t("wish.game_title_placeholder")}
                        className="h-12 rounded-2xl bg-background border-0 text-sm"
                        required
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        {t("wish.notes")}
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("wish.notes_placeholder")}
                        className="rounded-2xl bg-background border-0 text-sm min-h-[72px] resize-none"
                      />
                    </div>

                    {/* Neighborhood */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        {t("wish.neighborhood")} *
                      </label>
                      <div className="relative">
                        <select
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value as Neighborhood)}
                          required
                          className="w-full h-12 rounded-2xl bg-background border-0 text-sm px-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="" disabled>
                            {t("wish.neighborhood_placeholder")}
                          </option>
                          {NEIGHBORHOODS.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    {/* Error message */}
                    {error && (
                      <p className="text-xs text-red-600 text-center">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={!gameTitle.trim() || !neighborhood || submitting}
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold text-base transition-all duration-200 elevation-3 hover:elevation-4 active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                      {submitting ? t("wish.submitting") : t("wish.submit")}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RequestsPage
// ─────────────────────────────────────────────────────────────────────────────

export default function RequestsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GameCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "open" | "matched" | "fulfilled"
  >("open");
  const [addWishOpen, setAddWishOpen] = useState(false);
  const [lastMatchedGames, setLastMatchedGames] = useState<InventoryMatch[]>([]);
  const [localWishes, setLocalWishes] = useState<CommunityWish[]>([]);
  // Wishes loaded from Supabase; falls back to MOCK_WISHES only after load completes
  const [dbWishes, setDbWishes] = useState<CommunityWish[]>([]);
  const [wishesLoading, setWishesLoading] = useState(true);
  const { t, lang } = useLanguage();

  useEffect(() => {
    setWishesLoading(true);
    fetchCommunityWishes()
      .then((rows) => {
        // Use real rows if available, otherwise fall back to mock data
        setDbWishes(rows.length > 0 ? rows : MOCK_WISHES);
      })
      .catch(() => {
        // Network/DB error — fall back to mock data
        setDbWishes(MOCK_WISHES);
      })
      .finally(() => {
        setWishesLoading(false);
      });
  }, []);

  const STATUS_TABS: { value: "open" | "matched" | "fulfilled"; labelKey: "wishes.open" | "wishes.matched" | "wishes.fulfilled" }[] = [
    { value: "open", labelKey: "wishes.open" },
    { value: "matched", labelKey: "wishes.matched" },
    { value: "fulfilled", labelKey: "wishes.fulfilled" },
  ];

  function handleWishSuccess(wish: NewWishData) {
    if (wish.matches && wish.matches.length > 0) {
      setLastMatchedGames(wish.matches);
    }
    // Prepend the new wish to the local list so it appears immediately
    const newWish: CommunityWish = {
      id: wish.id,
      requesterId: "local-user",
      requesterName: "You",
      requesterAvatar: "https://api.dicebear.com/7.x/thumbs/svg?seed=local",
      neighborhood: wish.neighborhood,
      title: wish.gameTitle,
      description: wish.notes || "",
      category: "board-games",
      ageRange: "All",
      urgency: "normal",
      status: "open",
      createdAt: new Date().toISOString(),
      responses: 0,
    };
    setLocalWishes((prev) => [newWish, ...prev]);
    // Switch to open tab so user sees their wish
    setStatusFilter("open");
  }

  const allWishes = useMemo(() => [...localWishes, ...dbWishes], [localWishes, dbWishes]);

  const wishes = useMemo(() => {
    let filtered = allWishes.filter((w) => w.status === statusFilter);

    if (category !== "all") {
      filtered = filtered.filter((w) => w.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.requesterName.toLowerCase().includes(q)
      );
    }

    // Urgent first, then newest
    filtered.sort((a, b) => {
      const urgencyOrder = { high: 0, normal: 1, low: 2 };
      const urgDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgDiff !== 0) return urgDiff;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return filtered;
  }, [search, category, statusFilter, allWishes]);

  const openCount = allWishes.filter((w) => w.status === "open").length;

  return (
    <div className="px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative pt-8 pb-6"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 bg-gradient-to-b from-coral/[0.04] via-sunshine/[0.03] to-transparent -z-10 rounded-b-[40%]" />
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
              {t("wishes.title")}
            </h1>
            <Heart className="h-5 w-5 text-coral" />
          </div>
          {/* Add a Wish button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setAddWishOpen(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-primary text-white text-xs font-semibold elevation-2 hover:elevation-3 transition-all duration-200 mt-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t("wish.add_btn")}</span>
            {lang === "he" && <span className="opacity-70 text-2xs">/ הוסף בקשה</span>}
          </motion.button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px]">
          {t("wishes.subtitle")}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral" />
            <span className="font-medium text-foreground">{openCount}</span>{" "}
            {t("wishes.open_wishes")}
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            <HandHeart className="h-3.5 w-3.5" />
            {t("wishes.can_you_help")}
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
            placeholder={t("search.wishes_placeholder")}
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

      {/* Status Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="mb-4 flex gap-2"
      >
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-foreground text-white elevation-2"
                  : "bg-white text-muted-foreground elevation-1 hover:elevation-2"
              )}
              onClick={() => setStatusFilter(tab.value)}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </motion.div>

      {/* Category Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-4 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
      >
        {[{ value: "all" as const, label: t("category.all"), emoji: "" }, ...CATEGORIES].map(
          (c) => {
            const isActive = category === c.value;
            return (
              <button
                key={c.value}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-white elevation-2"
                    : "bg-white text-muted-foreground elevation-1 hover:elevation-2"
                )}
                onClick={() => setCategory(c.value)}
              >
                {c.emoji ? `${c.emoji} ` : ""}
                {c.value === "all" ? c.label : c.label}
              </button>
            );
          }
        )}
      </motion.div>

      {/* Results count */}
      <div className="mb-3 text-xs text-muted-foreground">
        {wishesLoading ? "..." : `${wishes.length} ${wishes.length === 1 ? t("wishes.wish") : t("wishes.wishes_count")}`}
      </div>

      {/* Wish Cards */}
      {wishesLoading ? (
        <div className="flex flex-col gap-3 pb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white elevation-1 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-4">
          {wishes.map((wish, i) => (
            <WishCard key={wish.id} wish={wish} index={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      <AnimatePresence>
        {!wishesLoading && wishes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-12 text-center pb-8"
          >
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {t("wishes.no_wishes")}
            </p>
            <p className="text-xs text-muted-foreground">
              {statusFilter === "open"
                ? t("wishes.all_fulfilled")
                : t("wishes.no_status", { status: statusFilter })}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Wish Modal */}
      <AddWishModal
        isOpen={addWishOpen}
        onClose={() => { setAddWishOpen(false); setLastMatchedGames([]); }}
        onSuccess={handleWishSuccess}
        matchedGames={lastMatchedGames}
      />
    </div>
  );
}

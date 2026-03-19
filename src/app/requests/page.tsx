"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MOCK_WISHES,
  CATEGORIES,
  URGENCY_CONFIG,
  getCategoryEmoji,
  type GameCategory,
  type CommunityWish,
} from "@/lib/data";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return "just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function WishCard({ wish, index }: { wish: CommunityWish; index: number }) {
  const urgency = URGENCY_CONFIG[wish.urgency];
  const isFulfilled = wish.status === "fulfilled";
  const isMatched = wish.status === "matched";
  const isOpen = wish.status === "open";
  const [offered, setOffered] = useState(false);
  const { t } = useLanguage();

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
                  {timeAgo(wish.createdAt)}
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
              <span>{wish.responses}</span>
            </div>
          </div>

          {/* "I have this game!" CTA — only on open wishes */}
          {isOpen && (
            <AnimatePresence mode="wait">
              {offered ? (
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
              ) : (
                <motion.button
                  key="offer-btn"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  onClick={() => setOffered(true)}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold transition-colors active:scale-[0.98]"
                >
                  <HandHeart className="h-4 w-4" />
                  {t("wishes.i_have_it")}
                </motion.button>
              )}
            </AnimatePresence>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default function RequestsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GameCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "open" | "matched" | "fulfilled"
  >("open");
  const { t, lang } = useLanguage();

  const STATUS_TABS: { value: "open" | "matched" | "fulfilled"; labelKey: "wishes.open" | "wishes.matched" | "wishes.fulfilled" }[] = [
    { value: "open", labelKey: "wishes.open" },
    { value: "matched", labelKey: "wishes.matched" },
    { value: "fulfilled", labelKey: "wishes.fulfilled" },
  ];

  const wishes = useMemo(() => {
    let filtered = MOCK_WISHES.filter((w) => w.status === statusFilter);

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
  }, [search, category, statusFilter]);

  const openCount = MOCK_WISHES.filter((w) => w.status === "open").length;

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
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
            {t("wishes.title")}
          </h1>
          <Heart className="h-5 w-5 text-coral" />
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
        {wishes.length} {wishes.length === 1 ? t("wishes.wish") : t("wishes.wishes_count")}
      </div>

      {/* Wish Cards */}
      <div className="flex flex-col gap-3 pb-4">
        {wishes.map((wish, i) => (
          <WishCard key={wish.id} wish={wish} index={i} />
        ))}
      </div>

      {/* Empty State */}
      <AnimatePresence>
        {wishes.length === 0 && (
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
    </div>
  );
}

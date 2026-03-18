"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, Repeat, Star, MapPin, Clock, Heart } from "lucide-react";
import { getGame, getUser } from "@/lib/data";
import { cn } from "@/lib/utils";

const NEIGHBORHOOD_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "RBS Aleph": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  "RBS Bet": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  "RBS Gimmel": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  "RBS Dalet": { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400" },
  "Old Beit Shemesh": { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400" },
};

function getNeighborhoodStyle(neighborhood: string) {
  return NEIGHBORHOOD_COLORS[neighborhood] ?? { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" };
}

interface JourneyEntry {
  id: string;
  type: "donated" | "borrowed" | "returned" | "current";
  personName: string;
  personInitials: string;
  neighborhood: string;
  date: string;
  duration?: string;
  rating?: number;
  note?: string;
  avatarColor: string;
}

function getMockJourney(gameTitle: string, ownerId: string): JourneyEntry[] {
  const owner = getUser(ownerId);
  return [
    {
      id: "j1",
      type: "donated",
      personName: owner?.name ?? "Anonymous",
      personInitials: (owner?.name ?? "A").split(" ").map(n => n[0]).join(""),
      neighborhood: owner?.neighborhood ?? "RBS Aleph",
      date: "2025-11-02",
      note: `Donated ${gameTitle} so other families could enjoy it too!`,
      avatarColor: "bg-emerald-500",
    },
    {
      id: "j2",
      type: "borrowed",
      personName: "Devorah Goldstein",
      personInitials: "DG",
      neighborhood: "RBS Bet",
      date: "2025-11-15",
      duration: "3 weeks",
      rating: 5,
      note: "Kids absolutely loved it! Shabbos afternoons were transformed.",
      avatarColor: "bg-sky-500",
    },
    {
      id: "j3",
      type: "borrowed",
      personName: "Yoel & Shira Friedman",
      personInitials: "YF",
      neighborhood: "RBS Aleph",
      date: "2025-12-10",
      duration: "2 weeks",
      rating: 4,
      note: "Great family game. Missing one instruction card but still playable.",
      avatarColor: "bg-amber-500",
    },
    {
      id: "j4",
      type: "borrowed",
      personName: "Rivka Stern",
      personInitials: "RS",
      neighborhood: "RBS Gimmel",
      date: "2026-01-05",
      duration: "4 weeks",
      rating: 5,
      note: "We played every single night of Chanukah vacation!",
      avatarColor: "bg-purple-500",
    },
    {
      id: "j5",
      type: "current",
      personName: "Chana Rubin",
      personInitials: "CR",
      neighborhood: "RBS Bet",
      date: "2026-03-01",
      avatarColor: "bg-coral",
    },
  ];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IL", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function GameJourneyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const game = getGame(id);

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <p className="text-sm font-medium mb-1">Game not found</p>
        <button onClick={() => router.push("/")} className="text-sm text-primary font-medium mt-2">
          Back to games
        </button>
      </div>
    );
  }

  const journey = getMockJourney(game.title, game.ownerId);
  const totalFamilies = journey.filter(j => j.type === "borrowed" || j.type === "current").length;
  const totalWeeks = journey
    .filter(j => j.duration)
    .reduce((sum, j) => {
      const weeks = parseInt(j.duration?.split(" ")[0] ?? "0");
      return sum + weeks;
    }, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-b from-primary/[0.06] via-sunshine/[0.04] to-transparent pt-4 pb-8 px-4"
      >
        <button
          onClick={() => router.back()}
          className="h-9 w-9 rounded-full glass flex items-center justify-center transition-transform hover:scale-105 mb-4"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📖</span>
            <h1 className="text-xl font-bold tracking-tight">Game Passport</h1>
          </div>
          <h2 className="text-lg font-semibold text-foreground mt-1">{game.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The journey of this game through our community
          </p>
        </motion.div>

        {/* Stats pills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mt-4 flex-wrap"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white elevation-1 text-xs font-medium">
            <Repeat className="h-3 w-3 text-primary" />
            <span>{game.handoffs} handoffs</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white elevation-1 text-xs font-medium">
            <Heart className="h-3 w-3 text-coral" />
            <span>{totalFamilies} families</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white elevation-1 text-xs font-medium">
            <Clock className="h-3 w-3 text-sunshine" />
            <span>{totalWeeks}+ weeks of joy</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Timeline */}
      <div className="px-4 pb-8">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-300 via-primary/30 to-coral/30 rounded-full" />

          <div className="space-y-0">
            {journey.map((entry, i) => {
              const nhStyle = getNeighborhoodStyle(entry.neighborhood);
              const isLast = entry.type === "current";

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                  className="relative pl-14 pb-8 last:pb-0"
                >
                  {/* Timeline dot + avatar */}
                  <div className="absolute left-0 top-0">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-sm ring-4 ring-background",
                        entry.avatarColor
                      )}
                    >
                      {entry.personInitials}
                    </div>
                    {isLast && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 ring-2 ring-background flex items-center justify-center">
                        <MapPin className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content card */}
                  <div className={cn(
                    "rounded-2xl p-4 transition-shadow",
                    isLast ? "bg-primary/[0.06] border border-primary/20" : "bg-white elevation-1"
                  )}>
                    {/* Type badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {entry.type === "donated" && (
                          <span className="flex items-center gap-1 text-2xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Gift className="h-3 w-3" /> Donated
                          </span>
                        )}
                        {entry.type === "borrowed" && (
                          <span className="flex items-center gap-1 text-2xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            <Repeat className="h-3 w-3" /> Borrowed
                          </span>
                        )}
                        {entry.type === "current" && (
                          <span className="flex items-center gap-1 text-2xs font-semibold text-coral bg-coral/10 px-2 py-0.5 rounded-full">
                            <MapPin className="h-3 w-3" /> Currently here
                          </span>
                        )}
                        <span className={cn("text-2xs font-medium px-2 py-0.5 rounded-full", nhStyle.bg, nhStyle.text)}>
                          {entry.neighborhood}
                        </span>
                      </div>
                    </div>

                    {/* Person name + date */}
                    <h3 className="font-semibold text-sm">{entry.personName}</h3>
                    <div className="flex items-center gap-3 mt-1 text-2xs text-muted-foreground">
                      <span>{formatDate(entry.date)}</span>
                      {entry.duration && (
                        <>
                          <span className="text-border">·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.duration}
                          </span>
                        </>
                      )}
                      {entry.rating && (
                        <>
                          <span className="text-border">·</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-sunshine text-sunshine" />
                            {entry.rating}/5
                          </span>
                        </>
                      )}
                    </div>

                    {/* Note */}
                    {entry.note && (
                      <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed italic bg-background/60 rounded-xl px-3 py-2">
                        &ldquo;{entry.note}&rdquo;
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center"
        >
          <div className="rounded-2xl bg-gradient-to-r from-primary/[0.06] to-coral/[0.06] p-5">
            <p className="text-sm font-semibold mb-1">Want to be next on this journey?</p>
            <p className="text-xs text-muted-foreground mb-3">
              Borrow this game and add your family&apos;s chapter to its story
            </p>
            <button
              onClick={() => router.push(`/game/${id}`)}
              className="px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold elevation-2 hover:elevation-3 transition-all active:scale-[0.98]"
            >
              Request this game
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

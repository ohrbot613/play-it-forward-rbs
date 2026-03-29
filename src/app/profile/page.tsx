"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MOCK_GAMES,
  MOCK_USERS,
  CATEGORIES,
  getCategoryLabel,
  getCategoryEmoji,
  formatDistance,
  getRecommendedGames,
  type GameCategory,
  type Game,
} from "@/lib/data";
import {
  fetchCurrentMember,
  fetchMemberGames,
  fetchBorrowHistory,
  fetchLendHistory,
  fetchPendingRequestCount,
  type LendingRequest,
} from "@/lib/queries";
import type { UserProfile } from "@/lib/data";
import {
  Package,
  Repeat,
  ChevronRight,
  MapPin,
  Shield,
  Star,
  Award,
  Settings,
  Plus,
  X,
  LogOut,
  Loader2,
  LogIn,
  Share2,
  Copy,
  Check,
  LayoutDashboard,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

// Demo/mock user shown only when Supabase auth is not configured (dev/offline mode)
// This ID is never used in production — demoMode is false whenever Supabase is available
const DEMO_USER_ID = process.env.NODE_ENV !== "production" ? "u1" : null;

const STATUS_LABEL_KEYS: Record<string, "status.pending" | "status.active" | "status.completed" | "status.cancelled" | "status.accepted"> = {
  pending: "status.pending",
  active: "status.active",
  completed: "status.completed",
  cancelled: "status.cancelled",
  accepted: "status.accepted",
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // true = Supabase not configured, show demo mode
  const [demoMode, setDemoMode] = useState(false);
  const [preferredCategories, setPreferredCategories] = useState<GameCategory[]>([]);
  const [kidAges, setKidAges] = useState<number[]>([]);
  const [newAge, setNewAge] = useState("");
  const [showPrefs, setShowPrefs] = useState(false);

  // Share / referral state
  const [copySuccess, setCopySuccess] = useState(false);

  // Real Supabase data
  const [dbMember, setDbMember] = useState<UserProfile | null>(null);
  const [myGamesReal, setMyGamesReal] = useState<Game[]>([]);
  const [borrowHistory, setBorrowHistory] = useState<LendingRequest[]>([]);
  const [lendHistory, setLendHistory] = useState<LendingRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase?.auth) {
      // Supabase not configured — show demo profile
      setDemoMode(true);
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      if (!user) {
        // Supabase configured but user not signed in — redirect
        router.replace("/auth/signin?redirect=/profile");
        return;
      }
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!session?.user) {
        router.replace("/auth/signin?redirect=/profile");
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Load real Supabase profile data once user is known
  useEffect(() => {
    if (demoMode || !user) return;

    let cancelled = false;
    setDataLoading(true);

    (async () => {
      try {
        // Fetch member + pending count in parallel — avoids duplicate DB call
        const [member, pending] = await Promise.all([
          fetchCurrentMember(),
          fetchPendingRequestCount(),
        ]);
        if (!cancelled) setPendingCount(pending);
        const games = member ? await fetchMemberGames(member.id) : [];

        if (cancelled) return;

        if (member) {
          setDbMember(member);
          // Pre-populate preferences from saved member data
          if (member.kidAges) setKidAges(member.kidAges);
          if (member.preferredCategories) setPreferredCategories(member.preferredCategories);

          // Load borrow/lend history in parallel
          const [borrow, lend] = await Promise.all([
            fetchBorrowHistory(member.id),
            fetchLendHistory(member.id),
          ]);
          if (!cancelled) {
            setBorrowHistory(borrow);
            setLendHistory(lend);
          }
        }

        if (!cancelled) {
          setMyGamesReal(games as Game[]);
        }
      } catch (err) {
        // Fail gracefully — page falls back to empty states
        console.error("[profile] data load error:", err);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, demoMode]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  const toggleCategory = (cat: GameCategory) => {
    setPreferredCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const addAge = () => {
    const age = parseInt(newAge);
    if (age > 0 && age <= 18 && !kidAges.includes(age)) {
      setKidAges((prev) => [...prev, age].sort((a, b) => a - b));
      setNewAge("");
    }
  };

  const removeAge = (age: number) => {
    setKidAges((prev) => prev.filter((a) => a !== age));
  };

  const handleCopyReferralLink = async () => {
    const code = demoMode
      ? (demoProfile?.referralCode ?? "PIF-DEMO")
      : (dbMember?.referralCode ?? "");
    if (!code) return;
    const link = `https://play-it-forward.vercel.app/join?ref=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const demoProfile = DEMO_USER_ID ? MOCK_USERS.find((u) => u.id === DEMO_USER_ID) : undefined;

  const recommendations = useMemo(() => {
    if (!user && !demoMode) return [];
    return getRecommendedGames({ kidAges, preferredCategories }, 4);
  }, [user, demoMode, kidAges, preferredCategories]);

  const displayName = demoMode
    ? (demoProfile?.name ?? t("profile.demo_name"))
    : (dbMember?.name ||
       user?.user_metadata?.full_name ||
       user?.user_metadata?.name ||
       user?.email?.split("@")[0] ||
       "You");
  const avatarUrl = demoMode
    ? null
    : (dbMember?.avatar ?? user?.user_metadata?.avatar_url ?? null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Supabase configured but no user yet (redirect in progress)
  if (!demoMode && !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // myGames: real data when logged in, mock data in demo mode, empty while loading
  const myGames = demoMode
    ? MOCK_GAMES.filter((g) => DEMO_USER_ID && g.ownerId === DEMO_USER_ID).slice(0, 3)
    : dataLoading
      ? []
      : myGamesReal.slice(0, 10);

  const trustScore = demoMode
    ? (demoProfile?.trustScore ?? 95)
    : (dbMember?.trustScore ?? 95);

  const totalHandoffs = demoMode
    ? myGames.reduce((sum, g) => sum + g.handoffs, 0)
    : (dbMember?.totalHandoffs ?? myGamesReal.reduce((sum, g) => sum + g.handoffs, 0));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-8 pb-8"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">
                {t("profile.greeting", { name: displayName })}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-2xs font-semibold">
                <Award className="h-3 w-3" />
                {t("profile.founding_member")}
              </span>
              {demoMode && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sunshine/20 text-yellow-700 text-2xs font-semibold">
                  Demo
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {myGames.length} {t("profile.games_in_circulation")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <div className="rounded-2xl bg-white elevation-1 p-4 text-center">
          <Package className="h-5 w-5 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold">{myGames.length}</div>
          <div className="text-2xs text-muted-foreground mt-0.5">{t("profile.shared")}</div>
        </div>
        <div className="rounded-2xl bg-white elevation-1 p-4 text-center">
          <Repeat className="h-5 w-5 text-coral mx-auto mb-2" />
          <div className="text-2xl font-bold">{totalHandoffs}</div>
          <div className="text-2xs text-muted-foreground mt-0.5">{t("profile.handoffs")}</div>
        </div>
        <div className="rounded-2xl bg-white elevation-1 p-4 text-center">
          <Shield className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{trustScore}</div>
          <div className="text-2xs text-muted-foreground mt-0.5">{t("profile.trust")}</div>
        </div>
      </motion.div>

      {/* Quick Access — Dashboard + Leaderboard */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="mb-6 space-y-2.5">
        <Link href="/dashboard">
          <div className="flex items-center gap-3 rounded-2xl bg-white elevation-1 p-4 hover:elevation-2 transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">{t("profile.my_dashboard")}</h3>
              <p className="text-2xs text-muted-foreground">{t("profile.dashboard_sub")}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {pendingCount > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-coral text-white text-2xs font-bold px-1.5">
                  {t("profile.pending_requests", { count: pendingCount })}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Link>
        <Link href="/leaderboard">
          <div className="flex items-center gap-3 rounded-2xl bg-white elevation-1 p-4 hover:elevation-2 transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-sunshine/10 flex items-center justify-center shrink-0">
              <Trophy className="h-5 w-5 text-sunshine" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">{t("profile.community_heroes")}</h3>
              <p className="text-2xs text-muted-foreground">{t("profile.heroes_sub")}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </Link>
      </motion.div>

      {/* Share PIF — Referral Card */}
      <motion.div {...fadeUp} transition={{ delay: 0.17 }} className="mb-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-sunshine/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{t("profile.share_pif")}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {t("profile.share_pif_sub")}
          </p>
          {(demoMode ? demoProfile?.referralCode : dbMember?.referralCode) && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-white rounded-xl elevation-1">
              <span className="text-xs text-muted-foreground flex-1 truncate font-mono">
                play-it-forward.vercel.app/join?ref=
                <span className="text-foreground font-semibold">
                  {demoMode ? demoProfile?.referralCode : dbMember?.referralCode}
                </span>
              </span>
            </div>
          )}
          <button
            onClick={handleCopyReferralLink}
            disabled={!(demoMode ? demoProfile?.referralCode : dbMember?.referralCode)}
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-primary text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-[0.98]"
          >
            {copySuccess ? (
              <>
                <Check className="h-4 w-4" />
                {t("profile.link_copied")}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {t("profile.copy_link")}
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* My Preferences */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="mb-6">
        <button
          onClick={() => setShowPrefs(!showPrefs)}
          className="w-full flex items-center justify-between mb-3"
        >
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            {t("profile.preferences")}
          </h2>
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              showPrefs && "rotate-90"
            )}
          />
        </button>

        {showPrefs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-4"
          >
            {/* Kid Ages */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                {t("profile.kid_ages")}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {kidAges.map((age) => (
                  <span
                    key={age}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-2xs font-medium"
                  >
                    {age} {t("profile.yrs")}
                    <button onClick={() => removeAge(age)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t("profile.age_placeholder")}
                  type="number"
                  min="1"
                  max="18"
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAge()}
                  className="w-20 h-9 bg-white border-0 elevation-1 rounded-xl text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addAge}
                  disabled={!newAge}
                  className="h-9 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  {t("profile.add_age")}
                </Button>
              </div>
            </div>

            {/* Preferred Categories */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                {t("profile.preferred_categories")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => {
                  const isActive = preferredCategories.includes(c.value);
                  return (
                    <button
                      key={c.value}
                      onClick={() => toggleCategory(c.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-2xs font-medium transition-all",
                        isActive
                          ? "bg-primary text-white elevation-2"
                          : "bg-white text-muted-foreground elevation-1"
                      )}
                    >
                      {c.emoji} {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Recommendations — only shown in demo mode (uses mock catalog) */}
      {demoMode && recommendations.length > 0 &&
        (kidAges.length > 0 || preferredCategories.length > 0) && (
          <motion.div {...fadeUp} transition={{ delay: 0.22 }} className="mb-6">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-sunshine" />
              {t("profile.recommended")}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              {recommendations.map((game) => (
                <Link
                  key={game.id}
                  href={`/game/${game.id}`}
                  className="shrink-0 w-36"
                >
                  <div className="rounded-2xl bg-white elevation-1 overflow-hidden hover:elevation-2 transition-shadow">
                    <div className="h-24 relative">
                      {game.photos[0] ? (
                        <Image
                          src={game.photos[0]}
                          alt={game.title}
                          fill
                          className="object-cover"
                          sizes="144px"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/10 to-sunshine/10 flex items-center justify-center">
                          <span className="text-2xl">
                            {getCategoryEmoji(game.category)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h3 className="text-2xs font-semibold truncate">
                        {game.title}
                      </h3>
                      <p className="text-2xs text-muted-foreground mt-0.5">
                        {getCategoryLabel(game.category)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

      {/* My Games List */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
        <h2 className="text-sm font-semibold mb-3">
          {t("profile.games_sharing")}
        </h2>
        {dataLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
          </div>
        ) : myGames.length === 0 ? (
          <p className="text-2xs text-muted-foreground text-center py-6">
            {demoMode ? t("profile.no_games_demo") : t("profile.no_games_shared")}
          </p>
        ) : (
          <div className="space-y-2.5">
            {myGames.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
              >
                <Link href={`/game/${game.id}`}>
                  <Card className="border-0 elevation-1 bg-white hover:elevation-2 transition-shadow duration-200">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 relative">
                        {game.photos[0] ? (
                          <Image
                            src={game.photos[0]}
                            alt={game.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/10 to-sunshine/10 flex items-center justify-center">
                            <span className="text-lg">
                              {getCategoryEmoji(game.category)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {game.title}
                        </h3>
                        <p className="text-2xs text-muted-foreground flex items-center gap-2">
                          <span>{t("profile.handoffs_count", { count: game.handoffs })}</span>
                          <span className="text-border">·</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {formatDistance(game)}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Borrow History — only shown when logged in and data available */}
      {!demoMode && !dataLoading && borrowHistory.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="mt-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Repeat className="h-4 w-4 text-coral" />
            {t("profile.games_borrowed")}
          </h2>
          <div className="space-y-2">
            {borrowHistory.slice(0, 5).map((req) => (
              <Card key={req.id} className="border-0 elevation-1 bg-white">
                <CardContent className="p-3 flex items-center gap-3">
                  {req.gamePhoto ? (
                    <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 relative">
                      <Image
                        src={req.gamePhoto}
                        alt={req.gameTitle}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 shrink-0 flex items-center justify-center">
                      <Package className="h-4 w-4 text-primary/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{req.gameTitle}</h3>
                    <p className="text-2xs text-muted-foreground">
                      {t("profile.borrowed_from", { name: req.lenderName })} · {t(STATUS_LABEL_KEYS[req.status] ?? "status.pending")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Lend History — only shown when logged in and data available */}
      {!demoMode && !dataLoading && lendHistory.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.32 }} className="mt-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            {t("profile.games_lent")}
          </h2>
          <div className="space-y-2">
            {lendHistory.slice(0, 5).map((req) => (
              <Card key={req.id} className="border-0 elevation-1 bg-white">
                <CardContent className="p-3 flex items-center gap-3">
                  {req.gamePhoto ? (
                    <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 relative">
                      <Image
                        src={req.gamePhoto}
                        alt={req.gameTitle}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 shrink-0 flex items-center justify-center">
                      <Package className="h-4 w-4 text-primary/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{req.gameTitle}</h3>
                    <p className="text-2xs text-muted-foreground">
                      {t("profile.lent_to", { name: req.borrowerName })} · {t(STATUS_LABEL_KEYS[req.status] ?? "status.pending")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Sign Out / Sign In */}
      <motion.div {...fadeUp} transition={{ delay: 0.35 }} className="mt-8">
        {demoMode ? (
          <Link href="/auth/signin?redirect=/profile">
            <Button
              variant="ghost"
              className="w-full h-11 rounded-2xl text-muted-foreground hover:text-primary"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {t("profile.sign_in_btn")}
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full h-11 rounded-2xl text-muted-foreground hover:text-red-500"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("profile.sign_out")}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}

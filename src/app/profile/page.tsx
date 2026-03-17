"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MOCK_GAMES,
  CATEGORIES,
  getCategoryLabel,
  getCategoryEmoji,
  formatDistance,
  getRecommendedGames,
  type GameCategory,
} from "@/lib/data";
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import type { User } from "@supabase/supabase-js";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferredCategories, setPreferredCategories] = useState<GameCategory[]>([]);
  const [kidAges, setKidAges] = useState<number[]>([]);
  const [newAge, setNewAge] = useState("");
  const [showPrefs, setShowPrefs] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase?.auth) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Redirect to sign-in page
        router.replace("/auth/signin?redirect=/profile");
        return;
      }
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/auth/signin?redirect=/profile");
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [router]);

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

  const recommendations = useMemo(() => {
    if (!user) return [];
    return getRecommendedGames({ kidAges, preferredCategories }, 4);
  }, [user, kidAges, preferredCategories]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "You";
  const avatarUrl = user?.user_metadata?.avatar_url;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const myGames = MOCK_GAMES.slice(0, 3);

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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                Hi, {displayName}!
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-2xs font-semibold">
                <Award className="h-3 w-3" />
                Founding Member
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {myGames.length} games in circulation
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
          <div className="text-2xs text-muted-foreground mt-0.5">Shared</div>
        </div>
        <div className="rounded-2xl bg-white elevation-1 p-4 text-center">
          <Repeat className="h-5 w-5 text-coral mx-auto mb-2" />
          <div className="text-2xl font-bold">
            {myGames.reduce((sum, g) => sum + g.handoffs, 0)}
          </div>
          <div className="text-2xs text-muted-foreground mt-0.5">Handoffs</div>
        </div>
        <div className="rounded-2xl bg-white elevation-1 p-4 text-center">
          <Shield className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">95</div>
          <div className="text-2xs text-muted-foreground mt-0.5">Trust</div>
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
            My Preferences
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
                Kid Ages
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {kidAges.map((age) => (
                  <span
                    key={age}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-2xs font-medium"
                  >
                    {age} yrs
                    <button onClick={() => removeAge(age)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Age"
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
                  Add
                </Button>
              </div>
            </div>

            {/* Preferred Categories */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Preferred Categories
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

      {/* Recommendations */}
      {recommendations.length > 0 &&
        (kidAges.length > 0 || preferredCategories.length > 0) && (
          <motion.div {...fadeUp} transition={{ delay: 0.22 }} className="mb-6">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-sunshine" />
              Recommended for You
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
          Games I&apos;m Sharing
        </h2>
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
                        <span>{game.handoffs} handoffs</span>
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
      </motion.div>

      {/* Sign Out */}
      <motion.div {...fadeUp} transition={{ delay: 0.35 }} className="mt-8">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full h-11 rounded-2xl text-muted-foreground hover:text-red-500"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </motion.div>
    </motion.div>
  );
}

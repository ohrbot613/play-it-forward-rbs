"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import { fetchIsRelayVolunteer, registerAsRelay } from "@/lib/queries";
import { useLanguage } from "@/lib/i18n";
import {
  Bike,
  Trophy,
  Users,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Star,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

const NEIGHBORHOODS = ["Aleph", "Bet", "Gimmel", "Dalet", "Hey"] as const;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function RelaySignupPage() {
  const { t, dir } = useLanguage();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAlready, setIsAlready] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [fromNeighborhood, setFromNeighborhood] = useState<typeof NEIGHBORHOODS[number]>(NEIGHBORHOODS[0]);
  const [toNeighborhood, setToNeighborhood] = useState<typeof NEIGHBORHOODS[number]>(NEIGHBORHOODS[1]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [availableHours, setAvailableHours] = useState("");

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const already = await fetchIsRelayVolunteer();
        setIsAlready(already);
      }
      setLoading(false);
    }
    init();
  }, []);

  function toggleDay(day: string) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await registerAsRelay({
      fromNeighborhood,
      toNeighborhood,
      availableDays: selectedDays,
      availableHours,
    });
    setSubmitting(false);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error ?? t("relay.error"));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm">{t("relay.title")}</span>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">

        {/* Hero */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Bike className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold">{t("relay.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("relay.subtitle")}</p>
        </motion.div>

        {/* How it works */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-4 pb-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("relay.how_it_works")}</p>
              {[
                { icon: <Users className="w-4 h-4 text-primary" />, text: t("relay.step1") },
                { icon: <Bike className="w-4 h-4 text-primary" />, text: t("relay.step2") },
                { icon: <Trophy className="w-4 h-4 text-primary" />, text: t("relay.step3") },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    {step.icon}
                  </div>
                  <p className="text-sm leading-snug">{step.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Perks */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="pt-4 pb-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("relay.perks_title")}</p>
              {[t("relay.perk1"), t("relay.perk2"), t("relay.perk3")].map((perk, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm">{perk}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Already volunteer */}
        {isAlready && (
          <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CardContent className="pt-4 pb-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">{t("relay.already_volunteer")}</p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">{t("relay.already_sub")}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Success state */}
        {success && (
          <motion.div {...fadeUp} transition={{ delay: 0 }}>
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CardContent className="pt-4 pb-4 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
                <p className="font-semibold text-green-800 dark:text-green-300">{t("relay.success")}</p>
                <Link href="/leaderboard">
                  <Button variant="outline" size="sm" className="mt-2">{t("lb.title")}</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Not signed in */}
        {!user && !loading && (
          <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="pt-4 pb-4 text-center space-y-3">
                <p className="text-sm text-muted-foreground">{t("relay.sign_in_required")}</p>
                <Link href="/auth">
                  <Button className="w-full">{t("auth.sign_in")}</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Signup form */}
        {user && !isAlready && !success && (
          <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* From neighborhood */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {t("relay.from_neighborhood")}
                </label>
                <select
                  value={fromNeighborhood}
                  onChange={e => setFromNeighborhood(e.target.value as typeof NEIGHBORHOODS[number])}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {NEIGHBORHOODS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* To neighborhood */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {t("relay.to_neighborhood")}
                </label>
                <select
                  value={toNeighborhood}
                  onChange={e => setToNeighborhood(e.target.value as typeof NEIGHBORHOODS[number])}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {NEIGHBORHOODS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Available days */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">{t("relay.available_days")}</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                        selectedDays.includes(day)
                          ? "bg-primary text-white border-primary"
                          : "bg-background border-border text-muted-foreground hover:border-primary"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {t("relay.available_hours")}
                </label>
                <Input
                  value={availableHours}
                  onChange={e => setAvailableHours(e.target.value)}
                  placeholder={t("relay.available_hours_placeholder")}
                  className="text-sm"
                />
              </div>

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                ) : (
                  <Bike className="w-4 h-4 me-2" />
                )}
                {t("relay.sign_up")}
              </Button>
            </form>
          </motion.div>
        )}

      </div>
    </div>
  );
}

"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Dice5, Users, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MOCK_GAMES } from "@/lib/data";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[80vh]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState(false);
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams?.get("redirect") ?? "/profile";

  useEffect(() => {
    const supabase = createClient();
    if (!supabase?.auth) {
      setCheckingAuth(false);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      if (user) {
        router.replace(redirectTo);
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router, redirectTo]);

  useEffect(() => {
    if (searchParams?.get("error") === "auth") {
      setAuthError(true);
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    if (!supabase?.auth) {
      setAuthError(true);
      return;
    }
    setLoading(true);
    setAuthError(false);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      setAuthError(true);
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalGames = MOCK_GAMES.length;
  const totalFamilies = new Set(MOCK_GAMES.map((g) => g.ownerId)).size;

  return (
    <div className="min-h-[85vh] flex flex-col justify-between px-4 pt-12 pb-8">
      {/* Top: Branding */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          {/* Logo area */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mx-auto mb-5 h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center elevation-3"
          >
            <Dice5 className="h-10 w-10 text-white" />
          </motion.div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
            {t("auth.welcome")}
          </h1>
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Sparkles className="h-4 w-4 text-sunshine" />
            <p className="text-sm text-muted-foreground">
              {t("auth.subtitle")}
            </p>
          </div>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-3 mb-8"
        >
          {[
            { icon: Dice5, text: lang === "he" ? "שתף ושאל משחקים מהשכנים" : "Share & borrow games from neighbors" },
            { icon: Users, text: lang === "he" ? "רשת שכנים מבוססת אמון" : "Trust-based neighborhood network" },
            { icon: Heart, text: lang === "he" ? "חינמי לגמרי — הקהילה מנהלת" : "Completely free — community-run" },
          ].map(({ icon: Icon, text }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: lang === "he" ? 12 : -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl bg-white elevation-1",
                lang === "he" && "flex-row-reverse text-right"
              )}
            >
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-sm text-foreground font-medium">{text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Community stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-6"
        >
          <p className="text-xs text-muted-foreground">
            {t("auth.community_stats", { games: String(totalGames), families: String(totalFamilies) })}
          </p>
        </motion.div>
      </div>

      {/* Bottom: Sign-in section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {authError && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm text-center">
            {t("auth.sign_in_failed")}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mb-4">
          {t("auth.sign_in_prompt")}
        </p>

        <Button
          className="w-full h-13 rounded-2xl text-base font-semibold elevation-3 hover:elevation-4 transition-all active:scale-[0.98]"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <svg className={cn("h-5 w-5", lang === "he" ? "ml-2" : "mr-2")} viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          {t("auth.sign_in_google")}
        </Button>

        <p className="text-center text-2xs text-muted-foreground mt-3">
          {t("auth.no_password")}
        </p>
      </motion.div>
    </div>
  );
}

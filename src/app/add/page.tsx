"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIES,
  CONDITIONS,
  AGE_GROUPS,
  type GameCategory,
  type GameCondition,
  type AgeGroup,
} from "@/lib/data";
import { Camera, Plus, CheckCircle2, X, ArrowRight, ArrowLeft, LogIn, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";
import Link from "next/link";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

type Step = "form" | "photos" | "identifying" | "submitting" | "done";

const GAME_CATEGORIES = [
  "Strategy",
  "Family",
  "Party",
  "Educational",
  "Cooperative",
  "Puzzle",
  "Card Game",
  "Abstract",
  "Trivia",
  "Other",
] as const;

type GameType = typeof GAME_CATEGORIES[number];

const AGE_RANGES = ["3+", "5+", "7+", "10+", "12+", "14+", "18+", "All Ages"] as const;
type AgeRange = typeof AGE_RANGES[number];

// Map AI-returned originalCategory to our GameType
const AI_CATEGORY_TO_GAME_TYPE: Record<string, GameType> = {
  Strategy: "Strategy",
  Family: "Family",
  Party: "Party",
  Children: "Educational",
  Cooperative: "Cooperative",
  "Card Game": "Card Game",
  "Word Game": "Party",
  Abstract: "Abstract",
  RPG: "Strategy",
  Trivia: "Trivia",
  Other: "Other",
};

// Map AI ageGroup string to AgeRange
function mapAiAgeGroup(ageGroup: string): AgeRange | "" {
  const match = ageGroup?.match(/\d+/);
  if (!match) return "";
  const age = parseInt(match[0]);
  if (age <= 3) return "3+";
  if (age <= 5) return "5+";
  if (age <= 7) return "7+";
  if (age <= 10) return "10+";
  if (age <= 12) return "12+";
  if (age <= 14) return "14+";
  if (age <= 18) return "18+";
  return "All Ages";
}

const pageVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function AddGamePage() {
  const [step, setStep] = useState<Step>("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GameCategory | "">("");
  const [condition, setCondition] = useState<GameCondition | "">("");
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [minPlayers, setMinPlayers] = useState("1");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [photos, setPhotos] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);
  const [aiToast, setAiToast] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType | "">("");
  const [ageRange, setAgeRange] = useState<AgeRange | "">("");
  const { t, lang } = useLanguage();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase?.auth) {
      setAuthChecked(true);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      setUser(user);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const toggleAge = (age: AgeGroup) => {
    setAgeGroups((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]
    );
  };

  const identifyGame = async (photoDataUrl: string) => {
    setStep("identifying");
    try {
      const res = await fetch("/api/identify-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: photoDataUrl }),
      });
      if (!res.ok) {
        if (res.status === 413) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error ?? "Photo too large. Please use a photo under 2MB.");
        }
        throw new Error("API error");
      }
      const data = await res.json();
      if (data.confidence === "high" || data.confidence === "medium") {
        if (data.name) setTitle(data.name);
        if (data.description) setDescription(data.description);
        if (data.category) setCategory(data.category as GameCategory);
        if (data.minPlayers) setMinPlayers(String(data.minPlayers));
        if (data.maxPlayers) setMaxPlayers(String(data.maxPlayers));
        if (data.originalCategory && AI_CATEGORY_TO_GAME_TYPE[data.originalCategory]) {
          setGameType(AI_CATEGORY_TO_GAME_TYPE[data.originalCategory]);
        }
        if (data.ageGroup) {
          const mapped = mapAiAgeGroup(data.ageGroup);
          if (mapped) setAgeRange(mapped);
        }
        setAiFilled(true);
        setStep("form");
      } else {
        setAiToast(t("add.ai_failed"));
        setStep("photos");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setAiToast(msg && msg !== "API error" ? msg : t("add.ai_failed"));
      setStep("photos");
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (!aiToast) return;
    const timer = setTimeout(() => setAiToast(null), 4000);
    return () => clearTimeout(timer);
  }, [aiToast]);

  const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB
  const MAX_DIMENSION = 1200;

  const resizeImageIfNeeded = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
          resolve(dataUrl);
          return;
        }
        const scale = MAX_DIMENSION / Math.max(width, height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const isFirstPhoto = photos.length === 0;
    Array.from(files).forEach((file, i) => {
      if (file.size > MAX_FILE_BYTES) {
        setAiToast(lang === "he" ? "התמונה גדולה מדי. אנא השתמש בתמונה מתחת ל-2MB." : "Photo too large. Please use a photo under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawDataUrl = reader.result as string;
        const dataUrl = await resizeImageIfNeeded(rawDataUrl);
        setPhotos((prev) => [...prev, dataUrl]);
        // Trigger AI identification on the very first photo added
        if (isFirstPhoto && i === 0) {
          identifyGame(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = title && category && condition;

  const uploadPhotosToStorage = async (
    photoDataUrls: string[],
    userId: string
  ): Promise<string[]> => {
    const supabase = createClient();
    if (!supabase) return [];

    const uploaded: string[] = [];
    for (let i = 0; i < photoDataUrls.length; i++) {
      try {
        const res = await fetch(photoDataUrls[i]);
        const blob = await res.blob();
        const ext = blob.type === "image/png" ? "png" : "jpg";
        const path = `${userId}/${Date.now()}-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("game-photos")
          .upload(path, blob, { contentType: blob.type, upsert: false });

        if (uploadError) {
          console.warn(`Photo ${i} upload failed:`, uploadError.message);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("game-photos")
          .getPublicUrl(path);

        uploaded.push(publicUrl);
      } catch (err) {
        console.warn(`Photo ${i} upload error:`, err);
      }
    }
    return uploaded;
  };

  const handleSubmit = async () => {
    setStep("submitting");
    setSubmitError(null);

    try {
      const supabase = createClient();

      // If Supabase is not configured, show success anyway (dev/demo mode)
      if (!supabase?.auth || !user) {
        setStep("done");
        return;
      }

      const categoryMap: Record<string, string> = {
        "board-games": "board_game",
        "outdoor-toys": "outdoor",
        "lego-building": "lego",
        magnets: "toy",
        playmobil: "toy",
        puzzles: "puzzle",
        other: "toy",
      };

      const conditionMap: Record<string, string> = {
        "like-new": "new",
        good: "good",
        fair: "fair",
      };

      // Upload photos to Supabase Storage, fall back gracefully if bucket missing
      const photoUrls = photos.length > 0
        ? await uploadPhotosToStorage(photos, user.id)
        : [];

      const { error } = await supabase.from("games").insert({
        title,
        description: description || null,
        category: categoryMap[category] || "toy",
        condition: conditionMap[condition as string] || "good",
        age_range_min: ageGroups.length > 0 ? 0 : null,
        age_range_max: ageGroups.length > 0 ? 18 : null,
        player_count_min: parseInt(minPlayers) || 1,
        player_count_max: parseInt(maxPlayers) || 4,
        owner_id: user.id,
        is_available: true,
        photos: photoUrls.length > 0 ? photoUrls : null,
        game_type: gameType || null,
        age_range: ageRange || null,
      });

      if (error) {
        console.error("Supabase insert failed:", error.message);
        setSubmitError(lang === "he" ? "שגיאה בשמירת המשחק. נסה שוב." : "Failed to save game. Please try again.");
        setStep("photos");
        return;
      }

      setStep("done");
    } catch (err) {
      console.error("Could not save to database:", err);
      setSubmitError(lang === "he" ? "שגיאה בשמירת המשחק. נסה שוב." : "Failed to save game. Please try again.");
      setStep("photos");
    }
  };

  // Not signed in — show prompt
  if (authChecked && !user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <LogIn className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold mb-2">{t("auth.sign_in_required")}</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-[260px]">
          {t("auth.sign_in_to_share")}
        </p>
        <Link href="/auth/signin?redirect=/add">
          <Button className="h-12 rounded-2xl px-8 text-base font-semibold elevation-3">
            <LogIn className={cn("h-4 w-4", lang === "he" ? "ml-2" : "mr-2")} />
            {t("auth.sign_in")}
          </Button>
        </Link>
      </motion.div>
    );
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (step === "identifying") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          {t("add.identifying")}
        </p>
      </div>
    );
  }

  if (step === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          {lang === "he" ? "שומר את המשחק..." : "Saving your game..."}
        </p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <motion.div
        key="done"
        variants={pageVariants}
        initial="enter"
        animate="center"
        className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="h-20 w-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-5"
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">{t("add.game_listed")}</h1>
        <p className="text-sm text-muted-foreground mb-1 max-w-[260px]">
          &ldquo;{title}&rdquo; {t("add.game_available")}
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          {t("add.whatsapp_notify")}
        </p>
        <Button
          onClick={() => {
            setStep("form");
            setTitle("");
            setDescription("");
            setCategory("");
            setCondition("");
            setAgeGroups([]);
            setPhotos([]);
            setAiFilled(false);
            setGameType("");
            setAgeRange("");
          }}
          variant="outline"
          className="rounded-2xl h-11 px-5"
        >
          <Plus className={cn("h-4 w-4", lang === "he" ? "ml-2" : "mr-2")} />
          {t("add.share_another")}
        </Button>
      </motion.div>
    );
  }

  if (step === "photos") {
    return (
      <motion.div
        key="photos"
        variants={pageVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="px-4 pt-8"
      >
        <h1 className="text-xl font-bold mb-1">{t("add.photos_title")}</h1>
        <p className="text-sm text-muted-foreground mb-5">
          {t("add.photos_subtitle")}
        </p>

        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {photos.map((photo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-2xl overflow-hidden elevation-1"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/40 backdrop-blur flex items-center justify-center transition-transform hover:scale-110"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </motion.div>
          ))}
          <label className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors bg-background">
            <Camera className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-2xs text-muted-foreground">{t("add.add_photo")}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>
        </div>

        {/* Submit error */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-4 px-4 py-2.5 rounded-2xl bg-red-50 text-xs text-red-600 text-center"
            >
              {submitError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI toast */}
        <AnimatePresence>
          {aiToast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-4 px-4 py-2.5 rounded-2xl bg-muted text-xs text-muted-foreground text-center"
            >
              {aiToast}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12 rounded-2xl" onClick={() => setStep("form")}>
            <ArrowLeft className={cn("h-4 w-4", lang === "he" ? "ml-1.5" : "mr-1.5")} />
            {t("add.back")}
          </Button>
          <Button className="flex-1 h-12 rounded-2xl font-semibold elevation-2" onClick={handleSubmit}>
            {photos.length > 0 ? t("add.submit") : t("add.skip_submit")}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="form"
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="px-4 pt-8"
    >
      {/* AI auto-fill banner */}
      {aiFilled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-2.5 rounded-2xl bg-primary/10 dark:bg-primary/20 text-xs text-primary font-medium flex items-center justify-between"
        >
          <span>{t("add.ai_filled")}</span>
          <button onClick={() => setAiFilled(false)} className="ml-2">
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("add.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("add.subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t("add.game_name")}</label>
          <Input
            placeholder={t("add.game_name_placeholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white border-0 elevation-1 h-12 rounded-2xl focus-visible:elevation-2 transition-shadow"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t("add.category")}</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-medium transition-all duration-200",
                  category === c.value
                    ? "bg-foreground text-white elevation-2"
                    : "bg-white text-muted-foreground elevation-1 hover:elevation-2"
                )}
                onClick={() => setCategory(c.value)}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t("add.condition")}</label>
          <div className="flex gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                className={cn(
                  "flex-1 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200",
                  condition === c.value
                    ? "bg-foreground text-white elevation-2"
                    : "bg-white text-muted-foreground elevation-1 hover:elevation-2"
                )}
                onClick={() => setCondition(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Game Type (detailed category) */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            {t("add.category_select")} <span className="text-muted-foreground font-normal text-xs">{t("add.optional")}</span>
          </label>
          <select
            value={gameType}
            onChange={(e) => setGameType(e.target.value as GameType | "")}
            className={cn(
              "w-full h-12 rounded-2xl bg-white border-0 elevation-1 px-4 text-sm focus:outline-none focus:elevation-2 transition-shadow appearance-none",
              !gameType && "text-muted-foreground"
            )}
          >
            <option value="">{t("add.category_select_placeholder")}</option>
            {GAME_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Age Range */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            {t("add.age_range")} <span className="text-muted-foreground font-normal text-xs">{t("add.optional")}</span>
          </label>
          <select
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value as AgeRange | "")}
            className={cn(
              "w-full h-12 rounded-2xl bg-white border-0 elevation-1 px-4 text-sm focus:outline-none focus:elevation-2 transition-shadow appearance-none",
              !ageRange && "text-muted-foreground"
            )}
          >
            <option value="">{t("add.age_range_placeholder")}</option>
            {AGE_RANGES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Age Groups */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            {t("add.good_for")} <span className="text-muted-foreground font-normal text-xs">{t("add.optional")}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((a) => (
              <button
                key={a.value}
                className={cn(
                  "px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200",
                  ageGroups.includes(a.value)
                    ? "bg-foreground text-white elevation-2"
                    : "bg-white text-muted-foreground elevation-1 hover:elevation-2"
                )}
                onClick={() => toggleAge(a.value)}
              >
                {a.label} ({a.range})
              </button>
            ))}
          </div>
        </div>

        {/* Players */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            {t("add.players")} <span className="text-muted-foreground font-normal text-xs">{t("add.optional")}</span>
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="1"
              max="20"
              value={minPlayers}
              onChange={(e) => setMinPlayers(e.target.value)}
              className="bg-white border-0 elevation-1 h-12 rounded-2xl w-20 text-center focus-visible:elevation-2"
            />
            <span className="text-sm text-muted-foreground">{t("add.to")}</span>
            <Input
              type="number"
              min="1"
              max="20"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="bg-white border-0 elevation-1 h-12 rounded-2xl w-20 text-center focus-visible:elevation-2"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            {t("add.notes")} <span className="text-muted-foreground font-normal text-xs">{t("add.optional")}</span>
          </label>
          <Textarea
            placeholder={t("add.notes_placeholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="bg-white border-0 elevation-1 rounded-2xl resize-none focus-visible:elevation-2 transition-shadow"
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full h-13 rounded-2xl text-base font-semibold elevation-3 hover:elevation-4 transition-all active:scale-[0.98]"
          disabled={!canProceed}
          onClick={() => setStep("photos")}
        >
          {t("add.next_photos")}
          <ArrowRight className={cn("h-4 w-4", lang === "he" ? "mr-2" : "ml-2")} />
        </Button>
      </div>

      <div className="h-6" />
    </motion.div>
  );
}

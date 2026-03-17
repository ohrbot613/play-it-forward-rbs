"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type Language = "en" | "he";

const translations = {
  // App title & hero
  "app.title": { en: "Play it Forward", he: "שחק הלאה" },
  "app.subtitle": { en: "Free game sharing across Ramat Beit Shemesh", he: "שיתוף משחקים חינם ברמת בית שמש" },
  "app.games_live": { en: "games live", he: "משחקים זמינים" },
  "app.shares_counting": { en: "shares & counting", he: "שיתופים וממשיכים" },

  // Search
  "search.placeholder": { en: "Search games...", he: "חיפוש משחקים..." },
  "search.wishes_placeholder": { en: "Search wishes...", he: "חיפוש בקשות..." },

  // Categories
  "category.all": { en: "All", he: "הכל" },

  // Filters
  "filter.available_only": { en: "Available only", he: "זמינים בלבד" },
  "filter.all_games": { en: "All games", he: "כל המשחקים" },
  "filter.results": { en: "results", he: "תוצאות" },

  // Sort options
  "sort.closest": { en: "Closest", he: "הקרוב ביותר" },
  "sort.newest": { en: "Newest", he: "החדש ביותר" },
  "sort.top_rated": { en: "Top Rated", he: "דירוג גבוה" },
  "sort.most_shared": { en: "Most Shared", he: "הכי משותף" },
  "sort.category": { en: "Category", he: "קטגוריה" },

  // Bottom nav
  "nav.browse": { en: "Browse", he: "עיון" },
  "nav.map": { en: "Map", he: "מפה" },
  "nav.share": { en: "Share", he: "שתף" },
  "nav.wishes": { en: "Wishes", he: "בקשות" },
  "nav.profile": { en: "Profile", he: "פרופיל" },

  // Game detail
  "game.not_found": { en: "Game not found", he: "משחק לא נמצא" },
  "game.may_removed": { en: "It may have been removed", he: "ייתכן שהוסר" },
  "game.back_to_games": { en: "Back to games", he: "חזרה למשחקים" },
  "game.shared_times": { en: "Shared {count} times", he: "שותף {count} פעמים" },
  "game.community_game": { en: "Community Game", he: "משחק קהילתי" },
  "game.on_loan": { en: "On Loan", he: "מושאל" },
  "game.on_loan_from": { en: "On loan from", he: "מושאל מ" },
  "game.trust": { en: "Trust", he: "אמינות" },
  "game.reviews": { en: "Reviews", he: "ביקורות" },
  "game.about": { en: "About this game", he: "על המשחק" },
  "game.players": { en: "Players", he: "שחקנים" },
  "game.time": { en: "Time", he: "זמן" },
  "game.level": { en: "Level", he: "רמה" },
  "game.distance": { en: "Distance", he: "מרחק" },
  "game.currently_with": { en: "Currently with", he: "נמצא אצל" },
  "game.listed": { en: "Listed", he: "פורסם" },
  "game.people_interested": { en: "{count} people interested", he: "{count} אנשים מעוניינים" },
  "game.person_interested": { en: "1 person interested", he: "אדם אחד מעוניין" },
  "game.request_whatsapp": { en: "Request via WhatsApp", he: "בקשה דרך וואטסאפ" },
  "game.express_interest": { en: "Express Interest", he: "הבעת עניין" },
  "game.whatsapp_help": { en: "WhatsApp messages the holder directly. Express Interest notifies them you're interested.", he: "וואטסאפ שולח הודעה ישירה למחזיק. הבעת עניין מודיעה להם שאתה מעוניין." },
  "game.currently_unavailable": { en: "Currently Unavailable", he: "לא זמין כרגע" },
  "game.notify_available": { en: "Notify Me When Available", he: "הודע לי כשזמין" },
  "game.notify_help": { en: "Get notified when this game becomes available again", he: "קבל התראה כשהמשחק יהיה זמין שוב" },
  "game.currently_out": { en: "Currently Out", he: "מושאל כרגע" },
  "game.helpful": { en: "helpful", he: "מועיל" },
  "game.like_new": { en: "Like New", he: "כמו חדש" },
  "game.good": { en: "Good", he: "טוב" },
  "game.fair": { en: "Fair", he: "סביר" },
  "game.shared_x": { en: "{count}x shared", he: "שותף {count} פעמים" },

  // Request modal
  "modal.request_title": { en: "Request This Game", he: "בקש את המשחק" },
  "modal.your_name": { en: "Your Name", he: "השם שלך" },
  "modal.enter_name": { en: "Enter your name", he: "הכנס את שמך" },
  "modal.message": { en: "Message (optional)", he: "הודעה (אופציונלי)" },
  "modal.message_placeholder": { en: "e.g. We'd love to borrow this for Shabbat!", he: "לדוגמה: נשמח לשאול את המשחק לשבת!" },
  "modal.send_request": { en: "Send Request", he: "שלח בקשה" },
  "modal.request_sent": { en: "Request Sent!", he: "הבקשה נשלחה!" },
  "modal.holder_notified": { en: "The holder will be notified", he: "המחזיק יקבל הודעה" },

  // Wishes / Requests page
  "wishes.title": { en: "Community Wishes", he: "בקשות הקהילה" },
  "wishes.subtitle": { en: "Games your neighbors are looking for", he: "משחקים שהשכנים שלך מחפשים" },
  "wishes.open_wishes": { en: "open wishes", he: "בקשות פתוחות" },
  "wishes.can_you_help": { en: "Can you help?", he: "תוכל לעזור?" },
  "wishes.open": { en: "Open", he: "פתוח" },
  "wishes.matched": { en: "Matched", he: "נמצא התאמה" },
  "wishes.fulfilled": { en: "Fulfilled", he: "מומש" },
  "wishes.match_found": { en: "Match found", he: "נמצאה התאמה" },
  "wishes.wish": { en: "wish", he: "בקשה" },
  "wishes.wishes_count": { en: "wishes", he: "בקשות" },
  "wishes.no_wishes": { en: "No wishes here", he: "אין בקשות כאן" },
  "wishes.all_fulfilled": { en: "All wishes have been fulfilled! Check back later.", he: "כל הבקשות מומשו! בדוק שוב מאוחר יותר." },
  "wishes.no_status": { en: "No {status} wishes right now.", he: "אין בקשות {status} כרגע." },

  // Activity feed
  "activity.title": { en: "Community Activity", he: "פעילות קהילתית" },
  "activity.live": { en: "Live feed", he: "עדכון חי" },

  // Empty states
  "empty.no_games": { en: "No games found", he: "לא נמצאו משחקים" },
  "empty.adjust_filters": { en: "Try adjusting your search or filters", he: "נסה לשנות את החיפוש או הסינון" },

  // Complexity labels
  "complexity.light": { en: "Light", he: "קל" },
  "complexity.medium": { en: "Medium", he: "בינוני" },
  "complexity.heavy": { en: "Heavy", he: "כבד" },

  // Urgency labels
  "urgency.high": { en: "Urgent", he: "דחוף" },
  "urgency.normal": { en: "Normal", he: "רגיל" },
  "urgency.low": { en: "Whenever", he: "בלי לחץ" },
} as const;

export type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pif-lang") as Language | null;
    if (stored === "en" || stored === "he") {
      setLangState(stored);
    }
    setMounted(true);
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("pif-lang", newLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey, replacements?: Record<string, string | number>): string => {
      const entry = translations[key];
      if (!entry) return key;
      let text = entry[lang] ?? entry.en;
      if (replacements) {
        for (const [k, v] of Object.entries(replacements)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [lang]
  );

  const dir = lang === "he" ? "rtl" : "ltr";

  // Update html attributes when language changes
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir, mounted]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

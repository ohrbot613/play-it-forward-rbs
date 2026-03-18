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

  // Auth / Sign-in
  "auth.welcome": { en: "Welcome to Play it Forward", he: "ברוכים הבאים לשחק הלאה" },
  "auth.subtitle": { en: "Free game sharing across Ramat Beit Shemesh", he: "שיתוף משחקים חינם ברמת בית שמש" },
  "auth.sign_in_google": { en: "Continue with Google", he: "המשך עם גוגל" },
  "auth.sign_in_prompt": { en: "Sign in to share games, borrow from neighbors, and join the community", he: "התחבר כדי לשתף משחקים, לשאול משכנים ולהצטרף לקהילה" },
  "auth.no_password": { en: "Quick and secure — no password needed", he: "מהיר ומאובטח — בלי סיסמה" },
  "auth.sign_in_failed": { en: "Sign in failed. Please try again.", he: "ההתחברות נכשלה. נסה שוב." },
  "auth.sign_in_required": { en: "You need to be signed in", he: "צריך להתחבר" },
  "auth.sign_in_to_share": { en: "Sign in to share a game with your neighbors", he: "התחבר כדי לשתף משחק עם השכנים" },
  "auth.sign_in": { en: "Sign In", he: "התחבר" },
  "auth.community_stats": { en: "{games} games shared by {families} families", he: "{games} משחקים ששותפו על ידי {families} משפחות" },

  // Add game (bilingual)
  "add.title": { en: "Share a Game", he: "שתף משחק" },
  "add.subtitle": { en: "Put a game into circulation for your neighbors", he: "הכנס משחק למחזור לטובת השכנים" },
  "add.game_name": { en: "Game Name", he: "שם המשחק" },
  "add.game_name_placeholder": { en: "e.g. Settlers of Catan", he: "לדוגמה: קטאן" },
  "add.category": { en: "Category", he: "קטגוריה" },
  "add.condition": { en: "Condition", he: "מצב" },
  "add.good_for": { en: "Good for", he: "מתאים ל" },
  "add.optional": { en: "optional", he: "אופציונלי" },
  "add.players": { en: "Players", he: "שחקנים" },
  "add.to": { en: "to", he: "עד" },
  "add.notes": { en: "Notes", he: "הערות" },
  "add.notes_placeholder": { en: "Any missing pieces? Special instructions? Great for Shabbat?", he: "חלקים חסרים? הוראות מיוחדות? מעולה לשבת?" },
  "add.next_photos": { en: "Next: Add Photos", he: "הבא: הוסף תמונות" },
  "add.photos_title": { en: "Add Photos", he: "הוסף תמונות" },
  "add.photos_subtitle": { en: "A few photos help neighbors know what to expect. Optional!", he: "כמה תמונות עוזרות לשכנים לדעת למה לצפות. לא חובה!" },
  "add.add_photo": { en: "Add Photo", he: "הוסף תמונה" },
  "add.back": { en: "Back", he: "חזרה" },
  "add.submit": { en: "Submit", he: "שלח" },
  "add.skip_submit": { en: "Skip & Submit", he: "דלג ושלח" },
  "add.game_listed": { en: "Game Listed!", he: "המשחק נוסף!" },
  "add.game_available": { en: "is now available for your neighbors to borrow.", he: "זמין כעת להשאלה לשכנים שלך." },
  "add.whatsapp_notify": { en: "You'll get a WhatsApp message when someone wants it.", he: "תקבל הודעת וואטסאפ כשמישהו ירצה אותו." },
  "add.share_another": { en: "Share Another Game", he: "שתף משחק נוסף" },
  "add.identifying": { en: "Identifying game...", he: "מזהה משחק..." },
  "add.ai_filled": { en: "AI filled this in — tap to edit", he: "AI מילא את זה — לחץ לעריכה" },
  "add.ai_failed": { en: "Couldn't identify game — please fill in manually", he: "לא הצלחנו לזהות את המשחק — נא למלא ידנית" },

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

  // Dashboard
  "nav.dashboard": { en: "Dashboard", he: "לוח בקרה" },
  "dash.title": { en: "Lender Dashboard", he: "לוח המשאיל" },
  "dash.subtitle": { en: "Manage your games & requests", he: "נהל את המשחקים והבקשות שלך" },
  "dash.tab_requests": { en: "Requests", he: "בקשות" },
  "dash.tab_loans": { en: "Active Loans", he: "השאלות פעילות" },
  "dash.tab_games": { en: "My Games", he: "המשחקים שלי" },
  "dash.pending": { en: "Pending", he: "ממתין" },
  "dash.accept": { en: "Accept", he: "אשר" },
  "dash.decline": { en: "Decline", he: "דחה" },
  "dash.accepted": { en: "Accepted", he: "אושר" },
  "dash.declined": { en: "Declined", he: "נדחה" },
  "dash.no_requests": { en: "No pending requests", he: "אין בקשות ממתינות" },
  "dash.no_requests_sub": { en: "When someone wants to borrow your game, it'll show up here", he: "כשמישהו ירצה לשאול משחק, זה יופיע כאן" },
  "dash.borrowed_by": { en: "Borrowed by", he: "מושאל ל" },
  "dash.since": { en: "Since", he: "מאז" },
  "dash.mark_returned": { en: "Mark Returned", he: "סמן כהוחזר" },
  "dash.returned": { en: "Returned!", he: "הוחזר!" },
  "dash.no_loans": { en: "No active loans", he: "אין השאלות פעילות" },
  "dash.no_loans_sub": { en: "Games you've lent out will appear here", he: "משחקים שהשאלת יופיעו כאן" },
  "dash.available": { en: "Available", he: "זמין" },
  "dash.on_loan": { en: "On Loan", he: "מושאל" },
  "dash.times_shared": { en: "times shared", he: "פעמים שותף" },
  "dash.no_games": { en: "No games listed yet", he: "עדיין אין משחקים" },
  "dash.no_games_sub": { en: "Share your first game to get started!", he: "שתף את המשחק הראשון שלך!" },
  "dash.requests_count": { en: "{count} pending", he: "{count} ממתינים" },
  "dash.loans_count": { en: "{count} active", he: "{count} פעילים" },
  "dash.games_count": { en: "{count} listed", he: "{count} רשומים" },
  "dash.wants_to_borrow": { en: "wants to borrow", he: "רוצה לשאול" },
  "dash.ago": { en: "ago", he: "לפני" },
  "dash.days": { en: "days", he: "ימים" },
  "dash.today": { en: "Today", he: "היום" },
  "dash.yesterday": { en: "Yesterday", he: "אתמול" },
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

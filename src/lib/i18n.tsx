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
  "game.request_to_borrow": { en: "Request to Borrow", he: "בקש להשאיל" },
  "game.coordinator_help": { en: "Our coordinator will arrange the handoff with the owner on your behalf.", he: "הרכז שלנו ידאג לסידור עם הבעלים בשמך." },
  "game.join_waitlist": { en: "Currently Borrowed — Join Waitlist", he: "מושאל כרגע — הצטרף לרשימת המתנה" },
  "game.waitlist_help": { en: "Message our coordinator and we'll notify you when it's available.", he: "שלח הודעה לרכז ונודיע לך כשיהיה זמין." },

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
  "add.age_range": { en: "Age Range", he: "טווח גיל" },
  "add.age_range_placeholder": { en: "Select age range", he: "בחר טווח גיל" },
  "add.category_select": { en: "Game Category", he: "קטגוריית משחק" },
  "add.category_select_placeholder": { en: "Select category", he: "בחר קטגוריה" },

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
  "dash.demo_banner": { en: "Demo Mode — data shown is sample data only", he: "מצב הדגמה — הנתונים המוצגים הם לדוגמה בלבד" },
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

  // Dashboard toasts
  "dash.toast_accepted": { en: "Request accepted!", he: "הבקשה אושרה!" },
  "dash.toast_declined": { en: "Request declined", he: "הבקשה נדחתה" },
  "dash.toast_returned": { en: "Game marked as returned", he: "המשחק סומן כהוחזר" },

  // Wishes — offer to help
  "wishes.i_have_it": { en: "I have this game!", he: "יש לי את המשחק הזה!" },
  "wishes.offer_sent": { en: "Great! We'll let them know.", he: "מעולה! נודיע להם." },
  "wishes.offer_cta": { en: "Offer to Help", he: "הצע עזרה" },
  "wishes.offering": { en: "Sending...", he: "שולח..." },
  "wishes.offer_error": { en: "Something went wrong. Try again.", he: "משהו השתבש. נסה שוב." },

  // Add Wish modal
  "wish.add_btn": { en: "Add a Wish", he: "הוסף בקשה" },
  "wish.add_title": { en: "Add a Wish", he: "הוסף בקשה" },
  "wish.add_subtitle": { en: "Tell the community what game you're looking for", he: "ספר לקהילה איזה משחק אתה מחפש" },
  "wish.game_title": { en: "Game Title", he: "שם המשחק" },
  "wish.game_title_placeholder": { en: "e.g. Catan, Ticket to Ride...", he: "לדוגמה: קטאן, Ticket to Ride..." },
  "wish.notes": { en: "Notes (optional)", he: "הערות (אופציונלי)" },
  "wish.notes_placeholder": { en: "Why do you want it? Any details?", he: "למה אתה רוצה את זה? פרטים נוספים?" },
  "wish.neighborhood": { en: "Your Neighborhood", he: "השכונה שלך" },
  "wish.neighborhood_placeholder": { en: "Select neighborhood", he: "בחר שכונה" },
  "wish.submit": { en: "Post Wish", he: "פרסם בקשה" },
  "wish.submitting": { en: "Posting...", he: "מפרסם..." },
  "wish.success": { en: "Wish posted!", he: "הבקשה פורסמה!" },
  "wish.success_sub": { en: "The community will see it shortly.", he: "הקהילה תראה אותה בקרוב." },
  "wish.error": { en: "Something went wrong. Try again.", he: "משהו השתבש. נסה שוב." },
  "wish.cancel": { en: "Cancel", he: "ביטול" },

  // Profile fallback (mock)
  "profile.founding_member": { en: "Founding Member", he: "חבר מייסד" },
  "profile.shared": { en: "Shared", he: "שותף" },
  "profile.handoffs": { en: "Handoffs", he: "העברות" },
  "profile.trust": { en: "Trust", he: "אמינות" },
  "profile.preferences": { en: "My Preferences", he: "ההעדפות שלי" },
  "profile.kid_ages": { en: "Kid Ages", he: "גילאי הילדים" },
  "profile.preferred_categories": { en: "Preferred Categories", he: "קטגוריות מועדפות" },
  "profile.recommended": { en: "Recommended for You", he: "מומלץ עבורך" },
  "profile.games_sharing": { en: "Games I'm Sharing", he: "משחקים שאני משתף" },
  "profile.sign_out": { en: "Sign Out", he: "התנתק" },
  "profile.sign_in_prompt": { en: "Sign in to see your profile", he: "התחבר לצפייה בפרופיל" },
  "profile.sign_in_btn": { en: "Sign In", he: "התחבר" },
  "profile.demo_name": { en: "Miriam Katz", he: "מרים כץ" },
  "profile.games_in_circulation": { en: "games in circulation", he: "משחקים במחזור" },
  "profile.greeting": { en: "Hi, {name}!", he: "שלום, {name}!" },
  "profile.add_age": { en: "Add", he: "הוסף" },
  "profile.no_games_demo": { en: "No games yet.", he: "עדיין אין משחקים." },
  "profile.no_games_shared": { en: "You haven't shared any games yet.", he: "עדיין לא שיתפת משחקים." },
  "profile.handoffs_count": { en: "{count} handoffs", he: "{count} העברות" },
  "profile.games_borrowed": { en: "Games I've Borrowed", he: "משחקים שאשאלתי" },
  "profile.borrowed_from": { en: "from {name}", he: "מ{name}" },
  "profile.games_lent": { en: "Games I've Lent", he: "משחקים שהשאלתי" },
  "profile.lent_to": { en: "to {name}", he: "ל{name}" },

  // Map page
  "map.your_location": { en: "Your Location", he: "מיקומך" },
  "map.default_location": { en: "Ramat Beit Shemesh", he: "רמת בית שמש" },
  "map.games_within_radius": { en: "{count} games within {radius}km", he: "{count} משחקים ברדיוס {radius}ק״מ" },
  "map.filter_category": { en: "Category", he: "קטגוריה" },
  "map.filter_all": { en: "All", he: "הכל" },
  "map.filter_radius": { en: "Search Radius", he: "רדיוס חיפוש" },
  "map.no_games_radius": { en: "No games in this radius — try expanding your search", he: "אין משחקים ברדיוס זה — נסה להרחיב את החיפוש" },
  "map.no_token_title": { en: "Neighborhood Map", he: "מפת השכונות" },
  "map.no_token_coming_soon": { en: "Coming soon", he: "בקרוב" },
  "map.no_token_neighborhoods": { en: "Neighborhoods: Aleph · Bet · Gimmel · Dalet · Hey", he: "שכונות: אלף · בית · גימל · דלת · הא" },

  // Time
  "time.just_now": { en: "just now", he: "כרגע" },
  "time.hr_ago": { en: "{count}h ago", he: "לפני {count}ש׳" },
  "time.yesterday": { en: "yesterday", he: "אתמול" },
  "time.days_ago": { en: "{count}d ago", he: "לפני {count}י׳" },
  "time.weeks_ago": { en: "{count}w ago", he: "לפני {count}ש׳" },

  // Game card
  "game.see_journey": { en: "See journey →", he: "ראה מסע ←" },

  // Game Journey / Passport page
  "journey.page_title": { en: "Game Passport", he: "דרכון משחק" },
  "journey.page_subtitle": { en: "The journey of this game through our community", he: "המסע של המשחק הזה דרך הקהילה שלנו" },
  "journey.handoffs": { en: "{count} handoffs", he: "{count} העברות" },
  "journey.families": { en: "{count} families", he: "{count} משפחות" },
  "journey.weeks_of_joy": { en: "{count}+ weeks of joy", he: "{count}+ שבועות של שמחה" },
  "journey.badge_donated": { en: "Donated", he: "תרום" },
  "journey.badge_borrowed": { en: "Borrowed", he: "הושאל" },
  "journey.badge_current": { en: "Currently here", he: "נמצא כאן כרגע" },
  "journey.cta_title": { en: "Want to be next on this journey?", he: "רוצה להיות הבא במסע?" },
  "journey.cta_subtitle": { en: "Borrow this game and add your family's chapter to its story", he: "שאל את המשחק והוסף את הפרק של משפחתך לסיפורו" },
  "journey.cta_button": { en: "Request this game", he: "בקש את המשחק" },
  "journey.not_found": { en: "Game not found", he: "משחק לא נמצא" },
  "journey.back_to_games": { en: "Back to games", he: "חזרה למשחקים" },
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
      let text: string = entry[lang] ?? entry.en;
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

const DEFAULT_LANGUAGE_CONTEXT: LanguageContextType = {
  lang: "en",
  setLang: () => {},
  t: (key, replacements) => {
    const entry = translations[key];
    if (!entry) return key as string;
    let text: string = entry.en;
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  },
  dir: "ltr",
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx ?? DEFAULT_LANGUAGE_CONTEXT;
}

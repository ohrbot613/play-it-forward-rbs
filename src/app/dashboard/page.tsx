"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_GAMES, MOCK_USERS, getCategoryEmoji } from "@/lib/data";
import type { Game } from "@/lib/data";
import {
  Inbox,
  ArrowLeftRight,
  Gamepad2,
  Check,
  X,
  RotateCcw,
  Clock,
  User,
  Star,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

interface Toast {
  id: string;
  message: string;
  type: "success" | "neutral";
}

let toastIdCounter = 0;
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = String(++toastIdCounter);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  return { toasts, addToast };
}

// ── Mock dashboard state ──────────────────────────────────────────────
// Current user is Miriam Katz (u1) — she owns games 1, 10, 19, 28, 37, 46
const CURRENT_USER_ID = "u1";

interface LoanRequest {
  id: string;
  gameId: string;
  gameTitle: string;
  requesterName: string;
  requesterAvatar: string;
  requestedAt: string;
  status: "pending" | "accepted" | "declined";
}

interface ActiveLoan {
  id: string;
  gameId: string;
  gameTitle: string;
  borrowerName: string;
  borrowerAvatar: string;
  lentAt: string;
  returned: boolean;
}

const INITIAL_REQUESTS: LoanRequest[] = [
  {
    id: "req1",
    gameId: "1",
    gameTitle: "Settlers of Catan",
    requesterName: "Yosef Levi",
    requesterAvatar: "https://i.pravatar.cc/150?u=yosef",
    requestedAt: "2026-03-17",
    status: "pending",
  },
  {
    id: "req2",
    gameId: "1",
    gameTitle: "Settlers of Catan",
    requesterName: "Chana Perl",
    requesterAvatar: "https://i.pravatar.cc/150?u=chana",
    requestedAt: "2026-03-16",
    status: "pending",
  },
  {
    id: "req3",
    gameId: "10",
    gameTitle: "Azul",
    requesterName: "Devorah Rosenberg",
    requesterAvatar: "https://i.pravatar.cc/150?u=devorah",
    requestedAt: "2026-03-15",
    status: "pending",
  },
];

const INITIAL_LOANS: ActiveLoan[] = [
  {
    id: "loan1",
    gameId: "19",
    gameTitle: "LEGO City Police Station",
    borrowerName: "Avi Mizrachi",
    borrowerAvatar: "https://i.pravatar.cc/150?u=avi",
    lentAt: "2026-03-10",
    returned: false,
  },
  {
    id: "loan2",
    gameId: "28",
    gameTitle: "Magna-Tiles 100pc Set",
    borrowerName: "Rivka Stern",
    borrowerAvatar: "https://i.pravatar.cc/150?u=rivka",
    lentAt: "2026-03-12",
    returned: false,
  },
];

type Tab = "requests" | "loans" | "games";

function daysAgo(dateStr: string, t: ReturnType<typeof useLanguage>["t"]): string {
  const now = new Date("2026-03-17");
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return t("dash.today");
  if (diff === 1) return t("dash.yesterday");
  return `${diff} ${t("dash.days")} ${t("dash.ago")}`;
}

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [loans, setLoans] = useState(INITIAL_LOANS);
  const { t, lang } = useLanguage();
  const { toasts, addToast } = useToast();

  const myGames = MOCK_GAMES.filter((g) => g.ownerId === CURRENT_USER_ID);
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const activeLoansCount = loans.filter((l) => !l.returned).length;

  const tabs: { key: Tab; labelKey: "dash.tab_requests" | "dash.tab_loans" | "dash.tab_games"; icon: typeof Inbox; count: string }[] = [
    { key: "requests", labelKey: "dash.tab_requests", icon: Inbox, count: t("dash.requests_count", { count: pendingCount }) },
    { key: "loans", labelKey: "dash.tab_loans", icon: ArrowLeftRight, count: t("dash.loans_count", { count: activeLoansCount }) },
    { key: "games", labelKey: "dash.tab_games", icon: Gamepad2, count: t("dash.games_count", { count: myGames.length }) },
  ];

  function handleAccept(id: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "accepted" as const } : r))
    );
    addToast(t("dash.toast_accepted"), "success");
  }

  function handleDecline(id: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "declined" as const } : r))
    );
    addToast(t("dash.toast_declined"), "neutral");
  }

  function handleReturn(id: string) {
    setLoans((prev) =>
      prev.map((l) => (l.id === id ? { ...l, returned: true } : l))
    );
    addToast(t("dash.toast_returned"), "success");
  }

  return (
    <div className="px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-8 pb-4"
      >
        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
          {t("dash.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dash.subtitle")}
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
      >
        {tabs.map(({ key, labelKey, icon: Icon, count }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-foreground text-white elevation-2"
                  : "bg-white text-muted-foreground elevation-1 hover:elevation-2"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(labelKey)}</span>
              <Badge
                className={cn(
                  "text-2xs px-1.5 py-0 h-5 border-0",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </Badge>
            </button>
          );
        })}
      </motion.div>

      {/* Toast Notifications */}
      <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium elevation-4 max-w-xs",
                toast.type === "success"
                  ? "bg-emerald-500 text-white"
                  : "bg-foreground text-background"
              )}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === "requests" && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 pb-6"
          >
            {requests.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={t("dash.no_requests")}
                subtitle={t("dash.no_requests_sub")}
              />
            ) : (
              requests.map((req) => (
                <Card key={req.id} className="border-0 elevation-2 bg-white overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={req.requesterAvatar}
                          alt={req.requesterName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {req.requesterName}
                          </p>
                          <span className="text-2xs text-muted-foreground shrink-0">
                            {daysAgo(req.requestedAt, t)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t("dash.wants_to_borrow")}{" "}
                          <span className="font-medium text-foreground">{req.gameTitle}</span>
                        </p>

                        {/* Action Buttons */}
                        {req.status === "pending" ? (
                          <div className={cn("flex gap-2 mt-3", lang === "he" && "flex-row-reverse")}>
                            <button
                              onClick={() => handleAccept(req.id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
                            >
                              <Check className="h-3.5 w-3.5" />
                              {t("dash.accept")}
                            </button>
                            <button
                              onClick={() => handleDecline(req.id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                              {t("dash.decline")}
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <Badge
                              className={cn(
                                "text-2xs border-0",
                                req.status === "accepted"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-600"
                              )}
                            >
                              {req.status === "accepted" ? t("dash.accepted") : t("dash.declined")}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </motion.div>
        )}

        {tab === "loans" && (
          <motion.div
            key="loans"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 pb-6"
          >
            {loans.length === 0 ? (
              <EmptyState
                icon={ArrowLeftRight}
                title={t("dash.no_loans")}
                subtitle={t("dash.no_loans_sub")}
              />
            ) : (
              loans.map((loan) => (
                <Card key={loan.id} className="border-0 elevation-2 bg-white overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full shrink-0 overflow-hidden">
                        <img
                          src={loan.borrowerAvatar}
                          alt={loan.borrowerName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {loan.gameTitle}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>
                            {t("dash.borrowed_by")}{" "}
                            <span className="font-medium text-foreground">{loan.borrowerName}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {t("dash.since")} {new Date(loan.lentAt).toLocaleDateString(lang === "he" ? "he-IL" : "en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>

                        {/* Return Button */}
                        <div className="mt-3">
                          {loan.returned ? (
                            <Badge className="text-2xs border-0 bg-emerald-50 text-emerald-700">
                              {t("dash.returned")}
                            </Badge>
                          ) : (
                            <button
                              onClick={() => handleReturn(loan.id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              {t("dash.mark_returned")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </motion.div>
        )}

        {tab === "games" && (
          <motion.div
            key="games"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 pb-6"
          >
            {myGames.length === 0 ? (
              <EmptyState
                icon={Gamepad2}
                title={t("dash.no_games")}
                subtitle={t("dash.no_games_sub")}
              />
            ) : (
              myGames.map((game) => (
                <MyGameCard key={game.id} game={game} t={t} />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MyGameCard({ game, t }: { game: Game; t: ReturnType<typeof useLanguage>["t"] }) {
  return (
    <Card className="border-0 elevation-2 bg-white overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Game emoji/icon */}
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 via-sunshine/10 to-coral/10 flex items-center justify-center shrink-0">
            <span className="text-xl">{getCategoryEmoji(game.category)}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {game.title}
              </h3>
              <Badge
                className={cn(
                  "text-2xs border-0 shrink-0",
                  game.available
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                )}
              >
                {game.available ? t("dash.available") : t("dash.on_loan")}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-2xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-sunshine text-sunshine" />
                {game.rating.toFixed(1)}
              </span>
              <span>
                {game.handoffs} {t("dash.times_shared")}
              </span>
              {game.requestCount > 0 && (
                <span className="text-primary font-medium">
                  {t("dash.requests_count", { count: game.requestCount })}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Inbox;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mt-12 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

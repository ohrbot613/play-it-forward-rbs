/*
 * WhatsApp Lending Flow — REC-16
 *
 * Handles org-mediated game borrowing. The org acts as a privacy shield:
 * borrowers and lenders never see each other's phone numbers.
 *
 * STATE MACHINE:
 *   START → IDENTIFY_GAME → GET_NEIGHBORHOOD → NOTIFY_LENDER → AWAIT_LENDER → CONFIRM_RELAY → DONE
 *
 * SESSION PERSISTENCE: same Supabase whatsapp_sessions table used by whatsapp-intake.
 * Use a namespaced session_key ("lending:<phone>") so both bots can coexist.
 *
 * SUPABASE MIGRATION REQUIRED (add once, idempotent):
 * ─────────────────────────────────────────────────
 * create table if not exists whatsapp_sessions (
 *   session_key  text primary key,
 *   state        jsonb        not null,
 *   step         text         not null,
 *   updated_at   timestamptz  not null default now()
 * );
 * -- Optional auto-purge (run in Supabase SQL editor, not here):
 * -- select cron.schedule('purge-whatsapp-sessions', '0/5 * * * *',
 * --   $$delete from whatsapp_sessions where updated_at < now() - interval '30 minutes'$$);
 *
 * Also requires a `lending_requests` table — migration SQL at bottom of this file.
 *
 * create table if not exists lending_requests (
 *   id              uuid primary key default gen_random_uuid(),
 *   borrower_phone  text not null,
 *   borrower_neighborhood text,
 *   game_title      text not null,
 *   game_id         uuid references games(id) on delete set null,
 *   lender_phone    text,
 *   lender_member_id uuid references members(id) on delete set null,
 *   status          text not null default 'pending_lender',
 *   relay_description text,
 *   created_at      timestamptz not null default now(),
 *   updated_at      timestamptz not null default now()
 * );
 */

import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type LendingStep =
  | "START"
  | "IDENTIFY_GAME"      // confirmed game title, asking for neighborhood
  | "GET_NEIGHBORHOOD"   // have neighborhood, sending lender notification
  | "NOTIFY_LENDER"      // lender has been messaged, waiting for their reply
  | "AWAIT_LENDER"       // alias used on the lender side while org waits
  | "CONFIRM_RELAY"      // lender agreed, org is confirming relay to borrower
  | "DONE";

/** Session stored per-phone in Supabase whatsapp_sessions */
interface LendingSession {
  step: LendingStep;
  phone: string;                   // borrower's phone
  gameTitle?: string;              // normalised game name
  gameId?: string;                 // matched Supabase game id (if found)
  neighborhood?: string;           // borrower's neighborhood (Aleph|Bet|Gimmel|Dalet|Hey)
  lenderPhone?: string;            // org-side only — never sent to borrower
  lenderMemberId?: string;
  lenderNeighborhood?: string;     // lender's neighborhood for relay calc
  requestId?: string;              // lending_requests row id
  lastUpdated: number;
}

// Lender-side sessions are stored under a separate key namespace so we can
// differentiate inbound messages from the lender vs. a borrower.
// key format:  "lending-lender:<lender_phone>:<requestId>"

interface LenderSession {
  step: "AWAIT_LENDER_REPLY";
  lenderPhone: string;
  requestId: string;
  borrowerNeighborhood: string;
  lenderNeighborhood: string;
  gameTitle: string;
  lastUpdated: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Neighborhoods
// ─────────────────────────────────────────────────────────────────────────────

const NEIGHBORHOODS = ["Aleph", "Bet", "Gimmel", "Dalet", "Hey"] as const;
type Neighborhood = (typeof NEIGHBORHOODS)[number];

const NEIGHBORHOOD_ALIASES: Record<string, Neighborhood> = {
  // English
  aleph: "Aleph",
  bet: "Bet",
  beit: "Bet",
  gimmel: "Gimmel",
  gimel: "Gimmel",
  dalet: "Dalet",
  daleth: "Dalet",
  hey: "Hey",
  hei: "Hey",
  he: "Hey",
  // Hebrew
  "א": "Aleph",
  "ב": "Bet",
  "ג": "Gimmel",
  "ד": "Dalet",
  "ה": "Hey",
  // Numbered shortcuts
  "1": "Aleph",
  "2": "Bet",
  "3": "Gimmel",
  "4": "Dalet",
  "5": "Hey",
};

function parseNeighborhood(input: string): Neighborhood | null {
  const normalized = input.toLowerCase().trim();
  return NEIGHBORHOOD_ALIASES[normalized] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Borrow intent detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the game title extracted from the message, or null if no borrow intent.
 * Handles patterns like:
 *   "I want to borrow Catan"
 *   "borrow Catan"
 *   "looking for Catan"
 *   "אני מחפש קטאן" (I'm looking for Catan)
 *   "רוצה לשאול קטאן" (want to borrow Catan)
 */
function extractBorrowIntent(body: string): string | null {
  const lower = body.toLowerCase().trim();

  const patterns = [
    /(?:i (?:want|need|would like) to borrow|borrow|looking for|i'm looking for|looking to borrow)\s+(.+)/i,
    /(?:can i borrow|do you have)\s+(.+)/i,
    /(?:רוצה לשאול|מחפש|אני מחפש|אני רוצה לשאול)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match?.[1]) {
      // Trim common trailing noise
      return match[1].replace(/[?!.,]+$/, "").trim();
    }
  }

  return null;
}

function isYes(body: string): boolean {
  const n = body.toLowerCase().trim();
  return ["yes", "yeah", "yep", "sure", "ok", "okay", "כן", "כן!", "בסדר", "1"].includes(n);
}

function isNo(body: string): boolean {
  const n = body.toLowerCase().trim();
  return ["no", "nope", "nah", "לא", "לא!", "2"].includes(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase helpers (mirrors whatsapp-intake pattern exactly)
// ─────────────────────────────────────────────────────────────────────────────

const THIRTY_MINUTES = 30 * 60 * 1000;
const SESSION_PREFIX = "lending:";
const LENDER_SESSION_PREFIX = "lending-lender:";

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

async function getSession(sessionKey: string): Promise<unknown | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/whatsapp_sessions?session_key=eq.${encodeURIComponent(sessionKey)}&select=*`,
      {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
      }
    );

    if (!res.ok) return null;

    const rows: Array<{
      state: Record<string, unknown>;
      step: string;
      updated_at: string;
    }> = await res.json();

    if (rows.length === 0) return null;

    const row = rows[0];
    const age = Date.now() - new Date(row.updated_at).getTime();
    if (age > THIRTY_MINUTES) {
      // Stale — delete and treat as new
      await deleteSession(sessionKey);
      return null;
    }

    return { ...row.state, step: row.step };
  } catch {
    return null;
  }
}

async function saveSession(
  sessionKey: string,
  step: string,
  data: Record<string, unknown>
): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg) return;

  try {
    await fetch(`${cfg.url}/rest/v1/whatsapp_sessions`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        session_key: sessionKey,
        state: data,
        step,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Non-fatal
  }
}

async function deleteSession(sessionKey: string): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg) return;

  try {
    await fetch(
      `${cfg.url}/rest/v1/whatsapp_sessions?session_key=eq.${encodeURIComponent(sessionKey)}`,
      {
        method: "DELETE",
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
      }
    );
  } catch {
    // Non-fatal
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase: game catalog lookup
// ─────────────────────────────────────────────────────────────────────────────

interface GameMatch {
  id: string;
  title: string;
  lenderPhone: string | null;
  lenderMemberId: string | null;
  lenderNeighborhood: string;
}

/**
 * Search the games table for an available game matching the title.
 * Returns the first match including the owner's phone and neighborhood.
 * Falls back to mock data when Supabase is not configured.
 */
async function findAvailableGame(gameTitle: string): Promise<GameMatch | null> {
  const cfg = getSupabaseConfig();

  if (!cfg) return null;

  // ── Live Supabase query (ilike fuzzy match on title) ─────────────────────
  try {
    const encoded = encodeURIComponent(`%${gameTitle}%`);
    const url =
      `${cfg.url}/rest/v1/games` +
      `?title=ilike.${encoded}` +
      `&is_available=eq.true` +
      `&select=id,title,owner_id,owner:members!games_owner_id_fkey(id,phone,neighborhood)` +
      `&limit=1`;

    const res = await fetch(url, {
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
    });

    if (!res.ok) return null;

    const rows: Array<{
      id: string;
      title: string;
      owner_id: string | null;
      owner: { id: string; phone: string | null; neighborhood: string } | null;
    }> = await res.json();

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      title: row.title,
      lenderPhone: row.owner?.phone ?? null,
      lenderMemberId: row.owner?.id ?? row.owner_id ?? null,
      lenderNeighborhood: row.owner?.neighborhood ?? "Unknown",
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase: lending_requests table
// ─────────────────────────────────────────────────────────────────────────────

async function createLendingRequest(params: {
  borrowerPhone: string;
  borrowerNeighborhood: string;
  gameTitle: string;
  gameId?: string;
  lenderPhone?: string;
  lenderMemberId?: string;
}): Promise<string | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return `mock-request-${Date.now()}`;

  try {
    const res = await fetch(`${cfg.url}/rest/v1/lending_requests`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        borrower_phone: params.borrowerPhone,
        borrower_neighborhood: params.borrowerNeighborhood,
        game_title: params.gameTitle,
        game_id: params.gameId ?? null,
        lender_phone: params.lenderPhone ?? null,
        lender_member_id: params.lenderMemberId ?? null,
        status: "pending_lender",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) return null;
    const rows: Array<{ id: string }> = await res.json();
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function updateLendingRequest(
  requestId: string,
  updates: { status?: string; relay_description?: string }
): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg) return;

  try {
    await fetch(
      `${cfg.url}/rest/v1/lending_requests?id=eq.${encodeURIComponent(requestId)}`,
      {
        method: "PATCH",
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          ...updates,
          updated_at: new Date().toISOString(),
        }),
      }
    );
  } catch {
    // Non-fatal
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Outbound WhatsApp message sender (Twilio)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send an outbound WhatsApp message via Twilio REST API.
 * Only runs when TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM are set.
 * In dev without those vars, it logs the message to console instead.
 */
async function sendWhatsApp(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

  if (!sid || !token || !from) {
    console.log(`[whatsapp-lending] OUTBOUND → ${to}:\n${body}\n`);
    return;
  }

  const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  try {
    const params = new URLSearchParams({
      From: from,
      To: toFormatted,
      Body: body,
    });

    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );
  } catch (err) {
    console.error("[whatsapp-lending] Failed to send outbound message:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Relay description builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a human-readable relay chain description.
 * For MVP we use a simple neighborhood-to-neighborhood heuristic.
 * Example: lender in Bet, borrower in Aleph → "Bet → Aleph"
 */
function buildRelayDescription(
  lenderNeighborhood: string,
  borrowerNeighborhood: string
): string {
  if (lenderNeighborhood === borrowerNeighborhood) {
    return `${lenderNeighborhood} (local handoff)`;
  }

  // Simple 2-stop relay via intermediate neighborhood when neighborhoods are far
  const order: Neighborhood[] = ["Aleph", "Bet", "Gimmel", "Dalet", "Hey"];
  const fromIdx = order.indexOf(lenderNeighborhood as Neighborhood);
  const toIdx = order.indexOf(borrowerNeighborhood as Neighborhood);

  if (fromIdx === -1 || toIdx === -1) {
    return `${lenderNeighborhood} → ${borrowerNeighborhood}`;
  }

  const gap = Math.abs(fromIdx - toIdx);
  if (gap <= 1) {
    return `${lenderNeighborhood} → ${borrowerNeighborhood}`;
  }

  // Suggest a middle stop
  const midIdx = Math.round((fromIdx + toIdx) / 2);
  const mid = order[midIdx];
  return `${lenderNeighborhood} → ${mid} → ${borrowerNeighborhood}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inbound message parser
// ─────────────────────────────────────────────────────────────────────────────

async function parseIncoming(req: NextRequest): Promise<{
  phone: string;
  messageBody: string;
}> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    return {
      phone: ((formData.get("From") as string) ?? "unknown").replace(
        "whatsapp:",
        ""
      ),
      messageBody: ((formData.get("Body") as string) ?? "").trim(),
    };
  }

  const body = await req.json();
  return {
    phone: (body.phone ?? body.From ?? "unknown").replace("whatsapp:", ""),
    messageBody: (body.body ?? body.Body ?? "").trim(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TwiML / JSON response helper
// ─────────────────────────────────────────────────────────────────────────────

function buildResponse(
  req: NextRequest,
  replyMessage: string,
  extra?: Record<string, unknown>
): NextResponse {
  const contentType = req.headers.get("content-type") ?? "";
  const acceptHeader = req.headers.get("accept") ?? "";

  if (
    acceptHeader.includes("application/xml") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const safe = replyMessage
      .replace(/\*/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${safe}</Message>
</Response>`;

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  return NextResponse.json({ reply: replyMessage, ...extra });
}

// ─────────────────────────────────────────────────────────────────────────────
// Lender-side inbound handler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if this inbound message is a lender responding to an org request.
 * Lender sessions are stored under "lending-lender:<phone>".
 * Returns the reply to send back to the lender (or null if not a lender message).
 *
 * Side-effects:
 *  - Updates lending_requests status in Supabase
 *  - Sends outbound WhatsApp to the borrower when lender agrees
 */
async function handleLenderReply(
  lenderPhone: string,
  messageBody: string
): Promise<string | null> {
  const sessionKey = `${LENDER_SESSION_PREFIX}${lenderPhone}`;
  const raw = await getSession(sessionKey);
  if (!raw) return null;

  const lenderSession = raw as LenderSession;
  if (lenderSession.step !== "AWAIT_LENDER_REPLY") return null;

  const { requestId, borrowerNeighborhood, lenderNeighborhood, gameTitle } = lenderSession;

  if (isYes(messageBody)) {
    // ── Lender agreed ────────────────────────────────────────────────────────
    const relayDesc = buildRelayDescription(
      lenderNeighborhood,
      borrowerNeighborhood
    );

    await updateLendingRequest(requestId, {
      status: "lender_agreed",
      relay_description: relayDesc,
    });

    // Notify borrower — find their session to get phone
    // The requestId encodes the borrower; look it up via lending_requests
    const borrowerPhone = await getBorrowerPhoneForRequest(requestId);

    if (borrowerPhone) {
      const borrowerMsg =
        `Great news! 🎉 We found a *${gameTitle}* for you!\n\n` +
        `Our volunteer relay team will handle delivery.\n` +
        `Estimated route: *${relayDesc}*\n` +
        `You'll receive another message once pickup is confirmed — usually within 24h.\n\n` +
        `מצוין! מצאנו *${gameTitle}* בשבילך!\n` +
        `צוות ההעברה שלנו יטפל במשלוח.\n` +
        `מסלול משוער: *${relayDesc}*`;

      await sendWhatsApp(borrowerPhone, borrowerMsg);

      // Clean up the borrower's session (flow is complete)
      await deleteSession(`${SESSION_PREFIX}${borrowerPhone}`);
    }

    await deleteSession(sessionKey);

    return (
      `Thanks! We've notified the borrower and will arrange delivery shortly.\n` +
      `They'll receive a message with the relay details.\n\n` +
      `תודה! הודענו לשואל ונסדר את המשלוח בקרוב.\n` +
      `תקבל/י פרטים נוספים בהמשך.`
    );
  }

  if (isNo(messageBody)) {
    // ── Lender declined ──────────────────────────────────────────────────────
    await updateLendingRequest(requestId, { status: "lender_declined" });
    await deleteSession(sessionKey);

    // Optionally notify borrower that we're searching for another copy
    const borrowerPhone = await getBorrowerPhoneForRequest(requestId);
    if (borrowerPhone) {
      const borrowerMsg =
        `Hi! The lender we contacted isn't available right now.\n` +
        `We're checking if another copy of *${gameTitle}* is available — we'll update you soon!\n\n` +
        `שלום! המשאיל שפנינו אליו אינו זמין כרגע.\n` +
        `אנו בודקים אם יש עותק נוסף של *${gameTitle}* — נעדכן אותך בקרוב!`;
      await sendWhatsApp(borrowerPhone, borrowerMsg);
    }

    return (
      `No problem, thanks for letting us know.\n` +
      `We'll look for another copy.\n\n` +
      `בסדר, תודה על העדכון. נחפש עותק אחר.`
    );
  }

  // Unrecognised reply from lender
  return (
    `Please reply *yes* if you're available to lend *${gameTitle}* this week, or *no* if not.\n\n` +
    `אנא ענה *כן* אם אתה פנוי להשאיל את *${gameTitle}* השבוע, או *לא* אם לא.`
  );
}

/** Fetch the borrower's phone from lending_requests by request ID */
async function getBorrowerPhoneForRequest(
  requestId: string
): Promise<string | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/lending_requests?id=eq.${encodeURIComponent(requestId)}&select=borrower_phone`,
      {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows: Array<{ borrower_phone: string }> = await res.json();
    return rows[0]?.borrower_phone ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main webhook handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { phone, messageBody } = await parseIncoming(req);

    // ── 1. Check if this is a lender responding ────────────────────────────
    const lenderReply = await handleLenderReply(phone, messageBody);
    if (lenderReply !== null) {
      return buildResponse(req, lenderReply, { phone, role: "lender" });
    }

    // ── 2. Borrower flow ───────────────────────────────────────────────────
    const sessionKey = `${SESSION_PREFIX}${phone}`;
    const raw = await getSession(sessionKey);

    // Reconstruct session or start fresh
    const session: LendingSession = raw
      ? (raw as LendingSession)
      : { step: "START", phone, lastUpdated: Date.now() };

    let replyMessage = "";
    let sessionDeleted = false;

    switch (session.step) {
      // ──────────────────────────────────────────────────────────────────────
      case "START": {
        const gameTitle = extractBorrowIntent(messageBody);

        if (!gameTitle) {
          replyMessage =
            `Hi! I'm the Play It Forward community library bot.\n\n` +
            `To borrow a game, send me a message like:\n` +
            `"I want to borrow Catan"\n` +
            `"Looking for Ticket to Ride"\n\n` +
            `שלום! אני בוט ספריית המשחקים הקהילתית של Play It Forward.\n\n` +
            `כדי לשאול משחק, שלח הודעה כמו:\n` +
            `"רוצה לשאול קטאן"\n` +
            `"מחפש Ticket to Ride"`;
          break;
        }

        // Search catalog immediately
        const match = await findAvailableGame(gameTitle);

        if (!match) {
          replyMessage =
            `We searched our library for *${gameTitle}* but couldn't find a copy available right now.\n\n` +
            `We'll keep your request open and notify you if one becomes available!\n` +
            `Type "borrow <game name>" any time to request another game.\n\n` +
            `חיפשנו *${gameTitle}* בספרייה אך לא מצאנו עותק זמין כרגע.\n` +
            `נשמור את בקשתך ונעדכן אותך כשיהיה זמין!`;
          break;
        }

        session.gameTitle = match.title;
        session.gameId = match.id;
        session.lenderPhone = match.lenderPhone ?? undefined;
        session.lenderMemberId = match.lenderMemberId ?? undefined;
        session.lenderNeighborhood = match.lenderNeighborhood ?? undefined;
        session.step = "IDENTIFY_GAME";

        replyMessage =
          `We have *${match.title}* in our library!\n\n` +
          `Which neighborhood are you in?\n` +
          `Reply with: *Aleph*, *Bet*, *Gimmel*, *Dalet*, or *Hey*\n` +
          `(or 1-5)\n\n` +
          `יש לנו *${match.title}* בספרייה!\n\n` +
          `באיזה שכונה אתה גר/ה?\n` +
          `ענה: *אלף*, *בית*, *גימל*, *דלת*, או *הא* (או 1-5)`;
        break;
      }

      // ──────────────────────────────────────────────────────────────────────
      case "IDENTIFY_GAME": {
        const neighborhood = parseNeighborhood(messageBody);

        if (!neighborhood) {
          replyMessage =
            `Please reply with your neighborhood:\n` +
            `*Aleph*, *Bet*, *Gimmel*, *Dalet*, or *Hey* (or 1-5)\n\n` +
            `אנא ציין את שכונתך:\n` +
            `*אלף*, *בית*, *גימל*, *דלת*, או *הא* (או 1-5)`;
          break;
        }

        session.neighborhood = neighborhood;
        session.step = "GET_NEIGHBORHOOD";

        // Create the lending request record
        const requestId = await createLendingRequest({
          borrowerPhone: phone,
          borrowerNeighborhood: neighborhood,
          gameTitle: session.gameTitle!,
          gameId: session.gameId,
          lenderPhone: session.lenderPhone,
          lenderMemberId: session.lenderMemberId,
        });

        session.requestId = requestId ?? undefined;

        // Contact the lender (org mediates — lender never gets borrower's number)
        if (session.lenderPhone && requestId) {
          const lenderMsg =
            `Hi! This is Play It Forward 👋\n\n` +
            `A community member in *${neighborhood}* wants to borrow your *${session.gameTitle}*.\n` +
            `Are you available to lend it this week?\n\n` +
            `Reply *yes* or *no*.\n\n` +
            `שלום! כאן Play It Forward 👋\n\n` +
            `חבר קהילה מ*שכונת ${neighborhood}* מעוניין לשאול את *${session.gameTitle}* שלך.\n` +
            `האם אתה פנוי להשאיל אותו השבוע?\n\n` +
            `ענה *כן* או *לא*.`;

          await sendWhatsApp(session.lenderPhone, lenderMsg);

          // Store a lender-side session so we can match their reply
          await saveSession(
            `${LENDER_SESSION_PREFIX}${session.lenderPhone}`,
            "AWAIT_LENDER_REPLY",
            {
              step: "AWAIT_LENDER_REPLY",
              lenderPhone: session.lenderPhone,
              requestId,
              borrowerNeighborhood: neighborhood,
              lenderNeighborhood: session.lenderNeighborhood ?? "Unknown",
              gameTitle: session.gameTitle,
              lastUpdated: Date.now(),
            }
          );

          replyMessage =
            `Got it! We've contacted the lender on your behalf.\n\n` +
            `*Your number is never shared* — we coordinate everything privately.\n\n` +
            `We'll message you as soon as they confirm (usually within a few hours).\n\n` +
            `מצוין! פנינו למשאיל עבורך.\n` +
            `*המספר שלך לא נחשף* — אנו מתאמים הכל באופן פרטי.\n` +
            `נעדכן אותך ברגע שיאשר/תאשר (בדרך כלל תוך מספר שעות).`;
        } else {
          // No lender phone on file — manual coordination needed
          replyMessage =
            `Got it! We have *${session.gameTitle}* in ${neighborhood}'s area.\n\n` +
            `Our team will coordinate the handoff and message you with delivery details shortly.\n` +
            `*Your number is never shared* with the lender.\n\n` +
            `קיבלנו! יש לנו *${session.gameTitle}* באזור שכונת ${neighborhood}.\n` +
            `הצוות שלנו יתאם את ההעברה ויעדכן אותך בפרטים בקרוב.\n` +
            `*המספר שלך לא נחשף* למשאיל.`;
        }

        break;
      }

      // ──────────────────────────────────────────────────────────────────────
      // These steps are terminal for the borrower — they wait for async lender reply.
      // If borrower messages again while waiting, acknowledge and hold.
      case "GET_NEIGHBORHOOD":
      case "NOTIFY_LENDER":
      case "AWAIT_LENDER":
      case "CONFIRM_RELAY": {
        replyMessage =
          `We're still waiting to hear back from the lender for *${session.gameTitle ?? "your game"}*.\n` +
          `We'll message you as soon as we have an update!\n\n` +
          `עדיין מחכים לתשובה מהמשאיל לגבי *${session.gameTitle ?? "המשחק שלך"}*.\n` +
          `נעדכן אותך ברגע שנקבל תשובה!`;
        break;
      }

      // ──────────────────────────────────────────────────────────────────────
      case "DONE": {
        // Session should have been deleted — start fresh
        const newGameTitle = extractBorrowIntent(messageBody);
        if (newGameTitle) {
          session.step = "START";
          // Re-process as START on next message
          replyMessage =
            `Your previous request was fulfilled! To borrow *${newGameTitle}*, reply again and we'll check availability.\n\n` +
            `הבקשה הקודמת שלך טופלה! לשאול *${newGameTitle}*, שלח שוב ונבדוק זמינות.`;
        } else {
          replyMessage =
            `Your borrow request was completed! Send "borrow <game name>" to request another game.\n\n` +
            `הבקשה שלך הושלמה! שלח "שאול <שם משחק>" לבקשת משחק נוסף.`;
        }
        sessionDeleted = true; // let it restart fresh next time
        await deleteSession(sessionKey);
        break;
      }
    }

    // Persist updated borrower session (unless we deleted it)
    if (!sessionDeleted) {
      session.lastUpdated = Date.now();
      const { phone: _phone, lastUpdated: _lu, step, ...rest } = session;
      await saveSession(sessionKey, step, {
        phone: _phone,
        lastUpdated: _lu,
        ...rest,
      });
    }

    return buildResponse(req, replyMessage, {
      phone,
      step: sessionDeleted ? "DONE" : session.step,
      role: "borrower",
    });
  } catch (err) {
    console.error("[whatsapp-lending] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — health check / webhook verification
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  return NextResponse.json({
    status: "WhatsApp lending bot is running",
    flow: "REC-16: Org-mediated game lending",
    steps: [
      "START → detect borrow intent, search catalog",
      "IDENTIFY_GAME → collect borrower neighborhood",
      "GET_NEIGHBORHOOD → notify lender, create lending_requests row",
      "(async) lender replies → org notifies borrower with relay details",
    ],
  });
}

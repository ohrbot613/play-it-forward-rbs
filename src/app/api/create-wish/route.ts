/*
 * POST /api/create-wish — REC-43 / REC-148
 *
 * Called when a user submits the "Add a Wish" modal on the requests page.
 * 1. Resolves the authenticated user's member profile (name + phone).
 * 2. Inserts a row into `community_wishes` table in Supabase (graceful if missing).
 * 3. Searches the `games` inventory for available matching titles (matching engine).
 * 4. Sends a WhatsApp notification to the org via Twilio (with match info if found).
 *
 * Body: { gameTitle: string, notes?: string, neighborhood: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// ─────────────────────────────────────────────────────────────────────────────
// Auth + member resolution
// ─────────────────────────────────────────────────────────────────────────────

interface RequesterInfo {
  userId: string | null;
  name: string | null;
  phone: string | null;
}

async function getRequesterInfo(): Promise<RequesterInfo> {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { userId: null, name: null, phone: null };

    const { data: member } = await supabase
      .from("members")
      .select("name, phone")
      .eq("auth_user_id", user.id)
      .single();

    return {
      userId: user.id,
      name: (member as { name: string; phone: string | null } | null)?.name ?? null,
      phone: (member as { name: string; phone: string | null } | null)?.phone ?? null,
    };
  } catch {
    return { userId: null, name: null, phone: null };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase helper
// ─────────────────────────────────────────────────────────────────────────────

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

async function insertCommunityWish(params: {
  gameTitle: string;
  notes?: string;
  neighborhood: string;
  requesterId: string | null;
  requesterName: string | null;
  requesterPhone: string | null;
}): Promise<{ id: string } | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) {
    console.log("[create-wish] No Supabase config — skipping DB insert");
    return null;
  }

  try {
    const res = await fetch(`${cfg.url}/rest/v1/community_wishes`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        title: params.gameTitle,
        description: params.notes ?? "",
        neighborhood: params.neighborhood,
        requester_id: params.requesterId ?? null,
        requester_name: params.requesterName ?? null,
        requester_phone: params.requesterPhone ?? null,
        status: "open",
        urgency: "normal",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[create-wish] Supabase insert failed:", res.status, text);
      return null;
    }

    const rows: Array<{ id: string }> = await res.json();
    return rows[0] ?? null;
  } catch (err) {
    // Graceful — table may not exist yet. Still send WhatsApp.
    console.error("[create-wish] Supabase error (non-fatal):", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory matching engine (REC-43)
// ─────────────────────────────────────────────────────────────────────────────

interface InventoryMatch {
  id: string;
  title: string;
  neighborhood: string;
  holderName: string;
}

/**
 * Search the `games` table for available games whose title contains any
 * significant word from the wish title. Uses PostgREST `ilike` on each word
 * so "Settlers of Catan" matches a game titled "Catan".
 * Returns [] gracefully if Supabase is unconfigured or no matches found.
 */
async function findMatchingGames(gameTitle: string): Promise<InventoryMatch[]> {
  const cfg = getSupabaseConfig();
  if (!cfg) return [];

  // Split title into words, filter out short/common words
  const stopWords = new Set(["of", "the", "a", "an", "and", "in", "for", "to", "de"]);
  const words = gameTitle
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  if (words.length === 0) return [];

  // Try each significant word — first match wins
  for (const word of words) {
    try {
      const params = new URLSearchParams({
        "title": `ilike.*${word}*`,
        "is_available": "eq.true",
        "select": "id,title,locations(neighborhood,holder:members!locations_current_holder_id_fkey(name,neighborhood))",
        "limit": "3",
      });

      const res = await fetch(`${cfg.url}/rest/v1/games?${params}`, {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) continue;

      const rows: Array<{
        id: string;
        title: string;
        locations?: Array<{
          neighborhood: string;
          holder?: { name: string; neighborhood: string } | null;
        }> | null;
      }> = await res.json();

      if (rows.length > 0) {
        return rows.map((r) => {
          const loc = r.locations?.[0];
          return {
            id: r.id,
            title: r.title,
            neighborhood: loc?.neighborhood ?? "Community",
            holderName: loc?.holder?.name ?? "a community member",
          };
        });
      }
    } catch {
      // Non-fatal — continue trying other words
    }
  }

  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp notifier (Twilio, mirrors whatsapp-lending pattern)
// ─────────────────────────────────────────────────────────────────────────────

async function sendWhatsApp(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    console.log(`[create-wish] OUTBOUND → ${to}:\n${body}\n`);
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
            "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );
  } catch (err) {
    console.error("[create-wish] Twilio send failed:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameTitle, notes, neighborhood } = body as {
      gameTitle: string;
      notes?: string;
      neighborhood: string;
    };

    if (!gameTitle?.trim()) {
      return NextResponse.json(
        { error: "gameTitle is required" },
        { status: 400 }
      );
    }

    if (!neighborhood?.trim()) {
      return NextResponse.json(
        { error: "neighborhood is required" },
        { status: 400 }
      );
    }

    // 1. Resolve the authenticated user's member profile
    const requester = await getRequesterInfo();

    // 2. Insert into Supabase (graceful — table may not exist yet)
    // 3. Run inventory matching in parallel
    const [inserted, matches] = await Promise.all([
      insertCommunityWish({
        gameTitle,
        notes,
        neighborhood,
        requesterId: requester.userId,
        requesterName: requester.name,
        requesterPhone: requester.phone,
      }),
      findMatchingGames(gameTitle),
    ]);

    // 4. Send WhatsApp notification to org (include match info if found)
    const orgPhone =
      process.env.ORG_WHATSAPP_NUMBER ?? process.env.TWILIO_WHATSAPP_FROM;

    const notesSuffix = notes?.trim() ? ` — ${notes.trim()}` : "";
    let message = `✨ New wish from ${neighborhood}: ${gameTitle}${notesSuffix}`;
    if (matches.length > 0) {
      const matchList = matches
        .map((m) => `"${m.title}" held by ${m.holderName} (${m.neighborhood})`)
        .join(", ");
      message += `\n🎯 Inventory match found: ${matchList}`;
    }

    if (orgPhone) {
      await sendWhatsApp(orgPhone, message);
    } else {
      console.log(`[create-wish] ORG_WHATSAPP_NUMBER not set. Would send: ${message}`);
    }

    return NextResponse.json({
      success: true,
      id: inserted?.id ?? null,
      matches: matches.length > 0 ? matches : undefined,
      wish: {
        gameTitle,
        notes: notes ?? "",
        neighborhood,
      },
    });
  } catch (err) {
    console.error("[create-wish] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

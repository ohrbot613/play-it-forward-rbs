/*
 * POST /api/create-wish — REC-43 / REC-148
 *
 * Called when a user submits the "Add a Wish" modal on the requests page.
 * 1. Resolves the authenticated user's member profile (name + phone).
 * 2. Inserts a row into `community_wishes` table in Supabase (graceful if missing).
 * 3. Sends a WhatsApp notification to the org via Twilio.
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
    const inserted = await insertCommunityWish({
      gameTitle,
      notes,
      neighborhood,
      requesterId: requester.userId,
      requesterName: requester.name,
      requesterPhone: requester.phone,
    });

    // 3. Send WhatsApp notification to org
    const orgPhone =
      process.env.ORG_WHATSAPP_NUMBER ?? process.env.TWILIO_WHATSAPP_FROM;

    const notesSuffix = notes?.trim() ? ` — ${notes.trim()}` : "";
    const message = `✨ New wish from ${neighborhood}: ${gameTitle}${notesSuffix}`;

    if (orgPhone) {
      await sendWhatsApp(orgPhone, message);
    } else {
      console.log(`[create-wish] ORG_WHATSAPP_NUMBER not set. Would send: ${message}`);
    }

    return NextResponse.json({
      success: true,
      id: inserted?.id ?? null,
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

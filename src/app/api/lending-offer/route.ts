/*
 * POST /api/lending-offer — REC-147
 *
 * Called when a community member clicks "I have this game!" on a wish card.
 * 1. Inserts a row into `wish_offers` table in Supabase (graceful if missing).
 * 2. Sends a WhatsApp notification to the org via Twilio.
 *
 * Body: { wishId: string, lenderUserId: string, gameTitle: string, lenderNeighborhood?: string, requesterName?: string }
 */

import { NextRequest, NextResponse } from "next/server";

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

async function insertLendingOffer(params: {
  wishId: string;
  lenderUserId: string;
  gameTitle: string;
  lenderNeighborhood?: string;
  requesterName?: string;
}): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg) {
    console.log("[lending-offer] No Supabase config — skipping DB insert");
    return;
  }

  try {
    const res = await fetch(`${cfg.url}/rest/v1/wish_offers`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        wish_id: params.wishId,
        offerer_id: params.lenderUserId,
        created_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[lending-offer] Supabase insert failed:", res.status, text);
    }
  } catch (err) {
    // Graceful — table may not exist yet. WhatsApp link already opened client-side.
    console.error("[lending-offer] Supabase error (non-fatal):", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp notifier (Twilio, mirrors whatsapp-lending pattern)
// ─────────────────────────────────────────────────────────────────────────────

async function sendWhatsApp(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

  if (!sid || !token || !from) {
    console.log(`[lending-offer] OUTBOUND → ${to}:\n${body}\n`);
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
    console.error("[lending-offer] Twilio send failed:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wishId, lenderUserId, gameTitle, lenderNeighborhood, requesterName } = body as {
      wishId: string;
      lenderUserId: string;
      gameTitle: string;
      lenderNeighborhood?: string;
      requesterName?: string;
    };

    if (!gameTitle) {
      return NextResponse.json(
        { error: "gameTitle is required" },
        { status: 400 }
      );
    }

    // 1. Insert into Supabase (graceful — table may not exist yet)
    await insertLendingOffer({
      wishId: wishId ?? "unknown",
      lenderUserId: lenderUserId ?? "anonymous",
      gameTitle,
      lenderNeighborhood,
      requesterName,
    });

    // 2. Send WhatsApp notification to org
    const orgPhone =
      process.env.ORG_WHATSAPP_NUMBER ?? process.env.TWILIO_WHATSAPP_FROM;

    if (orgPhone) {
      const neighborhood = lenderNeighborhood ?? "unknown neighborhood";
      const requester = requesterName ?? "a community member";
      const message =
        `🎮 ${gameTitle} offer from ${neighborhood}. Someone has this game available for ${requester}!`;
      await sendWhatsApp(orgPhone, message);
    } else {
      // Log the message even if no org phone is configured
      const neighborhood = lenderNeighborhood ?? "unknown neighborhood";
      const requester = requesterName ?? "a community member";
      console.log(
        `[lending-offer] ORG_WHATSAPP_NUMBER not set. Would send: 🎮 ${gameTitle} offer from ${neighborhood}. Someone has this game available for ${requester}!`
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[lending-offer] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

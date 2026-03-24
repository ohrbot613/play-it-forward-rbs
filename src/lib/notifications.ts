/**
 * notifications.ts — Outbound WhatsApp notifications via Twilio
 *
 * REC-295: Notify the lender via WhatsApp when a borrower submits a
 * lending request through the web app.
 *
 * Uses the same raw-fetch Twilio pattern as whatsapp-lending/route.ts
 * (no twilio npm package required).
 *
 * Required env vars (add to .env.local and Vercel):
 *   TWILIO_ACCOUNT_SID       — Twilio account SID
 *   TWILIO_AUTH_TOKEN        — Twilio auth token
 *   TWILIO_WHATSAPP_FROM     — Sender number, e.g. "whatsapp:+14155238886"
 *
 * If any of those vars are missing the function logs to console and
 * returns without throwing — notifications are non-blocking.
 */

/**
 * Send a WhatsApp message to the lender when a borrower requests their game.
 *
 * @param lenderPhone   Lender's phone in international format (e.g. "+972541234567")
 * @param gameTitle     Title of the game being requested
 * @param borrowerName  Display name of the borrower (or "A community member" as fallback)
 */
export async function sendWhatsAppToLender(
  lenderPhone: string,
  gameTitle: string,
  borrowerName = "A community member"
): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

  if (!sid || !token || !from) {
    // Dev fallback — log the would-be notification
    console.log(
      `[notifications] Twilio not configured. Would have sent to ${lenderPhone}:\n` +
        `"${borrowerName} wants to borrow your ${gameTitle}! Check your Play It Forward dashboard."`
    );
    return;
  }

  if (!lenderPhone) {
    console.log("[notifications] Lender has no phone on file — skipping WhatsApp notification.");
    return;
  }

  // Ensure whatsapp: prefix
  const to = lenderPhone.startsWith("whatsapp:") ? lenderPhone : `whatsapp:${lenderPhone}`;

  const body =
    `${borrowerName} wants to borrow your *${gameTitle}*! ` +
    `Check your Play It Forward dashboard to accept or decline the request.`;

  try {
    const params = new URLSearchParams({ From: from, To: to, Body: body });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[notifications] Twilio error ${res.status}:`, text);
    } else {
      console.log(`[notifications] WhatsApp notification sent to lender (${to}) for "${gameTitle}"`);
    }
  } catch (err) {
    // Non-fatal — never block the lending request flow
    console.error("[notifications] Failed to send WhatsApp notification:", err);
  }
}

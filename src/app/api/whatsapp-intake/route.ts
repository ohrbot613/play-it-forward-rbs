import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Conversation state machine
// ---------------------------------------------------------------------------

type ConversationState =
  | "START"
  | "AWAITING_PHOTO"
  | "CONFIRM_GAME"
  | "CONDITION"
  | "QUALITY"
  | "FINALIZE";

interface ConversationSession {
  state: ConversationState;
  phone: string;
  identifiedGame?: {
    name: string;
    description: string;
    category: string;
    minPlayers: number;
    maxPlayers: number;
    ageGroup: string;
  };
  missingPieces?: boolean;
  boxCondition?: string;
  lastUpdated: number;
}

// In-memory store keyed by phone number (good enough for prototype)
const sessions = new Map<string, ConversationSession>();

// Clean up sessions older than 2 hours
function cleanupSessions() {
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const now = Date.now();
  for (const [phone, session] of sessions.entries()) {
    if (now - session.lastUpdated > TWO_HOURS) {
      sessions.delete(phone);
    }
  }
}

function getOrCreateSession(phone: string): ConversationSession {
  cleanupSessions();
  if (!sessions.has(phone)) {
    sessions.set(phone, { state: "START", phone, lastUpdated: Date.now() });
  }
  const session = sessions.get(phone)!;
  session.lastUpdated = Date.now();
  return session;
}

// ---------------------------------------------------------------------------
// AI game identification from photo URL
// ---------------------------------------------------------------------------

async function identifyGameFromPhoto(photoUrl: string): Promise<{
  name: string;
  description: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  ageGroup: string;
  confidence: string;
} | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://play-it-forward.app",
        "X-Title": "Play It Forward",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `This is a board game box photo. Identify the game and return ONLY valid JSON:
{"name":"Game Name","description":"Brief description","minPlayers":2,"maxPlayers":4,"ageGroup":"8+","category":"Family","confidence":"high"}
Category: Strategy, Family, Party, Children, Cooperative, Card Game, Word Game, Abstract, RPG, Trivia, or Other.
If unclear, return confidence "low" and empty name.`,
              },
              {
                type: "image_url",
                image_url: { url: photoUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Supabase insert
// ---------------------------------------------------------------------------

async function saveGameToSupabase(session: ConversationSession): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey || !session.identifiedGame) return false;

  const conditionMap: Record<string, string> = {
    "like new": "new",
    good: "good",
    fair: "fair",
    worn: "fair",
  };

  const categoryMap: Record<string, string> = {
    Strategy: "board_game",
    Family: "board_game",
    Party: "board_game",
    Children: "toy",
    Cooperative: "board_game",
    "Card Game": "board_game",
    "Word Game": "board_game",
    Abstract: "board_game",
    RPG: "board_game",
    Trivia: "board_game",
    Other: "toy",
  };

  try {
    // Use service role key for server-side insert if available, else anon
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseKey;
    const res = await fetch(`${supabaseUrl}/rest/v1/games`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        title: session.identifiedGame.name,
        description: session.identifiedGame.description + (session.missingPieces ? " (Some missing pieces)" : ""),
        category: categoryMap[session.identifiedGame.category] ?? "toy",
        condition: conditionMap[session.boxCondition?.toLowerCase() ?? "good"] ?? "good",
        player_count_min: session.identifiedGame.minPlayers,
        player_count_max: session.identifiedGame.maxPlayers,
        is_available: true,
        intake_source: "whatsapp",
        owner_phone: session.phone,
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Response helpers — bilingual WhatsApp messages
// ---------------------------------------------------------------------------

function isTriggerMessage(body: string): boolean {
  const normalized = body.toLowerCase().trim();
  return (
    normalized.includes("add game") ||
    normalized.includes("הוסף משחק") ||
    normalized.includes("share game") ||
    normalized.includes("שתף משחק") ||
    normalized === "start" ||
    normalized === "התחל"
  );
}

function isYes(body: string): boolean {
  const n = body.toLowerCase().trim();
  return ["yes", "yeah", "yep", "sure", "ok", "כן", "כן!", "בסדר", "1"].includes(n);
}

function isNo(body: string): boolean {
  const n = body.toLowerCase().trim();
  return ["no", "nope", "nah", "לא", "לא!", "2"].includes(n);
}

const BOX_CONDITIONS = ["like new", "good", "fair", "worn"];

// ---------------------------------------------------------------------------
// Main webhook handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // Parse WhatsApp webhook payload (Twilio format or raw)
    let phone = "unknown";
    let messageBody = "";
    let mediaUrl = "";

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Twilio webhook format
      const formData = await req.formData();
      phone = (formData.get("From") as string) ?? "unknown";
      messageBody = ((formData.get("Body") as string) ?? "").trim();
      mediaUrl = (formData.get("MediaUrl0") as string) ?? "";
    } else {
      // JSON format (direct API calls / testing)
      const body = await req.json();
      phone = body.phone ?? body.From ?? "unknown";
      messageBody = (body.body ?? body.Body ?? "").trim();
      mediaUrl = body.mediaUrl ?? body.MediaUrl0 ?? "";
    }

    const session = getOrCreateSession(phone);
    let replyMessage = "";

    // State machine
    switch (session.state) {
      case "START": {
        if (isTriggerMessage(messageBody)) {
          session.state = "AWAITING_PHOTO";
          replyMessage =
            "Great! Let's add your game to the community library.\n\n" +
            "Please send a clear photo of the *game box* — front cover works best!\n\n" +
            "טוב! בוא נוסיף את המשחק שלך לספרייה הקהילתית.\n" +
            "שלח תמונה ברורה של *קופסת המשחק* — כריכה קדמית הכי טוב!";
        } else {
          replyMessage =
            'To add a game, send "add game" or "הוסף משחק"\n\n' +
            'כדי להוסיף משחק, שלח "add game" או "הוסף משחק"';
        }
        break;
      }

      case "AWAITING_PHOTO": {
        if (!mediaUrl) {
          replyMessage =
            "Please send a *photo* of the game box, not text.\n\n" +
            "אנא שלח *תמונה* של קופסת המשחק, לא טקסט.";
          break;
        }

        replyMessage = "Got your photo! Identifying the game...  (מזהה את המשחק...)";

        // Identify the game
        const identified = await identifyGameFromPhoto(mediaUrl);

        if (!identified || !identified.name || identified.confidence === "low") {
          replyMessage =
            "Hmm, I couldn't clearly identify the game from that photo.\n" +
            "Try sending a clearer photo of the *front cover* in good lighting.\n\n" +
            "לא הצלחתי לזהות את המשחק מהתמונה.\n" +
            "נסה לשלוח תמונה ברורה יותר של *הכריכה הקדמית* עם תאורה טובה.";
          // Stay in AWAITING_PHOTO state
          break;
        }

        session.identifiedGame = {
          name: identified.name,
          description: identified.description,
          category: identified.category,
          minPlayers: identified.minPlayers,
          maxPlayers: identified.maxPlayers,
          ageGroup: identified.ageGroup,
        };
        session.state = "CONFIRM_GAME";

        replyMessage =
          `I identified this as: *${identified.name}*\n` +
          `${identified.description}\n` +
          `Players: ${identified.minPlayers}-${identified.maxPlayers} | Age: ${identified.ageGroup}\n\n` +
          `Is that correct? Reply *yes* to continue or *no* to send another photo.\n\n` +
          `זיהיתי את המשחק כ: *${identified.name}*\n` +
          `נכון? ענה *כן* להמשיך או *לא* לשלוח תמונה אחרת.`;
        break;
      }

      case "CONFIRM_GAME": {
        if (isYes(messageBody)) {
          session.state = "CONDITION";
          replyMessage =
            "Great! Now a quick condition check:\n\n" +
            "*Are there any missing pieces?*\n" +
            "Reply *yes* or *no*\n\n" +
            "האם חסרים חלקים? ענה *כן* או *לא*";
        } else if (isNo(messageBody)) {
          session.state = "AWAITING_PHOTO";
          session.identifiedGame = undefined;
          replyMessage =
            "No problem! Please send another photo of the game box.\n\n" +
            "בסדר! שלח תמונה אחרת של קופסת המשחק.";
        } else {
          replyMessage =
            "Please reply *yes* to confirm or *no* to try again.\n\n" +
            "אנא ענה *כן* לאישור או *לא* לנסות שוב.";
        }
        break;
      }

      case "CONDITION": {
        if (isYes(messageBody)) {
          session.missingPieces = true;
        } else if (isNo(messageBody)) {
          session.missingPieces = false;
        } else {
          replyMessage =
            "Please reply *yes* (missing pieces) or *no* (complete).\n\n" +
            "אנא ענה *כן* (חסרים חלקים) או *לא* (מלא).";
          break;
        }

        session.state = "QUALITY";
        replyMessage =
          "Got it! What's the box condition?\n\n" +
          "Reply with one of:\n" +
          "• *like new* — barely used\n" +
          "• *good* — normal wear\n" +
          "• *fair* — noticeable wear\n" +
          "• *worn* — heavy use\n\n" +
          "מה מצב הקופסה?\n" +
          "• *כמו חדש* / like new\n" +
          "• *טוב* / good\n" +
          "• *סביר* / fair\n" +
          "• *בלוי* / worn";
        break;
      }

      case "QUALITY": {
        const normalized = messageBody.toLowerCase().trim();
        // Map Hebrew answers
        const hebrewMap: Record<string, string> = {
          "כמו חדש": "like new",
          טוב: "good",
          סביר: "fair",
          בלוי: "worn",
        };
        const mappedCondition = hebrewMap[normalized] ?? normalized;

        if (!BOX_CONDITIONS.includes(mappedCondition)) {
          replyMessage =
            "Please choose: *like new*, *good*, *fair*, or *worn*\n\n" +
            "אנא בחר: *כמו חדש*, *טוב*, *סביר*, או *בלוי*";
          break;
        }

        session.boxCondition = mappedCondition;
        session.state = "FINALIZE";

        const game = session.identifiedGame!;
        replyMessage =
          `Here's a summary of what will be listed:\n\n` +
          `*${game.name}*\n` +
          `${game.description}\n` +
          `Players: ${game.minPlayers}-${game.maxPlayers} | Age: ${game.ageGroup}\n` +
          `Condition: ${session.boxCondition}\n` +
          `Missing pieces: ${session.missingPieces ? "Yes" : "No"}\n\n` +
          `Reply *yes* to add it to the community library, or *no* to cancel.\n\n` +
          `---\n` +
          `*${game.name}* יתווסף לספרייה הקהילתית.\n` +
          `ענה *כן* לאישור או *לא* לביטול.`;
        break;
      }

      case "FINALIZE": {
        if (isYes(messageBody)) {
          const saved = await saveGameToSupabase(session);
          sessions.delete(phone); // Clear session after completion

          if (saved) {
            replyMessage =
              `Your game *${session.identifiedGame?.name}* has been added to the Play it Forward community library!\n\n` +
              `Neighbors can now borrow it. You'll get a WhatsApp message when someone requests it.\n\n` +
              `Thank you for sharing!\n\n` +
              `המשחק *${session.identifiedGame?.name}* נוסף לספרייה הקהילתית!\n` +
              `שכנים יכולים כעת לשאול אותו. תקבל הודעת וואטסאפ כשמישהו יבקש.\n` +
              `תודה על השיתוף!`;
          } else {
            replyMessage =
              `Thank you! Your game has been noted. Our team will add it to the library shortly.\n\n` +
              `תודה! המשחק שלך יתווסף לספרייה בקרוב.`;
          }
        } else if (isNo(messageBody)) {
          sessions.delete(phone);
          replyMessage =
            'No problem! Send "add game" any time to start again.\n\n' +
            'בסדר! שלח "הוסף משחק" בכל עת להתחלת הליך חדש.';
        } else {
          replyMessage =
            "Please reply *yes* to confirm or *no* to cancel.\n\n" +
            "אנא ענה *כן* לאישור או *לא* לביטול.";
        }
        break;
      }
    }

    // Update session timestamp
    if (sessions.has(phone)) {
      sessions.get(phone)!.lastUpdated = Date.now();
    }

    // Return TwiML for Twilio, or JSON for direct API usage
    const acceptHeader = req.headers.get("accept") ?? "";
    if (acceptHeader.includes("application/xml") || contentType.includes("application/x-www-form-urlencoded")) {
      // Twilio TwiML response
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${replyMessage.replace(/\*/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message>
</Response>`;
      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // JSON response (testing / direct API)
    return NextResponse.json({
      reply: replyMessage,
      state: sessions.get(phone)?.state ?? "DONE",
      phone,
    });
  } catch (err) {
    console.error("whatsapp-intake error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET for webhook verification (Twilio)
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "WhatsApp intake bot is running" });
}

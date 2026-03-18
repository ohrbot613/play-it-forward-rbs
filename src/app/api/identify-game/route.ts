import { NextRequest, NextResponse } from "next/server";

export interface GameIdentification {
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  ageGroup: string;
  category: string;
  confidence: "high" | "medium" | "low";
}

const CATEGORIES_MAP: Record<string, string> = {
  Strategy: "board-games",
  Family: "board-games",
  Party: "board-games",
  Children: "other",
  Cooperative: "board-games",
  "Card Game": "board-games",
  "Word Game": "board-games",
  Abstract: "board-games",
  RPG: "board-games",
  Trivia: "board-games",
  Other: "other",
};

export async function POST(req: NextRequest) {
  try {
    const { photoUrl } = await req.json();

    if (!photoUrl) {
      return NextResponse.json({ error: "photoUrl is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 });
    }

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
                text: `This is a board game box photo. Identify the game and return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "name": "Game Name",
  "description": "Brief 1-2 sentence description of what the game is",
  "minPlayers": 2,
  "maxPlayers": 4,
  "ageGroup": "8+",
  "category": "Strategy",
  "confidence": "high"
}

Category must be exactly one of: Strategy, Family, Party, Children, Cooperative, Card Game, Word Game, Abstract, RPG, Trivia, Other.
Confidence: "high" if clearly identified, "medium" if likely but uncertain, "low" if unclear photo or unrecognized game.
If the photo is not a game box or is too unclear to identify, return: {"name":"","description":"","minPlayers":1,"maxPlayers":4,"ageGroup":"6+","category":"Other","confidence":"low"}`,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response — handle markdown code blocks if present
    let parsed: GameIdentification;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json({
        name: "",
        description: "",
        minPlayers: 1,
        maxPlayers: 4,
        ageGroup: "6+",
        category: "other",
        confidence: "low",
      });
    }

    // Map category to internal format
    const internalCategory = CATEGORIES_MAP[parsed.category] ?? "other";

    return NextResponse.json({
      name: parsed.name ?? "",
      description: parsed.description ?? "",
      minPlayers: Number(parsed.minPlayers) || 1,
      maxPlayers: Number(parsed.maxPlayers) || 4,
      ageGroup: parsed.ageGroup ?? "6+",
      category: internalCategory,
      originalCategory: parsed.category,
      confidence: parsed.confidence ?? "low",
    });
  } catch (err) {
    console.error("identify-game error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

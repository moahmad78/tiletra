import { NextRequest, NextResponse } from "next/server";
import { checkAiRateLimit } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const user = await getAuthenticatedUser(req);
    const identifier = user?.id || clientIp;
    const isAuth = !!user;

    // 1. Enforce AI Generation Rate Limiting (5 for guests, 20 for auth per 10m)
    const rate = checkAiRateLimit(identifier, isAuth);
    if (!rate.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rate.resetTime - Date.now()) / 1000));
      return NextResponse.json(
        {
          success: false,
          error: `AI generation rate limit exceeded. You have reached your limit of ${rate.limit} requests per 10 minutes. Please retry in ${retryAfter} second(s).`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": rate.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(rate.resetTime / 1000).toString(),
          },
        }
      );
    }

    // 2. Validate input payload
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const roomType = typeof body.roomType === "string" ? body.roomType.trim() : "general";
    const style = typeof body.style === "string" ? body.style.trim() : "modern";

    if (!prompt || prompt.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid design description or prompt (minimum 5 characters).",
        },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt exceeds maximum allowed length of 1000 characters.",
        },
        { status: 400 }
      );
    }

    // 3. AI Generation execution (Gemini or intelligent architectural fallback)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    let aiContent = "";

    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const systemPrompt = `You are Intrihub's AI Architectural Materials Advisor for tiles, sanitaryware, electricals, and surface finishes in India.
User Prompt: "${prompt}"
Room Type: ${roomType}
Style: ${style}

Provide concise, practical material recommendations with tile types (vitrified, ceramic, full body, GVT/PGVT), surface finishes, sizing recommendations, and complementary color palettes.`;

        const result = await model.generateContent(systemPrompt);
        aiContent = result.response.text();
      } catch (geminiErr: any) {
        console.warn("[AI] Gemini API request failed, using architectural fallback:", geminiErr?.message);
      }
    }

    // Curated architectural fallback if API key is not configured or fails
    if (!aiContent) {
      aiContent = `Architectural Design Plan for ${roomType.toUpperCase()} (${style.toUpperCase()} Style):
1. Flooring Recommendation: 600x1200mm Glazed Vitrified Tiles (GVT) with anti-skid satin finish.
2. Wall Treatment: 300x600mm digital ceramic wall tiles with matching accent highlighter border.
3. Palette & Textures: Balanced neutral tones with warm undertones; pair with moisture-resistant epoxy grout.
4. Estimated Coverage & Waste Allowance: Add +10% over net carpet area for cuts and wastage.`;
    }

    const res = NextResponse.json({
      success: true,
      prompt,
      roomType,
      style,
      recommendation: aiContent,
      rateLimit: {
        limit: rate.limit,
        remaining: rate.remaining,
        resetTime: rate.resetTime,
      },
    });

    res.headers.set("X-RateLimit-Limit", rate.limit.toString());
    res.headers.set("X-RateLimit-Remaining", rate.remaining.toString());
    res.headers.set("X-RateLimit-Reset", Math.ceil(rate.resetTime / 1000).toString());
    return res;
  } catch (error: any) {
    console.error("[POST /api/ai/generate Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process AI generation request" },
      { status: 500 }
    );
  }
}

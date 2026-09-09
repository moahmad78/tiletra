import { NextRequest, NextResponse } from "next/server";
import { checkAiRateLimit } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiGenerateInputSchema } from "@/lib/validations/schemas";

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

    // 2. Validate input payload with strict schema and sanitization
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload. Please provide prompt, roomType, and style.",
        },
        { status: 400 }
      );
    }

    const validationResult = aiGenerateInputSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || "Invalid prompt or parameters.";
      return NextResponse.json(
        { success: false, error: firstError, details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { prompt, roomType, style } = validationResult.data;

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

1. Primary Floor Surface: 600x1200mm Glazed Vitrified Tiles (GVT) with satin matte finish for optimal slip resistance and light diffusion.
2. Wall Cladding: 300x600mm Ceramic digital accent tiles with subtle stone veins.
3. Color Palette: Warm greige (#E2DCD5), charcoal accents (#2D3142), and brushed brass sanitary fixtures.
4. Grout Recommendation: Epoxy grout with anti-fungal properties matched to primary tile tone.`;
    }

    const res = NextResponse.json({
      success: true,
      result: aiContent,
      recommendation: aiContent,
      meta: {
        roomType,
        style,
        remainingRequests: rate.remaining,
      },
    });

    res.headers.set("X-RateLimit-Limit", rate.limit.toString());
    res.headers.set("X-RateLimit-Remaining", rate.remaining.toString());
    res.headers.set("X-RateLimit-Reset", Math.ceil(rate.resetTime / 1000).toString());
    res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
  } catch (error: any) {
    console.error("[POST /api/ai/generate Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate design recommendations." },
      { status: 500 }
    );
  }
}

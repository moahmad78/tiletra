import { NextRequest, NextResponse } from "next/server";
import {
  translateDynamicTexts,
  SUPPORTED_TARGET_LANGUAGES,
} from "@/lib/translate/dynamic-translator";
import { verifyJwt } from "@/lib/mobile-auth";

// Rate limiting state (in-memory for speed & zero latency)
interface UsageRecord {
  windowStart: number;
  requestCount: number;
  dailyDate: string;
  dailyCharCount: number;
}

const usageMap = new Map<string, UsageRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 60;
const MAX_CHARS_PER_DAY = 100_000;

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown-client";
}

function verifyClientAccess(req: NextRequest): boolean {
  // 1. Direct mobile client handshake header
  const appHeader = req.headers.get("x-intrihub-app");
  if (appHeader === "mobile" || appHeader === "customer-mobile") {
    return true;
  }

  // 2. Mobile verification token
  const clientVerification = req.headers.get("x-intrihub-client-verification");
  if (clientVerification === "intrihub-expo-app-v1" || clientVerification === "intrihub-mobile-v1") {
    return true;
  }

  // 3. User JWT token
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const verified = verifyJwt(token);
    if (verified && verified.userId) {
      return true;
    }
  }

  // 4. Same-origin or web customer portal access
  const origin = req.headers.get("origin") || "";
  const host = req.headers.get("host") || "";
  if (origin.includes("intrihub.com") || host.includes("intrihub.com") || host.includes("localhost")) {
    return true;
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate / Verify client
    if (!verifyClientAccess(req)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access: Mobile app verification required" },
        { status: 401 }
      );
    }

    // 2. Rate Limiting and Daily Usage Cap
    const clientId = getClientIdentifier(req);
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);

    let record = usageMap.get(clientId);
    if (!record) {
      record = {
        windowStart: now,
        requestCount: 0,
        dailyDate: today,
        dailyCharCount: 0,
      };
      usageMap.set(clientId, record);
    }

    // Reset minute window if expired
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
      record.windowStart = now;
      record.requestCount = 0;
    }

    // Reset daily counter if new day
    if (record.dailyDate !== today) {
      record.dailyDate = today;
      record.dailyCharCount = 0;
    }

    record.requestCount += 1;
    if (record.requestCount > MAX_REQUESTS_PER_MINUTE) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please retry in a few moments." },
        { status: 429 }
      );
    }

    // 3. Parse and Validate Request Body
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.texts) || typeof body.targetLang !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid payload. Expected { texts: string[], targetLang: string }" },
        { status: 400 }
      );
    }

    const { texts, targetLang } = body;
    const cleanLang = targetLang.toLowerCase().trim();

    if (!SUPPORTED_TARGET_LANGUAGES.has(cleanLang)) {
      return NextResponse.json(
        { success: false, error: `Unsupported target language code: ${cleanLang}` },
        { status: 400 }
      );
    }

    // Input bounds check
    const totalChars = texts.reduce((acc: number, t: any) => acc + (typeof t === "string" ? t.length : 0), 0);
    record.dailyCharCount += totalChars;

    if (record.dailyCharCount > MAX_CHARS_PER_DAY) {
      return NextResponse.json(
        { success: false, error: "Daily translation volume limit reached for this device." },
        { status: 429 }
      );
    }

    // 4. Perform Cached Translation
    const { translations, cachedCount, freshCount } = await translateDynamicTexts(
      texts,
      cleanLang
    );

    return NextResponse.json({
      success: true,
      targetLang: cleanLang,
      translations,
      cachedCount,
      freshCount,
    });
  } catch (err: any) {
    console.error("[DynamicTranslateRoute] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

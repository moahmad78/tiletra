import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_PAYLOAD_BYTES = 2048; // 2KB payload cap
const MAX_ERROR_LOG_ENTRIES = 500;

// In-memory ring buffer for quick diagnostic summary
export interface ImageErrorEntry {
  url: string;
  page: string;
  connectionType: string;
  retryCount: number;
  timestamp: string;
}

export const recentImageErrors: ImageErrorEntry[] = [];

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";
    
    // Rate limit: 60 beacons per IP per minute
    const rateCheck = checkRateLimit(`img-error:${ip}`, 60, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const rawText = await req.text();
    if (rawText.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ success: false, error: "Payload too large" }, { status: 400 });
    }

    const body = JSON.parse(rawText || "{}");
    const url = typeof body.url === "string" ? body.url.slice(0, 300) : "unknown";
    const page = typeof body.page === "string" ? body.page.slice(0, 200) : "unknown";
    const connectionType = typeof body.connectionType === "string" ? body.connectionType.slice(0, 30) : "unknown";
    const retryCount = typeof body.retryCount === "number" ? body.retryCount : 0;

    // Sanitized entry (no PII or user identifiers)
    const entry: ImageErrorEntry = {
      url,
      page,
      connectionType,
      retryCount,
      timestamp: new Date().toISOString(),
    };

    recentImageErrors.push(entry);
    if (recentImageErrors.length > MAX_ERROR_LOG_ENTRIES) {
      recentImageErrors.shift();
    }

    console.warn(`[ImageLoadBeacon] Failed image load: URL=${url} Page=${page} Conn=${connectionType} Retries=${retryCount}`);

    return NextResponse.json({ success: true, logged: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 200 }); // Always 200 for beacon calls
  }
}

export async function GET() {
  // Summary of top failing image paths for monitoring
  const counts: Record<string, number> = {};
  for (const err of recentImageErrors) {
    counts[err.url] = (counts[err.url] || 0) + 1;
  }
  const topFailing = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([url, count]) => ({ url, count }));

  return NextResponse.json({
    totalRecorded: recentImageErrors.length,
    topFailingUrls: topFailing,
    recentEvents: recentImageErrors.slice(-10),
  });
}

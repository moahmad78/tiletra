import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url, page, connectionType, retryCount } = body;

    const userAgent = req.headers.get("user-agent") || "unknown";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";

    // Log diagnostic information for broken image monitoring (PRD FR-14)
    console.warn(`[ImageLoadBeacon] Failed image load:`, {
      failedUrl: url,
      pageUrl: page,
      connectionType: connectionType || "unknown",
      retryCount: retryCount ?? 1,
      userAgent: userAgent.slice(0, 100),
      ip: ip.slice(0, 15),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, logged: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 200 }); // Always 200 for beacon endpoints
  }
}

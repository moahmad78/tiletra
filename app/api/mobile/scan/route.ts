import { NextRequest, NextResponse } from "next/server";
import { extractProductVisualData, normalizeExtractedText } from "@/lib/lens/ocr-engine";
import { matchCatalogProducts } from "@/lib/lens/catalog-matcher";

export const maxDuration = 30;

const mobileScanRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isMobileRateLimited(identifier: string, maxRequests = 25, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = mobileScanRateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    mobileScanRateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (entry.count >= maxRequests) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    const body = await req.json();
    const { image, text, userId } = body;

    const rateLimitKey = userId || ip;
    if (isMobileRateLimited(rateLimitKey, 25, 60 * 60 * 1000)) {
      return NextResponse.json(
        {
          matched: false,
          confidence: 0,
          message: "Scan rate limit reached (max 25 scans/hr). Please try again in a bit or use manual search.",
          extractedInfo: null,
          matchedProduct: null,
          alternatives: [],
        },
        { status: 429 }
      );
    }

    console.log(`[Mobile Scan API] Processing scan request (IP: ${ip})`);

    let imageBuffer: Buffer | null = null;
    let rawExtractedText: string = text || "";
    let detectedLabels: string[] = [];

    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64Data, "base64");
    }

    if (imageBuffer && imageBuffer.length > 0) {
      console.log(`[Mobile Scan API] Image buffer received (${imageBuffer.length} bytes). Invoking visual analysis engine...`);
      const visualData = await extractProductVisualData(imageBuffer);
      if (visualData.rawText && visualData.rawText.trim().length > 0) {
        rawExtractedText = visualData.rawText;
      }
      detectedLabels = visualData.labels || [];
      console.log(`[Mobile Scan API] Visual analysis complete. Text length: ${rawExtractedText.length}, Labels: ${detectedLabels.length}`);
    }

    const extractedInfo = normalizeExtractedText(rawExtractedText, detectedLabels);
    const matchResult = await matchCatalogProducts(extractedInfo, userId);

    if ((!rawExtractedText || rawExtractedText.trim().length === 0) && !matchResult.matched) {
      matchResult.message = "No packaging text detected. Ensure good lighting and center the label, or browse verified in-stock materials below:";
    }

    return NextResponse.json(matchResult, { status: 200 });
  } catch (err: any) {
    console.error("[Mobile Scan API] Error:", err);
    return NextResponse.json(
      {
        matched: false,
        confidence: 0,
        confidenceTier: "low",
        extractedInfo: null,
        matchedProduct: null,
        possibleMatches: [],
        alternatives: [],
        error: err.message || "Failed to process mobile scan",
        message: "Something went wrong while analyzing the scan. Please try again.",
      },
      { status: 500 }
    );
  }
}

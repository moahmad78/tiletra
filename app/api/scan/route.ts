import { NextRequest, NextResponse } from "next/server";
import { extractProductVisualData, normalizeExtractedText } from "@/lib/lens/ocr-engine";
import { matchCatalogProducts } from "@/lib/lens/catalog-matcher";

export const maxDuration = 30; // 30s timeout for OCR on serverless

// In-memory rate limiting: Max 20 scans per IP / user per hour
const scanRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(identifier: string, maxRequests = 20, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = scanRateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    scanRateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
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

    let imageBuffer: Buffer | null = null;
    let fallbackText: string = "";
    let userId: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("image") as File | null;
      fallbackText = (formData.get("text") as string) || "";
      userId = (formData.get("userId") as string) || null;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }
    } else {
      const body = await req.json();
      userId = body.userId || null;
      fallbackText = body.text || "";

      if (body.image) {
        // Base64 Data URL (e.g. data:image/jpeg;base64,...)
        const base64Data = body.image.replace(/^data:image\/\w+;base64,/, "");
        imageBuffer = Buffer.from(base64Data, "base64");
      }
    }

    const rateLimitKey = userId || ip;
    if (isRateLimited(rateLimitKey, 25, 60 * 60 * 1000)) {
      return NextResponse.json(
        {
          matched: false,
          confidence: 0,
          message: "Scan rate limit reached (max 25 scans/hr). Please try again later or use manual search.",
          extractedInfo: null,
          matchedProduct: null,
          alternatives: [],
        },
        { status: 429 }
      );
    }

    let rawExtractedText = fallbackText;
    let detectedLabels: string[] = [];

    // Run OCR + Visual Label Analysis if image was provided
    if (imageBuffer && imageBuffer.length > 0) {
      const visualData = await extractProductVisualData(imageBuffer);
      if (visualData.rawText && visualData.rawText.trim().length > 0) {
        rawExtractedText = visualData.rawText;
      }
      detectedLabels = visualData.labels || [];
    }

    if (!rawExtractedText || rawExtractedText.trim().length === 0) {
      return NextResponse.json(
        {
          matched: false,
          confidence: 0,
          message: "No readable text or packaging could be identified. Please ensure good lighting and clear product labels.",
          extractedInfo: null,
          matchedProduct: null,
          alternatives: [],
        },
        { status: 200 }
      );
    }

    // Normalize and extract brand, grade, packaging & label insights
    const extractedInfo = normalizeExtractedText(rawExtractedText, detectedLabels);

    // Match against catalog
    const matchResult = await matchCatalogProducts(extractedInfo, userId);

    return NextResponse.json(matchResult, { status: 200 });
  } catch (err: any) {
    console.error("Scan API Error:", err);
    return NextResponse.json(
      {
        matched: false,
        error: err.message || "Failed to process scan",
        message: "Something went wrong while analyzing the scan. Please try again.",
      },
      { status: 500 }
    );
  }
}

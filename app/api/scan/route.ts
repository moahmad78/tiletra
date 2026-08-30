import { NextRequest, NextResponse } from "next/server";
import { extractRawTextFromBuffer, normalizeExtractedText } from "@/lib/lens/ocr-engine";
import { matchCatalogProducts } from "@/lib/lens/catalog-matcher";

export const maxDuration = 30; // 30s timeout for OCR on serverless

export async function POST(req: NextRequest) {
  try {
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

    let rawExtractedText = fallbackText;

    // Run OCR if image was provided
    if (imageBuffer && imageBuffer.length > 0) {
      const ocrResult = await extractRawTextFromBuffer(imageBuffer);
      if (ocrResult && ocrResult.trim().length > 0) {
        rawExtractedText = ocrResult;
      }
    }

    if (!rawExtractedText || rawExtractedText.trim().length === 0) {
      return NextResponse.json(
        {
          matched: false,
          confidence: 0,
          message: "No readable text or product could be detected. Please ensure good lighting and clear product packaging.",
          extractedInfo: null,
          matchedProduct: null,
          alternatives: [],
        },
        { status: 200 }
      );
    }

    // Normalize and extract brand, grade, packaging
    const extractedInfo = normalizeExtractedText(rawExtractedText);

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

import { NextRequest, NextResponse } from "next/server";
import { extractRawTextFromBuffer, normalizeExtractedText } from "@/lib/lens/ocr-engine";
import { matchCatalogProducts } from "@/lib/lens/catalog-matcher";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, text, userId } = body;

    let imageBuffer: Buffer | null = null;
    let rawExtractedText: string = text || "";

    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64Data, "base64");
    }

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
          message: "No readable text detected. Please aim at the product name or packaging label.",
          extractedInfo: null,
          matchedProduct: null,
          alternatives: [],
        },
        { status: 200 }
      );
    }

    const extractedInfo = normalizeExtractedText(rawExtractedText);
    const matchResult = await matchCatalogProducts(extractedInfo, userId);

    return NextResponse.json(matchResult, { status: 200 });
  } catch (err: any) {
    console.error("Mobile Scan API Error:", err);
    return NextResponse.json(
      {
        matched: false,
        error: err.message || "Failed to process mobile scan",
      },
      { status: 500 }
    );
  }
}

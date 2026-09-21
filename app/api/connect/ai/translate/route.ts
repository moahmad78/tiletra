import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/connect/translation-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, toLanguage = "Hindi", fromLanguage = "Auto" } = body;

    if (!text?.trim()) {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    const result = translateText({
      text,
      toLanguage,
      fromLanguage,
    });

    return NextResponse.json({ success: true, translation: result });
  } catch (err) {
    console.error("Translation API error:", err);
    return NextResponse.json({ success: false, error: "Translation failed" }, { status: 500 });
  }
}

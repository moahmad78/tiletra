import { NextRequest, NextResponse } from "next/server";
import { getAudiencePreview } from "@/lib/campaign-audience";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audience, platforms = "all" } = body;

    const preview = await getAudiencePreview(audience, platforms);
    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error: any) {
    console.error("[Audience Preview] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to calculate audience preview" },
      { status: 500 }
    );
  }
}

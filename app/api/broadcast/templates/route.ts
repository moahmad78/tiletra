import { NextResponse } from "next/server";
import { fetchWhatsAppTemplates } from "@/lib/autobot/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = await fetchWhatsAppTemplates();
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error("GET /api/broadcast/templates error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch templates." }, { status: 500 });
  }
}

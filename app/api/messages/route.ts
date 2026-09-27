import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/autobot/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json({ error: "chatId query parameter is required." }, { status: 400 });
    }

    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET /api/messages error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, messages: messages || [] });
  } catch (error: any) {
    console.error("GET /api/messages exception:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

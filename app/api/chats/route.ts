import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/autobot/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: chats, error } = await supabaseAdmin
      .from("chats")
      .select("*")
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("GET /api/chats error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, chats: chats || [] });
  } catch (error: any) {
    console.error("GET /api/chats exception:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { chatId, chat_mode, customer_name } = body;

    if (!chatId) {
      return NextResponse.json({ error: "chatId is required." }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (chat_mode !== undefined) {
      updates.chat_mode = chat_mode === "ai" ? "ai" : "human";
    }
    if (customer_name !== undefined) {
      updates.customer_name = customer_name;
    }

    const { data: updatedChat, error } = await supabaseAdmin
      .from("chats")
      .update(updates)
      .eq("id", chatId)
      .select()
      .single();

    if (error) {
      console.error("PATCH /api/chats error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, chat: updatedChat });
  } catch (error: any) {
    console.error("PATCH /api/chats exception:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
